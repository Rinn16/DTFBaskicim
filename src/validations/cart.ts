import { z } from "zod";

const gangSheetItemSchema = z.object({
  imageKey: z.string(),
  imageName: z.string().min(1),
  originalWidthPx: z.number().positive(),
  originalHeightPx: z.number().positive(),
  originalUrl: z.string().optional(),
  placements: z.array(z.object({
    x: z.number(),
    y: z.number(),
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
