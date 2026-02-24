"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SiteSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  emailWelcome: boolean;
  emailOrderConfirm: boolean;
  emailShipped: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

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
    </div>
  );
}
