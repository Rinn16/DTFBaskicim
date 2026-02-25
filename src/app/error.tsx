"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-6xl font-bold text-destructive">Hata</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Bir şeyler yanlış gitti
      </h1>
      <p className="mt-2 text-muted-foreground">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
