import type { ReactNode } from "react";

import { Colors } from "@/constants/colors";

import { ThreeCanvas } from "../ThreeCanvas";
import { RewardScene } from "../scenes/RewardScene";

type StoryRewardThreeProps = {
  active: boolean;
  fallback: ReactNode;
  onCoinPress: () => void;
};

export default function StoryRewardThree({
  active,
  fallback,
  onCoinPress,
}: StoryRewardThreeProps) {
  return (
    <ThreeCanvas
      active={active}
      backgroundColor={Colors.accentSoft}
      cameraPosition={[0, 0, 4.8]}
      fallback={fallback}
      maxPixelRatio={1.5}
      style={{ flex: 1, minHeight: 180 }}
    >
      <RewardScene onCoinPress={onCoinPress} />
    </ThreeCanvas>
  );
}
