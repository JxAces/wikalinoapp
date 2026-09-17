import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import type { CabinetActivity } from "@/data/cabinet-activities";

type Props = {
  activity: CabinetActivity;
  index: number;
  completed: boolean;
  hasDraft: boolean;
  compact: boolean;
  onPress: () => void;
};

/** The doors show saved completion; opening an editor never completes an activity. */
export function ActivityCabinetCard({ activity, index, completed, hasDraft, compact, onPress }: Props) {
  const [focused, setFocused] = useState(false);
  const status = completed ? "Kumpleto" : hasDraft ? "May draft" : "Hindi pa nasisimulan";
  const action = completed ? "Balikan ang sagot" : hasDraft ? "Ituloy ang gawain" : "Buksan ang gawain";

  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${activity.title}. ${status}. ${action}`}
    accessibilityHint={completed ? "Bukas ang kabinet dahil kumpleto na ang gawain." : "Pindutin upang sagutan ang gawain. Bubukas ang mga pinto kapag kumpleto na."}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    onPress={onPress}
    style={({ pressed }) => [styles.card, compact ? styles.cardCompact : styles.cardWide, focused && styles.focused, pressed && styles.pressed]}
  >
    <View pointerEvents="none" style={[styles.artwork, compact && styles.artworkCompact]}>
      <Svg width="100%" height="100%" viewBox="0 0 280 260" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
        <Ellipse cx="140" cy="248" rx="116" ry="8" fill="#0E2D27" opacity="0.65" />
        {/* Feet, solid case, and stepped cornice make each activity its own cabinet. */}
        <Path d="M33 225 H52 L49 247 H36 Z M228 225 H247 L244 247 H231 Z" fill="#825737" stroke="#C09A61" strokeWidth="2" />
        <Rect x="25" y="28" width="230" height="204" rx="4" fill="#543B2B" stroke="#BC935A" strokeWidth="3" />
        <Rect x="34" y="37" width="212" height="181" fill={completed ? "#263E30" : "#352C21"} />
        <Path d="M20 17 H260 L255 30 H25 Z" fill="#B18A54" stroke="#D6B575" strokeWidth="2" />
        <Rect x="15" y="10" width="250" height="8" rx="3" fill="#D0AC6B" />
        <Path d="M27 227 H253 V236 H27 Z" fill="#A07848" stroke="#D0AC6B" strokeWidth="2" />

        {completed ? <G>
          {/* Visible interior, hanging garments, and folded clothes. */}
          <Path d="M47 62 H233" stroke="#C4A16B" strokeWidth="4" />
          <Path d="M93 76 C85 66 102 64 103 73 C104 78 98 79 98 84 L74 99 H122 L98 84 M178 76 C170 66 187 64 188 73 C189 78 183 79 183 84 L159 99 H207 L183 84" fill="none" stroke="#D8BD83" strokeWidth="2" strokeLinejoin="round" />
          <Path d="M78 96 L88 92 Q98 102 108 92 L118 96 L130 112 L119 122 L113 115 L122 166 H74 L83 115 L77 122 L66 112 Z" fill="#EBD7A1" stroke="#B39761" strokeWidth="1.5" />
          <Path d="M164 96 L174 92 Q183 103 192 92 L202 96 L215 114 L204 123 L198 116 V160 H168 V116 L161 123 L151 114 Z" fill="#9BB58B" stroke="#657F5D" strokeWidth="1.5" />
          <Path d="M84 154 H113 M176 148 H190" stroke="#A28F5E" strokeWidth="1.5" strokeDasharray="3 3" />
          <Rect x="46" y="177" width="188" height="7" fill="#A58050" />
          <Rect x="93" y="197" width="96" height="10" rx="3" fill="#BA926A" />
          <Rect x="99" y="187" width="84" height="9" rx="3" fill="#DEC898" />
          {/* Angled doors expose the whole central compartment. */}
          <Path d="M34 37 L7 51 V229 L34 217 Z" fill="#916740" stroke="#D3B077" strokeWidth="2" />
          <Path d="M28 49 L14 57 V214 L28 209 Z" fill="#6E4C32" stroke="#B28B57" />
          <Path d="M246 37 L273 51 V229 L246 217 Z" fill="#916740" stroke="#D3B077" strokeWidth="2" />
          <Path d="M252 49 L266 57 V214 L252 209 Z" fill="#6E4C32" stroke="#B28B57" />
          <Path d="M20 130 V145 M260 130 V145" stroke="#F0D59A" strokeWidth="3" strokeLinecap="round" />
          <Circle cx="140" cy="49" r="16" fill="#BFE0A3" stroke="#324D35" strokeWidth="3" />
          <Path d="M132 49 L138 55 L149 43" fill="none" stroke="#34513A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </G> : <G>
          {/* Two inset wooden doors with separate brass handles. */}
          <Rect x="34" y="37" width="104" height="181" rx="2" fill="#8A623E" stroke="#C49A61" strokeWidth="2" />
          <Rect x="142" y="37" width="104" height="181" rx="2" fill="#805A3A" stroke="#C49A61" strokeWidth="2" />
          <Path d="M44 48 H128 V126 H44 Z M44 140 H128 V207 H44 Z M152 48 H236 V126 H152 Z M152 140 H236 V207 H152 Z" fill="#704D33" stroke="#B88D56" strokeWidth="1.5" />
          <Path d="M49 53 H123 V121 M49 145 H123 V202 M157 53 H231 V121 M157 145 H231 V202" fill="none" stroke="#4F3828" strokeWidth="2" opacity="0.55" />
          <Path d="M59 62 Q64 87 58 110 M109 62 Q103 87 109 110 M167 63 Q172 88 166 110 M217 62 Q211 87 218 110 M63 153 Q58 177 65 194 M210 153 Q216 177 210 194" fill="none" stroke="#A27A4C" strokeWidth="1.5" opacity="0.35" />
          <Rect x="122" y="126" width="6" height="22" rx="3" fill="#3D2D22" />
          <Rect x="152" y="126" width="6" height="22" rx="3" fill="#3D2D22" />
          <Path d="M124 129 V143 M156 129 V143" stroke="#F1D699" strokeWidth="4" strokeLinecap="round" />
          <Path d="M34 65 H39 M34 187 H39 M241 65 H246 M241 187 H246" stroke="#D4AE70" strokeWidth="4" />
        </G>}
      </Svg>
    </View>
    <View style={[styles.copy, compact && styles.copyCompact]}>
      <View style={styles.meta}>
        <Text style={styles.number}>GAWAIN {String(index + 1).padStart(2, "0")}</Text>
        {completed && <MaterialCommunityIcons name="check-circle" color="#BFE0A3" size={16} />}
      </View>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.mode}>{activity.mode === "group" ? "Pangkatang gawain" : "Indibidwal na gawain"}</Text>
      <Text style={[styles.status, completed && styles.statusDone]}>{completed ? "Kumpleto · Bukas na" : hasDraft ? "May draft · Hindi pa tapos" : "Handa nang simulan"}</Text>
      <View style={[styles.action, completed && styles.actionDone]}>
        <Text style={[styles.actionText, completed && styles.actionTextDone]}>{action}</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={completed ? "#CAE3B2" : "#EDD19A"} />
      </View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minWidth: 0, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  cardWide: { flex: 1 },
  cardCompact: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  focused: { borderColor: "#E5C583", backgroundColor: "#24473A" },
  pressed: { backgroundColor: "#24473A", transform: [{ scale: 0.98 }] },
  artwork: { width: "100%", aspectRatio: 280 / 260 },
  artworkCompact: { width: "39%", maxWidth: 170 },
  copy: { paddingHorizontal: 4, paddingTop: 12 },
  copyCompact: { flex: 1, paddingTop: 0, paddingHorizontal: 0 },
  meta: { minHeight: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  number: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, color: "#D7B97F" },
  title: { color: "#FFF0C6", fontSize: 19, lineHeight: 26, fontWeight: "800", marginTop: 8 },
  mode: { color: "#C8D1B1", fontSize: 11, lineHeight: 17, marginTop: 6 },
  status: { color: "#DAC598", fontSize: 11, lineHeight: 18, marginTop: 14 },
  statusDone: { color: "#BFE0A3" },
  action: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderTopColor: "#65714F", marginTop: 8, paddingVertical: 10 },
  actionDone: { borderTopColor: "#55774D" },
  actionText: { flex: 1, color: "#EDD19A", fontWeight: "700", fontSize: 12, lineHeight: 18 },
  actionTextDone: { color: "#CAE3B2" },
});
