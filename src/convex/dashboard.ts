import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * Everything the coordination desk renders, in one reactive query: the stored
 * operation map, the approval queue, decided updates and the activity timeline.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const [camps, routes, trucks, volunteers, updates, activity] =
      await Promise.all([
        ctx.db.query("camps").collect(),
        ctx.db.query("routes").collect(),
        ctx.db.query("trucks").collect(),
        ctx.db.query("volunteers").collect(),
        ctx.db.query("updates").order("desc").take(30),
        ctx.db.query("activity").order("desc").take(50),
      ]);

    const campName = new Map(camps.map((camp) => [camp._id, camp.name]));
    const routeName = new Map(routes.map((route) => [route._id, route.name]));

    const routeCards = routes.map((route) => ({
      id: route._id,
      name: route.name,
      status: route.status,
      notes: route.notes,
      capacityTrucks: route.capacityTrucks,
      camps: route.campIds
        .map((id) => campName.get(id))
        .filter((name): name is string => Boolean(name)),
      alternative:
        route.alternativeRouteId !== undefined
          ? (routeName.get(route.alternativeRouteId) ?? null)
          : null,
      trucks: trucks
        .filter((truck) => truck.routeId === route._id)
        .map((truck) => truck.code),
    }));

    const campCards = camps.map((camp) => ({
      id: camp._id,
      name: camp.name,
      location: camp.location,
      headcount: camp.headcount,
      medicalNeeds: camp.medicalNeeds,
      volunteers: volunteers
        .filter((volunteer) => volunteer.campId === camp._id)
        .map((volunteer) => volunteer.name),
    }));

    const truckCards = trucks.map((truck) => ({
      id: truck._id,
      code: truck.code,
      driver: truck.driver,
      cargo: truck.cargo,
      supplyForPeople: truck.supplyForPeople,
      eta: truck.eta,
      priority: truck.priority,
      status: truck.status,
      route: truck.routeId ? (routeName.get(truck.routeId) ?? null) : null,
    }));

    const mappedUpdates = updates.map((update) => ({
      id: update._id,
      rawText: update.rawText,
      reportedBy: update.reportedBy,
      type: update.type,
      confidence: update.confidence,
      status: update.status,
      structured: update.structured,
      connected: update.connected,
      impacts: update.impacts,
      proposals: update.proposals,
      checks: update.checks,
      revisionNote: update.revisionNote,
      question: update.question,
      conflict: update.conflict,
      decision: update.decision,
      decisionNote: update.decisionNote,
      decidedBy: update.decidedBy,
      decidedAt: update.decidedAt,
      createdAt: update.createdAt,
    }));

    const pending = mappedUpdates.filter((update) => update.status !== "resolved");
    const decided = mappedUpdates
      .filter((update) => update.status === "resolved")
      .slice(0, 6);

    return {
      camps: campCards,
      routes: routeCards,
      trucks: truckCards,
      volunteers: volunteers.map((volunteer) => ({
        id: volunteer._id,
        name: volunteer.name,
        contact: volunteer.contact,
        camp: volunteer.campId ? (campName.get(volunteer.campId) ?? null) : null,
      })),
      queue: pending,
      decided,
      activity,
      stats: {
        people: camps.reduce((sum, camp) => sum + camp.headcount, 0),
        camps: camps.length,
        volunteers: volunteers.length,
        trucksEnRoute: trucks.filter((truck) => truck.status === "en_route").length,
        routesOpen: routes.filter((route) => route.status === "open").length,
        routesClosed: routes.filter((route) => route.status === "closed").length,
        awaiting: pending.length,
        peopleAtRisk: pending.reduce(
          (sum, update) => sum + update.connected.peopleAffected,
          0,
        ),
      },
    };
  },
});
