import type { Story } from "@/data/stories";
import type { StoryWorldPortal } from "./story-world.types";
import { HUB_PORTALS, HUB_START_HEADING, HUB_START_POSITION } from "./hub-layout";

/** Save the story identity in the route, never arbitrary player coordinates. */
export function hubReturnRoute(story: Pick<Story, "id" | "markahan">) {
  return { pathname: "/landing" as const, params: { returnPortal: story.id, markahan: String(story.markahan) } };
}

/** Explicitly clear a previous tab's return location when starting a new session. */
export function hubStartRoute() {
  return { pathname: "/landing" as const, params: { returnPortal: "", markahan: "1" } };
}

export function hubSpawn(
  portals: readonly Pick<StoryWorldPortal, "position" | "story">[],
  returnPortal?: string | string[],
) {
  const id = Array.isArray(returnPortal) ? returnPortal[0] : returnPortal;
  const index = portals.findIndex(portal => portal.story.id === id);
  const portal = portals[index], placement = HUB_PORTALS[index];
  if (!portal || !placement) {
    return { position: { ...HUB_START_POSITION }, heading: HUB_START_HEADING };
  }
  // Just outside the stone plinth and interaction radius, on its open approach.
  return {
    position: {
      x: portal.position.x + Math.sin(placement.heading) * 3.4,
      z: portal.position.z + Math.cos(placement.heading) * 3.4,
    },
    heading: placement.heading + Math.PI,
  };
}
