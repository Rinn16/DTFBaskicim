import { z } from "zod";

export const guestInfoSchema = z.object({
  guestName: z.string().min(2, "Ad soyad zorunlu").max(100),
  guestEmail: z.string().email("Gecerli email adresi girin"),
  guestPhone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, "Gecerli telefon numarasi girin"),
});

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
});

export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
