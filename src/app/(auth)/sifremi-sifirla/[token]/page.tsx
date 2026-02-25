"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Bir hata oluştu.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/giris"), 3000);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {success ? "Şifre Değiştirildi" : "Yeni Şifre Belirle"}
        </CardTitle>
        <CardDescription>
          {success
            ? "Giriş sayfasına yönlendiriliyorsunuz..."
            : "Hesabınız için yeni bir şifre belirleyin"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/50 p-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Şifreniz başarıyla değiştirildi. Giriş sayfasına
                yönlendiriliyorsunuz...
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
              <Label htmlFor="password">Yeni Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  className="pl-10"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrarı</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  className="pl-10"
                  {...form.register("confirmPassword")}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Değiştiriliyor..." : "Şifremi Değiştir"}
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
