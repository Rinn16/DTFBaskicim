import { z } from "zod";

export const addressSchema = z.object({
  title: z.string().min(1, "Adres basligi zorunlu").max(50),
  fullName: z.string().min(2, "Ad soyad zorunlu").max(100),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Gecerli telefon numarasi girin"),
  city: z.string().min(1, "Sehir zorunlu").max(50),
  district: z.string().min(1, "Ilce zorunlu").max(50),
  address: z.string().min(10, "Adres en az 10 karakter olmali").max(400),
  zipCode: z.string().max(10).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
