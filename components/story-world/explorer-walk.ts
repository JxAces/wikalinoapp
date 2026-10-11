import { AnimationMixer, type AnimationClip, type Object3D } from "three";

/** Blend the embedded leg animation into the original standing pose. */
export class ExplorerWalk {
  private mixer: AnimationMixer;
  private action;
  private weight = 0;

  constructor(private root: Object3D, readonly clip: AnimationClip) {
    this.mixer = new AnimationMixer(root);
    this.action = this.mixer.clipAction(clip);
    this.action.setEffectiveWeight(0).play();
  }

  update(delta: number, strength: number) {
    const speed = Math.max(0, Math.min(1, strength));
    this.weight += (Math.min(1, speed * 2.5) - this.weight) * (1 - Math.exp(-delta * 14));
    if (!speed && this.weight < 0.001) this.weight = 0;
    this.action.paused = this.weight === 0;
    this.action.setEffectiveWeight(this.weight);
    this.action.setEffectiveTimeScale(0.55 + speed * 0.45);
    this.mixer.update(delta);
  }

  get phase() {
    return this.action.time / this.clip.duration * Math.PI * 2;
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}
