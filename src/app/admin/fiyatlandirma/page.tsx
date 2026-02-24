"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

/* ---------- Types ---------- */
interface PricingTier {
  id: string;
  minMeters: number;
  maxMeters: number | null;
  pricePerMeter: number;
  isActive: boolean;
}

interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderMeters: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

/* ---------- Tier Form State ---------- */
interface TierForm {
  minMeters: string;
  maxMeters: string;
  pricePerMeter: string;
  isActive: boolean;
}

const emptyTierForm: TierForm = {
  minMeters: "",
  maxMeters: "",
  pricePerMeter: "",
  isActive: true,
};

/* ---------- Discount Form State ---------- */
interface DiscountForm {
  code: string;
  discountPercent: string;
  discountAmount: string;
  minOrderMeters: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const emptyDiscountForm: DiscountForm = {
  code: "",
  discountPercent: "",
  discountAmount: "",
  minOrderMeters: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

export default function PricingPage() {
  /* ---------- Tiers State ---------- */
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState<TierForm>(emptyTierForm);
  const [tierSaving, setTierSaving] = useState(false);

  /* ---------- Discounts State ---------- */
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(
    null,
  );
  const [discountForm, setDiscountForm] =
    useState<DiscountForm>(emptyDiscountForm);
  const [discountSaving, setDiscountSaving] = useState(false);

  /* ---------- Shipping State ---------- */
  const [shippingCost, setShippingCost] = useState("");
  const [freeShippingMin, setFreeShippingMin] = useState("");
  const [shippingActive, setShippingActive] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingSaving, setShippingSaving] = useState(false);

  /* ============================================
     TIERS
     ============================================ */
  const fetchTiers = async () => {
    try {
      const res = await fetch("/api/admin/pricing/tiers");
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers);
      }
    } catch {
      // silent
    } finally {
      setTiersLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
    fetchDiscounts();
    fetchShipping();
  }, []);

  const openNewTier = () => {
    setEditingTierId(null);
    setTierForm(emptyTierForm);
    setTierDialogOpen(true);
  };

  const openEditTier = (tier: PricingTier) => {
    setEditingTierId(tier.id);
    setTierForm({
      minMeters: tier.minMeters.toString(),
      maxMeters: tier.maxMeters?.toString() || "",
      pricePerMeter: tier.pricePerMeter.toString(),
      isActive: tier.isActive,
    });
    setTierDialogOpen(true);
  };

  const handleSaveTier = async () => {
    const minMeters = parseFloat(tierForm.minMeters);
    const pricePerMeter = parseFloat(tierForm.pricePerMeter);
    if (isNaN(minMeters) || isNaN(pricePerMeter) || pricePerMeter <= 0) {
      toast.error("Geçerli değerler girin");
      return;
    }
    const maxMeters = tierForm.maxMeters
      ? parseFloat(tierForm.maxMeters)
      : null;

    setTierSaving(true);
    try {
      const url = editingTierId
        ? `/api/admin/pricing/tiers/${editingTierId}`
        : "/api/admin/pricing/tiers";
      const method = editingTierId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minMeters,
          maxMeters,
          pricePerMeter,
          isActive: tierForm.isActive,
        }),
      });

      if (res.ok) {
        toast.success(editingTierId ? "Kademe güncellendi" : "Kademe eklendi");
        setTierDialogOpen(false);
        fetchTiers();
      } else {
        const data = await res.json();
        toast.error(data.error || "İşlem başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setTierSaving(false);
    }
  };

  const handleDeleteTier = (id: string) => {
    toast("Bu kademeyi silmek istediğinize emin misiniz?", {
      action: {
        label: "Evet, Sil",
        onClick: async () => {
          try {
            const res = await fetch(`/api/admin/pricing/tiers/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              toast.success("Kademe silindi");
              fetchTiers();
            } else {
              toast.error("Kademe silinemedi");
            }
          } catch {
            toast.error("Bir hata oluştu");
          }
        },
      },
      cancel: { label: "İptal", onClick: () => {} },
    });
  };

  const handleToggleTier = async (tier: PricingTier) => {
    try {
      const res = await fetch(`/api/admin/pricing/tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minMeters: tier.minMeters,
          maxMeters: tier.maxMeters,
          pricePerMeter: tier.pricePerMeter,
          isActive: !tier.isActive,
        }),
      });
      if (res.ok) {
        fetchTiers();
      }
    } catch {
      toast.error("Durum değiştirilemedi");
    }
  };

  /* ============================================
     DISCOUNTS
     ============================================ */
  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/pricing/discounts");
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data.discounts);
      }
    } catch {
      // silent
    } finally {
      setDiscountsLoading(false);
    }
  };

  const openNewDiscount = () => {
    setEditingDiscountId(null);
    setDiscountForm(emptyDiscountForm);
    setDiscountDialogOpen(true);
  };

  const openEditDiscount = (d: DiscountCode) => {
    setEditingDiscountId(d.id);
    setDiscountForm({
      code: d.code,
      discountPercent: d.discountPercent?.toString() || "",
      discountAmount: d.discountAmount?.toString() || "",
      minOrderMeters: d.minOrderMeters?.toString() || "",
      maxUses: d.maxUses?.toString() || "",
      validFrom: d.validFrom.slice(0, 10),
      validUntil: d.validUntil.slice(0, 10),
      isActive: d.isActive,
    });
    setDiscountDialogOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountForm.code || !discountForm.validFrom || !discountForm.validUntil) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }

    setDiscountSaving(true);
    try {
      const url = editingDiscountId
        ? `/api/admin/pricing/discounts/${editingDiscountId}`
        : "/api/admin/pricing/discounts";
      const method = editingDiscountId ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        code: discountForm.code,
        validFrom: discountForm.validFrom,
        validUntil: discountForm.validUntil,
        isActive: discountForm.isActive,
        discountPercent: discountForm.discountPercent
          ? parseFloat(discountForm.discountPercent)
          : null,
        discountAmount: discountForm.discountAmount
          ? parseFloat(discountForm.discountAmount)
          : null,
        minOrderMeters: discountForm.minOrderMeters
          ? parseFloat(discountForm.minOrderMeters)
          : null,
        maxUses: discountForm.maxUses
          ? parseInt(discountForm.maxUses)
          : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(
          editingDiscountId ? "Kod güncellendi" : "Kod oluşturuldu",
        );
        setDiscountDialogOpen(false);
        fetchDiscounts();
      } else {
        const data = await res.json();
        toast.error(data.error || "İşlem başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleDeleteDiscount = (id: string) => {
    toast("Bu indirim kodunu silmek istediğinize emin misiniz?", {
      action: {
        label: "Evet, Sil",
        onClick: async () => {
          try {
            const res = await fetch(`/api/admin/pricing/discounts/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              toast.success("İndirim kodu silindi");
              fetchDiscounts();
            } else {
              toast.error("İndirim kodu silinemedi");
            }
          } catch {
            toast.error("Bir hata oluştu");
          }
        },
      },
      cancel: { label: "İptal", onClick: () => {} },
    });
  };

  const handleToggleDiscount = async (d: DiscountCode) => {
    try {
      const res = await fetch(`/api/admin/pricing/discounts/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: d.code,
          discountPercent: d.discountPercent,
          discountAmount: d.discountAmount,
          minOrderMeters: d.minOrderMeters,
          maxUses: d.maxUses,
          validFrom: d.validFrom.slice(0, 10),
          validUntil: d.validUntil.slice(0, 10),
          isActive: !d.isActive,
        }),
      });
      if (res.ok) {
        fetchDiscounts();
      }
    } catch {
      toast.error("Durum değiştirilemedi");
    }
  };

  /* ============================================
     SHIPPING
     ============================================ */
  const fetchShipping = async () => {
    try {
      const res = await fetch("/api/admin/shipping");
      if (res.ok) {
        const data = await res.json();
        setShippingCost(data.config.shippingCost.toString());
        setFreeShippingMin(data.config.freeShippingMin.toString());
        setShippingActive(data.config.isActive);
      }
    } catch {
      // silent
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSaveShipping = async () => {
    const cost = parseFloat(shippingCost);
    const min = parseFloat(freeShippingMin);
    if (isNaN(cost) || cost < 0 || isNaN(min) || min < 0) {
      toast.error("Geçerli değerler girin");
      return;
    }

    setShippingSaving(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingCost: cost,
          freeShippingMin: min,
          isActive: shippingActive,
        }),
      });
      if (res.ok) {
        toast.success("Kargo ayarları güncellendi");
      } else {
        const data = await res.json();
        toast.error(data.error || "Güncelleme başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setShippingSaving(false);
    }
  };

  /* ============================================
     RENDER
     ============================================ */
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fiyatlandırma</h1>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">Fiyat Kademeleri</TabsTrigger>
          <TabsTrigger value="discounts">İndirim Kodları</TabsTrigger>
          <TabsTrigger value="shipping">Kargo Ayarları</TabsTrigger>
        </TabsList>

        {/* ===== TIERS TAB ===== */}
        <TabsContent value="tiers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Fiyat Kademeleri</CardTitle>
              <Button size="sm" onClick={openNewTier}>
                <Plus className="h-4 w-4 mr-1.5" />
                Yeni Kademe
              </Button>
            </CardHeader>
            <CardContent>
              {tiersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz kademe eklenmemiş
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Min (m)</TableHead>
                      <TableHead>Max (m)</TableHead>
                      <TableHead>Fiyat (TL/m)</TableHead>
                      <TableHead>Aktif</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="tabular-nums">
                          {tier.minMeters}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {tier.maxMeters ?? "∞"}
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">
                          {tier.pricePerMeter} TL
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={tier.isActive}
                            onCheckedChange={() => handleToggleTier(tier)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTier(tier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTier(tier.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DISCOUNTS TAB ===== */}
        <TabsContent value="discounts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">İndirim Kodları</CardTitle>
              <Button size="sm" onClick={openNewDiscount}>
                <Plus className="h-4 w-4 mr-1.5" />
                Yeni Kod
              </Button>
            </CardHeader>
            <CardContent>
              {discountsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : discounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz indirim kodu eklenmemiş
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>İndirim</TableHead>
                      <TableHead>Min Metre</TableHead>
                      <TableHead>Kullanım</TableHead>
                      <TableHead>Geçerlilik</TableHead>
                      <TableHead>Aktif</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {d.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.discountPercent
                            ? `%${d.discountPercent}`
                            : d.discountAmount
                              ? `${d.discountAmount} TL`
                              : "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {d.minOrderMeters ? `${d.minOrderMeters} m` : "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {d.usedCount}
                          {d.maxUses ? ` / ${d.maxUses}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(d.validFrom).toLocaleDateString("tr-TR")} –{" "}
                          {new Date(d.validUntil).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={d.isActive}
                            onCheckedChange={() => handleToggleDiscount(d)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDiscount(d)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDiscount(d.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ===== SHIPPING TAB ===== */}
        <TabsContent value="shipping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Kargo Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label>Kargo Ücreti (TL)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder="Örn: 49.90"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ücretsiz Kargo Eşiği (TL)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={freeShippingMin}
                      onChange={(e) => setFreeShippingMin(e.target.value)}
                      placeholder="Örn: 500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={shippingActive}
                      onCheckedChange={setShippingActive}
                    />
                    <Label>Kargo ücreti aktif</Label>
                  </div>
                  <Button onClick={handleSaveShipping} disabled={shippingSaving}>
                    {shippingSaving && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== TIER DIALOG ===== */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTierId ? "Kademe Düzenle" : "Yeni Kademe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Metre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tierForm.minMeters}
                  onChange={(e) =>
                    setTierForm({ ...tierForm, minMeters: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Metre (boş = sınırsız)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tierForm.maxMeters}
                  onChange={(e) =>
                    setTierForm({ ...tierForm, maxMeters: e.target.value })
                  }
                  placeholder="Sınırsız"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Metre Fiyatı (TL)</Label>
              <Input
                type="number"
                step="0.01"
                value={tierForm.pricePerMeter}
                onChange={(e) =>
                  setTierForm({ ...tierForm, pricePerMeter: e.target.value })
                }
                placeholder="Örn: 150.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={tierForm.isActive}
                onCheckedChange={(v) =>
                  setTierForm({ ...tierForm, isActive: v })
                }
              />
              <Label>Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTierDialogOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={handleSaveTier} disabled={tierSaving}>
              {tierSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DISCOUNT DIALOG ===== */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDiscountId ? "İndirim Kodu Düzenle" : "Yeni İndirim Kodu"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Kod</Label>
              <Input
                value={discountForm.code}
                onChange={(e) =>
                  setDiscountForm({
                    ...discountForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Örn: YAZ2024"
                maxLength={30}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Yüzde İndirim (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.discountPercent}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      discountPercent: e.target.value,
                    })
                  }
                  placeholder="Örn: 10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sabit İndirim (TL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.discountAmount}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      discountAmount: e.target.value,
                    })
                  }
                  placeholder="Örn: 50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Sipariş (metre)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountForm.minOrderMeters}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      minOrderMeters: e.target.value,
                    })
                  }
                  placeholder="Opsiyonel"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Kullanım</Label>
                <Input
                  type="number"
                  step="1"
                  value={discountForm.maxUses}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      maxUses: e.target.value,
                    })
                  }
                  placeholder="Sınırsız"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={discountForm.validFrom}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      validFrom: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={discountForm.validUntil}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      validUntil: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={discountForm.isActive}
                onCheckedChange={(v) =>
                  setDiscountForm({ ...discountForm, isActive: v })
                }
              />
              <Label>Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscountDialogOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={handleSaveDiscount} disabled={discountSaving}>
              {discountSaving && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
