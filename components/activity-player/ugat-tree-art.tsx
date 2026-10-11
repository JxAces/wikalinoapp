import { Animated, StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from "react-native-svg";

const ROOTS = [
  "M120 269 C186 221 225 221 263 206 Q256 171 243 139 Q204 119 173 86",
  "M240 269 Q256 236 263 206 Q257 169 261 122 Q278 81 307 48",
  "M360 269 C338 233 310 227 266 206 Q271 174 281 146 Q315 119 340 75",
];
const CROWNS = [
  { box: [109, 36, 136, 91], shadow: [[174, 84, 44, 28], [210, 101, 31, 22]], leaves: [[140, 80, 27, 17], [174, 58, 30, 20], [197, 83, 28, 20]], light: [[151, 65, 14, 7], [191, 63, 14, 7]] },
  { box: [213, 7, 140, 88], shadow: [[269, 61, 38, 24], [312, 65, 38, 26]], leaves: [[245, 45, 29, 19], [284, 31, 35, 22], [320, 41, 28, 20]], light: [[267, 30, 15, 7], [303, 31, 15, 7]] },
  { box: [294, 38, 122, 89], shadow: [[331, 101, 36, 23], [368, 87, 38, 28]], leaves: [[329, 74, 29, 20], [365, 60, 28, 19], [391, 81, 22, 17]], light: [[346, 63, 14, 7], [381, 68, 14, 7]] },
];

/** All scenery is vector art; only three small crowns and the root light animate. */
export function UgatTreeArt({ grown, current, growth }: { grown: boolean[]; current: number; growth: Animated.Value }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%" viewBox="0 0 480 300" preserveAspectRatio="none">
      <Defs><LinearGradient id="ugatTreeBark" x1="0" x2="1"><Stop offset="0" stopColor="#B28B59" /><Stop offset="1" stopColor="#735738" /></LinearGradient></Defs>
      <Ellipse cx="268" cy="232" rx="105" ry="17" fill="#395A32" opacity={.22} />
      <Path d="M-20 268 Q70 229 158 244 T495 247" fill="none" stroke="#A68B5B" strokeWidth={32} />
      <Path d="M-20 266 Q70 227 158 242 T495 245" fill="none" stroke="#D7BC87" strokeWidth={23} />
      <G fill="none" stroke="#735738" strokeWidth={8} strokeLinecap="round">
        <Path d="M263 206 C225 221 186 221 120 269 M263 206 Q256 236 240 269 M266 206 C310 227 338 233 360 269" />
        <Path d="M229 222 Q202 237 197 255 M298 222 Q315 241 328 249" strokeWidth={3} />
      </G>
      <Path d="M244 218 C253 188 250 157 243 139 C222 129 192 111 169 89 L177 82 C204 104 227 111 244 116 C232 91 218 76 200 62 L210 57 C235 75 250 101 261 122 C271 94 281 68 302 45 L311 52 C294 76 282 101 278 125 C299 114 324 91 336 71 L345 78 C328 109 306 128 281 146 C274 174 278 196 291 218 Q269 230 244 218Z" fill="url(#ugatTreeBark)" stroke="#735738" strokeWidth={2} />
      <Path d="M267 209 Q259 174 262 146 M271 166 Q273 186 280 206 M253 136 Q233 121 219 117 M270 117 Q278 81 301 53" fill="none" stroke="#CCA971" strokeWidth={3} strokeLinecap="round" />
      <G fill="#73875B"><Ellipse cx={189} cy={69} rx={16} ry={8} transform="rotate(35 189 69)" /><Ellipse cx={314} cy={48} rx={15} ry={7} transform="rotate(-40 314 48)" /><Ellipse cx={345} cy={92} rx={14} ry={7} transform="rotate(-20 345 92)" /></G>
    </Svg>
    {ROOTS.map((path, index) => <Animated.View key={path} style={[StyleSheet.absoluteFill, { opacity: index === current ? growth : grown[index] ? 1 : 0 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 480 300" preserveAspectRatio="none"><Path d={path} fill="none" stroke="#F7D77A" strokeWidth={5} strokeLinecap="round" /></Svg>
    </Animated.View>)}
    {CROWNS.map(({ box: [x, y, w, h], shadow, leaves, light }, index) => <Animated.View
      key={index} testID={`ugat-tree-crown-${index + 1}`}
      style={{ position: "absolute", left: `${x / 480 * 100}%`, top: `${y / 300 * 100}%`, width: `${w / 480 * 100}%`, height: `${h / 300 * 100}%`,
        opacity: index === current ? growth : grown[index] ? 1 : 0,
        transform: [{ scale: index === current ? growth.interpolate({ inputRange: [0, 1], outputRange: [.35, 1] }) : 1 }],
      }}
    >
      <Svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="none">
        {[shadow, leaves, light].map((ellipses, layer) => <G key={layer} fill={["#476E3B", "#75994C", "#BDD878"][layer]}>
          {ellipses.map(([cx, cy, rx, ry], leaf) => <Ellipse key={leaf} cx={cx} cy={cy} rx={rx} ry={ry} />)}
        </G>)}
      </Svg>
    </Animated.View>)}
  </View>;
}
