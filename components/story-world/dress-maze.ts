import type { StoryWorldPosition } from "./story-world.types";

export const DRESS_MAZE_STORY = "m1-story-1";
export const MAZE_PLAYER_RADIUS = 0.42;
export const DRESS_MAZE_WALLS = [
  { x: -6.7, z: 1.25, w: 0.22, d: 20.5 },
  { x: 6.7, z: 1.25, w: 0.22, d: 20.5 },
  { x: 0, z: -9, w: 13.4, d: 0.22 },
  { x: -4.8, z: 11.5, w: 3.8, d: 0.22 },
  { x: 3.2, z: 11.5, w: 7, d: 0.22 },
  // Alternating openings, with shorter partitions forming side passages.
  { x: -1.75, z: 6.2, w: 9.9, d: 0.22 },
  { x: 1.75, z: 1.2, w: 9.9, d: 0.22 },
  { x: -1.75, z: -3.9, w: 9.9, d: 0.22 },
  { x: 0.5, z: 8.8, w: 0.22, d: 2.4 },
  { x: -2, z: 4.0, w: 0.22, d: 2.0 },
  { x: 2, z: -1.0, w: 0.22, d: 2.0 },
  { x: 1.2, z: -5.25, w: 0.22, d: 2.7 },
] as const;

export function canStandInDressMaze(x: number, z: number) {
  return !DRESS_MAZE_WALLS.some(wall =>
    Math.abs(x - wall.x) < wall.w / 2 + MAZE_PLAYER_RADIUS &&
    Math.abs(z - wall.z) < wall.d / 2 + MAZE_PLAYER_RADIUS);
}

/** Small substeps prevent crossing thin partitions; separate axes allow sliding. */
export function moveThroughDressMaze(position: StoryWorldPosition, dx: number, dz: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  for (let i = 0; i < steps; i++) {
    if (canStandInDressMaze(position.x + dx / steps, position.z)) position.x += dx / steps;
    if (canStandInDressMaze(position.x, position.z + dz / steps)) position.z += dz / steps;
  }
}
