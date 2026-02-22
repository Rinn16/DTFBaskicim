import { z } from "zod";

export const saveDraftSchema = z.object({
  name: z.string().min(1).max(100),
  data: z.object({
    uploadedImages: z.array(
      z.object({
        id: z.string(),
        imageKey: z.string(),
        imageName: z.string(),
        originalUrl: z.string(),
        thumbnailUrl: z.string(),
        widthPx: z.number(),
        heightPx: z.number(),
        widthCm: z.number(),
        heightCm: z.number(),
        persistedThumbnail: z.string().optional(),
      })
    ),
    placements: z.array(
      z.object({
        id: z.string(),
        imageId: z.string(),
        x: z.number(),
        y: z.number(),
        widthCm: z.number().positive(),
        heightCm: z.number().positive(),
        rotation: z.number(),
      })
    ),
    autoPlaceQuantities: z.record(z.string(), z.number()),
    gapCm: z.number(),
  }),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
