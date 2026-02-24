"use client";

import { createRoot } from "react-dom/client";
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

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

/**
 * Imperative confirm dialog — call from any handler, no JSX needed.
 *
 * Usage:
 *   const ok = await confirm({ description: "Silmek istediğinize emin misiniz?" });
 *   if (!ok) return;
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      container.remove();
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    root.render(
      <AlertDialog defaultOpen onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <AlertDialogContent className="bg-[#101620] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {opts.title ?? "Onay"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {opts.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} className="text-slate-200">
              {opts.cancelLabel ?? "İptal"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              variant={opts.variant ?? "destructive"}
            >
              {opts.confirmLabel ?? "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  });
}
