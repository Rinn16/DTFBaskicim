"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Loader2 } from "lucide-react";

interface DiscountInputProps {
  onApply: (code: string, percent: number, amount: number) => void;
  onClear: () => void;
}

export function DiscountInput({ onApply, onClear }: DiscountInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/pricing/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedCode(code.trim().toUpperCase());
        onApply(code.trim().toUpperCase(), data.discountPercent || 0, data.discountAmount || 0);
      } else {
        const data = await res.json();
        setError(data.error || "Gecersiz indirim kodu");
      }
    } catch {
      setError("Indirim kodu kontrol edilemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setAppliedCode(null);
    setCode("");
    setError("");
    onClear();
  };

  if (appliedCode) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1.5 h-8 px-3 text-xs">
          <Tag className="h-3.5 w-3.5" />
          {appliedCode}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-destructive hover:text-destructive"
          onClick={handleClear}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Kaldir
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Indirim kodu"
          className="h-9 text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          disabled={isLoading}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 text-sm"
          onClick={handleApply}
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uygula"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1.5">{error}</p>
      )}
    </div>
  );
}
