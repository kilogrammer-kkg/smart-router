import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Overview } from "@/lib/relay";
import { cn } from "@/lib/utils";
import { MapPin, Route as RouteIcon, Truck, Users } from "lucide-react";

const ROUTE_STATUS: Record<string, { label: string; className: string }> = {
  open: {
    label: "open",
    className: "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]",
  },
  closed: {
    label: "closed",
    className: "bg-[oklch(0.945_0.045_24)] text-[oklch(0.45_0.13_24)]",
  },
  unknown: {
    label: "unknown",
    className: "bg-[oklch(0.955_0.045_82)] text-[oklch(0.46_0.09_72)]",
  },
};

export function OperationPanel({ overview }: { overview: Overview }) {
  return (
    <section className="glass rounded-[1.35rem] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Stored operation
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">
            What is connected to what
          </h2>
        </div>
        <span className="glass-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
          <Users className="size-3" />
          {overview.stats.people} people
        </span>
      </div>

      <Tabs defaultValue="camps" className="mt-5">
        <TabsList className="glass-inset h-11 w-full rounded-xl bg-white/40 p-1">
          <TabsTrigger
            value="camps"
            className="rounded-lg text-[11.5px] data-[state=active]:bg-white/85 data-[state=active]:text-foreground"
          >
            Camps
          </TabsTrigger>
          <TabsTrigger
            value="trucks"
            className="rounded-lg text-[11.5px] data-[state=active]:bg-white/85 data-[state=active]:text-foreground"
          >
            Trucks
          </TabsTrigger>
          <TabsTrigger
            value="routes"
            className="rounded-lg text-[11.5px] data-[state=active]:bg-white/85 data-[state=active]:text-foreground"
          >
            Roads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camps" className="mt-3">
          <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {overview.camps.map((camp) => (
              <li
                key={camp.id}
                className="rounded-xl border border-white/80 bg-white/50 px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold">{camp.name}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {camp.headcount} people
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  {camp.location}
                </p>
                <p className="mt-1.5 text-[10.5px] leading-4 text-[oklch(0.47_0.03_240)]">
                  {camp.medicalNeeds}
                </p>
                <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                  {camp.volunteers.length > 0
                    ? camp.volunteers.join(" · ")
                    : "No volunteer assigned"}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="trucks" className="mt-3">
          <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {overview.trucks.map((truck) => (
              <li
                key={truck.id}
                className="rounded-xl border border-white/80 bg-white/50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <Truck className="size-3.5 text-primary" />
                    {truck.code}
                    {truck.priority && (
                      <span className="rounded-full bg-[oklch(0.955_0.04_82)] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide text-[oklch(0.46_0.09_72)] uppercase">
                        priority
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      truck.status === "held"
                        ? "bg-[oklch(0.955_0.04_82)] text-[oklch(0.46_0.09_72)]"
                        : "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]",
                    )}
                  >
                    {truck.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {truck.driver} · {truck.cargo}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  <RouteIcon className="size-3 shrink-0" />
                  {truck.route ?? "No route"} · ETA {truck.eta}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="routes" className="mt-3">
          <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {overview.routes.map((route) => {
              const status = ROUTE_STATUS[route.status] ?? ROUTE_STATUS.unknown;
              return (
                <li
                  key={route.id}
                  className="rounded-xl border border-white/80 bg-white/50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold">{route.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {route.camps.length > 0 ? route.camps.join(" · ") : "No camps depend on it"}
                    {route.trucks.length > 0 && ` · ${route.trucks.join(", ")}`}
                  </p>
                  {route.alternative && (
                    <p className="mt-1 text-[10.5px] text-[oklch(0.43_0.04_230)]">
                      Detour on file: {route.alternative}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </section>
  );
}
