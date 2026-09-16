import type { StoryWorldPosition } from "./story-world.types";

export const STORY_WORLD_POSITIONS: readonly StoryWorldPosition[] = [
  { x: -4.8, z: 8 },
  { x: 4.8, z: -3 },
  { x: -4.8, z: -15 },
];

export const STORY_WORLD_BOUNDS = {
  maxX: 7.4,
  maxZ: 13.5,
  minX: -7.4,
  minZ: -19.2,
} as const;

export const STORY_INTERACTION_DISTANCE = 2.55;
export const UGAT_STORY = "m1-story-2";
export const UGAT_SCROLL_POSITIONS = [{ x: -3.8, z: 7.5 }, { x: 3.8, z: 1.8 }, { x: -3.5, z: -4 }];

export const RETURN_PORTAL_ID = "return-to-hub";
// Behind the entry area, offset left so the chase camera can see the player.
export const RETURN_PORTAL_POSITION: StoryWorldPosition = { x: -3.8, z: 13.1 };

// Question groups use a compact lane; hub portals retain their wider spacing.
export const QUESTION_SCROLL_POSITIONS: readonly StoryWorldPosition[] = [
  { x: -1.6, z: 8 },
  { x: 1.6, z: 3 },
  { x: -1.6, z: -2 },
];

export function worldChestPosition(quest: boolean): StoryWorldPosition {
  return { x: 0, z: quest ? -7 : -18.85 };
}
