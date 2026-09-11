import type { ThreeVector3 } from "@/types/three.types";

import { FloatingBook } from "../objects/FloatingBook";
import { FloatingStar } from "../objects/FloatingStar";

type StorySceneProps = {
  animate?: boolean;
  accentColor?: string;
  bookColor?: string;
};

export function StoryScene({
  accentColor = "#F4C95D",
  animate = true,
  bookColor = "#6E4CCF",
}: StorySceneProps) {
  const bookPosition: ThreeVector3 = [-0.65, -0.05, 0];
  const starPosition: ThreeVector3 = [1.15, 0.72, 0.15];

  return (
    <group>
      <FloatingBook
        animate={animate}
        coverColor={bookColor}
        position={bookPosition}
        scale={0.9}
      />
      <FloatingStar
        animate={animate}
        color={accentColor}
        floatSpeed={1.6}
        position={starPosition}
        scale={0.62}
      />
    </group>
  );
}
