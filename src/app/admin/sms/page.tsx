"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Send, Users, Edit3, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/components/ui/confirm-dialog";

/* ========== Types ========== */

type TemplateType = "SIPARIS_ONAYLANDI" | "KARGOYA_VERILDI" | "KAMPANYA";

const TYPE_LABELS: Record<TemplateType, string> = {
  SIPARIS_ONAYLANDI: "Sipariş Onaylandı (Otomatik)",
  KARGOYA_VERILDI: "Kargoya Verildi (Otomatik)",
  KAMPANYA: "Kampanya (Manuel)",
};

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  type: TemplateType;
  isActive: boolean;
  createdAt: string;
}

interface TemplateForm {
  name: string;
  content: string;
  type: TemplateType;
  isActive: boolean;
}

const emptyForm: TemplateForm = {
  name: "",
  content: "",
  type: "SIPARIS_ONAYLANDI",
  isActive: true,
};

interface PhoneUser {
  phone: string;
  name: string;
}

type RecipientMode = "all" | "manual";

interface SmsLogEntry {
  id: string;
  templateId: string | null;
  message: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  sentBy: string;
  createdAt: string;
}

/* ========== Component ========== */

export default function SmsManagementPage() {
  /* --- Templates state --- */
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  /* --- Send state --- */
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("free");
  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [allUsers, setAllUsers] = useState<PhoneUser[]>([]);
  const [manualPhones, setManualPhones] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  /* --- History state --- */
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  /* ========== Fetch ========== */

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/sms-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch {
      // silent
    } finally {
      setTemplatesLoading(false);
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

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/sms-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchLogs();
  }, []);

  /* ========== Templates handlers ========== */

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: SmsTemplate) => {
    setEditingId(t.id);
    setForm({ name: t.name, content: t.content, type: t.type, isActive: t.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/sms-templates/${editingId}`
        : "/api/admin/sms-templates";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingId ? "Şablon güncellendi" : "Şablon oluşturuldu");
        setDialogOpen(false);
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || "İşlem başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      description: "Bu şablonu silmek istediğinize emin misiniz?",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/sms-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Şablon silindi");
        fetchTemplates();
      } else {
        toast.error("Şablon silinemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  const handleToggle = async (t: SmsTemplate) => {
    try {
      const res = await fetch(`/api/admin/sms-templates/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t.name, content: t.content, type: t.type, isActive: !t.isActive }),
      });
      if (res.ok) fetchTemplates();
    } catch {
      toast.error("Durum değiştirilemedi");
    }
  };

  /* ========== Send handlers ========== */

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
      return allUsers.map((u) => u.phone).filter(Boolean);
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
        fetchLogs();
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

  /* ========== Render ========== */

  const activeTemplates = templates.filter((t) => t.isActive);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Yönetimi</h1>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
          <TabsTrigger value="send">SMS Gönder</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        {/* ========== TAB: Şablonlar ========== */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Şablonlar</CardTitle>
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1.5" />
                Yeni Şablon
              </Button>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-12">
                  <MessageSquare className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">Henüz şablon eklenmemiş</p>
                  <p className="text-xs">Yeni bir SMS şablonu ekleyerek başlayın</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>İçerik</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant={t.type === "KAMPANYA" ? "default" : "secondary"}>
                              {TYPE_LABELS[t.type] || t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {t.content}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={t.isActive}
                              onCheckedChange={() => handleToggle(t)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
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

        {/* ========== TAB: SMS Gönder ========== */}
        <TabsContent value="send" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sol: Mesaj */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mesaj</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Şablon</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şablon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Serbest Mesaj</SelectItem>
                      {activeTemplates.map((t) => (
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
                    {usersLoading ? "Yükleniyor..." : `Tüm Kullanıcılar (${allUsers.length})`}
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
                      <span className="font-semibold text-foreground">{allUsers.length}</span>{" "}
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
                      <span className="font-medium">{getPhones().length} numara girildi</span>
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
        </TabsContent>

        {/* ========== TAB: Geçmiş ========== */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gönderim Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-12">
                  <History className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">Henüz SMS gönderilmemiş</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Mesaj</TableHead>
                        <TableHead className="text-center">Alıcı</TableHead>
                        <TableHead className="text-center">Başarılı</TableHead>
                        <TableHead className="text-center">Başarısız</TableHead>
                        <TableHead>Gönderen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                            {log.message}
                          </TableCell>
                          <TableCell className="text-center">{log.recipientCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {log.successCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {log.failCount > 0 ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                {log.failCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{log.sentBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== Template Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Şablon Düzenle" : "Yeni Şablon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Şablon Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Örn: Kampanya Duyurusu"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TemplateType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIPARIS_ONAYLANDI">Sipariş Onaylandı (Otomatik)</SelectItem>
                  <SelectItem value="KARGOYA_VERILDI">Kargoya Verildi (Otomatik)</SelectItem>
                  <SelectItem value="KAMPANYA">Kampanya (Manuel)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mesaj İçeriği</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="SMS mesaj içeriğini yazın..."
                maxLength={918}
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.content.length} / 918
              </p>
              {form.type !== "KAMPANYA" && (
                <div className="bg-muted/50 rounded-md p-2.5 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Kullanılabilir değişkenler:</p>
                  <p><code className="bg-muted px-1 rounded">{"{musteriAdi}"}</code> — Müşteri adı</p>
                  <p><code className="bg-muted px-1 rounded">{"{siparisNo}"}</code> — Sipariş numarası</p>
                  <p><code className="bg-muted px-1 rounded">{"{toplamTutar}"}</code> — Toplam tutar</p>
                  {form.type === "KARGOYA_VERILDI" && (
                    <p><code className="bg-muted px-1 rounded">{"{takipKodu}"}</code> — Kargo takip kodu</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Send Confirm Dialog ========== */}
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
              <Badge variant="secondary">{recipientCount} alıcı</Badge>
              {selectedTemplateId !== "free" && (
                <Badge variant="outline">
                  {templates.find((t) => t.id === selectedTemplateId)?.name}
                </Badge>
              )}
            </div>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
            <p className="text-xs text-muted-foreground">{message.length} karakter</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
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
