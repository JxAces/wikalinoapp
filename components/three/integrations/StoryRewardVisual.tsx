import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useIsFocused } from "expo-router";
import { lazy, Suspense } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";

import { ThreeErrorBoundary } from "../ThreeErrorBoundary";

const StoryRewardThree = lazy(() => import("./StoryRewardThree"));

function RewardFallback() {
  return (
    <View style={styles.fallback}>
      <MaterialCommunityIcons
        name="trophy"
        size={54}
        color={Colors.primary}
      />
    </View>
  );
}

export function StoryRewardVisual() {
  const isFocused = useIsFocused();

  const handleCoinPress = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  };

  return (
    <View
      accessible
      accessibilityLabel="Gantimpalang barya. Pindutin para paikutin."
      style={styles.frame}
    >
      <ThreeErrorBoundary fallback={<RewardFallback />}>
        <Suspense fallback={<RewardFallback />}>
          <StoryRewardThree
            active={isFocused}
            fallback={<RewardFallback />}
            onCoinPress={handleCoinPress}
          />
        </Suspense>
      </ThreeErrorBoundary>

      <View pointerEvents="none" style={styles.hint}>
        <MaterialCommunityIcons
          name="gesture-tap"
          size={13}
          color={Colors.primary}
        />
        <Text style={styles.hintText}>Pindutin ang barya</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    backgroundColor: Colors.accent,
    flex: 1,
    justifyContent: "center",
    minHeight: 180,
  },
  frame: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
    borderRadius: 34,
    borderWidth: 2,
    height: 180,
    overflow: "hidden",
    width: 210,
  },
  hint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    bottom: 9,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
  },
  hintText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },
});
