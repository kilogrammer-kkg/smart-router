import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type Overview = NonNullable<
  FunctionReturnType<typeof api.dashboard.overview>
>;
export type UpdateItem = Overview["queue"][number];
export type Proposal = UpdateItem["proposals"][number];
export type Check = UpdateItem["checks"][number];
export type ActivityEntry = Overview["activity"][number];
export type RouteCard = Overview["routes"][number];
export type TruckCard = Overview["trucks"][number];
export type CampCard = Overview["camps"][number];
export type CommentItem = Overview["comments"][number];
export type CommentTarget =
  | "update"
  | "camp"
  | "truck"
  | "route"
  | "volunteer";

export type CatalogList = NonNullable<
  FunctionReturnType<typeof api.catalog.items>
>;
export type CatalogItem = CatalogList["items"][number];
export type CatalogDetail = NonNullable<
  FunctionReturnType<typeof api.catalog.detail>
>;

export const REPORT_TYPE_LABEL: Record<string, string> = {
  route_blocked: "Road blocked",
  route_open: "Road passable",
  supply_shortage: "Supply gap",
  unclear: "Needs detail",
};

export const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-[oklch(0.94_0.045_172)] text-[oklch(0.38_0.075_173)]",
  medium: "bg-[oklch(0.955_0.05_88)] text-[oklch(0.45_0.09_74)]",
  low: "bg-[oklch(0.945_0.02_240)] text-[oklch(0.47_0.03_244)]",
};

export const SEVERITY_STYLE: Record<
  string,
  { dot: string; surface: string; text: string }
> = {
  critical: {
    dot: "bg-[oklch(0.6_0.17_24)]",
    surface: "bg-[oklch(0.972_0.022_24)] border-[oklch(0.9_0.05_24)]",
    text: "text-[oklch(0.44_0.13_24)]",
  },
  warning: {
    dot: "bg-[oklch(0.72_0.13_72)]",
    surface: "bg-[oklch(0.982_0.026_82)] border-[oklch(0.92_0.055_82)]",
    text: "text-[oklch(0.48_0.09_70)]",
  },
  info: {
    dot: "bg-[oklch(0.6_0.075_222)]",
    surface: "bg-white/55 border-white/80",
    text: "text-[oklch(0.42_0.045_226)]",
  },
};

export function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function clockTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isCheckFailed(check: Check) {
  return !check.passed;
}
