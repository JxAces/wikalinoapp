import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(projectRoot, "assets/models/muslim.glb");
const debugComponents = process.argv.includes("--debug-components");
const outputPath = path.join(
  projectRoot,
  debugComponents
    ? "assets/models/.tmp-muslim-components.glb"
    : "assets/models/wikalino-muslim-explorer.glb",
);

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const palette = {
  gold: "#C99A48",
  goldLight: "#E5C780",
  ivory: "#F1EEDD",
  rust: "#B77249",
  rustDark: "#945033",
  sandal: "#493326",
  sash: "#252C40",
  skin: "#AD7B56",
  hair: "#30231D",
};

function parseHex(hex) {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

function srgbToLinearByte(value) {
  const srgb = value / 255;
  const linear =
    srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  return Math.round(linear * 255);
}

function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));
  const values =
    sector < 1
      ? [chroma, x, 0]
      : sector < 2
        ? [x, chroma, 0]
        : sector < 3
          ? [0, chroma, x]
          : sector < 4
            ? [0, x, chroma]
            : sector < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const match = lightness - chroma / 2;
  return values.map((value) => Math.round((value + match) * 255));
}

const linearPalette = Object.fromEntries(
  Object.entries(palette).map(([name, hex]) => [
    name,
    parseHex(hex).map(srgbToLinearByte),
  ]),
);

// Islands in this scan are mesh fragments, not semantic clothing parts.
// Use continuous garment boundaries across fragments. Only isolated hands,
// feet and the head ornament can safely be identified by component rank.
const HAND_COMPONENTS = new Set([17, 19, 21, 23, 31, 33, 36, 38, 40, 41]);
const FOOT_COMPONENTS = new Set([13, 14, 24, 27, 32, 35]);
const CREST_COMPONENTS = new Set([29, 30, 34]);

function colorRegion(component, x, y, z) {
  const ax = Math.abs(x);
  if (CREST_COMPONENTS.has(component)) return "goldLight";
  // The rear of the turban crosses the face mesh's island boundary.
  if (y > 1.681 || (component === 11 && y > 1.65)) {
    const band = y + x * 0.30;
    return Math.abs(band - 1.71) < 0.013 ? "goldLight" : "gold";
  }
  if (y > 1.485 && ax < 0.12) {
    return z < -0.067 && y > 1.55 ? "hair" : "skin";
  }
  if (HAND_COMPONENTS.has(component) || (component === 5 && y < 0.848)) {
    return "skin";
  }
  if (FOOT_COMPONENTS.has(component)) {
    return y < 0.025 ? "sandal" : "skin";
  }

  // Ivory malong from the jacket hem down, with a narrow woven gold hem.
  if (y < 0.805) {
    if (z > 0.105 && ax < 0.047 && y > 0.548) return "gold";
    if (y < 0.19) return y > 0.17 || y < 0.125 ? "goldLight" : "gold";
    return "ivory";
  }

  // Dark sash must wrap around the back, without spilling onto the sleeves.
  if (ax < 0.205 && y > 1.008 && y < 1.12) {
    if (z > 0.13 && Math.hypot((x + 0.008) / 0.052, (y - 1.065) / 0.045) < 1) {
      return "goldLight";
    }
    return "sash";
  }

  // Gold front placket and embroidered jacket hem.
  if (y < 1.008 && z > 0.09 && ax < 0.025) return "gold";
  if (y < 0.824 && ax < 0.215) return "goldLight";
  // Matching narrow cuffs, not gold fingers.
  if (ax > 0.215 && y < 0.925) {
    return y < 0.868 || y > 0.909 ? "goldLight" : "gold";
  }

  // Shoulder panels taper along the actual sloping shoulder silhouette.
  const shoulderEdge = 0.125 + Math.max(0, 1.49 - y) * 0.66;
  if (y > 1.34 && ax > shoulderEdge) {
    return ax < shoulderEdge + 0.018 ? "goldLight" : "gold";
  }

  // Follow the draped necklace arcs on the front instead of coloring the
  // entire chest gold. Their reverse side remains copper fabric.
  if (z > 0.045 && y > 1.125 && y < 1.49) {
    for (const [width, bottom, top] of [
      [0.091, 1.30, 1.46], [0.097, 1.255, 1.455],
      [0.102, 1.205, 1.45], [0.108, 1.155, 1.45],
    ]) {
      const radius = Math.hypot(x / width, (y - top) / (top - bottom));
      if (Math.abs(radius - 1) < 0.026) return "goldLight";
    }
  }
  if (component === 37 || component === 39) return "goldLight";
  return ax > 0.21 ? "rustDark" : "rust";
}

function parseGlb(filePath) {
  const file = fs.readFileSync(filePath);
  if (file.readUInt32LE(0) !== GLB_MAGIC || file.readUInt32LE(4) !== 2) {
    throw new Error("Expected a glTF 2.0 binary file.");
  }

  let offset = 12;
  let document;
  let binary;
  while (offset < file.length) {
    const chunkLength = file.readUInt32LE(offset);
    const chunkType = file.readUInt32LE(offset + 4);
    const chunk = file.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === JSON_CHUNK) {
      document = JSON.parse(chunk.toString("utf8").replace(/[\u0000 ]+$/u, ""));
    } else if (chunkType === BIN_CHUNK) {
      binary = Buffer.from(chunk);
    }
    offset += 8 + chunkLength;
  }

  if (!document || !binary) {
    throw new Error("The GLB is missing its JSON or binary chunk.");
  }
  return { binary, document };
}

function writeGlb(filePath, document, binary) {
  let json = Buffer.from(JSON.stringify(document), "utf8");
  const jsonPadding = (4 - (json.length % 4)) % 4;
  json = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);
  const binaryPadding = (4 - (binary.length % 4)) % 4;
  const paddedBinary = Buffer.concat([binary, Buffer.alloc(binaryPadding)]);
  const totalLength = 12 + 8 + json.length + 8 + paddedBinary.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(GLB_MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(json.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  json.copy(output, 20);
  const binaryHeader = 20 + json.length;
  output.writeUInt32LE(paddedBinary.length, binaryHeader);
  output.writeUInt32LE(BIN_CHUNK, binaryHeader + 4);
  paddedBinary.copy(output, binaryHeader + 8);
  fs.writeFileSync(filePath, output);
}

const { binary, document } = parseGlb(inputPath);
const primitive = document.meshes?.[0]?.primitives?.[0];
const positionAccessorIndex = primitive?.attributes?.POSITION;
if (typeof positionAccessorIndex !== "number") {
  throw new Error("The model does not contain a POSITION attribute.");
}

const positionAccessor = document.accessors[positionAccessorIndex];
const positionView = document.bufferViews[positionAccessor.bufferView];
if (positionAccessor.componentType !== 5126 || positionAccessor.type !== "VEC3") {
  throw new Error("The color script expects float VEC3 positions.");
}

const positionStart =
  (positionView.byteOffset ?? 0) + (positionAccessor.byteOffset ?? 0);
const positionStride = positionView.byteStride ?? 12;
const counts = new Map();

function readIndices() {
  const indexAccessor = document.accessors[primitive.indices];
  const indexView = document.bufferViews[indexAccessor.bufferView];
  const start = (indexView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0);
  const stride = indexView.byteStride ?? (indexAccessor.componentType === 5125 ? 4 : 2);
  const indices = [];
  for (let index = 0; index < indexAccessor.count; index += 1) {
    const offset = start + index * stride;
    indices.push(
      indexAccessor.componentType === 5125
        ? binary.readUInt32LE(offset)
        : binary.readUInt16LE(offset),
    );
  }
  return indices;
}

function buildComponentRanks(vertexCount) {
  const indices = readIndices();
  const parents = Int32Array.from({ length: vertexCount }, (_, index) => index);
  const find = (input) => {
    let value = input;
    while (parents[value] !== value) {
      parents[value] = parents[parents[value]];
      value = parents[value];
    }
    return value;
  };
  const join = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parents[rightRoot] = leftRoot;
    }
  };

  for (let index = 0; index < indices.length; index += 3) {
    join(indices[index], indices[index + 1]);
    join(indices[index], indices[index + 2]);
  }

  const faceCounts = new Map();
  for (let index = 0; index < indices.length; index += 3) {
    const root = find(indices[index]);
    faceCounts.set(root, (faceCounts.get(root) ?? 0) + 1);
  }
  const rankedRoots = [...faceCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([root]) => root);
  const ranks = new Map(rankedRoots.map((root, rank) => [root, rank]));
  return Array.from({ length: vertexCount }, (_, index) => ranks.get(find(index)));
}

const componentRanks = buildComponentRanks(positionAccessor.count);

// Refine only triangles crossing a painted edge. Interpolated positions stay
// on the original surface; this adds color precision without changing shape.
const normalAccessor = document.accessors[primitive.attributes.NORMAL];
const normalView = document.bufferViews[normalAccessor.bufferView];
const normalStart = (normalView.byteOffset ?? 0) + (normalAccessor.byteOffset ?? 0);
const normalStride = normalView.byteStride ?? 12;
const vertices = Array.from({ length: positionAccessor.count }, (_, index) => {
  const p = positionStart + index * positionStride;
  const n = normalStart + index * normalStride;
  return {
    p: [0, 4, 8].map((offset) => binary.readFloatLE(p + offset)),
    n: [0, 4, 8].map((offset) => binary.readFloatLE(n + offset)),
    component: componentRanks[index] ?? 0,
  };
});
const regionOf = (v) => colorRegion(v.component, ...v.p);
const midpointCache = new Map();
function midpoint(a, b) {
  const key = a < b ? `${a}:${b}` : `${b}:${a}`;
  if (midpointCache.has(key)) return midpointCache.get(key);
  const left = vertices[a], right = vertices[b];
  const index = vertices.length;
  vertices.push({
    p: left.p.map((value, axis) => (value + right.p[axis]) / 2),
    n: left.n.map((value, axis) => (value + right.n[axis]) / 2),
    component: left.component,
  });
  midpointCache.set(key, index);
  return index;
}
const refinedIndices = [];
function refine(a, b, c, depth = 0) {
  const triangle = [vertices[a], vertices[b], vertices[c]];
  const samples = [...triangle, ...[[0, 1], [1, 2], [2, 0]].map(([i, j]) => ({
    p: triangle[i].p.map((v, axis) => (v + triangle[j].p[axis]) / 2),
    component: triangle[i].component,
  })), {
    p: [0, 1, 2].map(axis => triangle.reduce((sum, v) => sum + v.p[axis], 0) / 3),
    component: triangle[0].component,
  }];
  const regions = new Set(samples.map(regionOf));
  if (!debugComponents && depth < 2 && regions.size > 1) {
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    refine(a, ab, ca, depth + 1); refine(ab, b, bc, depth + 1);
    refine(ca, bc, c, depth + 1); refine(ab, bc, ca, depth + 1);
  } else refinedIndices.push(a, b, c);
}
const sourceIndices = readIndices();
for (let i = 0; i < sourceIndices.length; i += 3) {
  refine(sourceIndices[i], sourceIndices[i + 1], sourceIndices[i + 2]);
}
const positions = Buffer.alloc(vertices.length * 12);
const normals = Buffer.alloc(vertices.length * 12);
const paintedColors = Buffer.alloc(vertices.length * 4);
vertices.forEach((vertex, index) => {
  const region = regionOf(vertex);
  const color = debugComponents
    ? hslToRgb((vertex.component * 137.508) % 360, 0.78, vertex.component % 2 === 0 ? 0.48 : 0.62).map(srgbToLinearByte)
    : linearPalette[region];
  const normalLength = Math.hypot(...vertex.n) || 1;
  for (let axis = 0; axis < 3; axis++) {
    positions.writeFloatLE(vertex.p[axis], index * 12 + axis * 4);
    normals.writeFloatLE(vertex.n[axis] / normalLength, index * 12 + axis * 4);
    paintedColors[index * 4 + axis] = color[axis];
  }
  paintedColors[index * 4 + 3] = 255;
  counts.set(region, (counts.get(region) ?? 0) + 1);
});
const indexBytes = Buffer.alloc(refinedIndices.length * 4);
refinedIndices.forEach((index, i) => indexBytes.writeUInt32LE(index, i * 4));
// This source is a single static mesh. Repack only the used buffers so old
// uncolored geometry and unused UVs do not inflate the mobile asset.
if (document.meshes.length !== 1 || document.meshes[0].primitives.length !== 1 || document.animations?.length || document.skins?.length) {
  throw new Error("Expected the original single static Muslim character mesh");
}
const chunks = [positions, normals, paintedColors, indexBytes];
let byteOffset = 0;
document.bufferViews = chunks.map((chunk, index) => {
  const view = { buffer: 0, byteOffset, byteLength: chunk.length, target: index === 3 ? 34963 : 34962 };
  byteOffset += chunk.length;
  return view;
});
document.accessors = [
  { bufferView: 0, componentType: 5126, count: vertices.length, type: "VEC3", min: positionAccessor.min, max: positionAccessor.max },
  { bufferView: 1, componentType: 5126, count: vertices.length, type: "VEC3" },
  { bufferView: 2, componentType: 5121, count: vertices.length, normalized: true, type: "VEC4" },
  { bufferView: 3, componentType: 5125, count: refinedIndices.length, type: "SCALAR" },
];
primitive.attributes = { POSITION: 0, NORMAL: 1, COLOR_0: 2 };
primitive.indices = 3;
const extendedBinary = Buffer.concat(chunks);
console.log(`Mesh: ${vertices.length} vertices, ${refinedIndices.length / 3} triangles`);

document.materials[primitive.material] = {
  doubleSided: true,
  name: "Traditional attire colors",
  pbrMetallicRoughness: {
    baseColorFactor: [1, 1, 1, 1],
    metallicFactor: 0.04,
    roughnessFactor: 0.76,
  },
};
document.asset.generator = "Wikalino regional color baker";
document.buffers[0].byteLength = extendedBinary.length;
document.extras = {
  colorReference: "Traditional gold, rust, dark sash, ivory, and warm skin palette",
  palette,
};

writeGlb(outputPath, document, extendedBinary);
console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
console.log(Object.fromEntries([...counts.entries()].sort()));
