"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { calculatePrice } from "@/services/pricing.service";
import type { PricingTierData, PriceBreakdown, CustomerPricingData } from "@/types/pricing";
import { AddressSelector } from "@/components/checkout/address-selector";
import { AddressForm } from "@/components/checkout/address-form";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaytrIframe } from "@/components/checkout/paytr-iframe";

type CheckoutStep = "form" | "payment";

export default function OdemePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user?.id;
  const { guestItems, memberItems, clearGuestCart } = useCartStore();

  const cartItems = isAuthenticated ? memberItems : guestItems;

  const [step, setStep] = useState<CheckoutStep>("form");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [addressId, setAddressId] = useState<string | undefined>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paytrToken, setPaytrToken] = useState<string | null>(null);

  // Guest form state
  const [guestData, setGuestData] = useState<any>(null);

  // Pricing
  const [pricingTiers, setPricingTiers] = useState<PricingTierData[]>([]);
  const [customerPricing, setCustomerPricing] = useState<CustomerPricingData | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing/tiers");
        if (res.ok) {
          const data = await res.json();
          setPricingTiers(data.tiers);
          if (data.customerPricing) setCustomerPricing(data.customerPricing);
        }
      } catch { /* */ }
    }
    fetchPricing();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (status !== "loading" && cartItems.length === 0) {
      router.replace("/sepet");
    }
  }, [status, cartItems.length, router]);

  const totalHeightCm = cartItems.reduce((sum, item) => sum + item.layout.totalHeightCm, 0);
  let priceBreakdown: PriceBreakdown | null = null;
  if (pricingTiers.length > 0 && totalHeightCm > 0) {
    priceBreakdown = calculatePrice(totalHeightCm, pricingTiers, customerPricing);
  }

  const handleGuestAddressSubmit = (data: any) => {
    setGuestData(data);
    setShowAddressForm(false);
    toast.success("Adres bilgileri kaydedildi");
  };

  const handleNewAddressSaved = async (data: any) => {
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setAddressId(result.address.id);
        setShowAddressForm(false);
        toast.success("Adres kaydedildi");
      }
    } catch {
      toast.error("Adres kaydedilemedi");
    }
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (isAuthenticated && !addressId) {
      toast.error("Lutfen teslimat adresi secin");
      return;
    }
    if (!isAuthenticated && !guestData) {
      toast.error("Lutfen adres bilgilerinizi doldurun");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        paymentMethod,
        customerNote: customerNote || undefined,
      };

      if (isAuthenticated) {
        body.addressId = addressId;
      } else {
        body.guestInfo = {
          guestName: guestData.guestName,
          guestEmail: guestData.guestEmail,
          guestPhone: guestData.guestPhone,
        };
        body.guestAddress = {
          fullName: guestData.fullName,
          phone: guestData.phone,
          city: guestData.city,
          district: guestData.district,
          address: guestData.address,
          zipCode: guestData.zipCode,
        };
        body.cartItems = cartItems.map((item) => ({
          layout: item.layout,
          items: item.items,
          totalMeters: item.totalMeters,
        }));
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Siparis olusturulamadi");
        return;
      }

      const { order } = await res.json();

      // Guest cart temizle
      if (!isAuthenticated) {
        clearGuestCart();
      }

      if (paymentMethod === "CREDIT_CARD") {
        // PayTR token al
        const tokenRes = await fetch("/api/payment/paytr/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: order.orderNumber }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          setPaytrToken(tokenData.token);
          setStep("payment");
        } else {
          toast.error("Odeme sayfasi yuklenemedi");
          router.push(`/odeme/basarili?oid=${order.orderNumber}`);
        }
      } else {
        // Banka havale
        router.push(`/odeme/banka-havale?oid=${order.orderNumber}`);
      }
    } catch {
      toast.error("Bir hata olustu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // PayTR iFrame step
  if (step === "payment" && paytrToken) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Odeme</h1>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">256-bit SSL ile guvenli odeme</span>
          </div>
          <PaytrIframe token={paytrToken} />
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="h-8">
          <Link href="/sepet">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Sepete Don
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Odeme</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address section */}
          <Card className="p-5">
            <h2 className="font-semibold text-base mb-4">Teslimat Adresi</h2>

            {isAuthenticated ? (
              showAddressForm ? (
                <AddressForm
                  isGuest={false}
                  onSubmit={handleNewAddressSaved}
                />
              ) : (
                <AddressSelector
                  selectedId={addressId}
                  onSelect={setAddressId}
                  onAddNew={() => setShowAddressForm(true)}
                />
              )
            ) : (
              guestData ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{guestData.guestName}</p>
                  <p className="text-sm text-muted-foreground">{guestData.guestEmail} - {guestData.guestPhone}</p>
                  <p className="text-sm text-muted-foreground">
                    {guestData.address}, {guestData.district}/{guestData.city}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setGuestData(null)}>
                    Degistir
                  </Button>
                </div>
              ) : (
                <AddressForm
                  isGuest={true}
                  onSubmit={handleGuestAddressSubmit}
                />
              )
            )}
          </Card>

          {/* Payment method */}
          <Card className="p-5">
            <h2 className="font-semibold text-base mb-4">Odeme Yontemi</h2>
            <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
          </Card>

          {/* Customer note */}
          <Card className="p-5">
            <h2 className="font-semibold text-base mb-4">Siparis Notu (Opsiyonel)</h2>
            <Input
              placeholder="Siparissiniz hakkinda belirtmek istediginiz not..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              maxLength={500}
            />
          </Card>

          {/* Submit */}
          <Button
            className="w-full h-12 text-base"
            size="lg"
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="h-5 w-5 mr-2" />
            )}
            Siparisi Onayla
          </Button>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <OrderSummary items={cartItems} priceBreakdown={priceBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
