"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Users, Edit3 } from "lucide-react";
import { toast } from "sonner";

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  type: string;
  isActive: boolean;
}

interface PhoneUser {
  phone: string;
  name: string;
}

type RecipientMode = "all" | "manual";

export default function SmsSendPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("free");
  const [message, setMessage] = useState("");

  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [allUsers, setAllUsers] = useState<PhoneUser[]>([]);
  const [manualPhones, setManualPhones] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/sms-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates.filter((t: SmsTemplate) => t.isActive));
      }
    } catch {
      // silent
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/sms-send/phones");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
      }
    } catch {
      // silent
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);
    if (value === "free") {
      setMessage("");
    } else {
      const tpl = templates.find((t) => t.id === value);
      if (tpl) setMessage(tpl.content);
    }
  };

  const getPhones = (): string[] => {
    if (recipientMode === "all") {
      return allUsers.map((u) => u.phone).filter(Boolean) as string[];
    }
    return manualPhones
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  const recipientCount = recipientMode === "all" ? allUsers.length : getPhones().length;

  const handlePreview = () => {
    if (!message.trim()) {
      toast.error("Mesaj içeriği boş olamaz");
      return;
    }
    if (recipientCount === 0) {
      toast.error("En az bir alıcı gerekli");
      return;
    }
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const phones = getPhones();
      const res = await fetch("/api/admin/sms-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phones,
          templateId: selectedTemplateId !== "free" ? selectedTemplateId : undefined,
        }),
      });

      if (res.ok) {
        toast.success(`${phones.length} alıcıya SMS gönderildi`);
        setConfirmOpen(false);
        setMessage("");
        setManualPhones("");
        setSelectedTemplateId("free");
      } else {
        const data = await res.json();
        toast.error(data.error || "SMS gönderilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Gönder</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sol: Mesaj */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mesaj</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Şablon</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Serbest Mesaj</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mesaj İçeriği</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="SMS mesajını yazın..."
                maxLength={918}
                rows={8}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length} / 918
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sag: Alicilar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alıcılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={recipientMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRecipientMode("all")}
                disabled={usersLoading}
              >
                <Users className="h-4 w-4 mr-1.5" />
                {usersLoading
                  ? "Yükleniyor..."
                  : `Tüm Kullanıcılar (${allUsers.length})`}
              </Button>
              <Button
                variant={recipientMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setRecipientMode("manual")}
              >
                <Edit3 className="h-4 w-4 mr-1.5" />
                Manuel Giriş
              </Button>
            </div>

            {recipientMode === "all" ? (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Sistemde kayıtlı telefon numarası olan{" "}
                  <span className="font-semibold text-foreground">
                    {allUsers.length}
                  </span>{" "}
                  kullanıcıya gönderilecek.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Telefon Numaraları</Label>
                <Textarea
                  value={manualPhones}
                  onChange={(e) => setManualPhones(e.target.value)}
                  placeholder={"5xxxxxxxxx\n5xxxxxxxxx\n5xxxxxxxxx"}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Her satıra bir numara yazın.{" "}
                  <span className="font-medium">
                    {getPhones().length} numara girildi
                  </span>
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handlePreview}
              disabled={!message.trim() || recipientCount === 0}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Önizle ve Gönder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Onay Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS Gönderimi Onayla</DialogTitle>
            <DialogDescription>
              Aşağıdaki mesaj gönderilecek. Onaylıyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {recipientCount} alıcı
              </Badge>
              {selectedTemplateId !== "free" && (
                <Badge variant="outline">
                  {templates.find((t) => t.id === selectedTemplateId)?.name}
                </Badge>
              )}
            </div>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {message.length} karakter
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              İptal
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
