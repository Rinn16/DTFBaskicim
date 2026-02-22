import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email adresi gerekli")
    .email("Geçerli bir email adresi girin"),
  password: z
    .string()
    .min(1, "Şifre gerekli")
    .min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Ad gerekli").min(2, "Ad en az 2 karakter olmalı"),
    surname: z
      .string()
      .min(1, "Soyad gerekli")
      .min(2, "Soyad en az 2 karakter olmalı"),
    email: z
      .string()
      .min(1, "Email adresi gerekli")
      .email("Geçerli bir email adresi girin"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(1, "Şifre gerekli")
      .min(6, "Şifre en az 6 karakter olmalı"),
    confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
    companyName: z.string().optional(),
    taxNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmedi",
    path: ["confirmPassword"],
  });

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(1, "Telefon numarası gerekli")
    .regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli bir telefon numarası girin"),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(1, "Telefon numarası gerekli"),
  code: z
    .string()
    .min(1, "Doğrulama kodu gerekli")
    .length(6, "Doğrulama kodu 6 haneli olmalı"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
