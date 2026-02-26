import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .regex(/[A-Z]/, "En az bir büyük harf içermeli")
  .regex(/[a-z]/, "En az bir küçük harf içermeli")
  .regex(/[0-9]/, "En az bir rakam içermeli");

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email adresi gerekli")
    .email("Geçerli bir email adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
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
    password: strongPassword,
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
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli bir telefon numarası girin")),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(1, "Telefon numarası gerekli"),
  code: z
    .string()
    .min(1, "Doğrulama kodu gerekli")
    .length(6, "Doğrulama kodu 6 haneli olmalı"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email adresi gerekli")
    .email("Geçerli bir email adresi girin"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token gerekli"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmedi",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
