import { Color, DodecahedronGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Mesh, MeshLambertMaterial, type DataTexture } from "three";

/** Layered rock faces join the existing cliff batch and free geometry for water. */
export function addWaterfallCliff(parent: Group) {
  const rock = new Color(0x777e79), wet = new Color(0x485c56), moss = new Color(0x627a3b), color = new Color();
  const shapes = [
    [-33,2.8,-31,2.8,4.2,2.3],[-29.8,3.2,-31.2,2.6,4.5,2.1],
    [-26.8,3.5,-31.7,2.3,4.3,2.2],[-23.2,3.4,-31.7,2.5,4.2,2.2],
    [-19.7,2.8,-31.2,2.6,3.9,2.2],[-16.6,2.4,-31.8,2.4,3.4,2],
    [-30.6,.5,-27.3,1.8,1.1,1.1],[-19.4,.45,-27.3,1.65,1,1.2],
    [-25,5.3,-31,3.1,1.5,2.5],[-25,2.5,-30.8,3.3,3.4,1.3],
  ];
  for (const [index, [x,y,z,sx,sy,sz]] of shapes.entries()) {
    const geometry = new DodecahedronGeometry(1, 0), p = geometry.getAttribute("position");
    const colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
      const warp = 1 + Math.sin(px * 5 + index) * Math.cos(pz * 4) * .12;
      p.setXYZ(i, px * warp, py, pz * warp);
      color.copy(rock).lerp(wet, index === 9 ? .65 : Math.max(0, -py) * .3);
      color.lerp(moss, Math.max(0, py - .1) * .65);
      color.multiplyScalar(.88 + Math.sin(py * 11 + px * 3 + index) * .1).toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, new MeshLambertMaterial({ vertexColors: true }));
    mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.rotation.y = Math.sin(index * 1.7) * .16;
    parent.add(mesh);
  }
  for (const [x,z] of [[-28.3,-26.8],[-21.2,-26.9]]) {
    const mesh = new Mesh(new IcosahedronGeometry(1,0), new MeshLambertMaterial({color:0x64756a}));
    mesh.position.set(x,.08,z);mesh.scale.set(.6,.3,.5);parent.add(mesh);
  }
}

/** Reuse the water noise for stone grain after the rocks have been batched. */
export function addWetRockDetail(parent: Group, flowMap: DataTexture) {
  parent.traverse(object => {
    if (!(object instanceof Mesh) || !(object.material instanceof MeshLambertMaterial)) return;
    const material = Object.assign(object.material, { flowMap });
    material.onBeforeCompile = shader => {
      shader.uniforms.rockGrain = { value: flowMap };
      shader.vertexShader = "varying vec3 rockPosition;\n" + shader.vertexShader.replace(
        "#include <begin_vertex>", "#include <begin_vertex>\n rockPosition = position;",
      );
      shader.fragmentShader = "varying vec3 rockPosition; uniform sampler2D rockGrain;\n" + shader.fragmentShader.replace(
        "#include <color_fragment>", `#include <color_fragment>
          vec2 stoneUv = rockPosition.xz * 0.16 + vec2(rockPosition.y * 0.1);
          vec4 grain = texture2D(rockGrain, stoneUv);
          float seam = smoothstep(0.88, 1.0, fract(rockPosition.y * 1.7 + grain.r * 0.6));
          diffuseColor.rgb *= (0.81 + grain.g * 0.34) * (1.0 - seam * 0.13);
        `,
      );
    };
    material.customProgramCacheKey = () => "wikalino-waterfall-rock-grain-v1";
  });
}
