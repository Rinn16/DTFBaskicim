"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Lock,
  Zap,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { calculatePrice } from "@/services/pricing.service";
import type {
  PricingTierData,
  PriceBreakdown,
  CustomerPricingData,
  ShippingConfigData,
} from "@/types/pricing";
import { AddressSelector } from "@/components/checkout/address-selector";
import { AddressForm } from "@/components/checkout/address-form";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaytrIframe } from "@/components/checkout/paytr-iframe";
import {
  BillingForm,
  type BillingType,
  type BillingFields,
} from "@/components/checkout/billing-form";
import { Checkbox } from "@/components/ui/checkbox";
import { billingInfoSchema } from "@/validations/checkout";

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

  // Billing state
  const [billingSameAddress, setBillingSameAddress] = useState(true);
  const [billingType, setBillingType] = useState<BillingType>("INDIVIDUAL");
  const [billingFields, setBillingFields] = useState<BillingFields>({
    billingCity: "",
    billingDistrict: "",
    billingAddress: "",
  });
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>(
    {}
  );

  // Pricing
  const [pricingTiers, setPricingTiers] = useState<PricingTierData[]>([]);
  const [customerPricing, setCustomerPricing] =
    useState<CustomerPricingData | null>(null);
  const [shippingConfig, setShippingConfig] = useState<
    ShippingConfigData | undefined
  >();

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing/tiers");
        if (res.ok) {
          const data = await res.json();
          setPricingTiers(data.tiers);
          if (data.customerPricing) setCustomerPricing(data.customerPricing);
          if (data.shippingConfig) setShippingConfig(data.shippingConfig);
        }
      } catch {
        /* */
      }
    }
    fetchPricing();
  }, []);

  // Fetch saved billing info for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchBilling() {
      try {
        const res = await fetch("/api/user/billing");
        if (!res.ok) return;
        const { billing } = await res.json();
        if (!billing) return;
        // Only prefill if user has previously saved billing data
        const hasBillingData = billing.billingFullName || billing.billingCompanyName || billing.billingAddress;
        if (!hasBillingData) return;
        setBillingType(billing.billingType || "INDIVIDUAL");
        setBillingSameAddress(false);
        setBillingFields({
          billingFullName: billing.billingFullName || "",
          billingCompanyName: billing.billingCompanyName || "",
          billingTaxOffice: billing.billingTaxOffice || "",
          billingTaxNumber: billing.billingTaxNumber || "",
          billingCity: billing.billingCity || "",
          billingDistrict: billing.billingDistrict || "",
          billingAddress: billing.billingAddress || "",
          billingZipCode: billing.billingZipCode || "",
        });
      } catch {
        /* ignore - billing prefill is optional */
      }
    }
    fetchBilling();
  }, [isAuthenticated]);

  // Redirect if cart is empty
  useEffect(() => {
    if (status !== "loading" && cartItems.length === 0) {
      router.replace("/sepet");
    }
  }, [status, cartItems.length, router]);

  const totalHeightCm = cartItems.reduce(
    (sum, item) => sum + item.layout.totalHeightCm,
    0
  );
  let priceBreakdown: PriceBreakdown | null = null;
  if (pricingTiers.length > 0 && totalHeightCm > 0) {
    priceBreakdown = calculatePrice(
      totalHeightCm,
      pricingTiers,
      customerPricing,
      0,
      0,
      shippingConfig
    );
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
      toast.error("Lütfen teslimat adresi seçin");
      return;
    }
    if (!isAuthenticated && !guestData) {
      toast.error("Lütfen adres bilgilerinizi doldurun");
      return;
    }

    // Billing validation
    if (!billingSameAddress) {
      const billingData = { billingType, ...billingFields };
      const billingResult = billingInfoSchema.safeParse(billingData);
      if (!billingResult.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of billingResult.error.issues) {
          const key = issue.path[0]?.toString();
          if (key) fieldErrors[key] = issue.message;
        }
        setBillingErrors(fieldErrors);
        toast.error("Lütfen fatura bilgilerini doldurun");
        return;
      }
      setBillingErrors({});
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        paymentMethod,
        customerNote: customerNote || undefined,
        billingSameAddress,
        ...(!billingSameAddress && {
          billingInfo: { billingType, ...billingFields },
        }),
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
        toast.error(data.error || "Sipariş oluşturulamadı");
        return;
      }

      const { order } = await res.json();

      // Save billing info to user profile (fire-and-forget)
      if (isAuthenticated && !billingSameAddress) {
        fetch("/api/user/billing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billingType, ...billingFields }),
        }).catch(() => {/* ignore - billing save is optional */});
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
          // Ödeme sayfası açıldı -- guest sepeti temizle
          if (!isAuthenticated) clearGuestCart();
          setPaytrToken(tokenData.token);
          setStep("payment");
        } else {
          const errData = await tokenRes.json().catch(() => null);
          toast.error(
            errData?.error ||
              "Ödeme sayfası yüklenemedi. Lütfen tekrar deneyin."
          );
        }
      } else {
        // Banka havale -- sipariş kesinleşti, sepeti temizle
        if (!isAuthenticated) clearGuestCart();
        router.push(`/odeme/banka-havale?oid=${order.orderNumber}`);
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Ödeme</h1>
        <div className="rounded-2xl bg-card/80 backdrop-blur border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              256-bit SSL ile güvenli ödeme
            </span>
          </div>
          <PaytrIframe token={paytrToken} />
        </div>
      </div>
    );
  }

  const totalMeters = totalHeightCm / 100;

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-[15%] w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-64 h-64 bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted mb-6"
        >
          <Link href="/sepet">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Sepete Dön
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Order Summary */}
          <section className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase mb-2">
                Sipariş Özeti
              </h1>
              <p className="text-muted-foreground text-sm">
                Baskı rulonuzun son kontrolünü yapın.
              </p>
            </div>

            {/* Order items */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-6 space-y-4">
                {cartItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-12 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Ruler className="h-4 w-4 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Gang Sheet #{idx + 1}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.totalMeters.toFixed(2)}m -{" "}
                        {item.items.length} görsel
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price details */}
              <div className="border-t border-border p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Toplam Metre</span>
                  <span className="text-foreground font-mono font-bold">
                    {totalMeters.toFixed(2)} m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Birim Fiyat</span>
                  <span className="text-foreground font-mono font-bold">
                    {priceBreakdown
                      ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL/m`
                      : "- TL/m"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Ara Toplam</span>
                  <span className="text-foreground font-mono font-bold">
                    {priceBreakdown
                      ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
                {priceBreakdown && priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-400">
                    <span className="text-sm">İndirim</span>
                    <span className="font-mono font-bold">
                      -{priceBreakdown.discountAmount.toFixed(2)} TL
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">KDV (%20)</span>
                  <span className="text-foreground font-mono font-bold">
                    {priceBreakdown
                      ? `${priceBreakdown.taxAmount.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
                {priceBreakdown && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Kargo</span>
                    <span
                      className={`font-mono font-bold ${priceBreakdown.shippingCost === 0 ? "text-primary" : "text-foreground"}`}
                    >
                      {priceBreakdown.shippingCost === 0
                        ? "Ücretsiz"
                        : `${priceBreakdown.shippingCost.toFixed(2)} TL`}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-dashed border-border flex justify-between items-end">
                  <span className="text-muted-foreground text-sm uppercase tracking-wide">
                    Toplam
                  </span>
                  <span className="text-foreground font-bold text-2xl font-mono tracking-tight">
                    {priceBreakdown
                      ? `${priceBreakdown.totalAmount.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
              </div>
            </div>

            {/* Guarantee badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="text-foreground text-xs font-bold block">
                    Güvenli Ödeme
                  </span>
                  <span className="text-muted-foreground/70 text-[10px]">
                    256-bit SSL Koruması
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border">
                <Truck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="text-foreground text-xs font-bold block">
                    Hızlı Kargo
                  </span>
                  <span className="text-muted-foreground/70 text-[10px]">
                    24 Saatte Gönderim
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Checkout Form */}
          <section className="lg:col-span-8 order-1 lg:order-2">
            <div className="rounded-2xl bg-card/80 backdrop-blur border border-border p-6 lg:p-10 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Hızlı Ödeme
                  </h2>
                  {priceBreakdown && priceBreakdown.shippingCost === 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      <span className="text-primary text-xs font-bold uppercase tracking-wide">
                        Kargo Bedava
                      </span>
                    </div>
                  )}
                </div>

                {/* Address section */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    İletişim & Teslimat
                  </h3>

                  {isAuthenticated ? (
                    showAddressForm ? (
                      <AddressForm
                        isGuest={false}
                        onSubmit={handleNewAddressSaved}
                        onCancel={() => setShowAddressForm(false)}
                      />
                    ) : (
                      <AddressSelector
                        selectedId={addressId}
                        onSelect={setAddressId}
                        onAddNew={() => setShowAddressForm(true)}
                      />
                    )
                  ) : guestData ? (
                    <div className="rounded-lg bg-muted border border-border p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {guestData.guestName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {guestData.guestEmail} - {guestData.guestPhone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {guestData.address}, {guestData.district}/
                        {guestData.city}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground/80 border-border hover:bg-muted"
                        onClick={() => setGuestData(null)}
                      >
                        Değiştir
                      </Button>
                    </div>
                  ) : (
                    <AddressForm
                      isGuest={true}
                      onSubmit={handleGuestAddressSubmit}
                    />
                  )}
                </div>

                {/* Billing info */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Fatura Bilgileri
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      id="billingSame"
                      checked={billingSameAddress}
                      onCheckedChange={(checked) => {
                        setBillingSameAddress(checked === true);
                        if (checked) setBillingErrors({});
                      }}
                    />
                    <label
                      htmlFor="billingSame"
                      className="text-sm cursor-pointer select-none text-foreground/80"
                    >
                      Fatura adresim teslimat adresimle aynı
                    </label>
                  </div>
                  {!billingSameAddress && (
                    <BillingForm
                      billingType={billingType}
                      onBillingTypeChange={setBillingType}
                      values={billingFields}
                      onChange={setBillingFields}
                      errors={billingErrors}
                    />
                  )}
                </div>

                {/* Payment method */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Ödeme Yöntemi
                  </h3>
                  <PaymentMethod
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                  />
                </div>

                {/* Customer note */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Sipariş Notu
                    <span className="text-muted-foreground/70 text-[10px] normal-case tracking-normal">
                      (Opsiyonel)
                    </span>
                  </h3>
                  <Input
                    placeholder="Siparişiniz hakkında belirtmek istediğiniz not..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    maxLength={500}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Total & CTA */}
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">
                      Toplam Tutar
                    </span>
                    <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                      {priceBreakdown
                        ? `${priceBreakdown.totalAmount.toFixed(2)} TL`
                        : "0.00 TL"}
                    </span>
                  </div>

                  <button
                    className="group relative w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold uppercase tracking-wider rounded-lg overflow-hidden transition-all duration-300 shadow-primary/20 dark:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                      Siparişi Tamamla
                    </span>
                  </button>

                  <p className="text-center text-[10px] text-muted-foreground/70 mt-2">
                    &quot;Siparişi Tamamla&quot; butonuna tıklayarak{" "}
                    <Link
                      href="#"
                      className="text-muted-foreground underline hover:text-primary"
                    >
                      Mesafeli Satış Sözleşmesi
                    </Link>
                    &apos;ni kabul etmiş olursunuz.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
