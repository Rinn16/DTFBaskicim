"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailDogralaPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Geçersiz doğrulama bağlantısı");
      return;
    }

    fetch(`/api/user/change-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.error || "Doğrulama başarısız");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Bir hata oluştu");
      });
  }, [token]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Email adresi doğrulanıyor...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Email Adresi Değiştirildi</h1>
            <p className="text-muted-foreground">
              Yeni email adresiniz başarıyla doğrulandı ve hesabınıza güncellendi.
            </p>
            <Button asChild>
              <Link href="/hesabim/ayarlar">Ayarlara Dön</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Doğrulama Başarısız</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline">
              <Link href="/hesabim/ayarlar">Ayarlara Dön</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
