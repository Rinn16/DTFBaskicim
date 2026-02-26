"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-12">
      <p className="text-4xl font-bold text-destructive mb-4">Hata</p>
      <h1 className="text-xl font-bold text-foreground mb-2">
        Bir şeyler yanlış gitti
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
        <Link
          href="/giris"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Giriş Sayfasına Dön
        </Link>
      </div>
    </div>
  );
}
