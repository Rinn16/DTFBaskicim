"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir email adresi girin"),
  subject: z.string().min(3, "Konu en az 3 karakter olmalı"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setServerError(result.error || "Mesajınız gönderilemedi.");
      }
    } catch {
      setServerError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-bold text-foreground">Mesajınız iletildi!</h2>
        <p className="text-muted-foreground text-sm">
          En kısa sürede size geri döneceğiz.
        </p>
        <Button variant="outline" onClick={() => { setSuccess(false); form.reset(); }}>
          Yeni Mesaj Gönder
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
    >
      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ad Soyad *</Label>
          <Input
            id="name"
            placeholder="Adınız Soyadınız"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta *</Label>
          <Input
            id="email"
            type="email"
            placeholder="ornek@email.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Konu *</Label>
        <Input
          id="subject"
          placeholder="Mesajınızın konusu"
          {...form.register("subject")}
        />
        {form.formState.errors.subject && (
          <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mesaj *</Label>
        <textarea
          id="message"
          rows={6}
          placeholder="Mesajınızı buraya yazın..."
          className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all resize-none"
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        <Mail className="h-4 w-4 mr-2" />
        {form.formState.isSubmitting ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </form>
  );
}
