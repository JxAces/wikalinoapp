import type { StoryWorldPosition } from "./story-world.types";
import { HUB_PORTALS } from "./hub-layout";
import { STORY_ROUTE_CHEST, STORY_ROUTE_RETURN, STORY_ROUTE_SCROLLS, STORY_ROUTE_START_Z } from "./story-route-layout";

export const STORY_WORLD_POSITIONS: readonly StoryWorldPosition[] = HUB_PORTALS;

export const STORY_WORLD_BOUNDS = {
  maxX: 10,
  maxZ: STORY_ROUTE_START_Z,
  minX: -10,
  minZ: -19.2,
} as const;

export const STORY_INTERACTION_DISTANCE = 2.55;
export const UGAT_STORY = "m1-story-2";
export const UGAT_SCROLL_POSITIONS = STORY_ROUTE_SCROLLS;

export const RETURN_PORTAL_ID = "return-to-hub";
// Centered on the entrance pavement in every story world.
export const RETURN_PORTAL_POSITION: StoryWorldPosition = STORY_ROUTE_RETURN;

// Question groups use a compact lane; hub portals retain their wider spacing.
export const QUESTION_SCROLL_POSITIONS: readonly StoryWorldPosition[] = STORY_ROUTE_SCROLLS;

export function worldChestPosition(quest: boolean, _storyId?: string): StoryWorldPosition {
  return quest ? STORY_ROUTE_CHEST : { x: 25, z: 23 };
}
