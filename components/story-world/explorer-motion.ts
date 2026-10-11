export const EXPLORER_WALK_SPEED = 3.15;
const ACCELERATION = 12;
const BRAKING = 20;

/** Integrate velocity, so short joystick gestures do not jump to full speed. */
export class ExplorerLocomotion {
  private x = 0;
  private z = 0;
  readonly step = { x: 0, z: 0 };

  advance(delta: number, directionX: number, directionZ: number) {
    const dt = Math.max(0, Math.min(delta, 0.1));
    const length = Math.hypot(directionX, directionZ);
    const scale = length > 1 ? 1 / length : 1;
    const targetX = directionX * scale * EXPLORER_WALK_SPEED;
    const targetZ = directionZ * scale * EXPLORER_WALK_SPEED;
    const dx = targetX - this.x, dz = targetZ - this.z;
    const distance = Math.hypot(dx, dz);
    const braking = length < 0.001 || targetX * this.x + targetZ * this.z < 0;
    const amount = distance ? Math.min(1, (braking ? BRAKING : ACCELERATION) * dt / distance) : 1;
    const oldX = this.x, oldZ = this.z;
    this.x += dx * amount;
    this.z += dz * amount;
    this.step.x = (oldX + this.x) * 0.5 * dt;
    this.step.z = (oldZ + this.z) * 0.5 * dt;
    return this.step;
  }

  /** Collision response removes velocity into walls but keeps sliding along them. */
  resolve(actualX: number, actualZ: number) {
    if (Math.abs(actualX - this.step.x) > 0.00001) this.x = 0;
    if (Math.abs(actualZ - this.step.z) > 0.00001) this.z = 0;
  }

  reset() {
    this.x = this.z = this.step.x = this.step.z = 0;
  }
}

export type ExplorerAttention = {
  id: string;
  yaw: number;
  kind: "scroll" | "portal";
};

/** One brief gesture after settling beside an object; moving always cancels it. */
export class ExplorerExpressionState {
  breath = 0;
  gaze = 0;
  reach = 0;
  nod = 0;
  reading = 0;
  walking = 0;
  private time = 0;
  private settled = 0;
  private targetId: string | null = null;
  private gestured = false;
  private gestureTime = -1;

  update(delta: number, speed: number, target?: ExplorerAttention) {
    const dt = Math.max(0, Math.min(delta, 0.1));
    this.time += dt;
    const idle = 1 - Math.min(1, speed * 4);
    this.breath = Math.sin(this.time * 1.8) * 0.006 * idle;
    if ((target?.id ?? null) !== this.targetId) {
      this.targetId = target?.id ?? null;
      this.gestured = false;
      this.gestureTime = -1;
      this.settled = 0;
    }
    const facing = Boolean(target && Math.abs(target.yaw) < 1.25);
    if (speed > 0.035 || !facing) {
      this.settled = 0;
      this.gestureTime = -1;
    } else {
      this.settled += dt;
      if (!this.gestured && this.settled > 0.5) {
        this.gestured = true;
        this.gestureTime = 0;
      }
    }
    if (this.gestureTime >= 0) this.gestureTime += dt;
    const envelope = this.gestureTime >= 0 && this.gestureTime < 1.7
      ? Math.sin(Math.PI * this.gestureTime / 1.7) ** 2 : 0;
    const blend = 1 - Math.exp(-dt * 9);
    this.walking += (Math.min(1, speed * 2.5) - this.walking) * blend;
    const yaw = facing && target ? Math.max(-0.38, Math.min(0.38, target.yaw)) * idle : 0;
    this.gaze += (yaw - this.gaze) * blend;
    this.reach += (envelope * idle - this.reach) * blend;
    this.reading += ((target?.kind === "scroll" ? 1 : 0) - this.reading) * blend;
    this.nod += (((target?.kind === "scroll" ? 0.10 : -0.035) * envelope * idle) - this.nod) * blend;
  }
}
