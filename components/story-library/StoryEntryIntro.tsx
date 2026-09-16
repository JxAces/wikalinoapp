import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { PortalPassage, StorybookPortal } from "@/components/three/integrations/StorybookPortal";
import { useThreePerformance } from "@/hooks/useThreePerformance";

/** Only the portal passage from launch, without the opening book.
 * Mounted on the story route so the map releases its GL scene before playback.
 */
export function StoryEntryIntro({ title, onComplete }: { title: string; onComplete: () => void }) {
  const { reduceMotion } = useThreePerformance();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.85, height * 0.55, 360);
  const travel = useSharedValue(0);
  const spin = useSharedValue(0);
  const completed = useRef(false);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);
  useEffect(() => {
    travel.value = 0;
    spin.value = 0;
    if (!reduceMotion) {
      spin.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.linear }), -1, false);
      travel.value = withTiming(1, { duration: 2900, easing: Easing.linear });
    }
    const timer = setTimeout(finish, reduceMotion ? 500 : 2980);
    return () => {
      clearTimeout(timer);
      cancelAnimation(travel);
      cancelAnimation(spin);
    };
  }, [finish, reduceMotion, spin, travel]);
  const portalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(travel.value, [0, 0.24, 0.43, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(travel.value, [0, 0.24, 0.43, 1], [1, 1.7, 3.5, 3.5], Extrapolation.CLAMP) }],
  }));

  return <View style={styles.root} accessible accessibilityLabel={`Papasok sa portal ng ${title}`}>
    <Animated.View pointerEvents="none" style={[styles.portal, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, portalStyle]}>
      <StorybookPortal spin={spin} travel={travel} />
    </Animated.View>
    {!reduceMotion && <PortalPassage travel={travel} width={width} height={height} />}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06191F", overflow: "hidden" },
  portal: { position: "absolute", left: "50%", top: "48%" },
});
