import { useMemo } from "react";
import { Shape } from "three";
import type { ExtrudeGeometryOptions } from "three";

import type {
  ThreeObjectAnimationProps,
  ThreeObjectTransformProps,
} from "@/types/three.types";

import { FloatingAnimation } from "../effects/FloatingAnimation";
import { RotationAnimation } from "../effects/RotationAnimation";

const DEFAULT_ROTATION_SPEED = [0.1, 0.5, 0.08] as const;
const STAR_EXTRUSION: ExtrudeGeometryOptions = {
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.045,
  bevelThickness: 0.045,
  curveSegments: 1,
  depth: 0.13,
  steps: 1,
};

function createStarShape() {
  const shape = new Shape();
  const points = 10;

  for (let index = 0; index < points; index += 1) {
    const radius = index % 2 === 0 ? 0.62 : 0.27;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

type FloatingStarProps = ThreeObjectAnimationProps &
  ThreeObjectTransformProps & {
    color?: string;
  };

export function FloatingStar({
  animate = true,
  color = "#F4C95D",
  floatDistance = 0.18,
  floatSpeed = 1.4,
  position,
  rotation,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  scale = 1,
}: FloatingStarProps) {
  const shape = useMemo(() => createStarShape(), []);

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
        <mesh scale={scale}>
          <extrudeGeometry args={[shape, STAR_EXTRUSION]} />
          <meshStandardMaterial
            color={color}
            emissive="#8A6420"
            emissiveIntensity={0.14}
            metalness={0.12}
            roughness={0.5}
          />
        </mesh>
      </RotationAnimation>
    </FloatingAnimation>
  );
}
