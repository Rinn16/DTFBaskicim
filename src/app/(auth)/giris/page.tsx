"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  loginSchema,
  phoneLoginSchema,
  otpVerifySchema,
  type LoginInput,
  type PhoneLoginInput,
  type OtpVerifyInput,
} from "@/validations/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/tasarim";
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Email form
  const emailForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Phone form
  const phoneForm = useForm<PhoneLoginInput>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: "" },
  });

  // OTP form
  const otpForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { phone: "", code: "" },
  });

  const onEmailSubmit = async (data: LoginInput) => {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("email-password", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email veya şifre hatalı");
      } else {
        router.push(callbackUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (data: PhoneLoginInput) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        return;
      }

      setOtpSent(true);
      setOtpPhone(data.phone);
      otpForm.setValue("phone", data.phone);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpVerifyInput) => {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("phone-otp", {
        phone: data.phone,
        code: data.code,
        redirect: false,
      });

      if (result?.error) {
        setError("Geçersiz doğrulama kodu");
      } else {
        router.push(callbackUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
        <CardDescription>
          DTF Baskıcım hesabınıza giriş yapın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Telefon</TabsTrigger>
          </TabsList>

          {/* Email Login */}
          <TabsContent value="email">
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="örnek@email.com"
                  {...emailForm.register("email")}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  {...emailForm.register("password")}
                />
                {emailForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {emailForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
              <div className="text-right">
                <Link
                  href="/sifremi-unuttum"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              </div>
            </form>
          </TabsContent>

          {/* Phone Login */}
          <TabsContent value="phone">
            {!otpSent ? (
              <form
                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    {...phoneForm.register("phone")}
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  <strong>{otpPhone}</strong> numarasına gönderilen 6 haneli
                  kodu girin.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="code">Doğrulama Kodu</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    {...otpForm.register("code")}
                  />
                  {otpForm.formState.errors.code && (
                    <p className="text-xs text-destructive">
                      {otpForm.formState.errors.code.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Giriş Yap"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpPhone("");
                  }}
                >
                  Geri Dön
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">veya</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google ile Giriş Yap
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="text-primary hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
