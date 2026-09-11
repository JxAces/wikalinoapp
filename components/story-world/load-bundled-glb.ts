import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function loadBundledGlb(assetModule: number) {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) throw new Error("Hindi mahanap ang bundled 3D model.");
  const runtimeNavigator = globalThis.navigator as Navigator & { userAgent?: string };
  if (typeof runtimeNavigator.userAgent !== "string") {
    Object.defineProperty(runtimeNavigator, "userAgent", { configurable: true, value: "React Native" });
  }
  return new GLTFLoader().parseAsync(await new File(uri).arrayBuffer(), "");
}
