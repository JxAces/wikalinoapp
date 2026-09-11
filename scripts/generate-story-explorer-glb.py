#!/usr/bin/env python3
"""Generate Wikalino's small, texture-free animated Filipino student GLB."""

from __future__ import annotations

import json
import math
import pathlib
import struct
from typing import Iterable


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "models" / "wikalino-explorer.glb"

buffer = bytearray()
buffer_views: list[dict[str, object]] = []
accessors: list[dict[str, object]] = []


def align_buffer() -> None:
    while len(buffer) % 4:
        buffer.append(0)


def add_accessor(
    values: Iterable[float | int],
    component_type: int,
    accessor_type: str,
    components: int,
    *,
    target: int | None = None,
    include_bounds: bool = False,
) -> int:
    align_buffer()
    offset = len(buffer)
    packed_values = list(values)
    if component_type == 5126:
        payload = struct.pack(f"<{len(packed_values)}f", *packed_values)
    elif component_type == 5123:
        payload = struct.pack(f"<{len(packed_values)}H", *packed_values)
    else:
        raise ValueError(f"Unsupported component type: {component_type}")
    buffer.extend(payload)

    view: dict[str, object] = {
        "buffer": 0,
        "byteOffset": offset,
        "byteLength": len(payload),
    }
    if target is not None:
        view["target"] = target
    buffer_views.append(view)

    count = len(packed_values) // components
    accessor: dict[str, object] = {
        "bufferView": len(buffer_views) - 1,
        "componentType": component_type,
        "count": count,
        "type": accessor_type,
    }
    if include_bounds and count:
        rows = [packed_values[i : i + components] for i in range(0, len(packed_values), components)]
        accessor["min"] = [min(row[i] for row in rows) for i in range(components)]
        accessor["max"] = [max(row[i] for row in rows) for i in range(components)]
    accessors.append(accessor)
    return len(accessors) - 1


def box_geometry() -> tuple[list[float], list[float], list[int]]:
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []
    faces = [
        ((0, 0, 1), [(-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]),
        ((0, 0, -1), [(1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1)]),
        ((1, 0, 0), [(1, -1, 1), (1, -1, -1), (1, 1, -1), (1, 1, 1)]),
        ((-1, 0, 0), [(-1, -1, -1), (-1, -1, 1), (-1, 1, 1), (-1, 1, -1)]),
        ((0, 1, 0), [(-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1)]),
        ((0, -1, 0), [(-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1)]),
    ]
    for normal, corners in faces:
        base = len(positions) // 3
        for corner in corners:
            positions.extend(value * 0.5 for value in corner)
            normals.extend(normal)
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return positions, normals, indices


def sphere_geometry(segments: int = 18, rings: int = 12) -> tuple[list[float], list[float], list[int]]:
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []
    for ring in range(rings + 1):
        phi = math.pi * ring / rings
        for segment in range(segments + 1):
            theta = math.tau * segment / segments
            x = math.sin(phi) * math.cos(theta)
            y = math.cos(phi)
            z = math.sin(phi) * math.sin(theta)
            positions.extend([x * 0.5, y * 0.5, z * 0.5])
            normals.extend([x, y, z])
    stride = segments + 1
    for ring in range(rings):
        for segment in range(segments):
            a = ring * stride + segment
            b = a + stride
            indices.extend([a, b, a + 1, b, b + 1, a + 1])
    return positions, normals, indices


def quaternion_x(angle: float) -> list[float]:
    return [math.sin(angle / 2), 0.0, 0.0, math.cos(angle / 2)]


def quaternion_y(angle: float) -> list[float]:
    return [0.0, math.sin(angle / 2), 0.0, math.cos(angle / 2)]


def quaternion_z(angle: float) -> list[float]:
    return [0.0, 0.0, math.sin(angle / 2), math.cos(angle / 2)]


materials = [
    {"name": "Puting Uniporme", "pbrMetallicRoughness": {"baseColorFactor": [0.94, 0.96, 0.98, 1], "roughnessFactor": 0.86, "metallicFactor": 0}},
    {"name": "Anino ng Uniporme", "pbrMetallicRoughness": {"baseColorFactor": [0.70, 0.77, 0.83, 1], "roughnessFactor": 0.88, "metallicFactor": 0}},
    {"name": "Balat", "pbrMetallicRoughness": {"baseColorFactor": [0.69, 0.38, 0.20, 1], "roughnessFactor": 0.92, "metallicFactor": 0}},
    {"name": "Buhok at Sapatos", "pbrMetallicRoughness": {"baseColorFactor": [0.018, 0.022, 0.030, 1], "roughnessFactor": 0.76, "metallicFactor": 0}},
    {"name": "Sagisag", "pbrMetallicRoughness": {"baseColorFactor": [0.96, 0.68, 0.16, 1], "roughnessFactor": 0.62, "metallicFactor": 0.06}},
    {"name": "Itim na Pantalon", "pbrMetallicRoughness": {"baseColorFactor": [0.035, 0.045, 0.065, 1], "roughnessFactor": 0.86, "metallicFactor": 0}},
    {"name": "Asul ng Paaralan", "pbrMetallicRoughness": {"baseColorFactor": [0.055, 0.17, 0.34, 1], "roughnessFactor": 0.80, "metallicFactor": 0}},
    {"name": "Ngiti", "pbrMetallicRoughness": {"baseColorFactor": [0.30, 0.075, 0.055, 1], "roughnessFactor": 0.90, "metallicFactor": 0}},
]

box_positions, box_normals, box_indices = box_geometry()
sphere_positions, sphere_normals, sphere_indices = sphere_geometry()

box_position_accessor = add_accessor(box_positions, 5126, "VEC3", 3, target=34962, include_bounds=True)
box_normal_accessor = add_accessor(box_normals, 5126, "VEC3", 3, target=34962)
box_index_accessor = add_accessor(box_indices, 5123, "SCALAR", 1, target=34963)
sphere_position_accessor = add_accessor(sphere_positions, 5126, "VEC3", 3, target=34962, include_bounds=True)
sphere_normal_accessor = add_accessor(sphere_normals, 5126, "VEC3", 3, target=34962)
sphere_index_accessor = add_accessor(sphere_indices, 5123, "SCALAR", 1, target=34963)

meshes: list[dict[str, object]] = []


def mesh_for(material: int, sphere: bool = False) -> int:
    primitive = {
        "attributes": {
            "POSITION": sphere_position_accessor if sphere else box_position_accessor,
            "NORMAL": sphere_normal_accessor if sphere else box_normal_accessor,
        },
        "indices": sphere_index_accessor if sphere else box_index_accessor,
        "material": material,
    }
    meshes.append({"primitives": [primitive]})
    return len(meshes) - 1


box_meshes = [mesh_for(index) for index in range(len(materials))]
sphere_meshes = [mesh_for(index, sphere=True) for index in range(len(materials))]

nodes: list[dict[str, object]] = []


def add_node(
    name: str,
    *,
    mesh: int | None = None,
    translation: list[float] | None = None,
    scale: list[float] | None = None,
    rotation: list[float] | None = None,
    children: list[int] | None = None,
) -> int:
    node: dict[str, object] = {"name": name}
    if mesh is not None:
        node["mesh"] = mesh
    if translation is not None:
        node["translation"] = translation
    if scale is not None:
        node["scale"] = scale
    if rotation is not None:
        node["rotation"] = rotation
    if children:
        node["children"] = children
    nodes.append(node)
    return len(nodes) - 1


root = add_node("CharacterRoot")
torso = add_node("WhiteUniformShirt", mesh=sphere_meshes[0], translation=[0, 1.83, 0], scale=[1.14, 1.25, 0.66])
left_collar = add_node("LeftCollar", mesh=box_meshes[1], translation=[-0.20, 2.34, 0.31], scale=[0.34, 0.22, 0.065], rotation=quaternion_z(-0.38))
right_collar = add_node("RightCollar", mesh=box_meshes[1], translation=[0.20, 2.34, 0.31], scale=[0.34, 0.22, 0.065], rotation=quaternion_z(0.38))
tie_knot = add_node("TieKnot", mesh=box_meshes[6], translation=[0, 2.23, 0.36], scale=[0.14, 0.14, 0.07], rotation=quaternion_z(math.pi / 4))
tie = add_node("SchoolTie", mesh=box_meshes[6], translation=[0, 2.03, 0.35], scale=[0.12, 0.34, 0.06])
pocket = add_node("ShirtPocket", mesh=box_meshes[1], translation=[0.33, 1.94, 0.32], scale=[0.27, 0.27, 0.045])
badge = add_node("SchoolBadge", mesh=sphere_meshes[4], translation=[0.33, 2.01, 0.36], scale=[0.10, 0.10, 0.055])
neck = add_node("Neck", mesh=box_meshes[2], translation=[0, 2.48, 0], scale=[0.31, 0.24, 0.31])

head = add_node("Head", mesh=sphere_meshes[2], translation=[0, 2.84, 0], scale=[1.00, 1.08, 0.96])
left_ear = add_node("LeftEar", mesh=sphere_meshes[2], translation=[-0.51, 2.84, 0], scale=[0.15, 0.23, 0.16])
right_ear = add_node("RightEar", mesh=sphere_meshes[2], translation=[0.51, 2.84, 0], scale=[0.15, 0.23, 0.16])
hair = add_node("Hair", mesh=sphere_meshes[3], translation=[0, 3.18, -0.03], scale=[1.06, 0.38, 1.01])
left_side_hair = add_node("LeftSideHair", mesh=sphere_meshes[3], translation=[-0.40, 3.03, -0.07], scale=[0.25, 0.43, 0.58])
right_side_hair = add_node("RightSideHair", mesh=sphere_meshes[3], translation=[0.40, 3.03, -0.07], scale=[0.25, 0.43, 0.58])
left_eye = add_node("LeftEye", mesh=sphere_meshes[3], translation=[-0.18, 2.88, 0.47], scale=[0.095, 0.12, 0.065])
right_eye = add_node("RightEye", mesh=sphere_meshes[3], translation=[0.18, 2.88, 0.47], scale=[0.095, 0.12, 0.065])
left_brow = add_node("LeftEyebrow", mesh=box_meshes[3], translation=[-0.18, 3.01, 0.47], scale=[0.22, 0.045, 0.045], rotation=quaternion_z(-0.08))
right_brow = add_node("RightEyebrow", mesh=box_meshes[3], translation=[0.18, 3.01, 0.47], scale=[0.22, 0.045, 0.045], rotation=quaternion_z(0.08))
nose = add_node("Nose", mesh=sphere_meshes[2], translation=[0, 2.78, 0.50], scale=[0.11, 0.13, 0.10])
mouth = add_node("Mouth", mesh=box_meshes[7], translation=[0, 2.62, 0.48], scale=[0.22, 0.045, 0.05])

backpack = add_node("SchoolBackpack", mesh=sphere_meshes[6], translation=[0, 1.82, -0.38], scale=[0.92, 1.04, 0.42])


def arm(prefix: str, x: float) -> int:
    sleeve = add_node(
        f"{prefix}Sleeve",
        mesh=sphere_meshes[0],
        translation=[0, -0.23, 0],
        scale=[0.42, 0.54, 0.43],
    )
    forearm = add_node(
        f"{prefix}Forearm",
        mesh=sphere_meshes[2],
        translation=[0, -0.72, 0],
        scale=[0.29, 0.58, 0.31],
    )
    hand = add_node(
        f"{prefix}Hand",
        mesh=sphere_meshes[2],
        translation=[0, -1.03, 0],
        scale=[0.30, 0.30, 0.30],
    )
    return add_node(f"{prefix}Pivot", translation=[x, 2.25, 0], children=[sleeve, forearm, hand])


def leg(prefix: str, x: float) -> int:
    trouser_leg = add_node(
        f"{prefix}Trouser",
        mesh=sphere_meshes[5],
        translation=[0, -0.52, 0],
        scale=[0.43, 1.11, 0.46],
    )
    shoe = add_node(
        f"{prefix}Shoe",
        mesh=sphere_meshes[3],
        translation=[0, -1.09, 0.18],
        scale=[0.48, 0.27, 0.78],
    )
    return add_node(f"{prefix}Pivot", translation=[x, 1.22, 0], children=[trouser_leg, shoe])


left_arm = arm("LeftArm", -0.68)
right_arm = arm("RightArm", 0.68)
left_leg = leg("LeftLeg", -0.29)
right_leg = leg("RightLeg", 0.29)
nodes[root]["children"] = [
    backpack,
    torso,
    left_collar,
    right_collar,
    tie_knot,
    tie,
    pocket,
    badge,
    neck,
    head,
    left_ear,
    right_ear,
    hair,
    left_side_hair,
    right_side_hair,
    left_eye,
    right_eye,
    left_brow,
    right_brow,
    nose,
    mouth,
    left_arm,
    right_arm,
    left_leg,
    right_leg,
]

animations: list[dict[str, object]] = []


def add_animation(name: str, duration: float, tracks: list[tuple[int, str, list[list[float]]]]) -> None:
    times = [duration * index / (len(tracks[0][2]) - 1) for index in range(len(tracks[0][2]))]
    time_accessor = add_accessor(times, 5126, "SCALAR", 1, include_bounds=True)
    samplers: list[dict[str, object]] = []
    channels: list[dict[str, object]] = []
    for node_index, path, values in tracks:
        components = 4 if path == "rotation" else 3
        output_accessor = add_accessor(
            [number for value in values for number in value],
            5126,
            "VEC4" if components == 4 else "VEC3",
            components,
        )
        samplers.append({"input": time_accessor, "output": output_accessor, "interpolation": "LINEAR"})
        channels.append({"sampler": len(samplers) - 1, "target": {"node": node_index, "path": path}})
    animations.append({"name": name, "samplers": samplers, "channels": channels})


add_animation(
    "Idle",
    2.0,
    [
        (root, "translation", [[0, 0, 0], [0, 0.035, 0], [0, 0, 0], [0, -0.025, 0], [0, 0, 0]]),
        (head, "rotation", [quaternion_y(value) for value in [0, 0.08, 0, -0.08, 0]]),
        (left_arm, "rotation", [quaternion_x(value) for value in [0.04, 0.10, 0.04, -0.03, 0.04]]),
        (right_arm, "rotation", [quaternion_x(value) for value in [-0.04, -0.10, -0.04, 0.03, -0.04]]),
    ],
)

walk_angles = [0, 0.62, 0, -0.62, 0]
add_animation(
    "Walk",
    0.92,
    [
        (root, "translation", [[0, 0, 0], [0, 0.08, 0], [0, 0, 0], [0, 0.08, 0], [0, 0, 0]]),
        (left_arm, "rotation", [quaternion_x(-value) for value in walk_angles]),
        (right_arm, "rotation", [quaternion_x(value) for value in walk_angles]),
        (left_leg, "rotation", [quaternion_x(value) for value in walk_angles]),
        (right_leg, "rotation", [quaternion_x(-value) for value in walk_angles]),
    ],
)

run_angles = [0, 0.92, 0, -0.92, 0]
add_animation(
    "Run",
    0.62,
    [
        (root, "translation", [[0, 0, 0], [0, 0.16, 0], [0, 0, 0], [0, 0.16, 0], [0, 0, 0]]),
        (left_arm, "rotation", [quaternion_x(-value) for value in run_angles]),
        (right_arm, "rotation", [quaternion_x(value) for value in run_angles]),
        (left_leg, "rotation", [quaternion_x(value) for value in run_angles]),
        (right_leg, "rotation", [quaternion_x(-value) for value in run_angles]),
    ],
)

align_buffer()
document = {
    "asset": {"version": "2.0", "generator": "Wikalino Filipino Student GLB Generator"},
    "scene": 0,
    "scenes": [{"name": "Wikalino Filipino Student", "nodes": [root]}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "animations": animations,
    "buffers": [{"byteLength": len(buffer)}],
    "bufferViews": buffer_views,
    "accessors": accessors,
}

json_chunk = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
while len(json_chunk) % 4:
    json_chunk += b" "
binary_chunk = bytes(buffer)
while len(binary_chunk) % 4:
    binary_chunk += b"\x00"

total_length = 12 + 8 + len(json_chunk) + 8 + len(binary_chunk)
glb = bytearray(struct.pack("<III", 0x46546C67, 2, total_length))
glb.extend(struct.pack("<II", len(json_chunk), 0x4E4F534A))
glb.extend(json_chunk)
glb.extend(struct.pack("<II", len(binary_chunk), 0x004E4942))
glb.extend(binary_chunk)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_bytes(glb)
print(f"Generated {OUTPUT} ({len(glb)} bytes)")
