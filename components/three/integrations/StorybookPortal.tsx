import { StyleSheet, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";

type Motion = { spin: SharedValue<number>; travel: SharedValue<number> };

/** Vector light layers stay crisp as the camera passes through the opening. */
export function StorybookPortal({ spin, travel }: Motion) {
  const clockwise = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const counterclockwise = useAnimatedStyle(() => ({
    opacity: 0.6 + Math.sin(spin.value * Math.PI * 4) * 0.15,
    transform: [{ rotate: `${-spin.value * 225}deg` }, { scale: 1 + travel.value * 0.08 }],
  }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 256 256">
        <Defs>
          <RadialGradient id="portal-halo">
            <Stop offset="0.57" stopColor="#43D7A4" stopOpacity="0" />
            <Stop offset="0.73" stopColor="#42E6AF" stopOpacity="0.65" />
            <Stop offset="0.87" stopColor="#CFFFCB" stopOpacity="0.21" />
            <Stop offset="1" stopColor="#73ECB9" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="portal-depth" cx="48%" cy="43%" r="58%">
            <Stop offset="0" stopColor="#C7E8AA" />
            <Stop offset="0.12" stopColor="#8BC8A0" />
            <Stop offset="0.28" stopColor="#23564D" />
            <Stop offset="0.53" stopColor="#061F29" />
            <Stop offset="0.8" stopColor="#103B3A" />
            <Stop offset="0.95" stopColor="#439C78" />
            <Stop offset="1" stopColor="#BAEAB0" />
          </RadialGradient>
          <RadialGradient id="portal-rim">
            <Stop offset="0.82" stopColor="#A6FFE0" stopOpacity="0" />
            <Stop offset="0.92" stopColor="#85F6D3" stopOpacity="0.25" />
            <Stop offset="0.96" stopColor="#FFF5C4" stopOpacity="1" />
            <Stop offset="1" stopColor="#DCFCCA" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="128" cy="128" r="127" fill="url(#portal-halo)" />
        <Circle cx="128" cy="128" r="93" fill="url(#portal-depth)" />
        <Circle cx="128" cy="128" r="99" fill="url(#portal-rim)" />
        <Circle cx="128" cy="128" r="93" fill="none" stroke="#FFF4C5" strokeWidth="1.3" />
        <Ellipse cx="122" cy="113" rx="26" ry="32" fill="none" stroke="#B9E8AD" strokeOpacity="0.19" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, counterclockwise]}>
        <Svg width="100%" height="100%" viewBox="0 0 256 256">
          <G fill="none" strokeLinecap="round">
            <Path d="M 42 134 C 23 60 167 24 201 93 C 232 163 126 213 84 166 C 47 124 123 72 147 107" stroke="#90FAD3" strokeOpacity="0.18" strokeWidth="10" />
            <Path d="M 46 139 C 41 72 166 35 197 96 C 224 155 127 201 89 164 C 57 130 124 80 147 107" stroke="#DBFFDA" strokeOpacity="0.38" strokeWidth="1.2" />
            <Path d="M 201 133 C 207 199 84 215 57 161 C 35 115 125 56 163 93 C 196 127 126 167 115 135" stroke="#6CE3C2" strokeOpacity="0.45" strokeWidth="2.5" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, clockwise]}>
        <Svg width="100%" height="100%" viewBox="0 0 256 256">
          <G fill="none" strokeLinecap="round">
            <Circle cx="128" cy="128" r="99" stroke="#55E9BD" strokeOpacity="0.3" strokeWidth="8" strokeDasharray="79 30 51 60" />
            <Circle cx="128" cy="128" r="97" stroke="#FFF4BE" strokeWidth="2" strokeDasharray="57 83 113 37" />
            <Circle cx="128" cy="128" r="103" stroke="#D2FFE4" strokeOpacity="0.7" strokeWidth="0.8" strokeDasharray="9 17 41 19" />
          </G>
          {Array.from({ length: 24 }, (_, i) => {
            const angle = i * 2.39996;
            const radius = 96 + (i % 4) * 5;
            const x = 128 + Math.cos(angle) * radius;
            const y = 128 + Math.sin(angle) * radius;
            return <G key={i}>
              <Circle cx={x} cy={y} r={i % 3 === 0 ? 3 : 1.6} fill="#A0FBCB" opacity="0.22" />
              <Circle cx={x} cy={y} r={i % 3 === 0 ? 1.3 : 0.65} fill="#FFF8D1" />
            </G>;
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

function TunnelRing({ index, travel, size }: { index: number; travel: SharedValue<number>; size: number }) {
  const ringStyle = useAnimatedStyle(() => {
    // Perspective: rings accelerate past the camera, rather than all enlarging together.
    const phase = (index / 4 + travel.value * 1.6) % 1;
    const scale = 0.06 / (1.08 - phase);
    return {
      opacity: interpolate(phase, [0, 0.15, 0.72, 1], [0, 0.25, 0.5, 0]),
      transform: [
        { translateX: Math.sin(index * 1.7 + travel.value * 3) * size * 0.018 },
        { translateY: Math.cos(index * 1.7 + travel.value * 3) * size * 0.018 },
        { scale: scale * 3 },
        { rotate: `${index * 31 + travel.value * 95}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.tunnelLayer, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, ringStyle]}>
    <View style={styles.tunnelRingOuter} />
    <View style={styles.tunnelRingInner} />
  </Animated.View>;
}

function FlyingSpark({ index, travel, size }: { index: number; travel: SharedValue<number>; size: number }) {
  const sparkStyle = useAnimatedStyle(() => {
    const phase = (index / 16 + travel.value * 1.35) % 1;
    const radius = size * 0.024 / (1.04 - phase);
    const angle = index * 2.39996 + travel.value * 0.22;
    return {
      opacity: interpolate(phase, [0, 0.18, 0.8, 1], [0, 0.7, 0.9, 0]),
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { rotate: `${angle}rad` },
        { scaleX: 1 + phase * phase * 22 },
      ],
    };
  });
  return <Animated.View style={[styles.flyingSpark, index % 3 === 0 && styles.goldSpark, sparkStyle]} />;
}

export function PortalPassage({ travel, width }: { travel: SharedValue<number>; width: number; height: number }) {
  const size = Math.min(width, 430);
  const passageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(travel.value, [0, 0.24, 0.43, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
  }));
  const exitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(travel.value, [0, 0.81, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.passage, passageStyle]}>
    <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 800">
      <Defs>
        <RadialGradient id="tunnel-air" cx="50%" cy="48%" rx="68%" ry="50%">
          <Stop offset="0" stopColor="#8ED3AC" />
          <Stop offset="0.06" stopColor="#346C5E" />
          <Stop offset="0.21" stopColor="#092D30" />
          <Stop offset="0.7" stopColor="#06191F" />
          <Stop offset="1" stopColor="#010D15" />
        </RadialGradient>
      </Defs>
      <Path d="M0 0H400V800H0Z" fill="url(#tunnel-air)" />
    </Svg>
    {Array.from({ length: 4 }, (_, index) => <TunnelRing key={index} index={index} travel={travel} size={size} />)}
    {Array.from({ length: 16 }, (_, index) => <FlyingSpark key={index} index={index} travel={travel} size={size} />)}
    <Animated.View style={[StyleSheet.absoluteFill, styles.exitLight, exitStyle]} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  passage: { zIndex: 80, overflow: "hidden" },
  tunnelLayer: { position: "absolute", left: "50%", top: "48%" },
  flyingSpark: { position: "absolute", left: "50%", top: "48%", width: 2, height: 1.2, borderRadius: 2, backgroundColor: "#B2FFE0" },
  goldSpark: { backgroundColor: "#FFE5A6" },
  exitLight: { backgroundColor: "#B9DFC5" },
  tunnelRingOuter: { ...StyleSheet.absoluteFill, borderRadius: 999, borderWidth: 5, borderColor: "rgba(82,230,181,0.17)" },
  tunnelRingInner: { position: "absolute", top: 5, bottom: 5, left: 5, right: 5, borderRadius: 999, borderWidth: 1, borderColor: "rgba(165,251,224,0.65)" },
});
