"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FolderOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCanvasStore } from "@/stores/canvas-store";
import { useDraftStore } from "@/stores/draft-store";
import type { DraftSummary } from "@/stores/draft-store";
import { toast } from "sonner";

interface DraftListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCurrentBeforeLoad: () => Promise<void>;
}

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export function DraftListSheet({ open, onOpenChange, onSaveCurrentBeforeLoad }: DraftListSheetProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const {
    getDraftList,
    fetchMemberDrafts,
    loadMemberDraft,
    deleteMemberDraft,
    deleteGuestDraft,
    getGuestDraft,
    isLoading,
  } = useDraftStore();

  const { activeDraftId, setActiveDraftId, setActiveDraftName, loadDraft } = useCanvasStore();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState<string | null>(null);

  // Fetch member drafts when opening
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchMemberDrafts();
    }
  }, [open, isAuthenticated, fetchMemberDrafts]);

  const drafts: DraftSummary[] = getDraftList(isAuthenticated);

  const handleLoadDraft = async (draftId: string) => {
    setLoadingDraft(draftId);
    try {
      // Save current state first
      await onSaveCurrentBeforeLoad();

      if (isAuthenticated) {
        const draft = await loadMemberDraft(draftId);
        if (draft) {
          loadDraft(draft.data);
          setActiveDraftId(draft.id);
          setActiveDraftName(draft.name);
          toast.success(`"${draft.name}" yüklendi`);
        }
      } else {
        const draft = getGuestDraft(draftId);
        if (draft) {
          loadDraft(draft.data);
          setActiveDraftId(draft.id);
          setActiveDraftName(draft.name);
          toast.success(`"${draft.name}" yüklendi`);
        }
      }
      onOpenChange(false);
    } catch {
      toast.error("Taslak yüklenirken hata oluştu");
    } finally {
      setLoadingDraft(null);
    }
  };

  const handleDelete = async (draftId: string) => {
    try {
      if (isAuthenticated) {
        await deleteMemberDraft(draftId);
      } else {
        deleteGuestDraft(draftId);
      }

      // If we deleted the active draft, clear the active reference
      if (activeDraftId === draftId) {
        setActiveDraftId(null);
        setActiveDraftName("Adsız Tasarım");
      }
      toast.success("Taslak silindi");
    } catch {
      toast.error("Taslak silinirken hata oluştu");
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="bg-[#101620] border-white/10 text-white w-80 sm:max-w-80">
          <SheetHeader>
            <SheetTitle className="text-white">Taslaklar</SheetTitle>
            <SheetDescription className="text-slate-400">
              Kayıtlı tasarım taslaklarınız
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                Taslak bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => {
                  const isActive = activeDraftId === draft.id;
                  return (
                    <div
                      key={draft.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isActive
                          ? "border-cyan-500/50 bg-cyan-500/5"
                          : "border-white/5 bg-[#0a0f16]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-slate-100">
                            {draft.name}
                            {isActive && (
                              <span className="ml-1.5 text-[10px] text-cyan-400 font-normal">
                                (aktif)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {draft.imageCount} görsel · {draft.placementCount} yerleşim
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatRelativeTime(draft.updatedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Taslağı yükle"
                              className="h-7 w-7 p-0 text-slate-300 hover:text-white"
                              onClick={() => handleLoadDraft(draft.id)}
                              disabled={loadingDraft === draft.id}
                            >
                              {loadingDraft === draft.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FolderOpen className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Taslağı sil"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-destructive"
                            onClick={() => setDeleteTarget(draft.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#101620] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Taslağı Sil</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Bu taslak kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
