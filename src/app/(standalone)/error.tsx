"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StandaloneError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-6">
      <p className="text-5xl font-bold text-destructive mb-4">Hata</p>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Bir şeyler yanlış gitti
      </h1>
      <p className="text-muted-foreground mb-6">
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
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
