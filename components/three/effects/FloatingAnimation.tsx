import { ReactNode, useEffect, useRef } from "react";
import type { Group } from "three";

import type { ThreeVector3 } from "@/types/three.types";

import { useThreeMotion } from "../ThreeMotion";
import { useFrame } from "../runtime";

const ORIGIN = [0, 0, 0] as const;

type FloatingAnimationProps = {
  children: ReactNode;
  distance?: number;
  enabled?: boolean;
  phase?: number;
  position?: ThreeVector3;
  speed?: number;
};

export function FloatingAnimation({
  children,
  distance = 0.16,
  enabled = true,
  phase = 0,
  position = ORIGIN,
  speed = 1.2,
}: FloatingAnimationProps) {
  const groupRef = useRef<Group>(null);
  const elapsed = useRef(phase);
  const { animationsEnabled } = useThreeMotion();
  const shouldAnimate = enabled && animationsEnabled;

  useEffect(() => {
    if (!shouldAnimate && groupRef.current) {
      groupRef.current.position.y = position[1];
    }
  }, [position, shouldAnimate]);

  useFrame((_, delta) => {
    if (!shouldAnimate || !groupRef.current) {
      return;
    }

    elapsed.current += Math.min(delta, 0.1) * speed;
    groupRef.current.position.y =
      position[1] + Math.sin(elapsed.current) * distance;
  });

  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  );
}
