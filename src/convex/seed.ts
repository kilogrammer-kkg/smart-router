import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { persistRun } from "./lib/persist";
import { runCoordinator } from "./lib/pipeline";

const OPENING_REPORT =
  "Bridge near Camp 2 is flooded, trucks can't pass. - Ravi";

/** Sample operation + one genuine pending approval so the desk is never empty. */
export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to open SmartRouter.");

    const existing = await ctx.db.query("camps").first();
    if (existing) return { seeded: false };

    const camp1 = await ctx.db.insert("camps", {
      name: "Camp 1",
      location: "Riverside School, Block A",
      headcount: 340,
      medicalNeeds: "Two nurses on site; insulin cold chain for 9 patients",
    });
    const camp2 = await ctx.db.insert("camps", {
      name: "Camp 2",
      location: "Bela village ground",
      headcount: 180,
      medicalNeeds: "One dialysis patient; ORS and insulin running low",
    });
    const camp5 = await ctx.db.insert("camps", {
      name: "Camp 5",
      location: "Hilltop community hall",
      headcount: 120,
      medicalNeeds: "Maternal care; no doctor on site after 8pm",
    });
    const camp7 = await ctx.db.insert("camps", {
      name: "Camp 7",
      location: "Old mill warehouse",
      headcount: 95,
      medicalNeeds: "No formal medical post; first-aid only",
    });

    const highway = await ctx.db.insert("routes", {
      name: "National Highway 9",
      status: "open",
      campIds: [camp1, camp7],
      capacityTrucks: 4,
      notes: "Two-lane highway. Last checked this morning.",
    });
    const bridge = await ctx.db.insert("routes", {
      name: "Camp 2 Access Bridge",
      status: "open",
      campIds: [camp2, camp5],
      capacityTrucks: 2,
      notes: "Single-lane bridge. Impassable once the river rises.",
    });
    const track = await ctx.db.insert("routes", {
      name: "Riverside Track",
      status: "open",
      campIds: [camp2, camp5],
      capacityTrucks: 2,
      notes: "Gravel detour; adds about three hours.",
    });
    await ctx.db.insert("routes", {
      name: "Hilltop Ghat Road",
      status: "unknown",
      campIds: [camp5],
      capacityTrucks: 3,
      notes: "Unconfirmed since last night's landslide report.",
    });
    await ctx.db.patch(bridge, { alternativeRouteId: track });

    await ctx.db.insert("trucks", {
      code: "T3",
      driver: "Imran Qureshi",
      routeId: bridge,
      cargo: "Food & water for 320 people",
      supplyForPeople: 320,
      eta: "Today 21:30",
      priority: false,
      status: "en_route",
    });
    await ctx.db.insert("trucks", {
      code: "T5",
      driver: "Suresh Patil",
      routeId: track,
      cargo: "Shelter tarps & blankets",
      supplyForPeople: 150,
      eta: "Today 18:45",
      priority: false,
      status: "en_route",
    });
    await ctx.db.insert("trucks", {
      code: "T1",
      driver: "Asha Devi",
      routeId: highway,
      cargo: "Medical kits & insulin",
      supplyForPeople: 400,
      eta: "Today 17:20",
      priority: true,
      status: "en_route",
    });

    await ctx.db.insert("volunteers", {
      name: "Meena Raghavan",
      campId: camp2,
      contact: "+91 98200 44117",
    });
    await ctx.db.insert("volunteers", {
      name: "Ravi Menon",
      campId: camp2,
      contact: "+91 98200 55820",
    });
    await ctx.db.insert("volunteers", {
      name: "Anand Rao",
      campId: camp5,
      contact: "+91 98670 20348",
    });
    await ctx.db.insert("volunteers", {
      name: "Fatima Sheikh",
      campId: camp1,
      contact: "+91 90040 55192",
    });
    await ctx.db.insert("volunteers", {
      name: "Prakash Nair",
      campId: camp7,
      contact: "+91 90045 77120",
    });

    // Step 1: an update arrives and runs through all six agents for real, so
    // the desk opens with one genuine plan waiting for approval.
    const [allRoutes, allCamps, allTrucks, allVolunteers] = await Promise.all([
      ctx.db.query("routes").collect(),
      ctx.db.query("camps").collect(),
      ctx.db.query("trucks").collect(),
      ctx.db.query("volunteers").collect(),
    ]);
    const result = runCoordinator({
      rawText: OPENING_REPORT,
      routes: allRoutes,
      camps: allCamps,
      trucks: allTrucks,
      volunteers: allVolunteers,
      pendingUpdates: [],
    });
    await persistRun(ctx, OPENING_REPORT, result, Date.now() - 12 * 60 * 1000);

    return { seeded: true };
  },
});
