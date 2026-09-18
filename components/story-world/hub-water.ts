import { BufferGeometry, CircleGeometry, Color, Group, Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Two opaque draws for the whole river/pool and waterfall. No reflections,
 * transparent layers, texture uploads, or WebGL 2 features on phones. */
export function createHubWater() {
  const group = new Group(); group.name = "Flowing river and waterfall";
  const time = { value: 0 };
  function material(falling: boolean) {
    return new ShaderMaterial({
      uniforms: { time, deep: { value: new Color(falling ? 0x59afbc : 0x438f9d) },
        shallow: { value: new Color(0x73c4c3) }, foam: { value: new Color(0xdaf4df) } },
      vertexShader: `varying vec3 waterPosition; varying vec2 waterUv;
        void main() { waterPosition = position; waterUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float time; uniform vec3 deep; uniform vec3 shallow; uniform vec3 foam;
        varying vec3 waterPosition; varying vec2 waterUv;
        void main() {
          ${falling ? `
            float strand = sin(waterUv.x * 51.0 + sin(waterUv.y * 6.0 + time * 1.8));
            float flow = sin(waterUv.y * 24.0 + time * 6.0 + waterUv.x * 7.0);
            vec3 color = mix(deep, shallow, 0.4 + strand * 0.25);
            float splash = (1.0 - smoothstep(0.02, 0.23, waterUv.y)) * 0.7;
            color = mix(color, foam, splash + smoothstep(0.76, 1.0, flow) * smoothstep(0.3, 1.0, strand) * 0.38);
          ` : `
            vec2 p = waterPosition.xz;
            float wave = sin(p.x * 2.1 + p.y * 1.4 - time * 1.4);
            float crossing = sin(p.x * 0.9 - p.y * 2.3 + time * 0.8);
            float ripples = smoothstep(0.83, 1.0, wave) * smoothstep(0.0, 0.8, crossing);
            float pool = 1.0 - smoothstep(2.0, 5.0, distance(p, vec2(-25.0, -27.7)));
            float rings = smoothstep(0.8, 1.0, sin(distance(p, vec2(-25.0, -27.7)) * 8.0 - time * 3.0));
            vec3 color = mix(deep, shallow, 0.45 + wave * 0.12 + crossing * 0.12);
            color = mix(color, foam, ripples * 0.35 + pool * rings * 0.3);
          `}
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }
  const pieces: BufferGeometry[] = [
    new PlaneGeometry(5, 100).rotateX(-Math.PI / 2).translate(-13, .025, -4),
    new PlaneGeometry(10, 3).rotateX(-Math.PI / 2).translate(-19, .028, -29),
    new CircleGeometry(5, 24).rotateX(-Math.PI / 2).translate(-25, .035, -27.7),
  ];
  const river = mergeGeometries(pieces); pieces.forEach(piece => piece.dispose());
  if (river) group.add(new Mesh(river, material(false)));
  const waterfall = new Mesh(new PlaneGeometry(4.5, 6.2), material(true));
  waterfall.position.set(-25, 3.1, -27.94); group.add(waterfall);
  return { group, update(elapsed: number) { time.value = elapsed; } };
}
