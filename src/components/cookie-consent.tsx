"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 shadow-lg">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Bu web sitesi, deneyiminizi iyileştirmek için yalnızca zorunlu çerezleri kullanmaktadır.
          Daha fazla bilgi için{" "}
          <Link
            href="/cerez-politikasi"
            className="text-primary underline hover:text-primary/80"
          >
            Çerez Politikamızı
          </Link>{" "}
          inceleyebilirsiniz.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleReject}
            className="rounded-md border border-border bg-muted px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
