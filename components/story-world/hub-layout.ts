/** Shared by scenery, portal placement and wildlife, so clearings stay aligned. */
export const HUB_BOUNDS = { minX: -36, maxX: 38, minZ: -40, maxZ: 32 };
export const HUB_BRIDGES = [-8, 18];
export const HUB_RIVER_X = -13;
export const HUB_HOUSES = [{ x: 17, z: 3 }, { x: 30, z: -3 }, { x: 31, z: 17 }];
// Open, walkable village lawn; keep vegetation away from this gathering space.
export const HUB_VILLAGE_CLEARING = { x: 33, z: 7, radius: 6 };
export const HUB_PORTALS = [
  { x: -25, z: -23.5, heading: 0, approach: { x: -24, z: -16 } },
  { x: 20, z: -24.5, heading: -0.6, approach: { x: 12, z: -17 } },
  { x: 23, z: 12.5, heading: -Math.PI / 2, approach: { x: 12, z: 12 } },
] as const;

/** One source for the visible paths, minimap and planting clearances. */
export const HUB_TRAILS = [
  [[0,12],[0,-8],[-17,-8],[-24,-16],[-25,-23.5]],
  [[0,-8],[5,-14],[12,-17],[20,-24.5]],
  [[0,12],[12,12],[23,12.5],[25,23]],
  [[-24,-16],[-24,18],[-8,18],[0,12]],
] as const;

export function distanceToHubTrail(x: number, z: number) {
  let distance = Infinity;
  for (const trail of HUB_TRAILS) for (let i = 1; i < trail.length; i++) {
    const [ax, az] = trail[i-1], [bx, bz] = trail[i];
    const dx = bx-ax, dz = bz-az;
    const t = Math.max(0, Math.min(1, ((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    distance = Math.min(distance, Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return distance;
}

// A fresh journey begins on the dry waterfall approach, looking toward story 1.
export const HUB_START_POSITION = { ...HUB_PORTALS[0].approach };
export const HUB_START_HEADING = Math.atan2(
  HUB_PORTALS[0].x - HUB_START_POSITION.x,
  HUB_PORTALS[0].z - HUB_START_POSITION.z,
);

export function portalApproachClear(x: number, z: number, margin = 0) {
  return HUB_PORTALS.some(portal => {
    if (Math.hypot(x - portal.x, z - portal.z) < 5 + margin) return true;
    const dx = portal.approach.x - portal.x, dz = portal.approach.z - portal.z;
    const t = Math.max(0, Math.min(1, ((x - portal.x) * dx + (z - portal.z) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - portal.x - dx * t, z - portal.z - dz * t) < 3 + margin;
  });
}
