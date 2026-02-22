import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { DesignDraftData } from "@/types/canvas";

export async function getDrafts(userId: string) {
  const drafts = await db.designDraft.findMany({
    where: { userId },
    select: { id: true, name: true, data: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return drafts.map((draft) => {
    const data = draft.data as Record<string, unknown> | null;
    const images = Array.isArray(data?.uploadedImages) ? data.uploadedImages : [];
    const placements = Array.isArray(data?.placements) ? data.placements : [];
    return {
      id: draft.id,
      name: draft.name,
      imageCount: images.length,
      placementCount: placements.length,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  });
}

export async function getDraft(userId: string, draftId: string) {
  const draft = await db.designDraft.findUnique({ where: { id: draftId } });
  if (!draft || draft.userId !== userId) return null;
  return draft;
}

export async function createDraft(userId: string, name: string, data: DesignDraftData) {
  return db.designDraft.create({
    data: {
      userId,
      name,
      data: data as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function updateDraft(userId: string, draftId: string, name: string, data: DesignDraftData) {
  const existing = await db.designDraft.findUnique({ where: { id: draftId } });
  if (!existing || existing.userId !== userId) return null;
  return db.designDraft.update({
    where: { id: draftId },
    data: {
      name,
      data: data as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function deleteDraft(userId: string, draftId: string) {
  const draft = await db.designDraft.findUnique({ where: { id: draftId } });
  if (!draft || draft.userId !== userId) return null;
  return db.designDraft.delete({ where: { id: draftId } });
}
