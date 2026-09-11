import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(projectRoot, "assets/models/indigenous.glb");
const debugComponents = process.argv.includes("--debug-components");
const outputPath = path.join(
  projectRoot,
  debugComponents
    ? "assets/models/.tmp-indigenous-components.glb"
    : "assets/models/wikalino-indigenous-explorer.glb",
);

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const palette = {
  clothDark: "#33251F",
  gold: "#C99C50",
  goldLight: "#DBC389",
  hair: "#241A17",
  red: "#BD3435",
  redDark: "#741F27",
  skin: "#AF7953",
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

// The source's disconnected islands cross anatomical regions. Use the
// actual body coordinates for clothing boundaries, rather than island IDs.

function wovenRegion(coordinate) {
  const phase = ((coordinate % 0.092) + 0.092) % 0.092;
  if (phase < 0.012) return "clothDark";
  if (phase < 0.027) return "gold";
  if (phase < 0.035) return "goldLight";
  if (phase < 0.065) return "red";
  if (phase < 0.072) return "clothDark";
  return "redDark";
}

function colorRegion(_component, x, y, z) {
  // A narrow woven headband; keep the face and ears skin-colored.
  if (y > 1.816 && y < 1.842) return wovenRegion(x + 0.026);
  if (y >= 1.842 || (y > 1.70 && z < -0.015) || (y > 1.76 && Math.abs(x) > 0.105)) {
    return "hair";
  }

  // The broad sash wraps around the hips. Hands remain bare beside it.
  if (Math.abs(x) < 0.19 && y >= 0.944 && y < 1.07) {
    return wovenRegion(y + x * 0.24);
  }

  // Color only the hanging center cloth, leaving both thighs exposed.
  const frontFlap = z > 0.045 && Math.abs(x) < 0.055 && y > 0.812;
  const backFlap = z < -0.075 && Math.abs(x) < 0.065 && y > 0.54;
  if (y < 0.944 && (frontFlap || backFlap)) {
    return wovenRegion(x * 0.8 + y * 0.45);
  }
  return "skin";
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

// Cut triangles along color boundaries before baking. This preserves the
// original silhouette and smooth normals while avoiding blurred/jagged stripes.
const normalAccessor = document.accessors[primitive.attributes.NORMAL];
const normalView = document.bufferViews[normalAccessor.bufferView];
const normalStart = (normalView.byteOffset ?? 0) + (normalAccessor.byteOffset ?? 0);
const normalStride = normalView.byteStride ?? 12;
const sourceVertices = Array.from({ length: positionAccessor.count }, (_, index) => {
  const p = positionStart + index * positionStride;
  const n = normalStart + index * normalStride;
  return [0, 4, 8].map((offset) => binary.readFloatLE(p + offset))
    .concat([0, 4, 8].map((offset) => binary.readFloatLE(n + offset)));
});
const dot = (v, plane) => v[0] * plane[0] + v[1] * plane[1] + v[2] * plane[2] - plane[3];
const midpoint = (polygon) => [0, 1, 2].map(
  (axis) => polygon.reduce((sum, vertex) => sum + vertex[axis], 0) / polygon.length,
);
function splitPolygon(polygon, plane) {
  const distances = polygon.map((vertex) => dot(vertex, plane));
  if (Math.min(...distances) >= -1e-8 || Math.max(...distances) <= 1e-8) return [polygon];
  const sides = [[], []];
  polygon.forEach((vertex, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const distance = distances[index];
    const nextDistance = distances[(index + 1) % polygon.length];
    if (distance >= -1e-8) sides[0].push(vertex);
    if (distance <= 1e-8) sides[1].push(vertex);
    if (distance * nextDistance < 0) {
      const t = distance / (distance - nextDistance);
      const intersection = vertex.map((value, axis) => value + (next[axis] - value) * t);
      sides.forEach((side) => side.push(intersection));
    }
  });
  return sides.filter((side) => side.length >= 3);
}
function cut(polygons, planes) {
  return planes.reduce((parts, plane) => parts.flatMap((part) => splitPolygon(part, plane)), polygons);
}
function stripePlanes(polygon, axis, offset = 0) {
  const values = polygon.map((v) => dot(v, [...axis, -offset]));
  const planes = [];
  for (let repeat = Math.floor(Math.min(...values) / 0.092); repeat <= Math.ceil(Math.max(...values) / 0.092); repeat++) {
    for (const boundary of [0, 0.012, 0.027, 0.035, 0.065, 0.072]) {
      planes.push([...axis, repeat * 0.092 + boundary - offset]);
    }
  }
  return planes;
}
const positions = [], normals = [], colorBytes = [], outputIndices = [];
const vertexLookup = new Map();
function addVertex(vertex, color) {
  const key = vertex.map((value) => value.toFixed(7)).join(',') + ':' + color.join(',');
  if (vertexLookup.has(key)) return vertexLookup.get(key);
  const index = positions.length / 3;
  vertexLookup.set(key, index);
  positions.push(...vertex.slice(0, 3));
  const length = Math.hypot(...vertex.slice(3));
  normals.push(...vertex.slice(3).map((value) => value / length));
  colorBytes.push(...color, 255);
  return index;
}
const indices = readIndices();
for (let index = 0; index < indices.length; index += 3) {
  const triangle = indices.slice(index, index + 3).map((i) => sourceVertices[i]);
  const component = componentRanks[indices[index]] ?? 0;
  const minY = Math.min(...triangle.map((v) => v[1]));
  const maxY = Math.max(...triangle.map((v) => v[1]));
  let parts = [triangle];
  if (!debugComponents) {
    if (maxY > 0.54 && minY < 1.07) {
      parts = cut(parts, [
        ...[0.54, 0.812, 0.944, 1.07].map((y) => [0, 1, 0, y]),
        ...[-0.19, -0.065, -0.055, 0.055, 0.065, 0.19].map((x) => [1, 0, 0, x]),
        [0, 0, 1, 0.045], [0, 0, 1, -0.075],
      ]);
    }
    if (maxY > 1.70) parts = cut(parts, [
      ...[1.70, 1.76, 1.816, 1.842].map((y) => [0, 1, 0, y]),
      [0, 0, 1, -0.015], [1, 0, 0, -0.105], [1, 0, 0, 0.105],
    ]);
    parts = parts.flatMap((part) => {
      const center = midpoint(part);
      const region = colorRegion(component, ...center);
      if (region === 'skin' || region === 'hair') return [part];
      if (center[1] > 1.816) return cut([part], stripePlanes(part, [1, 0, 0], 0.026));
      return cut([part], stripePlanes(part, center[1] >= 0.944 ? [0.24, 1, 0] : [0.8, 0.45, 0]));
    });
  }
  for (const part of parts) {
    const region = colorRegion(component, ...midpoint(part));
    const color = debugComponents
      ? hslToRgb((component * 137.508) % 360, 0.78, component % 2 === 0 ? 0.48 : 0.62).map(srgbToLinearByte)
      : linearPalette[region];
    for (let corner = 1; corner < part.length - 1; corner++) {
      const tri = [part[0], part[corner], part[corner + 1]];
      const ab = tri[1].slice(0, 3).map((v, axis) => v - tri[0][axis]);
      const ac = tri[2].slice(0, 3).map((v, axis) => v - tri[0][axis]);
      if (Math.hypot(ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]) < 1e-12) continue;
      outputIndices.push(...tri.map((vertex) => addVertex(vertex, color)));
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }
}
const vertexCount = positions.length / 3;
const indexArray = vertexCount <= 65535 ? new Uint16Array(outputIndices) : new Uint32Array(outputIndices);
const buffers = [new Float32Array(positions), new Float32Array(normals), new Uint8Array(colorBytes), indexArray];
document.bufferViews = [];
let byteOffset = 0;
const chunks = buffers.map((array, index) => {
  const buffer = Buffer.from(array.buffer);
  document.bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, target: index === 3 ? 34963 : 34962 });
  const padded = Buffer.concat([buffer, Buffer.alloc((4 - buffer.length % 4) % 4)]);
  byteOffset += padded.length;
  return padded;
});
const extendedBinary = Buffer.concat(chunks);
document.accessors = [
  { bufferView: 0, componentType: 5126, count: vertexCount, type: 'VEC3', min: positionAccessor.min, max: positionAccessor.max },
  { bufferView: 1, componentType: 5126, count: vertexCount, type: 'VEC3' },
  { bufferView: 2, componentType: 5121, count: vertexCount, type: 'VEC4', normalized: true },
  { bufferView: 3, componentType: vertexCount <= 65535 ? 5123 : 5125, count: outputIndices.length, type: 'SCALAR' },
];
primitive.attributes = { POSITION: 0, NORMAL: 1, COLOR_0: 2 };
primitive.indices = 3;

document.materials[primitive.material] = {
  doubleSided: true,
  name: "Indigenous attire colors",
  pbrMetallicRoughness: {
    baseColorFactor: [1, 1, 1, 1],
    metallicFactor: 0.02,
    roughnessFactor: 0.86,
  },
};
document.asset.generator = "Wikalino indigenous color baker";
document.buffers[0].byteLength = extendedBinary.length;
document.extras = {
  colorReference: "Warm skin with red, black, and gold woven attire",
  palette,
};

writeGlb(outputPath, document, extendedBinary);
console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
console.log(Object.fromEntries([...counts.entries()].sort()));
