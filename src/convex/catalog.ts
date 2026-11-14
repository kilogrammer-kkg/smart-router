import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

const kindValidator = v.union(
  v.literal("camp"),
  v.literal("truck"),
  v.literal("route"),
  v.literal("volunteer"),
);

type CatalogKind = "camp" | "truck" | "route" | "volunteer";

function keyOf(kind: CatalogKind, id: string) {
  return `${kind}:${id}`;
}

/** Everything the catalog can browse: camps, trucks, roads and volunteers. */
export const items = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const [camps, routes, trucks, volunteers] = await Promise.all([
      ctx.db.query("camps").collect(),
      ctx.db.query("routes").collect(),
      ctx.db.query("trucks").collect(),
      ctx.db.query("volunteers").collect(),
    ]);

    const campName = new Map(camps.map((camp) => [camp._id, camp.name]));
    const routeName = new Map(routes.map((route) => [route._id, route.name]));

    const catalog = [
      ...camps.map((camp) => ({
        key: keyOf("camp", camp._id),
        kind: "camp" as const,
        id: camp._id as string,
        title: camp.name,
        subtitle: camp.location,
        status: null as string | null,
        tags: [`${camp.headcount} people`],
        summary: camp.medicalNeeds,
      })),
      ...trucks.map((truck) => ({
        key: keyOf("truck", truck._id),
        kind: "truck" as const,
        id: truck._id as string,
        title: `Truck ${truck.code}`,
        subtitle: `${truck.cargo} · ${truck.driver}`,
        status: truck.status,
        tags: [
          truck.routeId ? (routeName.get(truck.routeId) ?? "Unrouted") : "Unrouted",
          `Covers ${truck.supplyForPeople}`,
          truck.eta,
        ],
        summary: truck.priority ? "Priority load" : "Standard load",
      })),
      ...routes.map((route) => ({
        key: keyOf("route", route._id),
        kind: "route" as const,
        id: route._id as string,
        title: route.name,
        subtitle:
          route.campIds.length > 0
            ? route.campIds
                .map((id) => campName.get(id))
                .filter(Boolean)
                .join(" · ")
            : "No camps depend on it",
        status: route.status,
        tags: [
          `${route.capacityTrucks} convoy slots`,
          route.alternativeRouteId
            ? `Detour: ${routeName.get(route.alternativeRouteId) ?? "on file"}`
            : "No detour",
        ],
        summary: route.notes ?? "",
      })),
      ...volunteers.map((volunteer) => ({
        key: keyOf("volunteer", volunteer._id),
        kind: "volunteer" as const,
        id: volunteer._id as string,
        title: volunteer.name,
        subtitle: volunteer.campId
          ? (campName.get(volunteer.campId) ?? "Unassigned")
          : "Unassigned",
        status: null as string | null,
        tags: [volunteer.contact],
        summary: "Field contact",
      })),
    ];

    return { items: catalog };
  },
});

const KIND_LABEL: Record<CatalogKind, string> = {
  camp: "Camp",
  truck: "Truck",
  route: "Road",
  volunteer: "Volunteer",
};

/** One catalog entry, with the connections the coordinator relies on. */
export const detail = query({
  args: { kind: kindValidator, id: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    // Guard against hand-edited URLs so a bad id cannot break the page.
    if (!/^[a-zA-Z0-9]{20,}$/.test(args.id)) return null;

    const [camps, routes, trucks, volunteers] = await Promise.all([
      ctx.db.query("camps").collect(),
      ctx.db.query("routes").collect(),
      ctx.db.query("trucks").collect(),
      ctx.db.query("volunteers").collect(),
    ]);
    const campName = new Map(camps.map((camp) => [camp._id, camp.name]));
    const routeName = new Map(routes.map((route) => [route._id, route.name]));

    const link = (kind: CatalogKind, id: string, title: string, subtitle: string) => ({
      key: keyOf(kind, id),
      title,
      subtitle,
    });

    if (args.kind === "camp") {
      const camp = await ctx.db.get(args.id as Id<"camps">);
      if (!camp) return null;
      const servingRoutes = routes.filter((route) =>
        route.campIds.includes(camp._id),
      );
      const routeIds = new Set(servingRoutes.map((route) => route._id));
      return {
        key: keyOf("camp", camp._id),
        id: camp._id as string,
        kind: args.kind,
        kindLabel: KIND_LABEL.camp,
        title: camp.name,
        subtitle: camp.location,
        status: null,
        fields: [
          { label: "Registered people", value: String(camp.headcount) },
          { label: "Location", value: camp.location },
          { label: "Medical needs", value: camp.medicalNeeds },
        ],
        connections: [
          {
            label: "Volunteers on site",
            items: volunteers
              .filter((volunteer) => volunteer.campId === camp._id)
              .map((volunteer) =>
                link("volunteer", volunteer._id, volunteer.name, volunteer.contact),
              ),
          },
          {
            label: "Roads this camp depends on",
            items: servingRoutes.map((route) =>
              link(
                "route",
                route._id,
                route.name,
                `Marked ${route.status}`,
              ),
            ),
          },
          {
            label: "Trucks routed toward the camp",
            items: trucks
              .filter(
                (truck) =>
                  truck.routeId !== undefined && routeIds.has(truck.routeId),
              )
              .map((truck) =>
                link(
                  "truck",
                  truck._id,
                  `Truck ${truck.code}`,
                  truck.routeId ? (routeName.get(truck.routeId) ?? "") : "",
                ),
              ),
          },
        ],
      };
    }

    if (args.kind === "truck") {
      const truck = await ctx.db.get(args.id as Id<"trucks">);
      if (!truck) return null;
      const route = truck.routeId
        ? routes.find((item) => item._id === truck.routeId)
        : undefined;
      return {
        key: keyOf("truck", truck._id),
        id: truck._id as string,
        kind: args.kind,
        kindLabel: KIND_LABEL.truck,
        title: `Truck ${truck.code}`,
        subtitle: `${truck.cargo} · ${truck.driver}`,
        status: truck.status,
        fields: [
          { label: "Driver", value: truck.driver },
          { label: "Cargo", value: truck.cargo },
          { label: "Cargo covers", value: `${truck.supplyForPeople} people` },
          { label: "ETA", value: truck.eta },
          { label: "Priority", value: truck.priority ? "Yes" : "No" },
          { label: "Status", value: truck.status.replace("_", " ") },
        ],
        connections: [
          {
            label: "Road",
            items: route
              ? [link("route", route._id, route.name, `Marked ${route.status}`)]
              : [],
          },
          {
            label: "Camps on this road",
            items: route
              ? route.campIds
                  .map((id) => camps.find((camp) => camp._id === id))
                  .filter((camp): camp is (typeof camps)[number] => Boolean(camp))
                  .map((camp) =>
                    link(
                      "camp",
                      camp._id,
                      camp.name,
                      `${camp.headcount} people`,
                    ),
                  )
              : [],
          },
        ],
      };
    }

    if (args.kind === "route") {
      const route = await ctx.db.get(args.id as Id<"routes">);
      if (!route) return null;
      const alternative = route.alternativeRouteId
        ? routes.find((item) => item._id === route.alternativeRouteId)
        : undefined;
      return {
        key: keyOf("route", route._id),
        id: route._id as string,
        kind: args.kind,
        kindLabel: KIND_LABEL.route,
        title: route.name,
        subtitle: route.campIds
          .map((id) => campName.get(id))
          .filter(Boolean)
          .join(" · "),
        status: route.status,
        fields: [
          { label: "Status", value: route.status },
          { label: "Convoy capacity", value: `${route.capacityTrucks} trucks` },
          { label: "Detour on file", value: alternative?.name ?? "None" },
          { label: "Notes", value: route.notes ?? "No notes" },
        ],
        connections: [
          {
            label: "Camps that depend on this road",
            items: route.campIds
              .map((id) => camps.find((camp) => camp._id === id))
              .filter((camp): camp is (typeof camps)[number] => Boolean(camp))
              .map((camp) =>
                link("camp", camp._id, camp.name, `${camp.headcount} people`),
              ),
          },
          {
            label: "Trucks on this road",
            items: trucks
              .filter((truck) => truck.routeId === route._id)
              .map((truck) =>
                link("truck", truck._id, `Truck ${truck.code}`, truck.cargo),
              ),
          },
        ],
      };
    }

    const volunteer = await ctx.db.get(args.id as Id<"volunteers">);
    if (!volunteer) return null;
    const camp = volunteer.campId
      ? camps.find((item) => item._id === volunteer.campId)
      : undefined;
    const servingRoutes = camp
      ? routes.filter((route) => route.campIds.includes(camp._id))
      : [];
    return {
      key: keyOf("volunteer", volunteer._id),
      id: volunteer._id as string,
      kind: args.kind,
      kindLabel: KIND_LABEL.volunteer,
      title: volunteer.name,
      subtitle: camp?.name ?? "Unassigned",
      status: null,
      fields: [
        { label: "Assigned camp", value: camp?.name ?? "Unassigned" },
        { label: "Contact", value: volunteer.contact },
        { label: "Camp population", value: camp ? `${camp.headcount} people` : "—" },
        { label: "Camp medical needs", value: camp?.medicalNeeds ?? "—" },
      ],
      connections: [
        {
          label: "Other volunteers at the camp",
          items: camp
            ? volunteers
                .filter(
                  (item) =>
                    item.campId === camp._id && item._id !== volunteer._id,
                )
                .map((item) =>
                  link("volunteer", item._id, item.name, item.contact),
                )
            : [],
        },
        {
          label: "Roads serving the camp",
          items: servingRoutes.map((route) =>
            link("route", route._id, route.name, `Marked ${route.status}`),
          ),
        },
      ],
    };
  },
});
