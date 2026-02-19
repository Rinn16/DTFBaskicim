"use client";

import { Card } from "@/components/ui/card";
import { CreditCard, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodProps {
  value: string;
  onChange: (method: string) => void;
}

const methods = [
  {
    id: "CREDIT_CARD",
    label: "Kredi / Banka Karti",
    description: "PayTR guvenli odeme altyapisi ile",
    icon: CreditCard,
  },
  {
    id: "BANK_TRANSFER",
    label: "Banka Havalesi / EFT",
    description: "Havale bilgileri siparis sonrasi gosterilir",
    icon: Building2,
  },
];

export function PaymentMethod({ value, onChange }: PaymentMethodProps) {
  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isSelected = value === method.id;
        const Icon = method.icon;
        return (
          <Card
            key={method.id}
            className={cn(
              "p-4 cursor-pointer transition-colors",
              isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
            )}
            onClick={() => onChange(method.id)}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
