import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";

import type {
  ThreeObjectAnimationProps,
  ThreeObjectTransformProps,
} from "@/types/three.types";

import { FloatingAnimation } from "../effects/FloatingAnimation";
import { RotationAnimation } from "../effects/RotationAnimation";
import { useThreeMotion } from "../ThreeMotion";
import { useFrame } from "../runtime";

const COIN_GEOMETRY = [0.64, 0.64, 0.16, 24] as [
  number,
  number,
  number,
  number,
];
const RING_GEOMETRY = [0.4, 0.045, 8, 24] as [
  number,
  number,
  number,
  number,
];
const DEFAULT_ROTATION = [Math.PI / 2, 0, 0] as const;
const DEFAULT_ROTATION_SPEED = [0, 1.2, 0] as const;

type RewardCoinProps = ThreeObjectAnimationProps &
  ThreeObjectTransformProps & {
    color?: string;
    onPress?: () => void;
  };

export function RewardCoin({
  animate = true,
  color = "#F4C95D",
  floatDistance = 0.12,
  floatSpeed = 1.3,
  onPress,
  position,
  rotation = DEFAULT_ROTATION,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  scale = 1,
}: RewardCoinProps) {
  const interactionGroup = useRef<Group>(null);
  const tapTimeRemaining = useRef(0);
  const { animationsEnabled } = useThreeMotion();
  const baseScale = useMemo(
    () =>
      typeof scale === "number"
        ? [scale, scale, scale]
        : scale,
    [scale],
  );

  useFrame((_, delta) => {
    if (!interactionGroup.current) {
      return;
    }

    if (animationsEnabled) {
      tapTimeRemaining.current = Math.max(0, tapTimeRemaining.current - delta);
    } else {
      tapTimeRemaining.current = 0;
    }

    const pulse = tapTimeRemaining.current > 0 ? 1.24 : 1;
    const frameDelta = Math.min(delta, 0.1);
    const currentScale = interactionGroup.current.scale;

    currentScale.set(
      MathUtils.damp(currentScale.x, baseScale[0] * pulse, 16, frameDelta),
      MathUtils.damp(currentScale.y, baseScale[1] * pulse, 16, frameDelta),
      MathUtils.damp(currentScale.z, baseScale[2] * pulse, 16, frameDelta),
    );
  });

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
        <group
          onClick={(event) => {
            event.stopPropagation();
            tapTimeRemaining.current = animationsEnabled ? 0.18 : 0;
            onPress?.();
          }}
          ref={interactionGroup}
          scale={scale}
        >
          <mesh>
            <cylinderGeometry args={COIN_GEOMETRY} />
            <meshStandardMaterial
              color={color}
              metalness={0.52}
              roughness={0.32}
            />
          </mesh>

          <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={RING_GEOMETRY} />
            <meshStandardMaterial
              color="#FFF0A6"
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[0, 0.091, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 20]} />
            <meshStandardMaterial
              color="#D99B24"
              metalness={0.5}
              roughness={0.34}
            />
          </mesh>
        </group>
      </RotationAnimation>
    </FloatingAnimation>
  );
}
