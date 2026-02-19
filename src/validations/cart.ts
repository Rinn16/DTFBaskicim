import { z } from "zod";

const gangSheetItemSchema = z.object({
  imageKey: z.string().min(1),
  imageName: z.string().min(1),
  originalWidthPx: z.number().positive(),
  originalHeightPx: z.number().positive(),
  placements: z.array(z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    widthCm: z.number().positive(),
    heightCm: z.number().positive(),
    rotation: z.number(),
  })).min(1),
});

export const addToCartSchema = z.object({
  layout: z.object({
    items: z.array(gangSheetItemSchema).min(1),
    totalHeightCm: z.number().positive(),
    totalWidthCm: z.number().positive(),
  }),
  totalMeters: z.number().positive(),
  items: z.array(gangSheetItemSchema).min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
