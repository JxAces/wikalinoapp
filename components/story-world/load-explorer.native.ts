import { loadBundledGlb } from "./load-bundled-glb";
import {
  type AnimationClip,
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";

import type { PlayerCharacterId } from "@/data/player-characters";

export type ExplorerModel = {
  locomotionStyle: "hop" | "walk";
  scene: Group;
  standingPose: Object3D;
  walkingPose: Object3D;
  walkClip?: AnimationClip;
};

// Metro exposes bundled binary assets as numeric module identifiers.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const explorerAsset = require("../../assets/models/quaternius_cc0-male-character-1161.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const kangarooExplorerAsset = require("../../assets/models/wikalino-kangaroo-explorer.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const indigenousExplorerAsset = require("../../assets/models/wikalino-indigenous-explorer.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const muslimExplorerAsset = require("../../assets/models/wikalino-muslim-explorer.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const batangPinoyExplorerAsset = require("../../assets/models/wikalino-batang-pinoy-explorer.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const storyScrollAsset = require("../../assets/models/wikalino-story-scroll.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const treasureChestAsset = require("../../assets/models/wikalino-treasure-chest.glb");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tropicalHutAsset = require("../../assets/models/wikalino-tropical-hut.glb");

type CharacterPalette = {
  pants: number;
  shirt: number;
  shoes: number;
  skin: number;
};

const STUDENT_PALETTE: CharacterPalette = {
  pants: 0x171a20,
  shirt: 0xf4f5f1,
  shoes: 0x090a0c,
  skin: 0xb97850,
};

function uniformColor(materialName: string, palette: CharacterPalette) {
  const name = materialName.toLowerCase();
  if (name.startsWith("skin")) {
    return palette.skin;
  }
  if (name.startsWith("shirt")) {
    return palette.shirt;
  }
  if (name.startsWith("pants")) {
    return palette.pants;
  }
  if (name.startsWith("shoes")) {
    return palette.shoes;
  }
  return null;
}

function prepareCharacterMaterials(scene: Group, palette: CharacterPalette) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const preparedMaterials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone();
      if (material instanceof MeshStandardMaterial) {
        const color = uniformColor(material.name, palette);
        if (color !== null) {
          material.color.setHex(color);
        }
        material.alphaTest = 0;
        material.depthWrite = true;
        material.opacity = 1;
        material.transparent = false;
        material.needsUpdate = true;
      }
      return material;
    });
    object.material = Array.isArray(object.material)
      ? preparedMaterials
      : preparedMaterials[0];
  });
}

export async function loadExplorerModel(
  characterId: PlayerCharacterId,
): Promise<ExplorerModel> {
  if (characterId === "kangaroo") {
    return loadKangarooExplorer();
  }
  if (characterId === "indigenous") {
    return loadStaticExplorer(indigenousExplorerAsset, 2.25);
  }
  if (characterId === "muslim") {
    return loadStaticExplorer(muslimExplorerAsset, 2.25);
  }
  if (characterId === "batang-pinoy") {
    return loadStaticExplorer(batangPinoyExplorerAsset, 2.15);
  }

  const gltf = await loadBundledGlb(explorerAsset);
  const standingPose = gltf.scene.getObjectByName("Male_Standing");
  const walkingPose = gltf.scene.getObjectByName("Male_Walking");
  if (!standingPose || !walkingPose) {
    throw new Error("Walang standing o walking pose ang explorer model.");
  }

  for (const pose of [...gltf.scene.children]) {
    if (pose !== standingPose && pose !== walkingPose) {
      pose.removeFromParent();
    }
  }
  prepareCharacterMaterials(gltf.scene, STUDENT_PALETTE);
  standingPose.visible = true;
  walkingPose.visible = false;

  const bounds = new Box3().setFromObject(standingPose);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(bounds.getSize(new Vector3()).y, 0.001);
  const scale = 2.25 / height;
  gltf.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  gltf.scene.scale.setScalar(scale);

  return {
    locomotionStyle: "walk",
    scene: gltf.scene,
    standingPose,
    walkingPose,
  };
}

async function loadStaticExplorer(
  assetModule: number,
  targetHeight: number,
): Promise<ExplorerModel> {
  const gltf = await loadBundledGlb(assetModule);
  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const materials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone();
      if (material instanceof MeshStandardMaterial) {
        material.depthWrite = true;
        material.opacity = 1;
        material.roughness = 0.82;
        material.transparent = false;
        material.needsUpdate = true;
      }
      return material;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
  });

  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(bounds.getSize(new Vector3()).y, 0.001);
  const model = new Group();
  const standingPose = gltf.scene;
  const walkClip = gltf.animations.find(clip => clip.name === "Walk");
  if (walkClip) {
    // A rigged scene must keep its bones and mesh together. Cloning it as a
    // static pose would leave the copy bound to the original skeleton.
    standingPose.position.set(-center.x, -bounds.min.y, -center.z);
    model.add(standingPose);
    model.scale.setScalar(targetHeight / height);
    return { locomotionStyle: "walk", scene: model, standingPose, walkingPose: standingPose, walkClip };
  }
  const walkingPose = gltf.scene.clone(true);
  standingPose.position.set(-center.x, -bounds.min.y, -center.z);
  walkingPose.position.copy(standingPose.position);
  standingPose.visible = true;
  walkingPose.visible = false;
  model.add(standingPose, walkingPose);
  model.scale.setScalar(targetHeight / height);

  return {
    locomotionStyle: "walk",
    scene: model,
    standingPose,
    walkingPose,
  };
}

function prepareVertexColoredModel(scene: Group, roughness: number) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const preparedMaterials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone();
      if (material instanceof MeshStandardMaterial) {
        material.color.setHex(0xffffff);
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
        material.metalness = 0.02;
        material.roughness = roughness;
        material.vertexColors = true;
        material.needsUpdate = true;
      }
      return material;
    });
    object.material = Array.isArray(object.material)
      ? preparedMaterials
      : preparedMaterials[0];
  });
}

async function loadKangarooExplorer(): Promise<ExplorerModel> {
  const gltf = await loadBundledGlb(kangarooExplorerAsset);
  prepareVertexColoredModel(gltf.scene, 0.82);

  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(bounds.getSize(new Vector3()).y, 0.001);
  const model = new Group();
  const standingPose = gltf.scene;
  const walkingPose = gltf.scene.clone(true);
  standingPose.position.set(-center.x, -bounds.min.y, -center.z);
  walkingPose.position.copy(standingPose.position);
  standingPose.visible = true;
  walkingPose.visible = false;
  model.add(standingPose, walkingPose);
  model.scale.setScalar(2.05 / height);

  return {
    locomotionStyle: "hop",
    scene: model,
    standingPose,
    walkingPose,
  };
}

export async function loadStoryScrollModel(): Promise<Group> {
  const gltf = await loadBundledGlb(storyScrollAsset);
  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(bounds.getSize(new Vector3()).y, 0.001);
  const scale = 1.72 / height;
  gltf.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  gltf.scene.scale.setScalar(scale);
  return gltf.scene;
}

export async function loadTreasureChestModel(): Promise<Group> {
  const gltf = await loadBundledGlb(treasureChestAsset);
  prepareVertexColoredModel(gltf.scene, 0.72);

  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const width = Math.max(bounds.getSize(new Vector3()).x, 0.001);
  const scale = 2.05 / width;
  gltf.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  gltf.scene.scale.setScalar(scale);
  return gltf.scene;
}

export async function loadTropicalHutModel(): Promise<Group> {
  const gltf = await loadBundledGlb(tropicalHutAsset);
  prepareVertexColoredModel(gltf.scene, 0.9);

  const bounds = new Box3().setFromObject(gltf.scene);
  const center = bounds.getCenter(new Vector3());
  const height = Math.max(bounds.getSize(new Vector3()).y, 0.001);
  const scale = 3.1 / height;
  gltf.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  gltf.scene.scale.setScalar(scale);
  return gltf.scene;
}
