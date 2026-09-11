import { ReactNode, useEffect, useRef } from "react";
import type { Group } from "three";

import type { ThreeVector3 } from "@/types/three.types";

import { useThreeMotion } from "../ThreeMotion";
import { useFrame } from "../runtime";

const NO_ROTATION = [0, 0, 0] as const;
const DEFAULT_ROTATION_SPEED = [0, 0.35, 0] as const;

type RotationAnimationProps = {
  children: ReactNode;
  enabled?: boolean;
  initialRotation?: ThreeVector3;
  speed?: ThreeVector3;
};

export function RotationAnimation({
  children,
  enabled = true,
  initialRotation = NO_ROTATION,
  speed = DEFAULT_ROTATION_SPEED,
}: RotationAnimationProps) {
  const groupRef = useRef<Group>(null);
  const { animationsEnabled } = useThreeMotion();
  const shouldAnimate = enabled && animationsEnabled;

  useEffect(() => {
    if (!shouldAnimate && groupRef.current) {
      groupRef.current.rotation.set(...initialRotation);
    }
  }, [initialRotation, shouldAnimate]);

  useFrame((_, delta) => {
    if (!shouldAnimate || !groupRef.current) {
      return;
    }

    const frameDelta = Math.min(delta, 0.1);

    groupRef.current.rotation.x += frameDelta * speed[0];
    groupRef.current.rotation.y += frameDelta * speed[1];
    groupRef.current.rotation.z += frameDelta * speed[2];
  });

  return (
    <group ref={groupRef} rotation={initialRotation}>
      {children}
    </group>
  );
}
