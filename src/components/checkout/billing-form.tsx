"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BillingType = "INDIVIDUAL" | "CORPORATE";

export interface BillingFields {
  billingFullName?: string;
  billingCompanyName?: string;
  billingTaxOffice?: string;
  billingTaxNumber?: string;
  billingCity: string;
  billingDistrict: string;
  billingAddress: string;
  billingZipCode?: string;
}

interface BillingFormProps {
  billingType: BillingType;
  onBillingTypeChange: (type: BillingType) => void;
  values: BillingFields;
  onChange: (values: BillingFields) => void;
  errors?: Record<string, string>;
}

const types = [
  {
    id: "INDIVIDUAL" as const,
    label: "Bireysel",
    description: "Bireysel fatura",
    icon: User,
  },
  {
    id: "CORPORATE" as const,
    label: "Kurumsal",
    description: "Sirkete fatura",
    icon: Building2,
  },
];

const inputClass = "bg-muted border-border text-foreground placeholder:text-muted-foreground";

export function BillingForm({
  billingType,
  onBillingTypeChange,
  values,
  onChange,
  errors,
}: BillingFormProps) {
  const update = (field: keyof BillingFields, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="space-y-3">
        {types.map((type) => {
          const isSelected = billingType === type.id;
          const Icon = type.icon;
          return (
            <div
              key={type.id}
              className={cn(
                "p-4 cursor-pointer transition-all rounded-lg border",
                isSelected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-foreground/[0.02] hover:border-border"
              )}
              onClick={() => onBillingTypeChange(type.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Type-specific fields */}
      <div className="space-y-3">
        {billingType === "INDIVIDUAL" ? (
          <div>
            <Label htmlFor="billingFullName" className="text-foreground/80 text-xs">Ad Soyad</Label>
            <Input
              id="billingFullName"
              value={values.billingFullName || ""}
              onChange={(e) => update("billingFullName", e.target.value)}
              placeholder="Fatura uzerindeki ad soyad"
              className={inputClass}
            />
            {errors?.billingFullName && (
              <p className="text-xs text-red-400 mt-1">{errors.billingFullName}</p>
            )}
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="billingCompanyName" className="text-foreground/80 text-xs">Firma Adi</Label>
              <Input
                id="billingCompanyName"
                value={values.billingCompanyName || ""}
                onChange={(e) => update("billingCompanyName", e.target.value)}
                placeholder="Firma adi"
                className={inputClass}
              />
              {errors?.billingCompanyName && (
                <p className="text-xs text-red-400 mt-1">{errors.billingCompanyName}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="billingTaxOffice" className="text-foreground/80 text-xs">Vergi Dairesi</Label>
                <Input
                  id="billingTaxOffice"
                  value={values.billingTaxOffice || ""}
                  onChange={(e) => update("billingTaxOffice", e.target.value)}
                  placeholder="Vergi dairesi"
                  className={inputClass}
                />
                {errors?.billingTaxOffice && (
                  <p className="text-xs text-red-400 mt-1">{errors.billingTaxOffice}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billingTaxNumber" className="text-foreground/80 text-xs">Vergi No</Label>
                <Input
                  id="billingTaxNumber"
                  value={values.billingTaxNumber || ""}
                  onChange={(e) => update("billingTaxNumber", e.target.value)}
                  placeholder="Vergi numarasi"
                  className={inputClass}
                />
                {errors?.billingTaxNumber && (
                  <p className="text-xs text-red-400 mt-1">{errors.billingTaxNumber}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Common address fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="billingCity" className="text-foreground/80 text-xs">Sehir</Label>
            <Input
              id="billingCity"
              value={values.billingCity}
              onChange={(e) => update("billingCity", e.target.value)}
              placeholder="Sehir"
              className={inputClass}
            />
            {errors?.billingCity && (
              <p className="text-xs text-red-400 mt-1">{errors.billingCity}</p>
            )}
          </div>
          <div>
            <Label htmlFor="billingDistrict" className="text-foreground/80 text-xs">Ilce</Label>
            <Input
              id="billingDistrict"
              value={values.billingDistrict}
              onChange={(e) => update("billingDistrict", e.target.value)}
              placeholder="Ilce"
              className={inputClass}
            />
            {errors?.billingDistrict && (
              <p className="text-xs text-red-400 mt-1">{errors.billingDistrict}</p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="billingAddress" className="text-foreground/80 text-xs">Adres</Label>
          <Input
            id="billingAddress"
            value={values.billingAddress}
            onChange={(e) => update("billingAddress", e.target.value)}
            placeholder="Fatura adresi"
            className={inputClass}
          />
          {errors?.billingAddress && (
            <p className="text-xs text-red-400 mt-1">{errors.billingAddress}</p>
          )}
        </div>
        <div>
          <Label htmlFor="billingZipCode" className="text-foreground/80 text-xs">Posta Kodu (Opsiyonel)</Label>
          <Input
            id="billingZipCode"
            value={values.billingZipCode || ""}
            onChange={(e) => update("billingZipCode", e.target.value)}
            placeholder="Posta kodu"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
