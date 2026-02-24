"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  type: "BILGILENDIRME" | "KAMPANYA";
  isActive: boolean;
  createdAt: string;
}

interface TemplateForm {
  name: string;
  content: string;
  type: "BILGILENDIRME" | "KAMPANYA";
  isActive: boolean;
}

const emptyForm: TemplateForm = {
  name: "",
  content: "",
  type: "BILGILENDIRME",
  isActive: true,
};

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: SmsTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      content: t.content,
      type: t.type,
      isActive: t.isActive,
    });
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
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/sms-templates/${id}`, {
        method: "DELETE",
      });
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
        body: JSON.stringify({
          name: t.name,
          content: t.content,
          type: t.type,
          isActive: !t.isActive,
        }),
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch {
      toast.error("Durum değiştirilemedi");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SMS Şablonları</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Şablonlar</CardTitle>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            Yeni Şablon
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz şablon eklenmemiş
            </p>
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
                        <Badge
                          variant={
                            t.type === "KAMPANYA" ? "default" : "secondary"
                          }
                        >
                          {t.type === "KAMPANYA"
                            ? "Kampanya"
                            : "Bilgilendirme"}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Şablon Düzenle" : "Yeni Şablon"}
            </DialogTitle>
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
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    type: v as "BILGILENDIRME" | "KAMPANYA",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BILGILENDIRME">Bilgilendirme</SelectItem>
                  <SelectItem value="KAMPANYA">Kampanya</SelectItem>
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
    </div>
  );
}
