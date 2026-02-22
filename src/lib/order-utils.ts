import { ORDER_STATUSES } from "@/lib/constants";

export const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  SHIPPED: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border border-red-500/20",
  REFUNDED: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500",
  PROCESSING: "bg-blue-400",
  SHIPPED: "bg-cyan-400",
  COMPLETED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
  REFUNDED: "bg-slate-400",
};

export const STATUS_ACCENT_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500/50",
  PROCESSING: "bg-blue-500/50",
  SHIPPED: "bg-cyan-500/50",
  COMPLETED: "bg-emerald-500/50",
  CANCELLED: "bg-red-500/50",
  REFUNDED: "bg-slate-500/50",
};

export const STATUS_SHADOW_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "shadow-[0_0_10px_rgba(234,179,8,0.15)]",
  PROCESSING: "shadow-[0_0_10px_rgba(59,130,246,0.15)]",
  SHIPPED: "shadow-[0_0_10px_rgba(0,240,255,0.15)]",
  COMPLETED: "shadow-[0_0_10px_rgba(34,197,94,0.15)]",
  CANCELLED: "shadow-[0_0_10px_rgba(239,68,68,0.15)]",
  REFUNDED: "shadow-[0_0_10px_rgba(148,163,184,0.15)]",
};

export const statusLabel = (status: string) =>
  ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status;
