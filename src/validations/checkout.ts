import { z } from "zod";

export const guestInfoSchema = z.object({
  guestName: z.string().min(2, "Ad soyad zorunlu").max(100),
  guestEmail: z.string().email("Geçerli email adresi girin"),
  guestPhone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Geçerli telefon numarası girin"),
});

const billingAddressFields = {
  billingCity: z.string().min(1, "Şehir zorunlu").max(50),
  billingDistrict: z.string().min(1, "İlçe zorunlu").max(50),
  billingAddress: z.string().min(10, "Adres en az 10 karakter olmalı").max(400),
  billingZipCode: z.string().max(10).optional(),
};

const individualBillingSchema = z.object({
  billingType: z.literal("INDIVIDUAL"),
  billingFullName: z.string().min(2, "Ad soyad zorunlu").max(100),
  ...billingAddressFields,
});

const corporateBillingSchema = z.object({
  billingType: z.literal("CORPORATE"),
  billingCompanyName: z.string().min(2, "Firma adı zorunlu").max(200),
  billingTaxOffice: z.string().min(2, "Vergi dairesi zorunlu").max(100),
  billingTaxNumber: z.string().min(10, "Vergi numarası 10 haneli olmalı").max(11, "Vergi numarası en fazla 11 haneli olmalı"),
  ...billingAddressFields,
});

export const billingInfoSchema = z.discriminatedUnion("billingType", [
  individualBillingSchema,
  corporateBillingSchema,
]);

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CREDIT_CARD", "BANK_TRANSFER"]),
  addressId: z.string().optional(),
  guestAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/),
    city: z.string().min(1).max(50),
    district: z.string().min(1).max(50),
    address: z.string().min(10).max(400),
    zipCode: z.string().max(10).optional(),
  }).optional(),
  guestInfo: guestInfoSchema.optional(),
  discountCode: z.string().optional(),
  customerNote: z.string().max(500).optional(),
  billingSameAddress: z.boolean().default(true),
  billingInfo: billingInfoSchema.optional(),
}).refine(
  (data) => data.billingSameAddress || data.billingInfo !== undefined,
  { message: "Fatura bilgileri zorunlu", path: ["billingInfo"] }
);

export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type BillingInfoInput = z.infer<typeof billingInfoSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
