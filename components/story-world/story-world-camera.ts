import { Vector3 } from "three";

export const INITIAL_CHARACTER_HEADING = Math.PI;
const FOLLOW_DISTANCE = 7.2;
const FOLLOW_HEIGHT = 3.8;
const LOOK_AHEAD = 1.6;
const LOOK_HEIGHT = 1.3;

/** Smooth the shortest turn, including crossing the -PI / PI boundary. */
export function followHeading(current: number, target: number, delta: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-delta * 5));
}

/** Models face local +Z. The camera sits directly opposite that direction. */
export function chaseCameraPose(
  anchor: Vector3,
  heading: number,
  position: Vector3,
  target: Vector3,
) {
  const forwardX = Math.sin(heading);
  const forwardZ = Math.cos(heading);
  position.set(
    anchor.x - forwardX * FOLLOW_DISTANCE,
    anchor.y + FOLLOW_HEIGHT,
    anchor.z - forwardZ * FOLLOW_DISTANCE,
  );
  target.set(
    anchor.x + forwardX * LOOK_AHEAD,
    anchor.y + LOOK_HEIGHT,
    anchor.z + forwardZ * LOOK_AHEAD,
  );
}

/** Joystick up moves into the view, and right moves toward screen right. */
export function cameraRelativeMovement(x: number, y: number, heading: number, result: Vector3) {
  const length = Math.hypot(x, y);
  if (length < 0.06) return result.set(0, 0, 0);
  const strength = Math.min(1, length);
  const right = x / length * strength;
  const forward = y / length * strength;
  return result.set(
    -Math.cos(heading) * right + Math.sin(heading) * forward,
    0,
    Math.sin(heading) * right + Math.cos(heading) * forward,
  );
}
