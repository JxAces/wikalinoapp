import { Asset } from "expo-asset";
import { useEffect, useMemo, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import type {
  ModelSource,
  ThreeObjectTransformProps,
} from "@/types/three.types";

import { useLoader } from "../runtime";

type ModelProps = ThreeObjectTransformProps & {
  source: ModelSource;
};

type LoadedModelProps = Omit<ModelProps, "source"> & {
  uri: string;
};

function LoadedModel({ position, rotation, scale = 1, uri }: LoadedModelProps) {
  const gltf = useLoader(GLTFLoader, uri);
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene]);

  return (
    <primitive
      dispose={null}
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

function BundledModel({
  position,
  rotation,
  scale,
  source,
}: ModelProps & { source: number }) {
  const [error, setError] = useState<Error | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void Asset.fromModule(source)
      .downloadAsync()
      .then((asset) => {
        if (mounted) {
          setUri(asset.localUri ?? asset.uri);
        }
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(
            reason instanceof Error
              ? reason
              : new Error("Unable to load the 3D model."),
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [source]);

  if (error) {
    throw error;
  }

  if (!uri) {
    return null;
  }

  return (
    <LoadedModel
      position={position}
      rotation={rotation}
      scale={scale}
      uri={uri}
    />
  );
}

export function Model({ source, ...transform }: ModelProps) {
  if (typeof source === "number") {
    return <BundledModel source={source} {...transform} />;
  }

  return <LoadedModel uri={source} {...transform} />;
}
