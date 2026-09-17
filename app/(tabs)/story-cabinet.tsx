import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityCabinetCard } from "@/components/story-cabinet/ActivityCabinetCard";
import { CharacterTransformationMap } from "@/components/story-cabinet/CharacterTransformationMap";
import { DetectiveActivity } from "@/components/story-cabinet/DetectiveActivity";
import { UgatCheckActivity } from "@/components/story-cabinet/UgatCheckActivity";
import { UgatActivityTreeCard } from "@/components/story-cabinet/UgatActivityTreeCard";
import { canEnterStory, canOpenStoryActivities } from "@/components/story-world/quest-progression";
import { getCabinetActivities, isCabinetResponseComplete, type CabinetActivity } from "@/data/cabinet-activities";
import { getStoryById, type Story } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";

export default function StoryCabinetScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const focused = useIsFocused();
  const answers = useUserStore(state => state.activityResults);
  const reading = useUserStore(state => state.readingCompletedStoryIds);
  const story = getStoryById(storyId);
  if (!focused) return null;
  if (!story || !canEnterStory(story.id, answers)) return <Redirect href="/landing" />;
  if (!canOpenStoryActivities(story.id, reading, answers)) return <Redirect href={{ pathname: "/story-room", params: { storyId: story.id } }} />;
  return <Cabinet key={story.id} story={story} />;
}

function Cabinet({ story }: { story: Story }) {
  const scroll = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<CabinetActivity | null>(null);
  const [cabinetWidth, setCabinetWidth] = useState(0);
  const saved = useUserStore(state => state.cabinetResponses);
  const activities = getCabinetActivities(story.id);
  const completed = activities.filter(activity => saved[activity.id]?.completedAt).length;
  const individualCabinets = story.id === "m1-story-1";
  const ugatTree = story.id === "m1-story-2";
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={selected ? ugatTree ? "Bumalik sa puno ng gawain" : "Bumalik sa kabinet" : "Bumalik sa aklat, mga gawain, at balumbon"} onPress={() => selected ? setSelected(null) : router.replace({ pathname: "/story-room", params: { storyId: story.id } })} style={styles.back}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#F8E7B5" />
      </Pressable>
      <View style={styles.headerCopy}><Text style={styles.eyebrow}>{ugatTree ? "PUNO NG MGA GAWAIN" : "KABINET NG MGA GAWAIN"}</Text><Text style={styles.headerTitle}>{story.title}</Text></View>
      <MaterialCommunityIcons name={ugatTree ? "tree-outline" : "wardrobe-outline"} size={25} color="#E4C57F" />
    </View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} key={selected?.id ?? "cabinet"} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {selected ? <CabinetEditor key={selected.id} activity={selected} story={story} onBack={() => setSelected(null)} onFocusActivity={y => scroll.current?.scrollTo({ y, animated: false })} /> : <View style={styles.inner}>
          <Text accessibilityRole="header" style={styles.title}>{ugatTree ? "Tuklasin ang ugat ng kuwento" : "Buksan ang isang gawain"}</Text>
          <Text style={styles.subtitle}>{ugatTree ? "Pumili ng karatula upang simulan ang gawain." : "Suriin ang kuwento, magbigay ng patunay, at ipaliwanag ang iyong pananaw."}</Text>
          {activities.length > 0 ? <>
            <Text style={styles.progress}>{completed}/{activities.length} gawaing kumpleto</Text>
            {individualCabinets && <Text style={styles.cabinetHint}>Bubukas ang bawat kabinet kapag natapos ang gawain.</Text>}
            {ugatTree ? <UgatActivityTreeCard activities={activities.map(activity => ({ activity, completed: Boolean(saved[activity.id]?.completedAt), hasDraft: Boolean(saved[activity.id]) }))} onPress={setSelected} /> : <View onLayout={event => setCabinetWidth(event.nativeEvent.layout.width)} style={individualCabinets ? [styles.individualCabinets, cabinetWidth >= 620 && styles.cabinetRow] : styles.cabinet}>
              {activities.map((activity, index) => {
                const response = saved[activity.id];
                if (individualCabinets) return <ActivityCabinetCard key={activity.id} activity={activity} index={index} completed={Boolean(response?.completedAt)} hasDraft={Boolean(response)} compact={cabinetWidth < 620} onPress={() => setSelected(activity)} />;
                return <Pressable key={activity.id} accessibilityRole="button" accessibilityLabel={`Buksan ang ${activity.title}`} onPress={() => setSelected(activity)} style={({ pressed }) => [styles.compartment, response?.completedAt && styles.compartmentDone, pressed && styles.pressed]}>
                  <View style={styles.compartmentTop}><Text style={styles.number}>0{index + 1}</Text><MaterialCommunityIcons name={response?.completedAt ? "check-circle" : "wardrobe-outline"} color={response?.completedAt ? "#BFE0A3" : "#F3D898"} size={25} /></View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityMode}>{activity.mode === "group" ? "Pangkatang gawain" : "Indibidwal na gawain"}</Text>
                  <View style={styles.compartmentBottom}><Text style={styles.activityStatus}>{response?.completedAt ? "Kumpleto · Balikan" : response ? "May draft · Ituloy" : "Buksan"}</Text><MaterialCommunityIcons name="arrow-right" size={18} color="#F3D898" /></View>
                </Pressable>;
              })}
            </View>}
          </> : <View style={styles.notice}><Text style={styles.noticeText}>Wala pang nakatalagang gawain sa kabinet ng kuwentong ito.</Text><Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: "/quest-world", params: { storyId: story.id } })} style={styles.primary}><Text style={styles.primaryText}>Pumunta sa pagsusulit</Text></Pressable></View>}
          <Text style={styles.storageNote}>Naka-save sa device na ito ang iyong mga sagot. Ipakita ang mga ito sa guro para sa pagsusuri.</Text>
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function CabinetEditor({ activity, story, onBack, onFocusActivity }: { activity: CabinetActivity; story: Story; onBack: () => void; onFocusActivity: (y: number) => void }) {
  const detectiveTop = useRef(0);
  const saved = useUserStore(state => state.cabinetResponses[activity.id]);
  const profileGroup = useUserStore(state => state.profile?.pangkat ?? "");
  const saveResponse = useUserStore(state => state.saveCabinetResponse);
  const [responses, setResponses] = useState<Record<string, string>>(() => saved?.responses ?? {});
  const [groupName, setGroupName] = useState(() => saved?.groupName ?? profileGroup);
  const [showErrors, setShowErrors] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [message, setMessage] = useState("");
  const isTransformation = activity.id === "damit-transformation";
  const isUgatCheck = activity.id === "ugat-check";
  const isDetective = activity.id === "damit-detective";

  function changeAnswer(fieldId: string, value: string) {
    const next = { ...responses, [fieldId]: value };
    setResponses(next);
    setMessage("");
    saveResponse({ storyId: activity.storyId, activityId: activity.id, responses: next, groupName });
  }
  function complete() {
    if (!isCabinetResponseComplete(activity, responses)) { setShowErrors(true); setMessage("Punan ang lahat ng sagot at patunay bago tapusin ang gawain."); return; }
    saveResponse({ storyId: activity.storyId, activityId: activity.id, responses, groupName, complete: true });
    setShowErrors(false);
    setMessage(isDetective ? "Handa nang ipasuri ang ulat. Naka-save sa device na ito; ipakita ito sa guro." : "Kumpleto at naka-save sa device na ito. Maaari nang ipakita sa guro.");
  }

  return <View style={styles.inner}>
    <Text style={styles.eyebrow}>{isTransformation ? "GAWAIN 02 · PANGKATANG GAWAIN" : activity.mode === "group" ? "PANGKATANG GAWAIN" : "INDIBIDWAL NA GAWAIN"}</Text>
    <Text accessibilityRole="header" style={styles.title}>{activity.title}</Text>
    <Text style={styles.subtitle}>{isDetective ? "Limang pahiwatig, isang kuwento. Tuklasin ang Sandaang Damit bilang pangkat." : activity.description}</Text>
    <View style={styles.savedStatus} accessibilityLiveRegion="polite"><MaterialCommunityIcons name={saved?.completedAt ? isDetective ? "file-document-outline" : "check-circle-outline" : "content-save-outline"} size={17} color="#C5DFAA" /><Text style={styles.savedText}>{saved?.completedAt ? isDetective ? "Handa nang ipasuri · Naka-save sa device" : "Kumpleto · Naka-save sa device" : saved ? "Draft · Naka-save sa device" : "Awtomatikong mase-save ang iyong sagot"}</Text></View>
    {activity.mode === "group" && <>
      <Text nativeID="cabinet-group-label" style={styles.label}>Pangalan ng pangkat (opsyonal)</Text>
      <TextInput accessibilityLabel="Pangalan ng pangkat (opsyonal)" accessibilityLabelledBy="cabinet-group-label" value={groupName} onChangeText={value => { setGroupName(value); saveResponse({ storyId: activity.storyId, activityId: activity.id, responses, groupName: value }); setMessage(""); }} placeholder="Pangalan ng inyong pangkat" placeholderTextColor="#74806B" style={styles.input} />
    </>}
    {activity.example && !isDetective && <View style={styles.example}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showExample }} onPress={() => setShowExample(value => !value)} style={styles.exampleButton}><MaterialCommunityIcons name="lightbulb-outline" size={18} color="#EBD197" /><Text style={styles.exampleTitle}>{showExample ? "Itago ang halimbawa" : "Tingnan ang halimbawa"}</Text></Pressable>
      {showExample && <Text style={styles.exampleText}>Pangunahing Tauhan: {activity.example.answer}{"\n"}Patunay: {activity.example.evidence}</Text>}
    </View>}
    {isDetective ? <View onLayout={event => { detectiveTop.current = event.nativeEvent.layout.y; }}><DetectiveActivity activity={activity} story={story} responses={responses} groupName={groupName} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} onViewChange={() => requestAnimationFrame(() => onFocusActivity(detectiveTop.current))} /></View> : isTransformation ? <CharacterTransformationMap fields={activity.fields} responses={responses} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} /> : isUgatCheck ? <UgatCheckActivity activity={activity} responses={responses} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} /> : activity.fields.map((field, index) => {
      const value = responses[field.id] ?? "";
      const invalid = showErrors && (!value.trim() || Boolean(field.options && !field.options.some(option => option.value === value)));
      return <View key={field.id} style={styles.field}>
        <Text nativeID={`cabinet-label-${field.id}`} style={styles.label}>{index + 1}. {field.label}</Text>
        {field.options ? <View accessibilityRole="radiogroup" accessibilityLabel={field.label} style={styles.options}>
          {field.options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.value }} onPress={() => changeAnswer(field.id, option.value)} style={({ pressed }) => [styles.option, value === option.value && styles.optionSelected, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={option.icon ?? (value === option.value ? "radiobox-marked" : "radiobox-blank")} size={option.icon ? 29 : 20} color={value === option.value ? "#EED498" : "#BFCAA9"} />
            <Text style={styles.optionText}>{option.label}</Text>
            {option.icon && value === option.value && <MaterialCommunityIcons name="check" size={20} color="#EED498" />}
          </Pressable>)}
        </View> : <TextInput accessibilityLabel={field.label} accessibilityLabelledBy={`cabinet-label-${field.id}`} value={value} onChangeText={text => changeAnswer(field.id, text)} multiline textAlignVertical="top" placeholder={field.placeholder ?? "Isulat ang iyong paliwanag batay sa kuwento…"} placeholderTextColor="#74806B" style={[styles.input, styles.multiline, invalid && styles.invalid]} />}
        {invalid && <Text style={styles.error}>Kailangan ang sagot sa bahaging ito.</Text>}
      </View>;
    })}
    {message ? <Text accessibilityRole={showErrors ? "alert" : "text"} accessibilityLiveRegion="polite" style={[styles.message, showErrors && styles.error]}>{message}</Text> : null}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondary}><Text style={styles.secondaryText}>Bumalik sa kabinet</Text></Pressable>
      {!isDetective && !isTransformation && !isUgatCheck && <Pressable accessibilityRole="button" accessibilityLabel="Tapusin ang gawain" onPress={complete} style={styles.primary}><Text style={styles.primaryText}>{saved?.completedAt ? "Naka-save na" : "Tapusin ang gawain"}</Text></Pressable>}
    </View>
    <Text style={styles.storageNote}>Ang “kumpleto” ay nangangahulugang napunan ang gawain. Ang guro ang susuri sa nilalaman; wala pang awtomatikong marka o pagpapasa online.</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#173C34" }, flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#38584A" },
  back: { width: 44, height: 44, backgroundColor: "#315346", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 }, headerTitle: { color: "#F6E9BD", fontSize: 16, fontWeight: "800", marginTop: 4 },
  eyebrow: { color: "#C5CAA7", fontSize: 10, letterSpacing: 1.2, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 40, alignItems: "center" }, inner: { width: "100%", maxWidth: 720 },
  title: { color: "#FFEBB6", fontSize: 27, lineHeight: 35, fontWeight: "900", marginTop: 9 },
  subtitle: { color: "#CDD9BD", fontSize: 14, lineHeight: 23, marginTop: 12 },
  progress: { color: "#D9E5C0", fontSize: 12, marginTop: 24, marginBottom: 12 },
  cabinetHint: { color: "#BACBB0", fontSize: 12, lineHeight: 20, marginBottom: 14 },
  individualCabinets: { gap: 14 }, cabinetRow: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  cabinet: { backgroundColor: "#5E422E", borderWidth: 5, borderColor: "#A98552", borderRadius: 14, padding: 12, gap: 12 },
  compartment: { padding: 19, backgroundColor: "#765537", borderWidth: 1, borderColor: "#C5A06A", borderRadius: 7 },
  compartmentDone: { backgroundColor: "#314C36", borderColor: "#91AE70" },
  compartmentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  number: { color: "#DABD84", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  activityTitle: { color: "#FFF0C6", fontSize: 21, lineHeight: 28, fontWeight: "800" },
  activityMode: { color: "#E2D4B0", fontSize: 12, marginTop: 7 },
  compartmentBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 19 },
  activityStatus: { color: "#F0DBA6", fontSize: 12 }, pressed: { opacity: 0.75 },
  storageNote: { fontSize: 12, lineHeight: 20, color: "#BACBB0", marginTop: 23 },
  notice: { padding: 20, backgroundColor: "#2C4D40", borderRadius: 14, marginTop: 25 }, noticeText: { fontSize: 15, lineHeight: 23, color: "#DFE8C8", marginBottom: 18 },
  savedStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 19 }, savedText: { flex: 1, color: "#C5DFAA", fontSize: 12 },
  label: { color: "#F5E7BB", fontSize: 14, fontWeight: "700", lineHeight: 23, marginBottom: 8 },
  input: { backgroundColor: "#FFF7E1", color: "#293C2C", borderRadius: 9, borderWidth: 2, borderColor: "#DDCC9D", padding: 12, fontSize: 16, minHeight: 48 },
  multiline: { minHeight: 115, lineHeight: 25 }, invalid: { borderColor: "#F3AFA3" }, field: { marginTop: 22 },
  options: { gap: 10 }, option: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#2A4B3D", padding: 15, borderWidth: 1, borderColor: "#637557", borderRadius: 10 },
  optionSelected: { backgroundColor: "#465F3C", borderColor: "#E2C581" }, optionText: { flex: 1, fontSize: 15, lineHeight: 23, color: "#F4ECD0" },
  example: { backgroundColor: "#2E4D3C", padding: 13, marginTop: 19, borderRadius: 12 }, exampleButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9 }, exampleTitle: { color: "#EBD197", fontSize: 13, fontWeight: "700" }, exampleText: { color: "#D7E0BD", fontSize: 14, lineHeight: 24, paddingBottom: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 25 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", padding: 13, backgroundColor: "#E7C77F", borderRadius: 11 }, primaryText: { color: "#253C2C", fontWeight: "800", fontSize: 14 },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", padding: 13, borderWidth: 1, borderColor: "#6C7C58", borderRadius: 11 }, secondaryText: { color: "#EBDFB7", fontSize: 14, fontWeight: "700" },
  message: { color: "#D4EABC", fontSize: 13, lineHeight: 21, marginTop: 18 }, error: { color: "#FFC3B5", fontSize: 12, lineHeight: 20, marginTop: 8 },
});
