import { CommentThread } from "@/components/relay/Comments";
import {
  isCatalogKind,
  KindBadge,
  StatusPill,
} from "@/components/relay/catalog-bits";
import { DeskNav } from "@/components/relay/DeskNav";
import { api } from "@/convex/_generated/api";
import { useEnsureSeeded } from "@/hooks/use-ensure-seeded";
import type { CatalogDetail } from "@/lib/relay";
import { useQuery } from "convex/react";
import { ArrowLeft, Link2 } from "lucide-react";
import { Link, useParams } from "react-router";

export default function CatalogItemPage() {
  useEnsureSeeded();
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const valid = isCatalogKind(kind) && Boolean(id);
  const detail = useQuery(
    api.catalog.detail,
    valid ? { kind: kind!, id: id! } : "skip",
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <DeskNav active="catalog" />

      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 pt-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to catalog
      </Link>

      {!valid || detail === null ? (
        <div className="glass mt-4 rounded-[1.35rem] px-6 py-12 text-center">
          <p className="text-[14px] font-semibold">This record was not found</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] leading-6 text-muted-foreground">
            It may have been removed from the operation. The catalog list is the
            current source of truth.
          </p>
          <Link
            to="/catalog"
            className="mt-4 inline-flex rounded-lg border border-white/90 bg-white/70 px-3.5 py-2 text-[11.5px] font-semibold hover:bg-white/90"
          >
            Return to the catalog
          </Link>
        </div>
      ) : detail === undefined ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="glass h-72 animate-pulse rounded-[1.35rem]" />
          <div className="glass h-72 animate-pulse rounded-[1.35rem]" />
        </div>
      ) : (
        <CatalogBody detail={detail} />
      )}
    </main>
  );
}

function CatalogBody({ detail }: { detail: CatalogDetail }) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 pt-4 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={detail.kind} />
            <StatusPill status={detail.status} />
          </div>
          <h1 className="mt-2.5 font-display text-[clamp(1.8rem,3.2vw,2.4rem)] leading-none font-medium tracking-[-0.025em]">
            {detail.title}
          </h1>
          {detail.subtitle && (
            <p className="mt-2 text-[13px] text-muted-foreground">
              {detail.subtitle}
            </p>
          )}
        </div>
        <span className="glass-chip rounded-full px-3 py-1.5 text-[10.5px] font-medium text-muted-foreground">
          {detail.kindLabel} record
        </span>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section className="glass rounded-[1.35rem] p-4 sm:p-5">
            <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Record
            </h2>
            <dl className="mt-3 space-y-2">
              {detail.fields.map((field) => (
                <div
                  key={field.label}
                  className="grid gap-0.5 rounded-xl border border-white/80 bg-white/50 px-3.5 py-2.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-3"
                >
                  <dt className="text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">
                    {field.label}
                  </dt>
                  <dd className="text-[12px] leading-5 text-[oklch(0.34_0.03_240)]">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="glass rounded-[1.35rem] p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              <Link2 className="size-3.5 text-primary" />
              Connections
            </h2>
            <div className="mt-3 space-y-4">
              {detail.connections.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold text-[oklch(0.4_0.03_240)]">
                    {group.label}
                  </p>
                  {group.items.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Nothing connected yet.
                    </p>
                  ) : (
                    <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <li key={item.key}>
                          <Link
                            to={`/catalog/${item.key.split(":")[0]}/${item.key.split(":")[1]}`}
                            className="flex items-baseline justify-between gap-2 rounded-xl border border-white/80 bg-white/50 px-3 py-2 transition-colors hover:bg-white/80"
                          >
                            <span className="text-[11.5px] font-medium">
                              {item.title}
                            </span>
                            <span className="truncate text-[10.5px] text-muted-foreground">
                              {item.subtitle}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <CommentThread targetType={detail.kind} targetId={detail.id} />
          <div className="glass-soft rounded-xl px-3.5 py-3 text-[11px] leading-5 text-muted-foreground">
            The coordinator reads this record during the knowledge step. Keep it
            current; a wrong connection changes the plan it drafts.
          </div>
        </div>
      </div>
    </>
  );
}
