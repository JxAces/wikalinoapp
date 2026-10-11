import { Box3, Matrix4, Mesh, Vector3, Vector4, type Material, type Object3D } from "three";
import type { PlayerCharacterId } from "@/data/player-characters";
import { ExplorerExpressionState, type ExplorerAttention } from "./explorer-motion";

// Perform small upper-body poses after either baked or skeletal leg animation.
// GLSL 1, four shared pose values: no new bones, textures, draws or vertex uploads.
const DEFORMATION = `
uniform mat4 explorerToUnit;
uniform mat4 explorerFromUnit;
uniform vec4 explorerExpression;
uniform vec4 explorerAnatomy;
uniform float explorerReading;
uniform float explorerArmSwing;
attribute float explorerArmWeight;
vec3 explorerRotateX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c*p.y-s*p.z, s*p.y+c*p.z);
}
vec3 explorerRotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z);
}
void explorerUpperBody(inout vec3 p, inout vec3 n) {
  if (p.y < 0.28) return;
  float head = smoothstep(explorerAnatomy.x, explorerAnatomy.y, p.y);
  float chest = smoothstep(0.46, 0.64, p.y) * (1.0-head);
  float arm = explorerArmWeight;
  float lift = explorerExpression.z * arm * (p.x > 0.0 ? 0.48 : explorerReading*0.35);
  // Opposite arm and leg travel together; shoulders remain attached to the torso.
  float armAngle = -lift + explorerArmSwing * sign(p.x) * arm;
  vec3 shoulder = vec3(sign(p.x)*0.13, explorerAnatomy.z, 0.0);
  if (abs(armAngle) > 0.0001) {
    p = shoulder + explorerRotateX(p-shoulder, armAngle);
    n = explorerRotateX(n, armAngle);
  }
  float stretch = 1.0 + explorerExpression.x * chest;
  p.xz *= stretch;
  n.xz /= stretch;
  // Lift the rib cage very slightly; the feet remain fixed on the pavement.
  p.y += explorerExpression.x * 0.12 * chest;
  vec3 neck = vec3(0.0, explorerAnatomy.x, 0.0);
  if (head > 0.0) {
    p = neck + explorerRotateY(explorerRotateX(p-neck, explorerExpression.w*head), explorerExpression.y*head);
    n = explorerRotateY(explorerRotateX(n, explorerExpression.w*head), explorerExpression.y*head);
  }
}
`;

export function createExplorerExpression(root: Object3D, characterId: PlayerCharacterId) {
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(0.001, bounds.max.y - bounds.min.y);
  const toUnit = new Matrix4().makeScale(1 / height, 1 / height, 1 / height)
    .multiply(new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
  // Hats change the head's proportion of total model height.
  const anatomy = characterId === "muslim" ? new Vector4(0.70, 0.78, 0.69, 0)
    : characterId === "batang-pinoy" ? new Vector4(0.70, 0.79, 0.70, 0)
    : new Vector4(0.79, 0.85, 0.76, 0);
  const pose = { value: new Vector4() };
  const reading = { value: 0 };
  const armSwing = { value: 0 };
  const state = new ExplorerExpressionState();
  const restore: (() => void)[] = [];
  root.traverse(object => {
    if (!(object instanceof Mesh) || object.layers.mask === 0) return;
    const original = object.material;
    const transform = toUnit.clone().multiply(object.matrixWorld);
    const inverse = transform.clone().invert();
    const materials = (Array.isArray(original) ? original : [original]).map((source: Material) => {
      const material = source.clone();
      const sourceKey = source.customProgramCacheKey();
      material.customProgramCacheKey = () => `${sourceKey}-explorer-expression-v1`;
      material.onBeforeCompile = (shader, renderer) => {
        // Preserve WebGL 1's matrix-uniform skinning when used by the PWA.
        source.onBeforeCompile.call(material, shader, renderer);
        shader.uniforms.explorerToUnit = { value: transform };
        shader.uniforms.explorerFromUnit = { value: inverse };
        shader.uniforms.explorerExpression = pose;
        shader.uniforms.explorerAnatomy = { value: anatomy };
        shader.uniforms.explorerReading = reading;
        shader.uniforms.explorerArmSwing = armSwing;
        shader.vertexShader = DEFORMATION + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <defaultnormal_vertex>", `
          vec3 expressionNormal = normalize(mat3(explorerToUnit) * objectNormal);
          vec3 expressionRest = (explorerToUnit * vec4(position, 1.0)).xyz;
          explorerUpperBody(expressionRest, expressionNormal);
          objectNormal = normalize(mat3(explorerFromUnit) * expressionNormal);
          #include <defaultnormal_vertex>
        `).replace("#include <project_vertex>", `
          vec3 expressionPosition = (explorerToUnit * vec4(transformed, 1.0)).xyz;
          vec3 unusedExpressionNormal = vec3(0.0, 1.0, 0.0);
          explorerUpperBody(expressionPosition, unusedExpressionNormal);
          transformed = (explorerFromUnit * vec4(expressionPosition, 1.0)).xyz;
          #include <project_vertex>
        `);
      };
      return material;
    });
    object.material = Array.isArray(original) ? materials : materials[0];
    restore.push(() => {
      object.material = original;
      materials.forEach(material => material.dispose());
    });
  });
  let disposed = false;
  return {
    update(delta: number, speed: number, target?: ExplorerAttention, walkPhase = 0) {
      if (disposed) return;
      state.update(delta, speed, target);
      pose.value.set(state.breath, state.gaze, state.reach, state.nod);
      reading.value = state.reading;
      armSwing.value = Math.sin(walkPhase) * 0.32 * state.walking;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      restore.forEach(reset => reset());
    },
  };
}
