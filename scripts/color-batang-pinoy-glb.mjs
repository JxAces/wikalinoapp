import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(projectRoot, "assets/models/batangPinoy.glb");
const debugComponents = process.argv.includes("--debug-components");
const outputPath = path.join(
  projectRoot,
  debugComponents
    ? "assets/models/.tmp-batang-pinoy-components.glb"
    : "assets/models/wikalino-batang-pinoy-explorer.glb",
);

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const palette = {
  hat: "#B58B58",
  hatLight: "#D8BE88",
  red: "#C52E32",
  redDark: "#8F2026",
  shirt: "#F4F1E8",
  shirtShadow: "#D8D9D2",
  skin: "#A96E52",
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

const HAT_COMPONENTS = new Set([1, 3]);
const TROUSER_COMPONENTS = new Set([2, 4, 6, 8, 10, 13, 14]);
const SCARF_COMPONENTS = new Set([12, 22, 29, 30, 31, 33, 34]);
const SKIN_COMPONENTS = new Set([
  9, 11, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 32,
]);

function colorRegion(component, x, y, z) {
  if (HAT_COMPONENTS.has(component)) {
    if (y < 1.69 && z > -0.02 && Math.abs(x) < 0.26) {
      return "skin";
    }
    return component === 3 ? "hatLight" : "hat";
  }
  if (TROUSER_COMPONENTS.has(component)) {
    return y < 0.08 && z > 0.02 ? "redDark" : "red";
  }
  if (SCARF_COMPONENTS.has(component)) {
    return component === 12 ? "redDark" : "red";
  }
  if (SKIN_COMPONENTS.has(component)) {
    return "skin";
  }
  if (component === 5) {
    return z < -0.015 ? "shirtShadow" : "shirt";
  }
  if (component === 7) {
    return y >= 1.2 ? "shirt" : "skin";
  }
  if (component === 0) {
    if (y >= 1.38) {
      return "red";
    }
    if (Math.abs(x) >= 0.18 && y < 1.2) {
      return "skin";
    }
    return y < 0.95 ? "skin" : "shirt";
  }
  return "shirt";
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
const colors = Buffer.alloc(positionAccessor.count * 4);
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

for (let index = 0; index < positionAccessor.count; index += 1) {
  const offset = positionStart + index * positionStride;
  const x = binary.readFloatLE(offset);
  const y = binary.readFloatLE(offset + 4);
  const z = binary.readFloatLE(offset + 8);
  const component = componentRanks[index] ?? 0;
  const region = colorRegion(component, x, y, z);
  const debugColor = hslToRgb(
    (component * 137.508) % 360,
    0.78,
    component % 2 === 0 ? 0.48 : 0.62,
  ).map(srgbToLinearByte);
  const color = debugComponents ? debugColor : linearPalette[region];
  colors[index * 4] = color[0];
  colors[index * 4 + 1] = color[1];
  colors[index * 4 + 2] = color[2];
  colors[index * 4 + 3] = 255;
  const countKey = debugComponents ? `component-${component}` : region;
  counts.set(countKey, (counts.get(countKey) ?? 0) + 1);
}

const colorOffset = binary.length + ((4 - (binary.length % 4)) % 4);
const extendedBinary = Buffer.concat([
  binary,
  Buffer.alloc(colorOffset - binary.length),
  colors,
]);

document.bufferViews.push({
  buffer: 0,
  byteLength: colors.length,
  byteOffset: colorOffset,
  target: 34962,
});
document.accessors.push({
  bufferView: document.bufferViews.length - 1,
  componentType: 5121,
  count: positionAccessor.count,
  normalized: true,
  type: "VEC4",
});
primitive.attributes.COLOR_0 = document.accessors.length - 1;
delete primitive.attributes.TEXCOORD_0;

document.materials[primitive.material] = {
  doubleSided: true,
  name: "Batang Pinoy attire colors",
  pbrMetallicRoughness: {
    baseColorFactor: [1, 1, 1, 1],
    metallicFactor: 0.02,
    roughnessFactor: 0.82,
  },
};
document.asset.generator = "Wikalino Batang Pinoy color baker";
document.buffers[0].byteLength = extendedBinary.length;
document.extras = {
  colorReference: "Batang Pinoy reference palette",
  palette,
};

writeGlb(outputPath, document, extendedBinary);
console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
console.log(Object.fromEntries([...counts.entries()].sort()));
