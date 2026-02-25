"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  MessageSquare,
  Building2,
  Receipt,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SiteSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  emailWelcome: boolean;
  emailOrderConfirm: boolean;
  emailShipped: boolean;
  // Fatura firma bilgileri
  invoiceCompanyName: string | null;
  invoiceCompanyTaxNumber: string | null;
  invoiceCompanyTaxOffice: string | null;
  invoiceCompanyAddress: string | null;
  invoiceCompanyCity: string | null;
  invoiceCompanyDistrict: string | null;
  invoiceCompanyZipCode: string | null;
  invoiceCompanyPhone: string | null;
  invoiceCompanyEmail: string | null;
  invoiceCompanyIban: string | null;
  invoiceCompanyWebsite: string | null;
  invoiceCompanyLogoKey: string | null;
  invoiceNotes: string | null;
  invoicePrefix: string;
  invoiceNextNumber: number;
  // E-fatura (Trendyol E-Faturam)
  efaturaEnabled: boolean;
  efaturaEnvironment: string;
  efaturaEmail: string | null;
  efaturaPassword: string | null;
  efaturaEarsivPrefix: string;
  efaturaEfaturaPrefix: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Invoice company form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceCompanyName: "",
    invoiceCompanyTaxNumber: "",
    invoiceCompanyTaxOffice: "",
    invoiceCompanyAddress: "",
    invoiceCompanyCity: "",
    invoiceCompanyDistrict: "",
    invoiceCompanyZipCode: "",
    invoiceCompanyPhone: "",
    invoiceCompanyEmail: "",
    invoiceCompanyIban: "",
    invoiceCompanyWebsite: "",
    invoiceNotes: "",
    invoicePrefix: "DTF-F",
  });

  // E-fatura form state
  const [efaturaForm, setEfaturaForm] = useState({
    efaturaEnvironment: "test" as "test" | "production",
    efaturaEmail: "",
    efaturaPassword: "",
    efaturaEarsivPrefix: "DAP",
    efaturaEfaturaPrefix: "DIP",
  });

  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingEfatura, setSavingEfatura] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        // Populate invoice form
        const s = data.settings;
        setInvoiceForm({
          invoiceCompanyName: s.invoiceCompanyName || "",
          invoiceCompanyTaxNumber: s.invoiceCompanyTaxNumber || "",
          invoiceCompanyTaxOffice: s.invoiceCompanyTaxOffice || "",
          invoiceCompanyAddress: s.invoiceCompanyAddress || "",
          invoiceCompanyCity: s.invoiceCompanyCity || "",
          invoiceCompanyDistrict: s.invoiceCompanyDistrict || "",
          invoiceCompanyZipCode: s.invoiceCompanyZipCode || "",
          invoiceCompanyPhone: s.invoiceCompanyPhone || "",
          invoiceCompanyEmail: s.invoiceCompanyEmail || "",
          invoiceCompanyIban: s.invoiceCompanyIban || "",
          invoiceCompanyWebsite: s.invoiceCompanyWebsite || "",
          invoiceNotes: s.invoiceNotes || "",
          invoicePrefix: s.invoicePrefix || "DTF-F",
        });
        setEfaturaForm({
          efaturaEnvironment: s.efaturaEnvironment || "test",
          efaturaEmail: s.efaturaEmail || "",
          efaturaPassword: s.efaturaPassword || "",
          efaturaEarsivPrefix: s.efaturaEarsivPrefix || "DAP",
          efaturaEfaturaPrefix: s.efaturaEfaturaPrefix || "DIP",
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleSms = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsEnabled: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success(enabled ? "SMS bildirimleri etkinleştirildi" : "SMS bildirimleri devre dışı bırakıldı");
      } else {
        toast.error("Ayar güncellenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleEmail = async (field: keyof SiteSettings, enabled: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success("E-posta ayarı güncellendi");
      } else {
        toast.error("Ayar güncellenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveInvoiceCompany = async () => {
    setSavingInvoice(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success("Fatura firma bilgileri kaydedildi");
      } else {
        const err = await res.json().catch(() => null);
        console.error("Invoice save error:", err);
        toast.error(err?.detail || "Bilgiler kaydedilemedi");
      }
    } catch (e) {
      console.error("Invoice save exception:", e);
      toast.error("Bir hata oluştu");
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleSaveEfatura = async () => {
    setSavingEfatura(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(efaturaForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success("E-Fatura ayarları kaydedildi");
      } else {
        toast.error("Ayarlar kaydedilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSavingEfatura(false);
    }
  };

  const handleToggleEfatura = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ efaturaEnabled: enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success(enabled ? "E-Fatura sistemi etkinleştirildi" : "E-Fatura sistemi devre dışı bırakıldı");
      } else {
        toast.error("Ayar güncellenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo dosyası 2MB'dan küçük olmalıdır");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success("Logo yüklendi");
      } else {
        const data = await res.json();
        toast.error(data.error || "Logo yüklenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      {/* SMS Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">SMS Sistemi</Label>
              <p className="text-sm text-muted-foreground">
                Otomatik sipariş SMS&apos;leri ve manuel SMS gönderimi
              </p>
            </div>
            <Switch
              checked={settings?.smsEnabled ?? false}
              onCheckedChange={handleToggleSms}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-posta Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">E-posta Sistemi</Label>
              <p className="text-sm text-muted-foreground">
                Tüm otomatik e-posta bildirimlerini aç/kapat
              </p>
            </div>
            <Switch
              checked={settings?.emailEnabled ?? false}
              onCheckedChange={(v) => handleToggleEmail("emailEnabled", v)}
              disabled={updating}
            />
          </div>

          {settings?.emailEnabled && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Hoşgeldiniz Maili</Label>
                  <p className="text-sm text-muted-foreground">
                    Üye olunca gönderilen karşılama e-postası
                  </p>
                </div>
                <Switch
                  checked={settings.emailWelcome}
                  onCheckedChange={(v) => handleToggleEmail("emailWelcome", v)}
                  disabled={updating}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sipariş Onayı</Label>
                  <p className="text-sm text-muted-foreground">
                    Sipariş alındığında gönderilen onay e-postası
                  </p>
                </div>
                <Switch
                  checked={settings.emailOrderConfirm}
                  onCheckedChange={(v) => handleToggleEmail("emailOrderConfirm", v)}
                  disabled={updating}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Kargoya Verildi</Label>
                  <p className="text-sm text-muted-foreground">
                    Sipariş kargoya verildiğinde gönderilen e-posta
                  </p>
                </div>
                <Switch
                  checked={settings.emailShipped}
                  onCheckedChange={(v) => handleToggleEmail("emailShipped", v)}
                  disabled={updating}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fatura Firma Bilgileri Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Fatura Firma Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faturalarda görünecek firma bilgileri. Site adından farklı bir firma olabilir.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Firma Adı *</Label>
              <Input
                placeholder="Örn: ABC Tekstil Ltd. Şti."
                value={invoiceForm.invoiceCompanyName}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vergi Dairesi *</Label>
              <Input
                placeholder="Örn: Konya Selçuklu"
                value={invoiceForm.invoiceCompanyTaxOffice}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyTaxOffice: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vergi No *</Label>
              <Input
                placeholder="Örn: 1234567890"
                value={invoiceForm.invoiceCompanyTaxNumber}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyTaxNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Telefon</Label>
              <Input
                placeholder="Örn: 0332 123 45 67"
                value={invoiceForm.invoiceCompanyPhone}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">E-posta</Label>
              <Input
                type="email"
                placeholder="Örn: fatura@firma.com"
                value={invoiceForm.invoiceCompanyEmail}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Şehir</Label>
              <Input
                placeholder="Örn: Konya"
                value={invoiceForm.invoiceCompanyCity}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyCity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">İlçe</Label>
              <Input
                placeholder="Örn: Selçuklu"
                value={invoiceForm.invoiceCompanyDistrict}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyDistrict: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Posta Kodu</Label>
              <Input
                placeholder="Örn: 42050"
                value={invoiceForm.invoiceCompanyZipCode}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyZipCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Adres</Label>
            <Input
              placeholder="Açık adres"
              value={invoiceForm.invoiceCompanyAddress}
              onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyAddress: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">IBAN</Label>
              <Input
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={invoiceForm.invoiceCompanyIban}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyIban: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Web Sitesi</Label>
              <Input
                placeholder="Örn: www.dtfbaskicim.com"
                value={invoiceForm.invoiceCompanyWebsite}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceCompanyWebsite: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                E-faturada görünecek web sitesi adresi
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fatura Notu</Label>
            <Input
              placeholder="Örn: Sipariş No: {siparisNo} — İade koşulları için web sitemizi ziyaret ediniz."
              value={invoiceForm.invoiceNotes}
              onChange={(e) => setInvoiceForm((p) => ({ ...p, invoiceNotes: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              E-faturanın altında görünecek açıklama notu. Kullanılabilir değişkenler: <code className="bg-muted px-1 rounded">{"{siparisNo}"}</code> <code className="bg-muted px-1 rounded">{"{faturaNo}"}</code>
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fatura Ön Eki</Label>
              <Input
                placeholder="DTF-F"
                value={invoiceForm.invoicePrefix}
                onChange={(e) => setInvoiceForm((p) => ({ ...p, invoicePrefix: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Fatura numarası formatı: {invoiceForm.invoicePrefix || "DTF-F"}-2026-00001
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sonraki Fatura No</Label>
              <Input
                value={settings?.invoiceNextNumber ?? 1}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Otomatik artar, düzenlenemez
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Firma Logosu</Label>
            <div className="flex items-center gap-3">
              {settings?.invoiceCompanyLogoKey ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Logo yüklendi
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Logo yüklenmemiş
                </div>
              )}
              <Button variant="outline" size="sm" disabled={uploadingLogo} asChild>
                <label className="cursor-pointer">
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {uploadingLogo ? "Yükleniyor..." : "Logo Yükle"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG veya JPG, maks. 2MB. Fatura PDF&apos;inin sol üst köşesinde görünür.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveInvoiceCompany} disabled={savingInvoice}>
              {savingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* E-Fatura Ayarları Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            E-Fatura Ayarları (Trendyol E-Faturam)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">E-Fatura Sistemi</Label>
              <p className="text-sm text-muted-foreground">
                Trendyol E-Faturam üzerinden e-fatura/e-arşiv gönderimi
              </p>
            </div>
            <Switch
              checked={settings?.efaturaEnabled ?? false}
              onCheckedChange={handleToggleEfatura}
              disabled={updating}
            />
          </div>

          {settings?.efaturaEnabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ortam</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="efaturaEnv"
                      checked={efaturaForm.efaturaEnvironment === "test"}
                      onChange={() => setEfaturaForm((p) => ({ ...p, efaturaEnvironment: "test" }))}
                      className="accent-primary"
                    />
                    <span className="text-sm">Test (Stage)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="efaturaEnv"
                      checked={efaturaForm.efaturaEnvironment === "production"}
                      onChange={() => setEfaturaForm((p) => ({ ...p, efaturaEnvironment: "production" }))}
                      className="accent-primary"
                    />
                    <span className="text-sm">Production (Canlı)</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Test: stage-apigateway.trendyolefaturam.com — Canlı: apigateway.trendyolecozum.com
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-posta</Label>
                  <Input
                    type="email"
                    placeholder="Trendyol E-Faturam hesap e-postası"
                    value={efaturaForm.efaturaEmail}
                    onChange={(e) => setEfaturaForm((p) => ({ ...p, efaturaEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Şifre</Label>
                  <Input
                    type="password"
                    placeholder="Hesap şifresi"
                    value={efaturaForm.efaturaPassword}
                    onChange={(e) => setEfaturaForm((p) => ({ ...p, efaturaPassword: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-Arşiv Seri Ön Eki</Label>
                  <Input
                    placeholder="DAP"
                    maxLength={3}
                    value={efaturaForm.efaturaEarsivPrefix}
                    onChange={(e) => setEfaturaForm((p) => ({ ...p, efaturaEarsivPrefix: e.target.value.toUpperCase().slice(0, 3) }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bireysel müşteriler için (3 harf, rakamla başlayamaz)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-Fatura Seri Ön Eki</Label>
                  <Input
                    placeholder="DIP"
                    maxLength={3}
                    value={efaturaForm.efaturaEfaturaPrefix}
                    onChange={(e) => setEfaturaForm((p) => ({ ...p, efaturaEfaturaPrefix: e.target.value.toUpperCase().slice(0, 3) }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    E-Fatura kayıtlı kurumsal müşteriler için (3 harf, rakamla başlayamaz)
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveEfatura} disabled={savingEfatura}>
                  {savingEfatura ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
