import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Ad zorunlu").max(50),
  surname: z.string().min(1, "Soyad zorunlu").max(50),
  companyName: z.string().max(100).optional().nullable(),
  taxNumber: z.string().max(20).optional().nullable(),
});
