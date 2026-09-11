import type { StoryWorldPosition } from "./story-world.types";

export const STORY_WORLD_POSITIONS: readonly StoryWorldPosition[] = [
  { x: -3.8, z: 8.2 },
  { x: 3.9, z: 3.1 },
  { x: -4.1, z: -2.1 },
  { x: 3.8, z: -7.3 },
  { x: -3.7, z: -12.4 },
  { x: 3.6, z: -17.4 },
];

export const STORY_WORLD_BOUNDS = {
  maxX: 7.4,
  maxZ: 13.5,
  minX: -7.4,
  minZ: -19.2,
} as const;

export const STORY_INTERACTION_DISTANCE = 2.55;
