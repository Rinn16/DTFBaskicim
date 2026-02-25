"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/validations/auth";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 429) {
        setError("Çok fazla deneme. Lütfen 1 saat sonra tekrar deneyin.");
        return;
      }

      setSent(true);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
        <CardDescription>
          {sent
            ? "E-postanızı kontrol edin"
            : "Şifre sıfırlama linki göndereceğiz"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/50 p-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Eğer bu email adresi ile kayıtlı bir hesap varsa, şifre
                sıfırlama linki gönderildi. Lütfen gelen kutunuzu ve spam
                klasörünüzü kontrol edin.
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/giris">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Giriş Sayfasına Dön
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Adresi</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  className="pl-10"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/giris" className="text-primary hover:underline">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                Giriş sayfasına dön
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
