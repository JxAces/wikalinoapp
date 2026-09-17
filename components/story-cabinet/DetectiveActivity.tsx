import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CabinetActivity } from "@/data/cabinet-activities";
import type { Story } from "@/data/stories";

type Props = {
  activity: CabinetActivity;
  story: Story;
  responses: Record<string, string>;
  groupName: string;
  onChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
  showErrors: boolean;
  completed: boolean;
  onViewChange: () => void;
};

const missions = [
  { title: "Pangunahing Tauhan", question: "Sino ang sentro ng kuwento?", icon: "account-search-outline", hint: "Kanino nakatuon ang mga pangyayari? Humanap ng detalyeng nagpapakilala sa kaniyang katangian o kalagayan.", scene: 0 },
  { title: "Iba pang Tauhan", question: "Sino ang may kaugnayan sa kaniya?", icon: "account-group-outline", hint: "Sino ang nakausap, nakasama, o nakaapekto sa pangunahing tauhan? Ipaliwanag ang kanilang papel gamit ang isang pangyayari.", scene: 2 },
  { title: "Tagpuan", question: "Saan at kailan nangyari ang kuwento?", icon: "map-marker-outline", hint: "Hanapin ang mga lugar at palatandaan ng panahon sa teksto. Kung walang tiyak na petsa, huwag mag-imbento nito.", scene: 0 },
  { title: "Pangunahing Suliranin", question: "Ano ang problemang kinaharap?", icon: "magnify", hint: "Ano ang paulit-ulit na nagpapahirap sa tauhan? Anong kilos o pangyayari ang nagpapakita nito?", scene: 1 },
  { title: "Mahalagang Pangyayari", question: "Anong pangyayari ang mahalaga sa kuwento?", icon: "book-open-page-variant-outline", hint: "Pumili ng pangyayaring nagbago sa takbo o pag-unawa sa kuwento. Ipaliwanag kung bakit ito mahalaga.", scene: 6 },
] as const;

function Drawer({ index, filled, partial, opened, reducedMotion, onPress, disabled }: {
  index: number; filled: boolean; partial: boolean; opened: boolean; reducedMotion: boolean; onPress: () => void; disabled: boolean;
}) {
  const [slide] = useState(() => new Animated.Value(opened ? 1 : 0));
  useEffect(() => {
    if (reducedMotion) slide.setValue(opened ? 1 : 0);
    else Animated.timing(slide, { toValue: opened ? 1 : 0, duration: 180, useNativeDriver: Platform.OS !== "web" }).start();
    return () => slide.stopAnimation();
  }, [opened, reducedMotion, slide]);
  const mission = missions[index];
  const state = filled ? "May sagot at patunay" : partial ? "May draft" : "Wala pang tala";
  return <View style={styles.drawerSlot}>
    {opened && <View pointerEvents="none" style={styles.filedPaper}><View style={styles.paperTab} /></View>}
    <Animated.View style={{ transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 7] }) }] }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Drawer ${index + 1}: ${mission.title}. ${state}`} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.drawer, pressed && styles.pressed]}>
        <View style={styles.drawerNumber}><Text style={styles.drawerNumberText}>{String(index + 1).padStart(2, "0")}</Text></View>
        <View style={styles.drawerCopy}>
          <Text style={styles.drawerTitle}>{mission.title}</Text>
          <View style={styles.drawerStatus}><MaterialCommunityIcons name={filled ? "folder-text-outline" : partial ? "pencil-outline" : "magnify"} size={14} color="#EAD1A0" /><Text style={styles.drawerStatusText}>{state}</Text></View>
        </View>
        <View pointerEvents="none" style={styles.handle}><View style={styles.handleBar} /></View>
      </Pressable>
    </Animated.View>
  </View>;
}

/** Five case files over the existing element-0..4 / proof-0..4 response keys. */
export function DetectiveActivity({ activity, story, responses, groupName, onChange, onComplete, showErrors, completed, onViewChange }: Props) {
  const [view, setView] = useState<"cabinet" | "mission" | "report">("cabinet");
  const [active, setActive] = useState(0);
  const [opening, setOpening] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [hint, setHint] = useState(false);
  const [example, setExample] = useState(false);
  const [peek, setPeek] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = missions.map((_, i) => Boolean(responses[`element-${i}`]?.trim() && responses[`proof-${i}`]?.trim()));
  const count = done.filter(Boolean).length;
  const mission = missions[active];
  const scene = story.scenes[sceneIndex];
  const invalid = attempted || showErrors;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { mounted = false; subscription.remove(); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function changeView(next: typeof view) {
    setView(next);
    onViewChange();
  }
  function openMission(index: number, animate = false) {
    setActive(index);
    setHint(false);
    setAttempted(false);
    setNotice("");
    if (animate && !reducedMotion) {
      setOpening(index);
      timer.current = setTimeout(() => { setOpening(null); changeView("mission"); }, 210);
    } else changeView("mission");
  }
  function fileEvidence() {
    setAttempted(true);
    if (!done[active]) return;
    setAttempted(false);
    setNotice(`Naitala ang sagot at patunay para sa ${mission.title}.`);
    changeView("cabinet");
  }
  function finish() {
    const missing = done.findIndex(value => !value);
    if (missing !== -1) { openMission(missing); setAttempted(true); }
    onComplete();
  }
  function helpExample() {
    if (!activity.example) return null;
    return <View style={styles.example}>
      <Pressable accessibilityRole="button" aria-expanded={example} onPress={() => setExample(value => !value)} style={styles.helpButton}>
        <MaterialCommunityIcons name="lightbulb-outline" size={19} color="#EBD197" /><Text style={styles.helpText}>{example ? "Itago ang halimbawa" : "Tingnan ang halimbawa"}</Text><MaterialCommunityIcons name={example ? "chevron-up" : "chevron-down"} size={18} color="#EBD197" />
      </Pressable>
      {example && <View style={styles.exampleBody}><Text style={styles.exampleLabel}>HALIMBAWA · PANGUNAHING TAUHAN</Text><Text style={styles.exampleText}>Sagot: {activity.example.answer}</Text><Text style={styles.exampleText}>Patunay: {activity.example.evidence}</Text><Text style={styles.exampleNote}>Gabay lamang ito. Isulat ang sariling sagot at patunay ng inyong pangkat.</Text></View>}
    </View>;
  }

  return <View style={styles.root}>
    {view === "cabinet" ? <>
      <View style={styles.brief}>
        <View style={styles.detectiveSeal}><MaterialCommunityIcons name="magnify" size={30} color="#EDD09A" /></View>
        <View style={styles.briefCopy}><Text style={styles.eyebrow}>ANG INYONG MISYON</Text><Text accessibilityRole="header" style={styles.heading}>Kabinet ng mga Pahiwatig</Text><Text style={styles.intro}>Buksan ang limang drawer. Magtala ng sagot at humanap ng patunay sa kuwento.</Text></View>
      </View>
      <View style={styles.progressRow}><Text accessibilityLiveRegion="polite" style={styles.progressText}>{count} sa 5 pahiwatig ang naitala</Text><MaterialCommunityIcons name="folder-multiple-outline" size={18} color="#D8C49B" /></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Mga pahiwatig na may sagot at patunay" accessibilityValue={{ min: 0, max: 5, now: count }} aria-valuemin={0} aria-valuemax={5} aria-valuenow={count} style={styles.progressTrack}><View style={[styles.progressFill, { width: `${count * 20}%` }]} /></View>
      <View style={styles.cornice} /><View style={styles.cabinet}>
        {missions.map((_, index) => <Drawer key={index} index={index} filled={done[index]} partial={Boolean(responses[`element-${index}`]?.trim() || responses[`proof-${index}`]?.trim())} opened={done[index] || opening === index} reducedMotion={reducedMotion} disabled={opening !== null} onPress={() => openMission(index, true)} />)}
      </View><View style={styles.plinth} /><View style={styles.feet}><View style={styles.foot} /><View style={styles.foot} /></View>
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      {helpExample()}
      <Pressable accessibilityRole="button" onPress={() => changeView("report")} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="file-document-outline" size={23} color="#EFDAA8" /><View style={styles.reportButtonCopy}><Text style={styles.reportButtonTitle}>Ulat ng mga Detective</Text><Text style={styles.reportButtonNote}>{completed ? "Handa nang ipasuri · Balikan ang ulat" : count === 5 ? "Naitala na ang lima. Suriin ang inyong ulat." : "Silipin ang mga naitala ng inyong pangkat."}</Text></View><MaterialCommunityIcons name="arrow-right" size={20} color="#EFDAA8" />
      </Pressable>
    </> : view === "mission" ? <>
      <Pressable accessibilityRole="button" onPress={() => changeView("cabinet")} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={18} color="#E8D09E" /><Text style={styles.backText}>Bumalik sa mga drawer</Text></Pressable>
      <View style={styles.caseTabs}>
        {missions.map((item, index) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`Pahiwatig ${index + 1}: ${item.title}`} aria-selected={active === index} onPress={() => openMission(index)} style={[styles.caseTab, active === index && styles.caseTabActive]}><Text style={[styles.caseTabText, active === index && styles.caseTabTextActive]}>{String(index + 1).padStart(2, "0")}</Text>{done[index] && <View style={styles.tabDot} />}</Pressable>)}
      </View>
      <View style={styles.paper}>
        <View pointerEvents="none" style={styles.tape} />
        <View style={styles.caseHeading}><Text style={styles.caseNumber}>PAHIWATIG {String(active + 1).padStart(2, "0")} / 05</Text><MaterialCommunityIcons name={mission.icon} size={28} color="#47644A" /></View>
        <Text style={styles.caseType}>{mission.title}</Text><Text accessibilityRole="header" style={styles.question}>{mission.question}</Text>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" onPress={() => { setSceneIndex(Math.min(mission.scene, story.scenes.length - 1)); setPeek(true); }} style={styles.toolButton}><MaterialCommunityIcons name="book-open-outline" size={18} color="#36573E" /><Text style={styles.toolText}>Silip sa kuwento</Text></Pressable>
          <Pressable accessibilityRole="button" aria-expanded={hint} onPress={() => setHint(value => !value)} style={styles.toolButton}><MaterialCommunityIcons name="lightbulb-outline" size={18} color="#36573E" /><Text style={styles.toolText}>Pahiwatig</Text></Pressable>
        </View>
        {hint && <Text style={styles.hint}>{mission.hint}</Text>}
        {(["element", "proof"] as const).map((kind, index) => {
          const key = `${kind}-${active}`;
          const missing = invalid && !responses[key]?.trim();
          const label = index === 0 ? "Ang aming sagot" : "Patunay mula sa kuwento";
          return <View key={key} style={styles.field}>
            <View style={styles.labelRow}><MaterialCommunityIcons name={index === 0 ? "pencil-outline" : "paperclip"} size={18} color="#52654A" /><Text nativeID={`detective-${key}`} style={styles.label}>{label}</Text></View>
            <TextInput accessibilityLabel={`${mission.title} · ${index === 0 ? "Sagot" : "Patunay"}`} accessibilityLabelledBy={`detective-${key}`} value={responses[key] ?? ""} onChangeText={value => onChange(key, value)} multiline textAlignVertical="top" placeholder={index === 0 ? "Ibahagi ang sagot ng inyong pangkat…" : "Anong pangyayari, kilos, o pahayag ang sumusuporta sa sagot?"} placeholderTextColor="#7C8066" style={[styles.input, missing && styles.inputError]} />
            {missing && <Text accessibilityRole="alert" style={styles.error}>{index === 0 ? "Isulat muna ang sagot ng pangkat." : "Magbigay ng patunay mula sa kuwento."}</Text>}
          </View>;
        })}
        <Text style={styles.autoSave}>Awtomatikong naka-save ang mga pagbabago.</Text>
        <Pressable accessibilityRole="button" onPress={fileEvidence} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><MaterialCommunityIcons name="folder-plus-outline" size={20} color="#FFEDBE" /><Text style={styles.primaryText}>Itabi ang ebidensya</Text><MaterialCommunityIcons name="arrow-right" size={18} color="#FFEDBE" /></Pressable>
      </View>
      {helpExample()}
    </> : <>
      <Pressable accessibilityRole="button" onPress={() => changeView("cabinet")} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={18} color="#E8D09E" /><Text style={styles.backText}>Bumalik sa mga drawer</Text></Pressable>
      <View style={styles.paper}>
        <View pointerEvents="none" style={styles.tape} />
        <Text style={styles.caseNumber}>KASO · SANDAANG DAMIT</Text><Text accessibilityRole="header" style={styles.question}>Ulat ng mga Detective</Text>
        <Text style={styles.reportGroup}>{groupName.trim() || "Pangkat"} · {count}/5 pahiwatig</Text>
        <View style={styles.reviewStamp}><MaterialCommunityIcons name="file-document-outline" size={20} color="#36573E" /><Text accessibilityLiveRegion="polite" style={styles.reviewStampText}>{completed ? "Handa nang ipasuri" : "Draft ng ulat"}</Text></View>
        <Text style={styles.reportNote}>Ipakita ang ulat sa guro. Ang mga tala ay hindi pa namamarkahan.</Text>
        {missions.map((item, index) => <View key={item.title} style={styles.reportSection}>
          <Text style={styles.reportTitle}>{String(index + 1).padStart(2, "0")} · {item.title}</Text>
          <Text style={styles.reportLabel}>SAGOT</Text><Text selectable style={styles.reportText}>{responses[`element-${index}`]?.trim() || "Wala pang sagot."}</Text>
          <Text style={styles.reportLabel}>PATUNAY</Text><Text selectable style={styles.reportText}>{responses[`proof-${index}`]?.trim() || "Wala pang patunay."}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Baguhin: ${item.title}`} onPress={() => openMission(index)} style={styles.editButton}><MaterialCommunityIcons name="pencil-outline" size={16} color="#36573E" /><Text style={styles.toolText}>Baguhin ang tala</Text></Pressable>
        </View>)}
        {!completed && <Pressable accessibilityRole="button" onPress={finish} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Ihanda para sa guro</Text><MaterialCommunityIcons name="arrow-right" size={18} color="#FFEDBE" /></Pressable>}
        <Text style={styles.reportNote}>{completed ? "Naka-save sa device na ito. Maaari pa ring baguhin ang mga tala." : "Punan ang limang sagot at patunay bago ihanda ang ulat."}</Text>
      </View>
    </>}

    <Modal visible={peek} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={() => setPeek(false)}>
      <SafeAreaView style={styles.modalBackdrop}>
        <View accessibilityViewIsModal role="dialog" aria-modal={true} accessibilityLabel="Silip sa kuwento" style={styles.storySheet}>
          <View style={styles.storyHeader}><View style={styles.storyHeaderCopy}><Text style={styles.caseNumber}>SILIP SA KUWENTO</Text><Text accessibilityRole="header" style={styles.storyTitle}>{story.title}</Text><Text style={styles.storyAuthor}>{story.author}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Isara ang silip sa kuwento" onPress={() => setPeek(false)} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#294437" /></Pressable></View>
          <ScrollView key={sceneIndex} contentContainerStyle={styles.storyContent}><Text accessibilityRole="header" style={styles.question}>{scene?.title}</Text>{scene?.paragraphs.map((paragraph, index) => <Text key={index} selectable style={styles.storyParagraph}>{paragraph}</Text>)}</ScrollView>
          <View style={styles.storyNavigation}>
            <Pressable accessibilityRole="button" accessibilityLabel="Naunang bahagi ng kuwento" disabled={sceneIndex === 0} onPress={() => setSceneIndex(value => value - 1)} style={[styles.sceneArrow, sceneIndex === 0 && styles.disabled]}><MaterialCommunityIcons name="arrow-left" size={20} color="#36573E" /></Pressable>
            <Text accessibilityLiveRegion="polite" style={styles.sceneCount}>Bahagi {sceneIndex + 1} / {story.scenes.length}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Susunod na bahagi ng kuwento" disabled={sceneIndex === story.scenes.length - 1} onPress={() => setSceneIndex(value => value + 1)} style={[styles.sceneArrow, sceneIndex === story.scenes.length - 1 && styles.disabled]}><MaterialCommunityIcons name="arrow-right" size={20} color="#36573E" /></Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setPeek(false)} style={styles.resume}><Text style={styles.toolText}>Bumalik sa ebidensya</Text></Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 26 }, pressed: { opacity: 0.82 }, disabled: { opacity: 0.3 },
  brief: { flexDirection: "row", alignItems: "flex-start", gap: 13 }, briefCopy: { flex: 1 },
  detectiveSeal: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#A88B54", backgroundColor: "#2E5140", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#CBB685", fontSize: 10, letterSpacing: 1.3, fontWeight: "800" }, heading: { color: "#FFEDBE", fontSize: 22, lineHeight: 29, fontWeight: "800", marginTop: 6 },
  intro: { color: "#C8D4B7", fontSize: 13, lineHeight: 21, marginTop: 8 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 9 }, progressText: { color: "#ECDBB2", fontSize: 12, lineHeight: 19, fontWeight: "700" },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#355748", marginBottom: 24, overflow: "hidden" }, progressFill: { height: 5, backgroundColor: "#DBBD77" },
  cornice: { height: 12, borderRadius: 3, backgroundColor: "#B28A51", borderTopWidth: 3, borderTopColor: "#D9B879" },
  cabinet: { marginHorizontal: 5, paddingHorizontal: 10, paddingTop: 13, paddingBottom: 16, backgroundColor: "#443122", borderLeftWidth: 5, borderRightWidth: 5, borderColor: "#957044", gap: 14 },
  drawerSlot: { paddingTop: 3, paddingBottom: 7, backgroundColor: "#2D261C", borderRadius: 3 },
  drawer: { minHeight: 83, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 11, backgroundColor: "#775238", borderWidth: 2, borderTopColor: "#C8A16A", borderRightColor: "#9B7248", borderBottomColor: "#553D2B", borderLeftColor: "#9B7248", borderRadius: 3 },
  filedPaper: { position: "absolute", top: -3, left: 38, right: 33, height: 22, backgroundColor: "#EBD8A5", borderRadius: 2 }, paperTab: { position: "absolute", top: -4, left: 10, width: 44, height: 7, backgroundColor: "#EBD8A5", borderRadius: 2 },
  drawerNumber: { width: 27, height: 31, alignItems: "center", justifyContent: "center", backgroundColor: "#BA965C", borderWidth: 1, borderColor: "#E1BF7C", borderRadius: 3 }, drawerNumberText: { color: "#3F3423", fontSize: 11, fontWeight: "900" },
  drawerCopy: { flex: 1 }, drawerTitle: { color: "#FFF0CB", fontSize: 15, lineHeight: 21, fontWeight: "800" }, drawerStatus: { flexDirection: "row", gap: 5, alignItems: "center", marginTop: 5 }, drawerStatusText: { color: "#EAD1A0", fontSize: 10, lineHeight: 16, flexShrink: 1 },
  handle: { width: 20, height: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#573C29", borderRadius: 3 }, handleBar: { height: 18, width: 5, borderRadius: 3, backgroundColor: "#D9B776" },
  plinth: { height: 11, backgroundColor: "#AD834C", borderTopWidth: 2, borderTopColor: "#D0A467", borderRadius: 2 }, feet: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18 }, foot: { height: 14, width: 21, backgroundColor: "#967044", borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  notice: { color: "#D9E8C0", fontSize: 12, lineHeight: 20, marginTop: 14 },
  example: { backgroundColor: "#2B4C3D", borderRadius: 10, marginTop: 20 }, helpButton: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 49, padding: 13 }, helpText: { flex: 1, color: "#EBD197", fontSize: 13, fontWeight: "700" }, exampleBody: { paddingHorizontal: 14, paddingBottom: 16 }, exampleLabel: { color: "#BCCAAB", fontSize: 10, lineHeight: 17, letterSpacing: 0.7, fontWeight: "700" }, exampleText: { color: "#E6E6C8", fontSize: 14, lineHeight: 23, marginTop: 8 }, exampleNote: { color: "#BCCBAA", fontSize: 12, lineHeight: 19, marginTop: 10 },
  reportButton: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1, borderColor: "#7A855B", borderRadius: 12, marginTop: 20 }, reportButtonCopy: { flex: 1 }, reportButtonTitle: { color: "#EFDAA8", fontSize: 15, lineHeight: 22, fontWeight: "800" }, reportButtonNote: { color: "#C5D4B3", fontSize: 12, lineHeight: 19, marginTop: 4 },
  back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }, backText: { color: "#E8D09E", fontSize: 13, fontWeight: "700" },
  caseTabs: { flexDirection: "row", gap: 8, marginBottom: 25 }, caseTab: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: "#80906C", borderRadius: 7, alignItems: "center", justifyContent: "center" }, caseTabActive: { backgroundColor: "#E2C68B", borderColor: "#E2C68B" }, caseTabText: { color: "#E8D8B4", fontSize: 13, fontWeight: "800" }, caseTabTextActive: { color: "#314533" }, tabDot: { position: "absolute", right: 5, top: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: "#AAC68A" },
  paper: { padding: 20, backgroundColor: "#FFF3D4", borderRadius: 5, borderBottomWidth: 5, borderBottomColor: "#CEBD91" }, tape: { position: "absolute", top: -8, left: "39%", width: 64, height: 16, backgroundColor: "#C8B785", opacity: 0.75, transform: [{ rotate: "-3deg" }] },
  caseHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, caseNumber: { color: "#6F7558", fontSize: 10, lineHeight: 18, fontWeight: "800", letterSpacing: 1.1 }, caseType: { color: "#627150", fontSize: 12, lineHeight: 20, marginTop: 15, fontWeight: "700" }, question: { color: "#294437", fontSize: 23, lineHeight: 31, fontWeight: "800", marginTop: 7 },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 }, toolButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#C2C49F", borderRadius: 7, paddingHorizontal: 10 }, toolText: { color: "#36573E", fontSize: 12, lineHeight: 19, fontWeight: "700" }, hint: { backgroundColor: "#E8E6C8", padding: 12, color: "#405C3F", fontSize: 13, lineHeight: 22, borderRadius: 7, marginTop: 10 },
  field: { marginTop: 23 }, labelRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 }, label: { flex: 1, color: "#314D39", fontSize: 14, lineHeight: 22, fontWeight: "800" }, input: { minHeight: 116, borderWidth: 1, borderColor: "#C5C4A1", backgroundColor: "#FFFCF0", borderRadius: 7, padding: 13, fontSize: 16, lineHeight: 25, color: "#294437" }, inputError: { borderColor: "#A13F2B", borderWidth: 2 }, error: { color: "#963B29", fontSize: 12, lineHeight: 20, marginTop: 8 }, autoSave: { color: "#697257", fontSize: 11, lineHeight: 18, marginTop: 12 },
  primary: { minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 13, backgroundColor: "#224C3B", borderRadius: 9, marginTop: 22 }, primaryText: { flexShrink: 1, color: "#FFEDBE", fontSize: 14, lineHeight: 21, fontWeight: "800" },
  reportGroup: { color: "#6F7558", fontSize: 13, lineHeight: 21, marginTop: 10 }, reviewStamp: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#77956A", backgroundColor: "#E3E9CA", borderRadius: 4, padding: 10, marginTop: 18 }, reviewStampText: { flexShrink: 1, color: "#36573E", fontSize: 13, fontWeight: "800" }, reportNote: { color: "#697257", fontSize: 12, lineHeight: 21, marginTop: 11 }, reportSection: { borderTopWidth: 1, borderTopColor: "#D5C9A8", paddingTop: 18, marginTop: 22 }, reportTitle: { color: "#294437", fontSize: 16, lineHeight: 23, fontWeight: "800" }, reportLabel: { color: "#74765B", fontSize: 10, letterSpacing: 1, fontWeight: "800", marginTop: 15, marginBottom: 6 }, reportText: { color: "#354A37", fontSize: 15, lineHeight: 25 }, editButton: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", minHeight: 44, marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(8,28,24,0.85)", justifyContent: "center", alignItems: "center", padding: 16 }, storySheet: { width: "100%", maxWidth: 650, maxHeight: "95%", flexShrink: 1, backgroundColor: "#FFF3D4", borderRadius: 14, overflow: "hidden" }, storyHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 20, borderBottomWidth: 1, borderBottomColor: "#D5C9A8" }, storyHeaderCopy: { flex: 1 }, storyTitle: { color: "#294437", fontSize: 20, lineHeight: 27, fontWeight: "800" }, storyAuthor: { color: "#697257", fontSize: 12, marginTop: 4 }, close: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }, storyContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 }, storyParagraph: { color: "#354A37", fontSize: 16, lineHeight: 28, marginTop: 16 }, storyNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#D5C9A8" }, sceneArrow: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }, sceneCount: { color: "#52654A", fontSize: 12, fontWeight: "700" }, resume: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingBottom: 8 },
});
