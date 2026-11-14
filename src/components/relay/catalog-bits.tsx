import type { CatalogItem } from "@/lib/relay";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { Route as RouteIcon, Tent, Truck, Users } from "lucide-react";

export const KIND_META = {
  camp: { label: "Camp", icon: Tent },
  truck: { label: "Truck", icon: Truck },
  route: { label: "Road", icon: RouteIcon },
  volunteer: { label: "Volunteer", icon: Users },
} as const;

export const CATALOG_KINDS = ["camp", "truck", "route", "volunteer"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export function isCatalogKind(value: string | undefined): value is CatalogKind {
  return Boolean(value && (CATALOG_KINDS as readonly string[]).includes(value));
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]",
  en_route: "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]",
  closed: "bg-[oklch(0.945_0.045_24)] text-[oklch(0.45_0.13_24)]",
  held: "bg-[oklch(0.955_0.045_82)] text-[oklch(0.46_0.09_72)]",
  unknown: "bg-[oklch(0.955_0.045_82)] text-[oklch(0.46_0.09_72)]",
  delivered: "bg-white/70 text-muted-foreground",
};

export function StatusPill({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize",
        STATUS_STYLE[status] ?? "bg-white/70 text-muted-foreground",
        className,
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function KindBadge({ kind }: { kind: CatalogKind }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span className="glass-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-[oklch(0.44_0.05_224)] uppercase">
      <Icon className="size-3 text-primary" />
      {meta.label}
    </span>
  );
}

export function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      to={`/catalog/${item.kind}/${item.id}`}
      className="glass group flex flex-col rounded-[1.35rem] p-4 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <KindBadge kind={item.kind} />
        <StatusPill status={item.status} />
      </div>
      <h3 className="mt-3 text-[14.5px] font-semibold tracking-[-0.01em] text-[oklch(0.3_0.035_242)]">
        {item.title}
      </h3>
      <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">
        {item.subtitle}
      </p>
      {item.summary && (
        <p className="mt-2 line-clamp-2 text-[11.5px] leading-5 text-[oklch(0.43_0.03_240)]">
          {item.summary}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/80 bg-white/55 px-2 py-0.5 text-[10px] text-[oklch(0.45_0.03_240)]"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        Open record →
      </span>
    </Link>
  );
}
