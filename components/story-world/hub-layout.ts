/** Shared by scenery, portal placement and wildlife, so clearings stay aligned. */
export const HUB_PORTALS = [
  { x: -25, z: -23.5, heading: 0, approach: { x: -24, z: -16 } },
  { x: 20, z: -24.5, heading: -0.6, approach: { x: 12, z: -17 } },
  { x: 23, z: 12.5, heading: -Math.PI / 2, approach: { x: 12, z: 12 } },
] as const;

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
