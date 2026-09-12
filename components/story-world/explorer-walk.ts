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

  update(delta: number, moving: boolean) {
    this.weight += ((moving ? 1 : 0) - this.weight) * (1 - Math.exp(-delta * 14));
    if (!moving && this.weight < 0.001) this.weight = 0;
    this.action.paused = this.weight === 0;
    this.action.setEffectiveWeight(this.weight);
    this.mixer.update(delta);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}
