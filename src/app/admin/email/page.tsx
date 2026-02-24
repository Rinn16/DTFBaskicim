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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Trash2, Eye, Code2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

/* ========== Types ========== */

type EmailTemplateType = "WELCOME" | "ORDER_CONFIRMATION" | "SHIPPED";

const TYPE_LABELS: Record<EmailTemplateType, string> = {
  WELCOME: "Hoş Geldiniz",
  ORDER_CONFIRMATION: "Sipariş Onayı",
  SHIPPED: "Kargoya Verildi",
};

const TYPE_VARIABLES: Record<EmailTemplateType, { key: string; label: string }[]> = {
  WELCOME: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
  ],
  ORDER_CONFIRMATION: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
    { key: "{siparisNo}", label: "Sipariş numarası" },
    { key: "{siparisTarihi}", label: "Sipariş tarihi" },
    { key: "{toplamTutar}", label: "Toplam tutar" },
    { key: "{toplamMetre}", label: "Toplam metre" },
    { key: "{urunSayisi}", label: "Ürün sayısı" },
    { key: "{odemeTuru}", label: "Ödeme yöntemi" },
    { key: "{kargoUcreti}", label: "Kargo ücreti" },
    { key: "{urunListesi}", label: "Ürün listesi (HTML)" },
    { key: "{teslimatAdresi}", label: "Teslimat adresi" },
    { key: "{siparisDetayUrl}", label: "Sipariş detay URL" },
  ],
  SHIPPED: [
    { key: "{musteriAdi}", label: "Müşteri adı" },
    { key: "{siparisNo}", label: "Sipariş numarası" },
    { key: "{takipKodu}", label: "Kargo takip kodu" },
    { key: "{siparisTarihi}", label: "Sipariş tarihi" },
    { key: "{urunListesi}", label: "Ürün listesi (HTML)" },
    { key: "{teslimatAdresi}", label: "Teslimat adresi" },
    { key: "{siparisDetayUrl}", label: "Sipariş detay URL" },
    { key: "{toplamTutar}", label: "Toplam tutar" },
    { key: "{toplamMetre}", label: "Toplam metre" },
    { key: "{urunSayisi}", label: "Ürün sayısı" },
    { key: "{odemeTuru}", label: "Ödeme yöntemi" },
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

  // Edit mode — when set, full-page editor is shown instead of the list
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
    setTimeout(() => fetchPreview(t.content, t.subject, t.type), 100);
  };

  const closeEdit = () => {
    setEditingTemplate(null);
    setPreviewHtml("");
    setPreviewSubject("");
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
        closeEdit();
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

  /* ========== Full-page Editor View ========== */

  if (editingTemplate) {
    return (
      <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] md:h-[calc(100vh-theme(spacing.12))]">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={closeEdit}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Geri
            </Button>
            <div className="h-5 w-px bg-border" />
            <Code2 className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold truncate">
              {editingTemplate.name}
            </h1>
            <Badge variant="secondary" className="shrink-0">
              {TYPE_LABELS[editingTemplate.type]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => handleFormChange({ isActive: v })}
              />
              <Label className="text-sm">Aktif</Label>
            </div>
            <Button variant="outline" onClick={closeEdit}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </div>
        </div>

        {/* Split editor + preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Left: Editor */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
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
                placeholder="E-posta konu satırı — değişkenler kullanılabilir"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
              <Label>HTML İçerik</Label>
              <Textarea
                value={form.content}
                onChange={(e) => handleFormChange({ content: e.target.value })}
                placeholder="E-posta HTML içeriği..."
                className="flex-1 min-h-[300px] font-mono text-xs resize-none"
              />
            </div>

            {/* Variables */}
            {TYPE_VARIABLES[editingTemplate.type] && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2 shrink-0">
                <p className="text-xs font-medium text-foreground">Kullanılabilir Değişkenler — tıklayarak ekle</p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_VARIABLES[editingTemplate.type].map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-background border px-2.5 py-1.5 text-xs font-mono hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                      title={`${v.label} — tıklayarak ekle`}
                    >
                      {v.key}
                      <span className="text-muted-foreground font-sans">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 shrink-0">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Canlı Önizleme</Label>
              {previewLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>

            {previewSubject && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 shrink-0">
                <p className="text-xs text-muted-foreground">Konu:</p>
                <p className="text-sm font-medium">{previewSubject}</p>
              </div>
            )}

            <div className="flex-1 rounded-lg border bg-white overflow-hidden min-h-[400px]">
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
      </div>
    );
  }

  /* ========== Template List View ========== */

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
    </div>
  );
}
