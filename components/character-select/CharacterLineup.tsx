import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";

import { AppTheme, Colors } from "@/constants/colors";
import { PLAYER_CHARACTER_OPTIONS, type PlayerCharacterId } from "@/data/player-characters";
import { CharacterModelPreview } from "./CharacterModelPreview";

type Props = {
  characterId: PlayerCharacterId;
  onCharacterChange: (id: PlayerCharacterId) => void;
  onBack: () => void;
  onConfirm: () => void;
  active: boolean;
  confirmLabel?: string;
  backLabel?: string;
};

export function CharacterLineup({ characterId, onCharacterChange, onBack, onConfirm, active, confirmLabel = "Magsimula na", backLabel = "Bumalik sa pangalan at baitang" }: Props) {
  const index = Math.max(0, PLAYER_CHARACTER_OPTIONS.findIndex(character => character.id === characterId));
  function cycle(direction: number) {
    onCharacterChange(PLAYER_CHARACTER_OPTIONS[(index + direction + PLAYER_CHARACTER_OPTIONS.length) % PLAYER_CHARACTER_OPTIONS.length].id);
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="arrow-left" size={23} color={Colors.primaryDark} />
      </Pressable>
      <View style={styles.heading}>
        <WikalinoBrand />
      </View>
      <Text style={styles.counter}>{index + 1} / {PLAYER_CHARACTER_OPTIONS.length}</Text>
    </View>
    <View style={styles.stage}>
      {active && <CharacterModelPreview characterId={characterId} interactive style={styles.model} />}
      <View pointerEvents="box-none" style={styles.arrows}>
        {([-1, 1] as const).map(direction => <Pressable key={direction} onPress={() => cycle(direction)}
          accessibilityRole="button" accessibilityLabel={direction < 0 ? "Naunang tauhan" : "Susunod na tauhan"}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <MaterialCommunityIcons name={direction < 0 ? "chevron-left" : "chevron-right"} size={34} color={Colors.accentSoft} />
        </Pressable>)}
      </View>
    </View>
    <View style={styles.footer}>
      <Text accessibilityLiveRegion="polite" style={styles.number}>{index + 1}</Text>
      <View style={styles.dots}>
        {PLAYER_CHARACTER_OPTIONS.map((character, i) => <Pressable key={character.id}
          accessibilityRole="button" accessibilityLabel={String(i + 1)} accessibilityState={{ selected: i === index }}
          onPress={() => onCharacterChange(character.id)} style={styles.dotTarget}>
          <View style={[styles.dot, i === index && styles.activeDot]} />
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={confirmLabel} onPress={onConfirm} style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}>
        <Text style={styles.confirmText}>{confirmLabel}</Text>
        <MaterialCommunityIcons name="arrow-right" size={22} color={Colors.primaryDark} />
      </Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppTheme.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 },
  back: { width: 46, height: 46, borderRadius: 16, backgroundColor: AppTheme.surfaceSoft, alignItems: "center", justifyContent: "center" },
  heading: { flex: 1, alignItems: "center" },
  counter: { color: Colors.secondary, fontSize: 12, fontWeight: "800", minWidth: 46, textAlign: "right" },
  stage: { flex: 1, minHeight: 0 },
  model: { flex: 1, minHeight: 0 },
  arrows: { ...StyleSheet.absoluteFill, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  arrow: { width: 48, height: 56, borderRadius: 18, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: AppTheme.border },
  footer: { paddingHorizontal: 26, paddingTop: 8, paddingBottom: 16, alignItems: "center" },
  number: { fontSize: 26, fontWeight: "900", color: Colors.primaryDark, textAlign: "center" },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 18 },
  dotTarget: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: AppTheme.border },
  activeDot: { width: 22, backgroundColor: Colors.secondary },
  confirm: { width: "100%", maxWidth: 460, minHeight: 58, borderRadius: 18, backgroundColor: Colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, padding: 14 },
  confirmText: { color: Colors.primaryDark, fontSize: 17, fontWeight: "900" },
  pressed: { opacity: 0.7 },
});
