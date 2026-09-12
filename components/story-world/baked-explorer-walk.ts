import { AnimationMixer, BufferGeometry, Mesh, type AnimationClip, type Object3D } from "three";
import { prepareCompatibleSkinning } from "./compatible-skinning";

/** Native WebGL 1: calculate the leg poses once, then switch immutable buffers.
 * No skinning shader, per-vertex JS loop, or repeated buffer upload during play.
 * Only position/normal buffers vary; colors, UVs and indices are shared.
 */
export async function bakeExplorerWalk(
  root: Object3D,
  clip: AnimationClip,
  cancelled: () => boolean,
  yieldFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve())),
) {
  const skinning = prepareCompatibleSkinning(root, false);
  if (!skinning) return null;
  const displays: Mesh[] = [];
  root.traverse(object => {
    if (object instanceof Mesh && object.name.endsWith("-webgl1-display")) displays.push(object);
  });
  const working = displays.map(display => display.geometry);
  const poses: BufferGeometry[][] = [];
  const mixer = new AnimationMixer(root);
  const frameCount = 12;
  let disposed = false;
  function capture() {
    poses.push(working.map(source => {
      const pose = new BufferGeometry();
      pose.setIndex(source.index);
      for (const [name, attribute] of Object.entries(source.attributes)) {
        pose.setAttribute(name, name === "position" || name === "normal" ? attribute.clone() : attribute);
      }
      // The GLBs may have more than one material range.
      for (const range of source.groups) pose.addGroup(range.start, range.count, range.materialIndex);
      pose.setDrawRange(source.drawRange.start, source.drawRange.count);
      return pose;
    }));
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    // The compatibility helper owns the working buffers, not the selected pose.
    displays.forEach((display, index) => { display.geometry = working[index]; });
    skinning!.dispose();
    poses.forEach(pose => pose.forEach(geometry => geometry.dispose()));
    poses.length = 0;
  }
  try {
    capture(); // Original standing pose, before any animation binding changes it.
    mixer.clipAction(clip).play();
    for (let frame = 0; frame < frameCount; frame++) {
      await yieldFrame();
      if (cancelled()) { dispose(); return null; }
      mixer.setTime(clip.duration * frame / frameCount);
      skinning.update();
      capture();
    }
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    displays.forEach((display, index) => { display.geometry = poses[0][index]; });
  } catch (error) {
    dispose();
    throw error;
  }
  let time = 0;
  let selected = 0;
  return {
    mode: "baked-poses" as const,
    duration: clip.duration,
    update(delta: number, moving: boolean) {
      if (disposed) return;
      time = moving ? (time + delta) % clip.duration : 0;
      const next = moving ? 1 + Math.floor(time / clip.duration * frameCount) : 0;
      if (next === selected) return;
      selected = next;
      displays.forEach((display, index) => { display.geometry = poses[next][index]; });
    },
    dispose,
  };
}

export type BakedExplorerWalk = Awaited<ReturnType<typeof bakeExplorerWalk>>;
