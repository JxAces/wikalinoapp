import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Ellipse } from "react-native-svg";

import type { CabinetActivity } from "@/data/cabinet-activities";

type TreeActivity = { activity: CabinetActivity; completed: boolean; hasDraft: boolean };

type Props = { activities: TreeActivity[]; onPress: (activity: CabinetActivity) => void };

const symbols = ["magnify", "notebook-outline", "cards-outline"] as const;

/** A full lesson tree: its roots frame the work and each branch holds one activity. */
export function UgatActivityTreeCard({ activities, onPress }: Props) {
  const [focused, setFocused] = useState<string | null>(null);
  return <View style={styles.tree}>
    <View pointerEvents="none" style={styles.trunk}><View style={styles.bark} /></View>
    <View pointerEvents="none" style={styles.canopy}>
      <Svg width="100%" height="100%" viewBox="0 0 360 180" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
        <Ellipse cx="180" cy="95" rx="151" ry="74" fill="#254D3B" />
        <Path d="M43 116 C14 79 45 41 82 49 C85 13 125 10 153 30 C178 -3 224 10 237 35 C279 18 319 49 308 77 C345 104 316 151 279 143 C254 170 217 155 201 139 C175 165 132 155 117 138 C85 157 43 146 43 116Z" fill="#517F50" stroke="#86A66B" strokeWidth="2" />
        <Path d="M60 81 C58 54 90 53 104 62 C117 31 149 43 158 54 C179 22 210 35 224 53 C248 36 280 48 281 70" fill="none" stroke="#769A60" strokeWidth="14" strokeLinecap="round" />
        <Path d="M163 180 L164 120 L133 94 M196 180 L192 118 L225 86 M179 143 L182 72" fill="none" stroke="#AA784C" strokeWidth="13" strokeLinecap="round" />
        <Path d="M179 142 L181 86" stroke="#DBB57A" strokeWidth="3" strokeLinecap="round" />
        <G fill="#B2CA82"><Path d="M105 87 Q87 65 76 81 Q85 101 105 87Z" /><Path d="M239 106 Q264 85 277 103 Q260 120 239 106Z" /><Path d="M151 65 Q127 45 121 64 Q134 80 151 65Z" /></G>
        <G fill="#E2C278"><Circle cx="41" cy="32" r="2" /><Circle cx="313" cy="30" r="3" /><Circle cx="333" cy="146" r="2" /></G>
      </Svg>
    </View>
    {activities.map((item, index) => {
      const status = item.completed ? "Kumpleto · Balikan" : item.hasDraft ? "May draft · Ituloy" : "Buksan";
      const right = index % 2 === 1;
      return <View key={item.activity.id} style={styles.branchRow}>
        <View pointerEvents="none" style={[styles.branchArt, right && styles.mirrored]}>
          <Svg width="100%" height="100%" viewBox="0 0 360 80" preserveAspectRatio="none" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
            <Path d="M185 68 Q162 31 127 23 L39 16 M182 55 Q228 58 258 28" fill="none" stroke="#98673F" strokeWidth="12" strokeLinecap="round" />
            <Path d="M162 40 Q139 25 119 24 L41 19" fill="none" stroke="#C59960" strokeWidth="3" strokeLinecap="round" />
            <Path d="M72 20 L72 50 M130 26 L130 50" stroke="#D5BD83" strokeWidth="3" />
            <Path d="M247 36 Q245 12 270 10 Q274 30 247 36Z" fill="#83A764" stroke="#B4C781" />
            {item.completed && <G fill="#C3CD77"><Path d="M235 44 Q210 18 210 44 Q220 56 235 44Z" /><Path d="M267 47 Q292 24 293 45 Q285 59 267 47Z" /></G>}
          </Svg>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${item.activity.title}. ${status}.`} onFocus={() => setFocused(item.activity.id)} onBlur={() => setFocused(null)} onPress={() => onPress(item.activity)} style={({ pressed }) => [styles.sign, right ? styles.right : styles.left, item.completed && styles.signDone, focused === item.activity.id && styles.focused, pressed && styles.pressed]}>
        <View style={styles.signTop}><Text style={styles.number}>GAWAIN {String(index + 1).padStart(2, "0")}</Text><MaterialCommunityIcons name={item.completed ? "check-circle" : symbols[index] ?? "leaf"} size={18} color={item.completed ? "#DDE7A6" : "#E9C789"} /></View>
        <Text style={styles.title}>{item.activity.title}</Text>
        <Text style={styles.mode}>{item.activity.mode === "group" ? "Pangkatang gawain" : "Indibidwal na gawain"}</Text>
        <View style={styles.footer}><Text style={[styles.status, item.completed && styles.statusDone]}>{status}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={item.completed ? "#C9E5A8" : "#F0D089"} /></View>
      </Pressable></View>;
    })}
    <View pointerEvents="none" style={styles.roots}>
      <Svg width="100%" height="100%" viewBox="0 0 360 115" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
        <Path d="M12 33 Q89 16 159 28 Q228 15 348 33 L341 95 Q183 121 20 95Z" fill="#284633" />
        <Path d="M161 0 Q160 30 139 41 Q111 58 60 54 M197 0 Q191 30 215 41 Q245 59 300 52 M176 19 Q176 48 150 71 L125 90 M188 25 Q189 56 229 78 L251 90" fill="none" stroke="#A57449" strokeWidth="12" strokeLinecap="round" />
        <Path d="M139 42 L116 76 M215 42 L246 68 M150 70 L95 79" stroke="#A57449" strokeWidth="5" fill="none" strokeLinecap="round" />
        <Path d="M22 30 Q96 15 155 28 M205 25 Q262 17 340 31" stroke="#769257" strokeWidth="3" fill="none" />
      </Svg>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  tree: { width: "100%", maxWidth: 520, alignSelf: "center", paddingBottom: 0 },
  canopy: { height: 170, width: "100%" },
  trunk: { position: "absolute", top: 148, bottom: 100, left: "45%", width: "10%", backgroundColor: "#98673F", borderLeftWidth: 3, borderRightWidth: 3, borderColor: "#BD905B", borderRadius: 15 },
  bark: { marginLeft: "38%", width: 3, height: "100%", backgroundColor: "#785334", opacity: 0.65 },
  branchRow: { paddingTop: 43, paddingBottom: 13 },
  branchArt: { position: "absolute", top: 0, left: 0, right: 0, height: 80 },
  mirrored: { transform: [{ scaleX: -1 }] },
  roots: { height: 115, marginTop: -2 },
  sign: { width: "68%", maxWidth: 320, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 6, backgroundColor: "#735034", borderWidth: 2, borderBottomWidth: 5, borderColor: "#B78953", borderBottomColor: "#503A29" },
  left: { alignSelf: "flex-start" }, right: { alignSelf: "flex-end" },
  signDone: { backgroundColor: "#31523A", borderColor: "#9BBA78" },
  focused: { borderColor: "#FFE4A1" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  signTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  number: { color: "#E5C887", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#FFF0C8", fontSize: 17, lineHeight: 23, fontWeight: "800", marginTop: 6 },
  mode: { color: "#E7DAB6", fontSize: 11, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  status: { color: "#F2DCAB", fontSize: 12, fontWeight: "800" }, statusDone: { color: "#C9E5A8" },
});
