"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";

interface StatusHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
}

interface StatusTimelineProps {
  statusHistory: StatusHistoryItem[];
}

const statusLabel = (status: string) =>
  ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status;

export function StatusTimeline({ statusHistory }: StatusTimelineProps) {
  if (statusHistory.length === 0) return null;

  return (
    <div className="space-y-3">
      {statusHistory.map((entry, idx) => {
        const isLast = idx === statusHistory.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {isLast ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              {idx < statusHistory.length - 1 && (
                <div className="w-px h-full bg-border mt-1" />
              )}
            </div>
            <div className="pb-3">
              <p className="text-sm font-medium">{statusLabel(entry.toStatus)}</p>
              {entry.note && (
                <p className="text-xs text-muted-foreground">{entry.note}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(entry.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
