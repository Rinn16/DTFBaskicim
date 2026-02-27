"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, Banknote, Trash2 } from "lucide-react";
import { STATUS_COLORS, statusLabel } from "@/lib/order-utils";
import { toast } from "sonner";

interface CustomerDetail {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  taxNumber: string | null;
  createdAt: string;
  totalSpent: number;
  specialPricing: {
    id: string;
    pricePerMeter: number;
    notes: string | null;
  } | null;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    totalMeters: number;
    createdAt: string;
  }[];
  addresses: {
    id: string;
    title: string;
    city: string;
    district: string;
    isDefault: boolean;
  }[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricePerMeter, setPricePerMeter] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      }
    } catch {
      toast.error("Müşteri bilgileri yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openPricingDialog = () => {
    setPricePerMeter(customer?.specialPricing?.pricePerMeter?.toString() || "");
    setPricingNotes(customer?.specialPricing?.notes || "");
    setPricingOpen(true);
  };

  const handleSavePricing = async () => {
    const price = parseFloat(pricePerMeter);
    if (isNaN(price) || price <= 0) {
      toast.error("Geçerli bir fiyat girin");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerMeter: price,
          notes: pricingNotes || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Özel fiyat kaydedildi");
        setPricingOpen(false);
        fetchCustomer();
      } else {
        toast.error("Fiyat kaydedilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePricing = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/pricing`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Özel fiyat kaldırıldı");
        setPricingOpen(false);
        fetchCustomer();
      } else {
        toast.error("Fiyat kaldırılamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Müşteri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/admin/musteriler"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Müşterilere Dön
        </Link>
        <h1 className="text-xl font-bold">
          {customer.name} {customer.surname}
        </h1>
        <p className="text-sm text-muted-foreground">
          Kayıt: {new Date(customer.createdAt).toLocaleDateString("tr-TR")}
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p>{customer.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Telefon</p>
              <p>{customer.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Firma</p>
              <p>{customer.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Vergi No</p>
              <p>{customer.taxNumber || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Toplam Sipariş</p>
              <p className="font-medium">{customer.orders.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Toplam Harcama</p>
              <p className="font-medium tabular-nums">
                {customer.totalSpent.toFixed(2)} TL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Pricing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Özel Fiyatlandırma</CardTitle>
          <Button size="sm" variant="outline" onClick={openPricingDialog}>
            <Banknote className="h-4 w-4 mr-1.5" />
            {customer.specialPricing ? "Düzenle" : "Fiyat Ata"}
          </Button>
        </CardHeader>
        <CardContent>
          {customer.specialPricing ? (
            <div className="text-sm">
              <p>
                <span className="text-muted-foreground">Metre Fiyatı:</span>{" "}
                <span className="font-semibold tabular-nums">
                  {customer.specialPricing.pricePerMeter} TL/m
                </span>
              </p>
              {customer.specialPricing.notes && (
                <p className="text-muted-foreground mt-1">
                  {customer.specialPricing.notes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Standart fiyatlandırma kullanılıyor.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Siparişler ({customer.orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz sipariş yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/admin/siparisler/${o.id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${STATUS_COLORS[o.status] || ""}`}
                      >
                        {statusLabel(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {o.totalAmount.toFixed(2)} TL
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Özel Fiyat Ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Metre Fiyatı (TL)</Label>
              <Input
                type="number"
                step="0.01"
                value={pricePerMeter}
                onChange={(e) => setPricePerMeter(e.target.value)}
                placeholder="Örn: 150.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Not (opsiyonel)</Label>
              <Input
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder="İç not"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {customer.specialPricing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePricing}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Kaldır
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPricingOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSavePricing} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
