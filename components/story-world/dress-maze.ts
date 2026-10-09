import { STORY_AVENUE_TREES } from "./story-route-layout";
import type { StoryWorldPosition } from "./story-world.types";

export const DRESS_MAZE_STORY = "m1-story-1";
export const MAZE_PLAYER_RADIUS = 0.42;
// Keep the colorful clothing displays, arranged as side galleries rather than
// barriers across the new shared promenade. The central view stays open.
export const DRESS_MAZE_WALLS = [-1,1].flatMap(side=>[9,2,-5,-12].flatMap(z=>[
  {x:side*4.5,z,w:.42,d:4.8},
  {x:side*7,z:z-.7,w:.42,d:4.8},
]));

export function canStandInDressMaze(x: number, z: number) {
  return !STORY_AVENUE_TREES.some(p=>Math.hypot(x-p.x,z-p.z)<.8) && !DRESS_MAZE_WALLS.some(wall =>
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
