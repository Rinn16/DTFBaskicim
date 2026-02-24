"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Pencil, Trash2, Eye, Code2, Mail } from "lucide-react";
import { toast } from "sonner";

/* ========== Types ========== */

type EmailTemplateType = "ORDER_CONFIRMATION" | "STATUS_UPDATE" | "WELCOME" | "OTP";

const TYPE_LABELS: Record<EmailTemplateType, string> = {
  ORDER_CONFIRMATION: "Sipariş Onayı",
  STATUS_UPDATE: "Durum Güncelleme",
  WELCOME: "Hoş Geldiniz",
  OTP: "Doğrulama Kodu",
};

const TYPE_VARIABLES: Record<EmailTemplateType, { key: string; label: string }[]> = {
  ORDER_CONFIRMATION: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
    { key: "{siparisNo}", label: "Sipariş numarası" },
    { key: "{toplamTutar}", label: "Toplam tutar" },
    { key: "{toplamMetre}", label: "Toplam metre" },
    { key: "{urunSayisi}", label: "Ürün sayısı" },
    { key: "{odemeTuru}", label: "Ödeme yöntemi" },
  ],
  STATUS_UPDATE: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
    { key: "{siparisNo}", label: "Sipariş numarası" },
    { key: "{toplamTutar}", label: "Toplam tutar" },
    { key: "{toplamMetre}", label: "Toplam metre" },
    { key: "{urunSayisi}", label: "Ürün sayısı" },
    { key: "{odemeTuru}", label: "Ödeme yöntemi" },
    { key: "{yeniDurum}", label: "Yeni durum" },
  ],
  WELCOME: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
  ],
  OTP: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
  ],
};

interface EmailTemplate {
  id: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateForm {
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
}

/* ========== Component ========== */

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>({ name: "", subject: "", content: "", isActive: true });
  const [saving, setSaving] = useState(false);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ========== Fetch ========== */

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/email-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /* ========== Preview ========== */

  const fetchPreview = useCallback(
    async (content: string, subject: string, type: EmailTemplateType) => {
      if (!content.trim()) {
        setPreviewHtml("");
        setPreviewSubject("");
        return;
      }
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/email-templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, subject, type }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewHtml(data.html);
          setPreviewSubject(data.subject);
        }
      } catch {
        // silent
      } finally {
        setPreviewLoading(false);
      }
    },
    [],
  );

  const schedulePreview = useCallback(
    (content: string, subject: string, type: EmailTemplateType) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchPreview(content, subject, type);
      }, 500);
    },
    [fetchPreview],
  );

  /* ========== Handlers ========== */

  const openEdit = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setForm({ name: t.name, subject: t.subject, content: t.content, isActive: t.isActive });
    setPreviewHtml("");
    setPreviewSubject("");
    setDialogOpen(true);
    // Trigger initial preview
    setTimeout(() => fetchPreview(t.content, t.subject, t.type), 100);
  };

  const handleFormChange = (updates: Partial<TemplateForm>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    if (editingTemplate && (updates.content !== undefined || updates.subject !== undefined)) {
      schedulePreview(newForm.content, newForm.subject, editingTemplate.type);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    if (!form.name || !form.subject || !form.content) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Şablon güncellendi");
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

  const handleToggle = async (t: EmailTemplate) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          subject: t.subject,
          content: t.content,
          isActive: !t.isActive,
        }),
      });
      if (res.ok) fetchTemplates();
    } catch {
      toast.error("Durum değiştirilemedi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, { method: "DELETE" });
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

  const insertVariable = (key: string) => {
    handleFormChange({ content: form.content + key });
  };

  /* ========== Render ========== */

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">E-posta Şablonları</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şablonlar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz e-posta şablonu yok
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {TYPE_LABELS[t.type] || t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                        {t.subject}
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

      {/* ========== Edit Dialog (Split View) ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Şablon Düzenle: {editingTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
            {/* Left: Editor */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>Şablon Adı</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFormChange({ name: e.target.value })}
                  placeholder="Şablon adı"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Konu Satırı</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => handleFormChange({ subject: e.target.value })}
                  placeholder="E-posta konu satırı"
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <Label>HTML İçerik</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => handleFormChange({ content: e.target.value })}
                  placeholder="E-posta HTML içeriği..."
                  className="flex-1 min-h-[250px] font-mono text-xs"
                />
              </div>

              {/* Variables */}
              {editingTemplate && TYPE_VARIABLES[editingTemplate.type] && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">Kullanılabilir Değişkenler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_VARIABLES[editingTemplate.type].map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="inline-flex items-center gap-1 rounded-md bg-background border px-2 py-1 text-xs font-mono hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                        title={`${v.label} — tıklayarak ekle`}
                      >
                        {v.key}
                        <span className="text-muted-foreground font-sans text-[10px]">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => handleFormChange({ isActive: v })}
                />
                <Label>Aktif</Label>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col gap-2 overflow-hidden min-h-0">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Önizleme</Label>
                {previewLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>

              {previewSubject && (
                <div className="rounded-md border bg-muted/30 px-3 py-1.5">
                  <p className="text-xs text-muted-foreground">Konu:</p>
                  <p className="text-sm font-medium">{previewSubject}</p>
                </div>
              )}

              <div className="flex-1 rounded-lg border bg-white overflow-hidden min-h-[300px]">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title="E-posta Önizleme"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    İçerik girince önizleme görünecek
                  </div>
                )}
              </div>
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
    </div>
  );
}
