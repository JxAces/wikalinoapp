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
