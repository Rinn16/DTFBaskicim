import { z } from "zod";

export const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı zorunlu").max(50),
  fullName: z.string().min(2, "Ad soyad zorunlu").max(100),
  phone: z.string().transform((v) => v.replace(/\s/g, "")).pipe(z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli telefon numarası girin")),
  city: z.string().min(1, "Şehir zorunlu").max(50),
  district: z.string().min(1, "İlçe zorunlu").max(50),
  address: z.string().min(10, "Adres en az 10 karakter olmalı").max(400),
  zipCode: z.string().max(10).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
