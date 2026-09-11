import { FloatingStar } from "../objects/FloatingStar";
import { RewardCoin } from "../objects/RewardCoin";

type RewardSceneProps = {
  animate?: boolean;
  onCoinPress?: () => void;
};

export function RewardScene({
  animate = true,
  onCoinPress,
}: RewardSceneProps) {
  return (
    <group>
      <RewardCoin
        animate={animate}
        onPress={onCoinPress}
        position={[0, -0.08, 0]}
        scale={1.25}
      />
      <FloatingStar
        animate={animate}
        color="#FFE18B"
        floatDistance={0.1}
        floatSpeed={1.8}
        position={[-1.25, 0.8, -0.25]}
        scale={0.38}
      />
      <FloatingStar
        animate={animate}
        color="#F4C95D"
        floatDistance={0.14}
        floatSpeed={1.35}
        position={[1.3, -0.72, -0.2]}
        rotationSpeed={[0.05, 0.65, 0.08]}
        scale={0.3}
      />
    </group>
  );
}
