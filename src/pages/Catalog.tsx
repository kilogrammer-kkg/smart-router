import {
  CATALOG_KINDS,
  CatalogCard,
  KIND_META,
} from "@/components/relay/catalog-bits";
import { DeskNav } from "@/components/relay/DeskNav";
import { api } from "@/convex/_generated/api";
import { useEnsureSeeded } from "@/hooks/use-ensure-seeded";
import type { CatalogItem } from "@/lib/relay";
import { useQuery } from "convex/react";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const FILTERS = ["all", ...CATALOG_KINDS] as const;
type Filter = (typeof FILTERS)[number];

export default function CatalogPage() {
  useEnsureSeeded();
  const catalog = useQuery(api.catalog.items);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const items = catalog?.items ?? [];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (!needle) return true;
      return [item.title, item.subtitle, item.summary, ...item.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, filter, search]);

  const countFor = (target: Filter) =>
    target === "all"
      ? items.length
      : items.filter((item) => item.kind === target).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <DeskNav active="catalog" />

      <section className="flex flex-wrap items-end justify-between gap-4 pt-3 pb-6">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.18em] text-primary uppercase">
            Current operation
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,3.4vw,2.5rem)] leading-none font-medium tracking-[-0.025em]">
            Catalog
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">
            Every camp, truck, road and volunteer the coordinator reasons about.
            Open a record to see what it touches.
          </p>
        </div>
        <span className="glass-chip rounded-full px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground">
          {items.length} record{items.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="glass rounded-[1.35rem] p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, road, driver, need or contact…"
            aria-label="Search the catalog"
            className="h-11 w-full rounded-xl border border-white/90 bg-white/60 pr-10 pl-9 text-[12.5px] shadow-[inset_0_1px_2px_rgba(28,62,88,0.06)] outline-none transition placeholder:text-muted-foreground/80 focus:border-[oklch(0.82_0.05_212)] focus:bg-white/85 focus:ring-2 focus:ring-[oklch(0.74_0.06_212)]/25"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5 px-0.5">
          {FILTERS.map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => setFilter(target)}
              className={
                filter === target
                  ? "rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-[0_2px_8px_-4px_rgba(28,62,88,0.4)]"
                  : "rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
              }
            >
              {target === "all" ? "All records" : KIND_META[target].label + "s"}
              <span className="ml-1.5 text-[10px] opacity-60">{countFor(target)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5">
        {catalog === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="glass h-[168px] animate-pulse rounded-[1.35rem]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => { setSearch(""); setFilter("all"); }} />
        ) : (
          <>
            <p className="mb-3 px-1 text-[11px] text-muted-foreground">
              {filtered.length} record{filtered.length === 1 ? "" : "s"}
              {search.trim() ? ` matching “${search.trim()}”` : ""}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item: CatalogItem) => (
                <CatalogCard key={item.key} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="glass rounded-[1.35rem] px-6 py-12 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-white/70 text-primary">
        <Search className="size-4" />
      </span>
      <p className="mt-3 text-[14px] font-semibold">Nothing matches that search</p>
      <p className="mx-auto mt-1 max-w-sm text-[12px] leading-6 text-muted-foreground">
        Try a camp name, a road, a driver or a supply need. The catalog holds only
        records already in the operation.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-lg border border-white/90 bg-white/70 px-3.5 py-2 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-white/90"
      >
        Clear search and filters
      </button>
    </div>
  );
}
