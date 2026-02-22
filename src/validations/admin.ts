import { z } from "zod";

export const pricingTierSchema = z.object({
  minMeters: z.number().min(0, "Min metre 0 veya daha büyük olmalı"),
  maxMeters: z.number().positive().nullable().optional(),
  pricePerMeter: z.number().positive("Fiyat sıfırdan büyük olmalı"),
  isActive: z.boolean().optional(),
});

export const discountCodeSchema = z.object({
  code: z.string().min(1, "Kod zorunlu").max(30),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  minOrderMeters: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.string().min(1, "Başlangıç tarihi zorunlu"),
  validUntil: z.string().min(1, "Bitiş tarihi zorunlu"),
  isActive: z.boolean().optional(),
});
