import { AnimationMixer, BufferGeometry, Mesh, Vector2, type AnimationClip, type Object3D } from "three";
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
  const blend = { value: new Vector2() };
  const restoreMaterials: (() => void)[] = [];
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
    restoreMaterials.forEach(restore => restore());
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
    // Interpolate already-baked frames on the GPU. Attributes reference the
    // same immutable buffers; neither memory copies nor per-frame uploads.
    poses.forEach((pose, frame) => pose.forEach((geometry, index) => {
      const next = poses[frame === 0 || frame === frameCount ? 1 : frame + 1][index];
      geometry.setAttribute("walkNextPosition", next.getAttribute("position"));
      geometry.setAttribute("walkNextNormal", next.getAttribute("normal"));
      geometry.setAttribute("walkRestPosition", poses[0][index].getAttribute("position"));
      geometry.setAttribute("walkRestNormal", poses[0][index].getAttribute("normal"));
    }));
    const materials = new Set(displays.flatMap(display => Array.isArray(display.material) ? display.material : [display.material]));
    for (const material of materials) {
      const before = material.onBeforeCompile;
      const cacheKey = material.customProgramCacheKey;
      const key = cacheKey.call(material);
      material.customProgramCacheKey = () => `${key}-interpolated-explorer-walk-v1`;
      material.onBeforeCompile = (shader, renderer) => {
        before.call(material, shader, renderer);
        shader.uniforms.explorerWalkBlend = blend;
        shader.vertexShader = `
          attribute vec3 walkNextPosition;
          attribute vec3 walkNextNormal;
          attribute vec3 walkRestPosition;
          attribute vec3 walkRestNormal;
          uniform vec2 explorerWalkBlend;
        ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
          vec3 transformed = mix(walkRestPosition, mix(position, walkNextPosition, explorerWalkBlend.x), explorerWalkBlend.y);
        `).replace("#include <beginnormal_vertex>", `
          #include <beginnormal_vertex>
          objectNormal = normalize(mix(walkRestNormal, mix(normal, walkNextNormal, explorerWalkBlend.x), explorerWalkBlend.y));
        `);
      };
      material.needsUpdate = true;
      restoreMaterials.push(() => {
        material.onBeforeCompile = before;
        material.customProgramCacheKey = cacheKey;
        material.needsUpdate = true;
      });
    }
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
    get phase() { return time / clip.duration * Math.PI * 2; },
    update(delta: number, strength: number) {
      if (disposed) return;
      const speed = Math.max(0, Math.min(1, strength));
      blend.value.y += (Math.min(1, speed * 2.5) - blend.value.y) * (1 - Math.exp(-delta * 14));
      if (!speed && blend.value.y < 0.001) blend.value.y = 0;
      time = blend.value.y ? (time + delta * (0.55 + 0.45 * speed)) % clip.duration : 0;
      const frame = time / clip.duration * frameCount;
      blend.value.x = frame % 1;
      const next = blend.value.y ? 1 + Math.floor(frame) : 0;
      if (next === selected) return;
      selected = next;
      displays.forEach((display, index) => { display.geometry = poses[next][index]; });
    },
    dispose,
  };
}

export type BakedExplorerWalk = Awaited<ReturnType<typeof bakeExplorerWalk>>;
