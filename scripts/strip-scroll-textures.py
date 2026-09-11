#!/usr/bin/env python3
"""Create a small, texture-free GLB from a single-mesh PixelLabs model.

The source model embeds three large PNG textures. Expo GL's React Native image
path cannot decode those GLB images reliably, and bundling them for every story
marker is wasteful. This script keeps only the position, normal, and index data,
then gives the mesh a parchment-colored material. A later glTF Transform pass
simplifies the remaining geometry.
"""

from __future__ import annotations

import argparse
import copy
import json
import math
import pathlib
import subprocess
import struct
import tempfile
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "assets" / "models" / "pixellabs-scroll-3468.glb"
DEFAULT_OUTPUT = pathlib.Path("/tmp/wikalino-scroll-untextured.glb")

JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942
GLB_MAGIC = 0x46546C67


def read_glb(path: pathlib.Path) -> tuple[dict[str, Any], bytes]:
    payload = path.read_bytes()
    magic, version, total_length = struct.unpack_from("<III", payload, 0)
    if magic != GLB_MAGIC or version != 2 or total_length != len(payload):
        raise ValueError(f"Invalid GLB: {path}")

    document: dict[str, Any] | None = None
    binary = b""
    offset = 12
    while offset < total_length:
        chunk_length, chunk_type = struct.unpack_from("<II", payload, offset)
        offset += 8
        chunk = payload[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == JSON_CHUNK:
            document = json.loads(chunk.rstrip(b" \0"))
        elif chunk_type == BIN_CHUNK:
            binary = chunk

    if document is None or not binary:
        raise ValueError(f"GLB is missing JSON or binary data: {path}")
    return document, binary


def align_four(payload: bytearray) -> None:
    payload.extend(b"\0" * ((-len(payload)) % 4))


def write_glb(path: pathlib.Path, document: dict[str, Any], binary: bytes) -> None:
    json_data = json.dumps(document, separators=(",", ":")).encode("utf-8")
    json_data += b" " * ((-len(json_data)) % 4)
    binary += b"\0" * ((-len(binary)) % 4)
    total_length = 12 + 8 + len(json_data) + 8 + len(binary)
    output = bytearray(struct.pack("<III", GLB_MAGIC, 2, total_length))
    output.extend(struct.pack("<II", len(json_data), JSON_CHUNK))
    output.extend(json_data)
    output.extend(struct.pack("<II", len(binary), BIN_CHUNK))
    output.extend(binary)
    path.write_bytes(output)


def texture_source_index(texture: dict[str, Any]) -> int:
    if "source" in texture:
        return texture["source"]
    webp_extension = texture.get("extensions", {}).get("EXT_texture_webp", {})
    if "source" in webp_extension:
        return webp_extension["source"]
    raise ValueError("Base-color texture has no supported image source")


def read_ppm(path: pathlib.Path) -> tuple[int, int, bytes]:
    with path.open("rb") as stream:
        if stream.readline().strip() != b"P6":
            raise ValueError("dwebp did not produce a binary RGB PPM")

        dimensions = stream.readline().strip()
        while dimensions.startswith(b"#") or not dimensions:
            dimensions = stream.readline().strip()
        width, height = map(int, dimensions.split())
        if stream.readline().strip() != b"255":
            raise ValueError("Unsupported PPM color depth")
        pixels = stream.read()
    if len(pixels) != width * height * 3:
        raise ValueError("Decoded PPM has an unexpected byte length")
    return width, height, pixels


def srgb_to_linear(value: int) -> float:
    channel = value / 255
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def decode_image_to_ppm(
    image_data: bytes,
    mime_type: str,
    temporary_dir: pathlib.Path,
) -> pathlib.Path:
    ppm_path = temporary_dir / "base-color.ppm"
    if mime_type == "image/webp":
        encoded_path = temporary_dir / "base-color.webp"
        encoded_path.write_bytes(image_data)
        subprocess.run(
            ["dwebp", "-quiet", "-ppm", str(encoded_path), "-o", str(ppm_path)],
            check=True,
        )
        return ppm_path

    if mime_type == "image/png":
        encoded_path = temporary_dir / "base-color.png"
        encoded_path.write_bytes(image_data)
        decoder = """
const fs = require('fs');
const { PNG } = require('pngjs');
const image = PNG.sync.read(fs.readFileSync(process.argv[1]));
const rgb = Buffer.alloc(image.width * image.height * 3);
for (let source = 0, target = 0; source < image.data.length; source += 4) {
  rgb[target++] = image.data[source];
  rgb[target++] = image.data[source + 1];
  rgb[target++] = image.data[source + 2];
}
const header = Buffer.from(`P6\\n${image.width} ${image.height}\\n255\\n`);
fs.writeFileSync(process.argv[2], Buffer.concat([header, rgb]));
"""
        subprocess.run(
            ["node", "-e", decoder, str(encoded_path), str(ppm_path)],
            check=True,
        )
        return ppm_path

    raise ValueError(f"Unsupported base-color image type: {mime_type}")


def bake_base_color_to_vertices(
    document: dict[str, Any],
    binary: bytes,
) -> tuple[dict[str, Any], bytes]:
    primitive = document["meshes"][0]["primitives"][0]
    uv_accessor = document["accessors"][primitive["attributes"]["TEXCOORD_0"]]
    if uv_accessor["componentType"] != 5126 or uv_accessor["type"] != "VEC2":
        raise ValueError("Expected floating-point VEC2 texture coordinates")

    material = document["materials"][primitive.get("material", 0)]
    pbr = material.get("pbrMetallicRoughness", {})
    texture_info = pbr.get("baseColorTexture")
    if not texture_info:
        raise ValueError("Model material has no base-color texture to bake")
    texture = document["textures"][texture_info["index"]]
    image = document["images"][texture_source_index(texture)]
    image_view = document["bufferViews"][image["bufferView"]]
    image_start = image_view.get("byteOffset", 0)
    image_data = binary[image_start : image_start + image_view["byteLength"]]

    with tempfile.TemporaryDirectory() as directory:
        temporary_dir = pathlib.Path(directory)
        ppm_path = decode_image_to_ppm(
            image_data,
            image.get("mimeType", ""),
            temporary_dir,
        )
        width, height, pixels = read_ppm(ppm_path)

    uv_view = document["bufferViews"][uv_accessor["bufferView"]]
    uv_start = uv_view.get("byteOffset", 0) + uv_accessor.get("byteOffset", 0)
    uv_stride = uv_view.get("byteStride", 8)
    base_factor = pbr.get("baseColorFactor", [1, 1, 1, 1])
    colors = bytearray()
    for vertex_index in range(uv_accessor["count"]):
        u, v = struct.unpack_from("<ff", binary, uv_start + vertex_index * uv_stride)
        u -= math.floor(u)
        v -= math.floor(v)
        x = min(width - 1, int(u * width))
        y = min(height - 1, int(v * height))
        pixel_offset = (y * width + x) * 3
        for channel_index in range(3):
            linear = srgb_to_linear(pixels[pixel_offset + channel_index])
            linear *= base_factor[channel_index]
            colors.append(round(max(0, min(1, linear)) * 255))

    output_binary = bytearray(binary)
    align_four(output_binary)
    color_offset = len(output_binary)
    output_binary.extend(colors)
    color_view_index = len(document["bufferViews"])
    document["bufferViews"].append({
        "buffer": 0,
        "byteLength": len(colors),
        "byteOffset": color_offset,
        "target": 34962,
    })
    color_accessor_index = len(document["accessors"])
    document["accessors"].append({
        "bufferView": color_view_index,
        "componentType": 5121,
        "count": uv_accessor["count"],
        "normalized": True,
        "type": "VEC3",
    })
    primitive["attributes"]["COLOR_0"] = color_accessor_index
    document["buffers"][0]["byteLength"] = len(output_binary)
    return document, bytes(output_binary)


def strip_model(
    document: dict[str, Any],
    binary: bytes,
    material_name: str,
    base_color: list[float],
) -> tuple[dict[str, Any], bytes]:
    meshes = document.get("meshes", [])
    if len(meshes) != 1 or len(meshes[0].get("primitives", [])) != 1:
        raise ValueError("Expected the PixelLabs model to contain one mesh primitive")

    result = copy.deepcopy(document)
    primitive = result["meshes"][0]["primitives"][0]
    primitive["attributes"] = {
        semantic: accessor
        for semantic, accessor in primitive["attributes"].items()
        if semantic in {"POSITION", "NORMAL", "COLOR_0"}
    }
    primitive["material"] = 0

    used_accessor_indices = list(primitive["attributes"].values()) + [primitive["indices"]]
    accessor_index_map = {
        old_index: new_index for new_index, old_index in enumerate(used_accessor_indices)
    }
    old_accessors = result["accessors"]
    result["accessors"] = [copy.deepcopy(old_accessors[index]) for index in used_accessor_indices]
    primitive["attributes"] = {
        semantic: accessor_index_map[index]
        for semantic, index in primitive["attributes"].items()
    }
    primitive["indices"] = accessor_index_map[primitive["indices"]]

    used_view_indices: list[int] = []
    for accessor in result["accessors"]:
        view_index = accessor.get("bufferView")
        if view_index is not None and view_index not in used_view_indices:
            used_view_indices.append(view_index)

    old_views = result["bufferViews"]
    view_index_map = {
        old_index: new_index for new_index, old_index in enumerate(used_view_indices)
    }
    output_binary = bytearray()
    new_views: list[dict[str, Any]] = []
    for old_index in used_view_indices:
        old_view = old_views[old_index]
        align_four(output_binary)
        start = old_view.get("byteOffset", 0)
        end = start + old_view["byteLength"]
        view = copy.deepcopy(old_view)
        view["buffer"] = 0
        view["byteOffset"] = len(output_binary)
        output_binary.extend(binary[start:end])
        new_views.append(view)

    for accessor in result["accessors"]:
        accessor["bufferView"] = view_index_map[accessor["bufferView"]]

    result["bufferViews"] = new_views
    result["buffers"] = [{"byteLength": len(output_binary)}]
    result["materials"] = [{
        "name": material_name,
        "doubleSided": True,
        "pbrMetallicRoughness": {
            "baseColorFactor": base_color,
            "metallicFactor": 0.0,
            "roughnessFactor": 0.84,
        },
    }]

    for key in (
        "images",
        "textures",
        "samplers",
        "extensionsUsed",
        "extensionsRequired",
    ):
        result.pop(key, None)

    result.setdefault("asset", {})["generator"] = "Wikalino mobile GLB optimizer"
    return result, bytes(output_binary)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--material-name", default="Wikalino Parchment")
    parser.add_argument("--bake-base-color", action="store_true")
    parser.add_argument(
        "--base-color",
        type=float,
        nargs=4,
        default=[0.92, 0.68, 0.30, 1.0],
        metavar=("R", "G", "B", "A"),
    )
    args = parser.parse_args()

    document, binary = read_glb(args.source)
    if args.bake_base_color:
        document, binary = bake_base_color_to_vertices(document, binary)
    stripped_document, stripped_binary = strip_model(
        document,
        binary,
        args.material_name,
        args.base_color,
    )
    write_glb(args.output, stripped_document, stripped_binary)
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
