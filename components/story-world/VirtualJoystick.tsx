import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type VirtualJoystickProps = {
  disabled?: boolean;
  onMove: (x: number, y: number) => void;
};

const TRAVEL_RADIUS = 39;

export function VirtualJoystick({
  disabled = false,
  onMove,
}: VirtualJoystickProps) {
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(0)
        .runOnJS(true)
        .onBegin(() => {
          knobX.set(0);
          knobY.set(0);
          onMove(0, 0);
        })
        .onUpdate((event) => {
          const distance = Math.hypot(event.translationX, event.translationY);
          const scale = distance > TRAVEL_RADIUS ? TRAVEL_RADIUS / distance : 1;
          const x = event.translationX * scale;
          const y = event.translationY * scale;
          knobX.set(x);
          knobY.set(y);
          onMove(x / TRAVEL_RADIUS, -y / TRAVEL_RADIUS);
        })
        .onFinalize(() => {
          knobX.set(withSpring(0, { damping: 15, stiffness: 210 }));
          knobY.set(withSpring(0, { damping: 15, stiffness: 210 }));
          onMove(0, 0);
        }),
    [disabled, knobX, knobY, onMove],
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }, { translateY: knobY.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>GALAW</Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.base, disabled && styles.disabled]}>
          <View style={styles.crossHorizontal} />
          <View style={styles.crossVertical} />
          <Animated.View style={[styles.knob, knobStyle]}>
            <View style={styles.knobGlow} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    backgroundColor: "rgba(13, 13, 48, 0.72)",
    borderColor: "rgba(255, 220, 127, 0.38)",
    borderRadius: 62,
    borderWidth: 1,
    height: 124,
    justifyContent: "center",
    width: 124,
  },
  crossHorizontal: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 1,
    position: "absolute",
    width: 82,
  },
  crossVertical: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 82,
    position: "absolute",
    width: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  knob: {
    alignItems: "center",
    backgroundColor: "#F6CD62",
    borderColor: "#FFF2BF",
    borderRadius: 25,
    borderWidth: 2,
    height: 50,
    justifyContent: "center",
    shadowColor: "#F6CD62",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    width: 50,
  },
  knobGlow: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 8,
    height: 10,
    left: 9,
    position: "absolute",
    top: 8,
    width: 10,
  },
  label: {
    color: "rgba(255, 233, 172, 0.74)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
    textAlign: "center",
  },
  wrapper: {
    alignItems: "center",
  },
});
