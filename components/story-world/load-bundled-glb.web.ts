import { Asset } from "expo-asset";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function loadBundledGlb(assetModule: number) {
  const asset = Asset.fromModule(assetModule);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`Hindi ma-load ang 3D model (${response.status}).`);
  return new GLTFLoader().parseAsync(await response.arrayBuffer(), new URL(".", new URL(asset.uri, window.location.href)).href);
}
