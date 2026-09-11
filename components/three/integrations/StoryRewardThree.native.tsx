import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

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
    <Pressable
      accessibilityRole="button"
      disabled={!active}
      onPress={onCoinPress}
      style={styles.container}
    >
      {fallback}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
  },
});
