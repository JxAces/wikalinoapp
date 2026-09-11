import type {
  ThreeObjectAnimationProps,
  ThreeObjectTransformProps,
} from "@/types/three.types";

import { FloatingAnimation } from "../effects/FloatingAnimation";
import { RotationAnimation } from "../effects/RotationAnimation";

const COVER_GEOMETRY = [1.35, 1.7, 0.1] as [number, number, number];
const PAGE_GEOMETRY = [1.24, 1.58, 0.18] as [number, number, number];
const SPINE_GEOMETRY = [0.12, 1.72, 0.28] as [number, number, number];
const DEFAULT_ROTATION = [-0.12, 0.3, -0.08] as const;
const DEFAULT_ROTATION_SPEED = [0.08, 0.22, 0.04] as const;

type FloatingBookProps = ThreeObjectAnimationProps &
  ThreeObjectTransformProps & {
    coverColor?: string;
    pageColor?: string;
  };

export function FloatingBook({
  animate = true,
  coverColor = "#6E4CCF",
  floatDistance = 0.14,
  floatSpeed = 1.15,
  pageColor = "#FFF7DC",
  position,
  rotation = DEFAULT_ROTATION,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  scale = 1,
}: FloatingBookProps) {
  return (
    <FloatingAnimation
      distance={floatDistance}
      enabled={animate}
      position={position}
      speed={floatSpeed}
    >
      <RotationAnimation
        enabled={animate}
        initialRotation={rotation}
        speed={rotationSpeed}
      >
        <group scale={scale}>
          <mesh position={[0, 0, -0.13]}>
            <boxGeometry args={COVER_GEOMETRY} />
            <meshStandardMaterial color={coverColor} roughness={0.72} />
          </mesh>

          <mesh>
            <boxGeometry args={PAGE_GEOMETRY} />
            <meshStandardMaterial color={pageColor} roughness={0.9} />
          </mesh>

          <mesh position={[0, 0, 0.13]}>
            <boxGeometry args={COVER_GEOMETRY} />
            <meshStandardMaterial color={coverColor} roughness={0.7} />
          </mesh>

          <mesh position={[-0.68, 0, 0]}>
            <boxGeometry args={SPINE_GEOMETRY} />
            <meshStandardMaterial color="#51339D" roughness={0.78} />
          </mesh>

          <mesh position={[0, 0.22, 0.19]}>
            <planeGeometry args={[0.78, 0.08]} />
            <meshBasicMaterial color="#F4C95D" />
          </mesh>
        </group>
      </RotationAnimation>
    </FloatingAnimation>
  );
}
