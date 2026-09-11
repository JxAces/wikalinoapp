import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import { type ComponentProps, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CharacterLineup } from "../../components/character-select/CharacterLineup";
import { CharacterModelPreview } from "../../components/character-select/CharacterModelPreview";
import { Colors } from "../../constants/colors";
import { DEFAULT_PLAYER_CHARACTER, PLAYER_CHARACTER_OPTIONS, type PlayerCharacterId } from "../../data/player-characters";
import { getAllStories, storyUnits } from "../../data/stories";
import { useUserStore } from "../../store/useUserStore";
import { getLevelInfo } from "../../utils/progression";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
const stories = getAllStories();

export default function ProgressScreen() {
  const profile = useUserStore(state => state.profile);
  const xp = useUserStore(state => state.xp);
  const completedStoryIds = useUserStore(state => state.completedStoryIds);
  const activityResults = useUserStore(state => state.activityResults);
  const getStoryStars = useUserStore(state => state.getStoryStars);
  const clearGameProgress = useUserStore(state => state.clearGameProgress);
  const deleteAccount = useUserStore(state => state.deleteAccount);
  const updateProfile = useUserStore(state => state.updateProfile);
  const focused = useIsFocused();
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lineupOpen, setLineupOpen] = useState(false);
  const [draftCharacter, setDraftCharacter] = useState<PlayerCharacterId>(DEFAULT_PLAYER_CHARACTER);
  const selectedCharacter = profile?.character ?? DEFAULT_PLAYER_CHARACTER;
  const characterTitle = PLAYER_CHARACTER_OPTIONS.find(item => item.id === selectedCharacter)?.title ?? "Mag-aaral";
  const level = getLevelInfo(xp);
  const totalStars = stories.reduce((sum, story) => sum + getStoryStars(story.id), 0);
  const completedCount = stories.filter(story => completedStoryIds.includes(story.id)).length;
  const activityCount = Object.keys(activityResults).length;
  const earned = [completedCount >= 1, totalStars >= 9, level.level >= 5];

  function handleReset() {
    Alert.alert("I-reset ang Progreso", "Mabubura ang XP, natapos na kuwento, stars at koleksyon. Mananatili ang iyong pangalan, baitang at tauhan.", [
      { text: "Kanselahin", style: "cancel" },
      { text: "I-reset", style: "destructive", onPress: clearGameProgress },
    ]);
  }
  function handleDeleteAccount() {
    Alert.alert("Burahin ang Account?", "Permanenteng mabubura ang profile at lahat ng naka-save na progreso, XP, stars, koleksyon at hamon sa device na ito.", [
      { text: "Kanselahin", style: "cancel" },
      { text: "Burahin Lahat", style: "destructive", onPress: async () => {
        setIsDeleting(true);
        try {
          await deleteAccount();
          router.replace("/onboarding");
        } catch {
          setIsDeleting(false);
          Alert.alert("Hindi Nabura ang Account", "Hindi maalis ang naka-save na data. Pakisubukan muli.");
        }
      } },
    ]);
  }
  function openLineup() {
    setDraftCharacter(selectedCharacter);
    setLineupOpen(true);
  }

  return <LinearGradient colors={["#A9D8C4", "#EAF4EC", "#EAF4EC"]} style={styles.screen}>
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Bumalik sa mapa" onPress={() => router.replace("/landing")}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="arrow-left" color={Colors.primaryDark} size={23} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>ANG IYONG PAGLALAKBAY</Text>
            <Text style={styles.pageTitle}>Tala ng Manlalakbay</Text>
          </View>
          <View style={styles.starPill}><MaterialCommunityIcons name="star" color={Colors.accent} size={17} /><Text style={styles.starText}>{totalStars}</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.identity}>
            <View style={styles.rankBadge}>
              <MaterialCommunityIcons name="shield-crown" color={Colors.accent} size={29} />
              <Text style={styles.rankNumber}>LV {level.level}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.playerName}>{profile?.fullName || "Manlalakbay"}</Text>
              <Text style={styles.playerGrade}>{profile?.pangkat?.replace("Pangkat", "Baitang") || "Bagong manlalakbay"}</Text>
              <Text style={styles.rankTitle}>{level.title}</Text>
            </View>
          </View>
          <View style={styles.stage}>
            {focused && !lineupOpen && <CharacterModelPreview characterId={selectedCharacter} interactive style={styles.model} />}
            <View pointerEvents="none" style={styles.characterTag}><Text style={styles.characterTagText}>{characterTitle}</Text></View>
          </View>
          <View style={styles.characterActions}>
            <Text style={styles.rotateHint}>{Platform.OS === "web" ? "Iyong tauhan sa mapa" : "I-drag upang paikutin"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Palitan ang tauhan" onPress={openLineup} style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="account-switch-outline" color={Colors.secondary} size={18} />
              <Text style={styles.changeText}>Palitan ang tauhan</Text>
            </Pressable>
          </View>
          <LinearGradient colors={["#273F42", "#182E32"]} style={styles.xpPanel}>
            <View style={styles.between}>
              <Text style={styles.xpLabel}>LAKAS NG KAALAMAN</Text>
              <Text style={styles.xpValue}>{xp.toLocaleString()} <Text style={styles.xpSuffix}>XP</Text></Text>
            </View>
            <Meter value={level.progress} label="Progreso sa susunod na antas" gold />
            <View style={styles.between}>
              <Text style={styles.xpHint}>{level.next ? `${Math.max(0, level.next.minXp - xp)} XP pa sa susunod na antas` : "Naabot mo ang pinakamataas na antas!"}</Text>
              <Text style={styles.nextRank}>{level.next ? `LV ${level.next.level}` : "MAX"}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.stats}>
          <Stat icon="book-check-outline" value={`${completedCount}/${stories.length}`} label="KUWENTONG TAPOS" />
          <Stat icon="sword-cross" value={String(activityCount)} label="HAMONG TAPOS" />
          <Stat icon="star-four-points" value={String(totalStars)} label="NAIPONG TALA" />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.replace("/landing")} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
          <View style={styles.playIcon}><MaterialCommunityIcons name="map-marker-path" size={26} color={Colors.accent} /></View>
          <View style={styles.flex}>
            <Text style={styles.playTitle}>{completedCount === stories.length ? "Balikan ang mga kuwento" : "Ituloy ang pakikipagsapalaran"}</Text>
            <Text style={styles.playSubtitle}>Bumalik sa mapa ng mga kuwento</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={Colors.accent} />
        </Pressable>

        <SectionTitle title="Mga Parangal" detail={`${earned.filter(Boolean).length} / 3 nakamit`} />
        <View style={styles.awards}>
          <Achievement icon="compass-rose" title="Unang Hakbang" detail="Tapusin ang isang kuwento" unlocked={earned[0]} progress={`${Math.min(completedCount, 1)} / 1`} />
          <Achievement icon="star-circle" title="Kolektor ng Tala" detail="Mag-ipon ng 9 na stars" unlocked={earned[1]} progress={`${Math.min(totalStars, 9)} / 9`} />
          <Achievement icon="crown" title="Maestro" detail="Abutin ang Antas 5" unlocked={earned[2]} progress={`LV ${level.level} / 5`} />
        </View>

        <SectionTitle title="Mga Mundo ng Kuwento" detail="PROGRESO SA MARKAHAN" />
        <View style={styles.worlds}>
          {storyUnits.map(unit => {
            const total = unit.stories.length;
            const completed = unit.stories.filter(story => completedStoryIds.includes(story.id)).length;
            const cleared = total > 0 && completed === total;
            return <View key={unit.id} style={[styles.world, !total && styles.upcomingWorld]}>
              <View style={[styles.worldNumber, cleared && styles.worldCleared]}>
                <MaterialCommunityIcons name={cleared ? "flag-checkered" : total ? "pine-tree" : "lock-outline"} size={26} color={cleared ? Colors.surface : total ? Colors.secondary : Colors.textMuted} />
                <Text style={[styles.worldIndex, cleared && styles.lightText]}>0{unit.markahan}</Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.between}>
                  <Text style={styles.worldEyebrow}>MUNDO {unit.markahan}</Text>
                  <Text style={[styles.worldStatus, cleared && styles.completedText]}>{!total ? "PAPARATING" : cleared ? "NATAPOS" : `${completed} / ${total}`}</Text>
                </View>
                <Text style={styles.worldTitle}>{unit.title}</Text>
                {total > 0 ? <Meter value={completed / total * 100} label={`${unit.title}: ${completed} sa ${total} kuwento`} /> : <Text style={styles.upcomingText}>May bagong paglalakbay na darating.</Text>}
              </View>
            </View>;
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push("/collection")} style={({ pressed }) => [styles.collection, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="bookshelf" color={Colors.secondary} size={32} />
          <View style={styles.flex}><Text style={styles.collectionTitle}>Buksan ang Aklatan</Text><Text style={styles.collectionHint}>Basahin at balikan ang buong kuwento</Text></View>
          <MaterialCommunityIcons name="chevron-right" color={Colors.secondary} size={24} />
        </Pressable>

        <View style={styles.settings}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: settingsOpen }} aria-expanded={settingsOpen}
            onPress={() => setSettingsOpen(open => !open)} style={styles.settingsToggle}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.settingsTitle}>Profile at naka-save na data</Text>
            <MaterialCommunityIcons name={settingsOpen ? "chevron-up" : "chevron-down"} size={21} color={Colors.textMuted} />
          </Pressable>
          {settingsOpen && <View style={styles.settingsBody}>
            <Text style={styles.settingsHint}>Pamahalaan ang iyong progreso at profile sa device na ito.</Text>
            <Pressable disabled={isDeleting} accessibilityRole="button" accessibilityLabel="I-reset ang Progreso" onPress={handleReset} style={styles.reset}>
              <MaterialCommunityIcons name="refresh" size={20} color={Colors.error} /><Text style={styles.resetText}>I-reset ang Progreso</Text>
            </Pressable>
            <Pressable disabled={isDeleting} accessibilityRole="button" accessibilityLabel={isDeleting ? "Binubura" : "Burahin ang Account"} accessibilityState={{ disabled: isDeleting }} onPress={handleDeleteAccount}
              style={({ pressed }) => [styles.delete, (pressed || isDeleting) && styles.pressed]}>
              <MaterialCommunityIcons name="delete-forever-outline" size={20} color={Colors.surface} />
              <Text style={styles.deleteText}>{isDeleting ? "Binubura…" : "Burahin ang Account"}</Text>
            </Pressable>
          </View>}
        </View>
      </ScrollView>
      <Modal visible={lineupOpen && focused} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setLineupOpen(false)}>
        {lineupOpen && focused && <CharacterLineup characterId={draftCharacter} onCharacterChange={setDraftCharacter}
          onBack={() => setLineupOpen(false)} active={focused}
          confirmLabel="Gamitin ang tauhan"
          backLabel="Bumalik sa progreso"
          onConfirm={() => { updateProfile({ character: draftCharacter }); setLineupOpen(false); }} />}
      </Modal>
    </SafeAreaView>
  </LinearGradient>;
}

function Meter({ value, label, gold = false }: { value: number; label: string; gold?: boolean }) {
  const percent = Math.max(0, Math.min(100, value));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }} style={[styles.meter, gold && styles.meterDark]}>
    <View style={[styles.meterFill, gold && styles.meterGold, { width: `${percent}%` }]} />
  </View>;
}
function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDetail}>{detail}</Text></View>;
}
function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return <View style={styles.stat}><MaterialCommunityIcons name={icon} color={Colors.secondary} size={24} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function Achievement({ icon, title, detail, unlocked, progress }: { icon: IconName; title: string; detail: string; unlocked: boolean; progress: string }) {
  return <View style={styles.achievement} accessible accessibilityLabel={`${title}. ${detail}. ${unlocked ? "Nakamit" : progress}`}>
    <View style={[styles.medal, unlocked && styles.medalEarned]}>
      <MaterialCommunityIcons name={icon} size={30} color={unlocked ? "#936727" : "#819486"} />
      <View style={[styles.medalMark, unlocked && styles.medalMarkEarned]}><MaterialCommunityIcons name={unlocked ? "check" : "lock"} size={11} color={unlocked ? Colors.surface : Colors.textMuted} /></View>
    </View>
    <Text style={styles.achievementTitle}>{title}</Text>
    <Text style={styles.achievementDetail}>{detail}</Text>
    <Text style={[styles.achievementStatus, unlocked && styles.completedText]}>{unlocked ? "NAKAMIT" : progress}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 20, maxWidth: 640, width: "100%", alignSelf: "center" },
  flex: { flex: 1 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 46, borderRadius: 15, backgroundColor: "#CAE5D4", alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.5, color: Colors.secondary },
  pageTitle: { marginTop: 5, fontSize: 20, fontWeight: "900", color: Colors.primaryDark },
  starPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryDark, borderRadius: 15, padding: 10 },
  starText: { color: Colors.accentSoft, fontWeight: "900", fontSize: 13 },
  hero: { borderRadius: 26, overflow: "hidden", backgroundColor: "#A9D8C4", borderWidth: 1.5, borderColor: "#92BAA1" },
  identity: { padding: 18, flexDirection: "row", gap: 14, alignItems: "center" },
  rankBadge: { width: 66, minHeight: 78, backgroundColor: Colors.secondary, borderWidth: 2, borderColor: Colors.accent, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 3 },
  rankNumber: { fontSize: 14, fontWeight: "900", color: Colors.accentSoft },
  playerName: { fontSize: 24, fontWeight: "900", color: Colors.primaryDark },
  playerGrade: { marginTop: 3, color: Colors.secondary, fontSize: 12, fontWeight: "600" },
  rankTitle: { marginTop: 7, color: Colors.primaryDark, fontSize: 12, fontWeight: "800" },
  stage: { height: 290 },
  model: { flex: 1, minHeight: 0 },
  characterTag: { position: "absolute", bottom: 8, alignSelf: "center", borderRadius: 20, backgroundColor: "#D7EDDE", paddingHorizontal: 16, paddingVertical: 6 },
  characterTagText: { fontSize: 11, fontWeight: "800", color: Colors.secondary },
  characterActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, padding: 14 },
  rotateHint: { fontSize: 10, color: Colors.secondary, flexShrink: 1 },
  changeButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, padding: 10, backgroundColor: "#E6F1DF" },
  changeText: { fontSize: 11, fontWeight: "800", color: Colors.secondary },
  xpPanel: { padding: 18, gap: 10 },
  xpLabel: { color: "#B9D0C5", fontSize: 9, letterSpacing: 1.2, fontWeight: "900" },
  xpValue: { color: Colors.accent, fontWeight: "900", fontSize: 24 },
  xpSuffix: { fontSize: 12 },
  xpHint: { flex: 1, color: "#C7DDD0", fontSize: 11 },
  nextRank: { fontSize: 11, color: Colors.accent, fontWeight: "900" },
  meter: { height: 7, borderRadius: 5, backgroundColor: "#D7E4D6", overflow: "hidden", marginTop: 6 },
  meterDark: { backgroundColor: "#45605B", height: 10, marginTop: 0 },
  meterFill: { height: "100%", backgroundColor: Colors.teal, borderRadius: 5 },
  meterGold: { backgroundColor: Colors.accent },
  stats: { flexDirection: "row", gap: 9 },
  stat: { flex: 1, alignItems: "center", backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, paddingVertical: 15, paddingHorizontal: 4, gap: 7 },
  statValue: { color: Colors.primaryDark, fontSize: 25, fontWeight: "900" },
  statLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
  playButton: { backgroundColor: Colors.secondary, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  playIcon: { backgroundColor: "#274F3D", padding: 10, borderRadius: 15 },
  playTitle: { color: Colors.surface, fontSize: 14, fontWeight: "900", lineHeight: 20 },
  playSubtitle: { color: "#C9DFBD", fontSize: 10, marginTop: 4 },
  sectionHeader: { gap: 5, marginTop: 3 },
  sectionTitle: { color: Colors.primaryDark, fontSize: 20, fontWeight: "900" },
  sectionDetail: { color: Colors.textMuted, fontSize: 10, letterSpacing: 0.8, fontWeight: "700" },
  awards: { flexDirection: "row", gap: 8 },
  achievement: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, paddingVertical: 15, paddingHorizontal: 6, backgroundColor: "#F3F5E9", alignItems: "center" },
  medal: { width: 58, height: 58, borderRadius: 20, borderWidth: 2, borderColor: "#B7C8B8", backgroundColor: "#E0E9DF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  medalEarned: { borderColor: "#D7AE52", backgroundColor: "#FBE7AC" },
  medalMark: { position: "absolute", right: -5, bottom: -4, width: 21, height: 21, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#CDD9CD", borderWidth: 2, borderColor: "#F3F5E9" },
  medalMarkEarned: { backgroundColor: Colors.secondary },
  achievementTitle: { textAlign: "center", color: Colors.primaryDark, fontSize: 11, fontWeight: "900", minHeight: 30 },
  achievementDetail: { fontSize: 9, color: Colors.textMuted, textAlign: "center", lineHeight: 14, minHeight: 30 },
  achievementStatus: { fontSize: 9, fontWeight: "900", color: Colors.textMuted, marginTop: 10 },
  completedText: { color: Colors.secondary },
  worlds: { gap: 10 },
  world: { backgroundColor: Colors.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", gap: 14 },
  upcomingWorld: { backgroundColor: "#E6EEE3" },
  worldNumber: { width: 52, height: 65, borderRadius: 16, backgroundColor: "#DEECD7", alignItems: "center", justifyContent: "center", gap: 3 },
  worldCleared: { backgroundColor: Colors.secondary },
  worldIndex: { fontWeight: "900", fontSize: 11, color: Colors.secondary },
  lightText: { color: Colors.surface },
  worldEyebrow: { fontSize: 8, letterSpacing: 1.2, fontWeight: "900", color: Colors.textMuted },
  worldStatus: { fontSize: 9, fontWeight: "900", color: Colors.textMuted },
  worldTitle: { fontSize: 15, fontWeight: "900", color: Colors.primaryDark, marginVertical: 6 },
  upcomingText: { fontSize: 10, lineHeight: 15, color: Colors.textMuted },
  collection: { padding: 18, backgroundColor: "#F4ECCF", borderWidth: 1, borderColor: "#D9D3AB", borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 13 },
  collectionTitle: { fontWeight: "900", fontSize: 15, color: Colors.primaryDark },
  collectionHint: { color: Colors.textMuted, marginTop: 4, fontSize: 10, lineHeight: 15 },
  settings: { borderTopWidth: 1, borderColor: Colors.border },
  settingsToggle: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 18 },
  settingsTitle: { flex: 1, color: Colors.textMuted, fontSize: 12, fontWeight: "700" },
  settingsBody: { gap: 12, paddingBottom: 8 },
  settingsHint: { fontSize: 12, lineHeight: 18, color: Colors.textMuted },
  reset: { padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#DFBFB3", borderRadius: 14, backgroundColor: "#FFF2E8" },
  resetText: { fontSize: 13, fontWeight: "800", color: Colors.error },
  delete: { padding: 16, backgroundColor: Colors.error, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deleteText: { fontSize: 13, fontWeight: "800", color: Colors.surface },
  pressed: { opacity: 0.7 },
});
