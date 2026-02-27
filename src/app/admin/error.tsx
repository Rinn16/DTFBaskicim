"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-destructive">Hata</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Bir şeyler yanlış gitti
      </h1>
      <p className="mt-2 text-muted-foreground">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Dashboard&apos;a Dön
        </Link>
      </div>
    </div>
  );
}
