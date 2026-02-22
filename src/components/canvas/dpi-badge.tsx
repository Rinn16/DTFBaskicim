"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DpiBadgeProps {
  widthPx: number;
  widthCm: number;
}

function calculateDpi(widthPx: number, widthCm: number): number {
  if (widthCm <= 0) return 0;
  return Math.round(widthPx / (widthCm / 2.54));
}

function getDpiQuality(dpi: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (dpi >= 300)
    return {
      label: "Mükemmel",
      color: "text-emerald-300",
      bgColor: "bg-emerald-500/15",
    };
  if (dpi >= 200)
    return {
      label: "İyi",
      color: "text-blue-300",
      bgColor: "bg-blue-500/15",
    };
  if (dpi >= 150)
    return {
      label: "Orta",
      color: "text-amber-300",
      bgColor: "bg-amber-500/15",
    };
  return {
    label: "Düşük",
    color: "text-red-300",
    bgColor: "bg-red-500/15",
  };
}

export function DpiBadge({ widthPx, widthCm }: DpiBadgeProps) {
  const dpi = calculateDpi(widthPx, widthCm);
  const quality = getDpiQuality(dpi);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${quality.bgColor} ${quality.color}`}
        >
          {dpi} DPI
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-52">
        <p className="font-medium">{quality.label} Kalite</p>
        <p className="text-xs text-muted-foreground">
          {dpi >= 300
            ? "Baskı için ideal çözünürlük."
            : dpi >= 200
              ? "İyi kalitede baskı yapılabilir."
              : dpi >= 150
                ? "Kabul edilebilir kalite. Daha yüksek çözünürlük önerilir."
                : "Düşük kalite. Baskıda pikselleşme görülebilir."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function DpiInfoBox() {
  return (
    <div className="absolute top-3 left-11 z-20 bg-[#101620]/95 backdrop-blur border border-white/5 rounded-lg shadow-sm px-3 py-2 max-w-56">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Info className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-white">Baskı Kalitesi (DPI)</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px]">
            <span className="font-medium text-slate-200">300+ DPI</span>
            <span className="text-slate-400"> — Mükemmel</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px]">
            <span className="font-medium text-slate-200">200-299 DPI</span>
            <span className="text-slate-400"> — İyi</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[11px]">
            <span className="font-medium text-slate-200">150-199 DPI</span>
            <span className="text-slate-400"> — Orta</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[11px]">
            <span className="font-medium text-slate-200">&lt;150 DPI</span>
            <span className="text-slate-400"> — Düşük</span>
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
        DTF baskı için en az 300 DPI önerilir. Düşük DPI baskıda pikselleşmeye neden olur.
      </p>
    </div>
  );
}
