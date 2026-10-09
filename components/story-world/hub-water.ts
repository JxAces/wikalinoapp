import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh,
  ShaderMaterial, UniformsLib, UniformsUtils, type DataTexture,
} from "three";
import { createWaterFlowTexture } from "./water-flow-texture";

const RIVER_CENTER = -13, POOL_X = -25, POOL_Z = -27.7, FALL_Z = -28.5;

// The entire shoreline stays inside the existing 2.9 m collision half-width.
function riverCenter(z: number) { return RIVER_CENTER + Math.sin(z * .13) * .16 + Math.sin(z * .43) * .06; }
function riverWidth(z: number) { return 2.32 + Math.sin(z * .23 + .7) * .12 + Math.sin(z * .57) * .11; }

function createRiverGeometry() {
  const positions: number[] = [], indices: number[] = [];
  function ribbon(rows: number, point: (t: number, side: number) => number[]) {
    const start = positions.length / 3;
    for (let row = 0; row <= rows; row++) for (let side = -1; side <= 1; side++) positions.push(...point(row / rows, side));
    for (let row = 0; row < rows; row++) for (let side = 0; side < 2; side++) {
      const a = start + row * 3 + side;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  ribbon(32, (t, side) => {
    const z = 46 - t * 100;
    return [riverCenter(z) + side * riverWidth(z), .027, z];
  });
  // A short outlet joins the pool to the river behind the portal's dry shelf.
  ribbon(4, (t, side) => [-23 + t * 10, .03, -29 + Math.sin(t * Math.PI) * .15 - side * 1.25]);
  const center = positions.length / 3;
  positions.push(POOL_X, .033, POOL_Z);
  for (let i = 0; i <= 36; i++) {
    const a = i / 36 * Math.PI * 2, radius = 4.7 + Math.sin(a * 3) * .18 + Math.cos(a * 5) * .12;
    positions.push(POOL_X + Math.cos(a) * radius, .033, POOL_Z + Math.sin(a) * radius);
    if (i < 36) indices.push(center, center + i + 2, center + i + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

function createFallGeometry() {
  const positions: number[] = [], uv: number[] = [], effects: number[] = [], indices: number[] = [];
  const columns = 8, rows = 10;
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
    const u = column / columns, v = row / rows;
    const spread = 3.9 + (1 - v) * (1 - v) * 1.1;
    const turn = Math.max(0, (v - .84) / .16);
    positions.push(POOL_X + (u - .5) * spread, .09 + v * 6.5,
      FALL_Z - turn * turn * 1.3 + (1 - v) * (1 - v) * .75 + Math.cos(u * Math.PI * 2) * .09);
    uv.push(u, v); effects.push(0, 0, 0);
    if (row < rows && column < columns) {
      const a = row * (columns + 1) + column;
      indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
    }
  }
  function spray(x: number, y: number, z: number, kind: number, phase: number, size: number) {
    const start = positions.length / 3;
    for (const [u, v] of [[0,0],[1,0],[0,1],[1,1]]) {
      positions.push(x, y, z); uv.push(u, v); effects.push(kind, phase, size);
    }
    indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
  }
  for (let i = 0; i < 6; i++) spray(POOL_X - 2 + i * .8, .4, -27.2 + (i % 2) * .15, 1, i * .167, 1.1 + (i % 3) * .2);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399;
    spray(POOL_X + Math.cos(a) * 1.9, .13, -27.65 + Math.sin(a) * .65, 2, i * .0833, .04 + (i % 3) * .015);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setAttribute("effect", new Float32BufferAttribute(effects, 3));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  // Shader billboards move slightly outside their stationary centers.
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 1.5;
  return geometry;
}

class WaterMaterial extends ShaderMaterial {
  // Keep the shared texture visible to the world's resource disposer.
  readonly flowMap: DataTexture;
  constructor(flowMap: DataTexture, time: { value: number }, falling: boolean) {
    super({
      fog: true, transparent: falling, depthWrite: !falling,
      side: DoubleSide, forceSinglePass: true,
      uniforms: {
        ...UniformsUtils.clone(UniformsLib.fog), time, flowMap: { value: flowMap },
        deep: { value: new Color(0x225e61) }, shallow: { value: new Color(0x699b85) },
        skyTint: { value: new Color(0xbdd6cf) }, foam: { value: new Color(0xe2eee5) },
      },
      vertexShader: `
        uniform float time;
        varying vec3 waterPosition;
        ${falling ? "attribute vec3 effect; varying vec2 waterUv; varying vec3 spray;" : ""}
        #include <fog_pars_vertex>
        void main() {
          vec3 p = position;
          ${falling ? `
            waterUv = uv; spray = effect;
            if (effect.x < 0.5) {
              p.z += sin(p.x * 4.5 + time * 2.5 + uv.y * 7.0) * 0.028;
            } else {
              float life = fract(time * (effect.x < 1.5 ? 0.16 : 0.8) + effect.y);
              if (effect.x < 1.5) {
                p.y += life * 0.65;
                p.x += sin(time * 0.7 + effect.y * 6.28) * 0.18;
              } else {
                p.y += sin(life * 3.14159) * 0.55;
                p.z += life * 0.35;
              }
              spray.y = life;
            }
          ` : ""}
          waterPosition = (modelMatrix * vec4(p, 1.0)).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          ${falling ? "if (effect.x > 0.5) mvPosition.xy += (uv - 0.5) * effect.z * (1.0 + spray.y * 0.55);" : ""}
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        uniform float time;
        uniform sampler2D flowMap;
        uniform vec3 deep, shallow, skyTint, foam;
        varying vec3 waterPosition;
        ${falling ? "varying vec2 waterUv; varying vec3 spray;" : ""}
        #include <fog_pars_fragment>
        void main() {
          vec3 color; float alpha = 1.0;
          ${falling ? `
            if (spray.x > 0.5) {
              vec2 p = waterUv - 0.5;
              float soft = 1.0 - smoothstep(0.06, 0.5, length(p));
              float life = sin(spray.y * 3.14159);
              float billow = texture2D(flowMap, waterUv * 0.7 + vec2(time * 0.025, -time * 0.045)).g;
              alpha = soft * life * (spray.x < 1.5 ? 0.22 * billow : 0.55);
              color = foam;
            } else {
              vec2 p = waterUv;
              vec4 strands = texture2D(flowMap, vec2(p.x * 1.8, p.y * 0.15 + time * 0.34));
              vec4 rush = texture2D(flowMap, vec2(p.x * 4.2 + strands.r * 0.08, p.y * 0.65 + time * 1.05));
              float fiber = smoothstep(0.2, 0.78, strands.g * 0.65 + rush.r * 0.35);
              float impact = 1.0 - smoothstep(0.0, 0.25, p.y);
              color = mix(deep, skyTint, 0.52 + fiber * 0.36);
              color = mix(color, foam, fiber * 0.32 + impact * (0.45 + rush.g * 0.25));
              float edge = smoothstep(0.0, 0.09, min(p.x, 1.0 - p.x) - (rush.g - 0.5) * 0.025);
              float lip = smoothstep(0.0, 0.025, 1.0 - p.y);
              alpha = edge * lip * (0.66 + fiber * 0.29);
            }
            if (alpha < 0.012) discard;
          ` : `
            vec2 p = waterPosition.xz;
            vec4 a = texture2D(flowMap, p * vec2(0.16, 0.11) + vec2(time * 0.009, -time * 0.045));
            vec4 b = texture2D(flowMap, p.yx * vec2(0.38, 0.45) + vec2(-time * 0.022, time * 0.013));
            float center = -13.0 + sin(p.y * 0.13) * 0.16 + sin(p.y * 0.43) * 0.06;
            float width = 2.32 + sin(p.y * 0.23 + 0.7) * 0.12 + sin(p.y * 0.57) * 0.11;
            float riverDepth = 1.0 - abs(p.x - center) / width;
            float poolDepth = 1.0 - length((p - vec2(-25.0, -27.7)) / vec2(4.7));
            float outletDepth = min(1.0 - abs(p.y + 28.9) / 1.3, 1.0 - abs(p.x + 18.0) / 5.0);
            float depth = clamp(max(riverDepth, max(poolDepth, outletDepth)), 0.0, 1.0);
            vec3 normal = normalize(vec3((a.b + b.b - 1.0) * 0.38, 1.0, (a.a + b.a - 1.0) * 0.3));
            vec3 view = normalize(cameraPosition - waterPosition);
            float fresnel = pow(1.0 - max(dot(view, normal), 0.0), 4.0);
            vec3 halfLight = normalize(view + normalize(vec3(-0.45, 0.82, 0.35)));
            float sparkle = pow(max(dot(normal, halfLight), 0.0), 80.0);
            color = mix(shallow, deep, smoothstep(0.02, 0.85, depth));
            color *= 0.9 + a.r * 0.16 + b.g * 0.06;
            float bed = (1.0 - smoothstep(0.08, 0.55, depth)) * 0.2;
            color = mix(color, vec3(0.24, 0.29, 0.17) * (0.75 + b.g * 0.45), bed);
            color = mix(color, skyTint, 0.055 + fresnel * 0.3);
            color += vec3(1.0, 0.96, 0.8) * sparkle * 0.38;
            float rim = (1.0 - smoothstep(0.015, 0.14, depth)) * smoothstep(0.4, 0.72, a.g + b.g * 0.2);
            float radius = length((p - vec2(-25.0, -27.7)) * vec2(0.8, 1.5));
            float impact = (1.0 - smoothstep(0.1, 1.6, radius)) * (0.58 + a.g * 0.4);
            float wave = sin(radius * 7.0 - time * 3.5 + a.r * 3.5);
            float wake = smoothstep(0.73, 1.0, wave) * (1.0 - smoothstep(1.0, 5.8, radius)) * smoothstep(0.33, 0.65, b.g) * 0.36;
            color = mix(color, foam, clamp(rim * 0.12 + impact + wake, 0.0, 0.92));
          `}
          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    this.flowMap = flowMap;
  }
}

/** Two water draws, one small shared texture, and one changing time uniform.
 * Ripples, falling streams and spray run on the GPU without reflection targets. */
export function createHubWater() {
  const group = new Group(); group.name = "Flowing river and waterfall";
  const time = { value: 0 }, flowMap = createWaterFlowTexture();
  const river = new Mesh(createRiverGeometry(), new WaterMaterial(flowMap, time, false));
  river.name = "River shallows and foaming plunge pool";
  const waterfall = new Mesh(createFallGeometry(), new WaterMaterial(flowMap, time, true));
  waterfall.name = "Curved waterfall, mist and splash droplets";
  group.add(river, waterfall);
  return { group, flowMap, update(elapsed: number) { time.value = elapsed; } };
}
