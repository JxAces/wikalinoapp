import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityCabinetCard } from "@/components/story-cabinet/ActivityCabinetCard";
import { CharacterTransformationMap } from "@/components/story-cabinet/CharacterTransformationMap";
import { DetectiveActivity } from "@/components/story-cabinet/DetectiveActivity";
import { UgatCheckActivity } from "@/components/story-cabinet/UgatCheckActivity";
import { UgatActivityTreeCard } from "@/components/story-cabinet/UgatActivityTreeCard";
import { UgatExploreActivity, UgatTreeMapActivity } from "@/components/story-cabinet/UgatLearningActivities";
import { UtosActivityMenu } from "@/components/story-cabinet/UtosActivityMenu";
import { UtosConflictActivity } from "@/components/story-cabinet/UtosConflictActivity";
import { UtosMeaningsActivity, UtosSequenceActivity, UtosReflectionActivity } from "@/components/story-cabinet/UtosLearningActivities";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { canEnterStory, canOpenStoryActivities } from "@/components/story-world/quest-progression";
import { canOpenCabinetActivity, getCabinetActivities, isCabinetResponseComplete, type CabinetActivity } from "@/data/cabinet-activities";
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
  const [selection, setSelected] = useState<CabinetActivity | null>(null);
  const [cabinetWidth, setCabinetWidth] = useState(0);
  const saved = useUserStore(state => state.cabinetResponses);
  const activities = getCabinetActivities(story.id);
  const individualCabinets = story.id === "m1-story-1";
  const ugatTree = story.id === "m1-story-2";
  const utosCrown = story.id === "m1-story-3";
  const selected = selection && canOpenCabinetActivity(selection, saved) ? selection : null;
  const isCompleted = (activity: CabinetActivity) => {
    const response = saved[activity.id];
    return Boolean(response?.completedAt) && (!utosCrown ||
      response?.storyId === story.id && isCabinetResponseComplete(activity, response.responses));
  };
  const completed = activities.filter(isCompleted).length;
  const selectActivity = (activity: CabinetActivity) => {
    if (canOpenCabinetActivity(activity, saved)) setSelected(activity);
  };
  const crownMenu = utosCrown && (!selected || selected.id === 'utos-conflict');
  const woodMenu = individualCabinets && !selected;
  const ugatMenu = ugatTree && !selected;
  return <LinearGradient colors={AppTheme.backgroundGradient} style={styles.flex}><SafeAreaView style={styles.screen}>
    <View style={[styles.header, crownMenu && styles.parchmentHeader, woodMenu && styles.woodHeader, ugatMenu && styles.ugatMenuHeader]}>
      <Pressable accessibilityRole="button" accessibilityLabel={selected ? "Bumalik sa mga gawain" : "Bumalik sa aklat, mga gawain, at pagsusulit"} onPress={() => selected ? setSelected(null) : router.replace({ pathname: "/story-room", params: { storyId: story.id } })} style={[styles.back, crownMenu && styles.parchmentBack, woodMenu && styles.woodBack, ugatMenu && styles.ugatMenuBack]}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={AppTheme.primary} />
      </Pressable>
      <View style={styles.headerCopy}><WikalinoBrand color={AppTheme.text} /><Text style={styles.headerTitle}>{story.title} ni {story.author}</Text></View>
      <MaterialCommunityIcons name={utosCrown ? "crown-outline" : ugatTree ? "tree-outline" : "wardrobe-outline"} size={25} color={AppTheme.primary} />
    </View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} key={selected?.id ?? "cabinet"} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {selected ? <CabinetEditor key={selected.id} activity={selected} story={story} onBack={() => setSelected(null)} onNext={ugatTree && activities.indexOf(selected) < activities.length - 1 ? () => selectActivity(activities[activities.indexOf(selected) + 1]) : undefined} onFocusActivity={y => scroll.current?.scrollTo({ y, animated: false })} /> : utosCrown ? <UtosActivityMenu activities={activities.map(activity => ({ activity, completed: isCompleted(activity), hasDraft: Boolean(saved[activity.id]), locked: !canOpenCabinetActivity(activity, saved) }))} onSelect={selectActivity} /> : <View style={styles.inner}>
          {individualCabinets ? <>
            <Text style={styles.pathLabel}>SANDAANG DAMIT PATH</Text>
            <Text accessibilityRole="header" style={styles.title}>Suriin ang kuwento, magbigay ng patunay, at ipaliwanag ang iyong pananaw.</Text>
          </> : <>
            <Text accessibilityRole="header" style={[styles.title, ugatMenu && styles.ugatMenuText]}>{ugatTree ? "Suriin ang pinagmulan ng kwento" : "Buksan ang isang gawain"}</Text>
            <Text style={[styles.subtitle, ugatMenu && styles.ugatMenuBody]}>{ugatTree ? "Pindutin ang karatula upang magsimula" : "Suriin ang kuwento, magbigay ng patunay, at ipaliwanag ang iyong pananaw."}</Text>
          </>}
          {activities.length > 0 ? <>
            <Text style={[styles.progress, woodMenu && styles.woodCopy, ugatMenu && styles.ugatMenuBody]}>{completed}/{activities.length} gawaing kumpleto</Text>
            {ugatTree ? <UgatActivityTreeCard activities={activities.map(activity => ({ activity, completed: Boolean(saved[activity.id]?.completedAt), hasDraft: Boolean(saved[activity.id]) }))} onPress={setSelected} /> : <View onLayout={event => setCabinetWidth(event.nativeEvent.layout.width)} style={individualCabinets ? [styles.individualCabinets, cabinetWidth >= 620 && styles.cabinetRow] : styles.cabinet}>
              {activities.map((activity, index) => {
                const response = saved[activity.id];
                if (individualCabinets) return <ActivityCabinetCard key={activity.id} activity={activity} index={index} completed={Boolean(response?.completedAt)} hasDraft={Boolean(response)} compact={cabinetWidth < 620} onPress={() => setSelected(activity)} />;
                return <Pressable key={activity.id} accessibilityRole="button" accessibilityLabel={`Buksan ang ${activity.title}`} onPress={() => setSelected(activity)} style={({ pressed }) => [styles.compartment, response?.completedAt && styles.compartmentDone, pressed && styles.pressed]}>
                  <View style={styles.compartmentTop}><Text style={styles.number}>0{index + 1}</Text><MaterialCommunityIcons name={response?.completedAt ? "check-circle" : utosCrown ? "crown-outline" : "wardrobe-outline"} color={response?.completedAt ? AppTheme.primary : AppTheme.primary} size={25} /></View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityMode}>{activity.mode === "group" ? "Pangkatang gawain" : "Indibidwal na gawain"}</Text>
                  <View style={styles.compartmentBottom}><Text style={styles.activityStatus}>{response?.completedAt ? "Kumpleto · Balikan" : response ? "May draft · Ituloy" : "Buksan"}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={AppTheme.primary} /></View>
                </Pressable>;
              })}
            </View>}
          </> : <View style={styles.notice}><Text style={styles.noticeText}>Wala pang nakatalagang gawain sa kabinet ng kuwentong ito.</Text><Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: "/quest-world", params: { storyId: story.id } })} style={styles.primary}><Text style={styles.primaryText}>Pumunta sa pagsusulit</Text></Pressable></View>}
          <Text style={[styles.storageNote, woodMenu && styles.woodCopy, ugatMenu && styles.ugatMenuBody]}>Naka-save sa device na ito ang iyong mga sagot. Ipakita ang mga ito sa guro para sa pagsusuri.</Text>
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView></LinearGradient>;
}

function CabinetEditor({ activity, story, onBack, onNext, onFocusActivity }: { activity: CabinetActivity; story: Story; onBack: () => void; onNext?: () => void; onFocusActivity: (y: number) => void }) {
  const detectiveTop = useRef(0);
  const ugatMapTop = useRef(0);
  const saved = useUserStore(state => state.cabinetResponses[activity.id]);
  const profileGroup = useUserStore(state => state.profile?.pangkat ?? "");
  const saveResponse = useUserStore(state => state.saveCabinetResponse);
  const [responses, setResponses] = useState<Record<string, string>>(() => saved?.responses ?? {});
  const responsesRef = useRef(responses);
  const [groupName, setGroupName] = useState(() => saved?.groupName ?? profileGroup);
  const [showErrors, setShowErrors] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [message, setMessage] = useState("");
  const isTransformation = activity.id === "damit-transformation";
  const isUgatCheck = activity.id === "ugat-check";
  const isUgatExplore = activity.id === 'ugat-explore';
  const isUgatTreeMap = activity.id === 'ugat-tree-map';
  const isDetective = activity.id === "damit-detective";

  function changeAnswer(fieldId: string, value: string) {
    // Puzzle checks may save several fields during one event before React renders.
    const next = { ...responsesRef.current, [fieldId]: value };
    responsesRef.current = next;
    setResponses(next);
    setMessage("");
    saveResponse({ storyId: activity.storyId, activityId: activity.id, responses: next, groupName });
  }
  function complete() {
    const currentResponses = responsesRef.current;
    if (!isCabinetResponseComplete(activity, currentResponses)) { setShowErrors(true); setMessage(activity.id === 'utos-sequence' ? 'Ayusin ang anim na pangyayari sa tamang pagkakasunod-sunod. Gamitin ang bawat story card nang isang beses lamang.' : activity.storyId === 'm1-story-3' ? 'Tapusin ang bawat bahagi at suriin ang iyong mga sagot bago ipasa.' : "Punan ang lahat ng sagot at patunay bago tapusin ang gawain."); return; }
    saveResponse({ storyId: activity.storyId, activityId: activity.id, responses: currentResponses, groupName, complete: true });
    setShowErrors(false);
    setMessage(isUgatExplore ? 'Tapos na ang paggalugad. Maaari mong balikan ang mga pahiwatig anumang oras.' : isDetective ? "Kumpleto ang ulat. Naka-save sa device na ito; ipakita ito sa guro." : "Kumpleto at naka-save sa device na ito. Maaari nang ipakita sa guro.");
  }

  if (activity.id === 'utos-conflict') return <UtosConflictActivity
    activity={activity} responses={responses} onChange={changeAnswer} onComplete={complete}
    completed={Boolean(saved?.completedAt) && isCabinetResponseComplete(activity, responses)} hasDraft={Boolean(saved)} onBack={onBack}
    onViewChange={() => onFocusActivity(0)}
  />;

  const UtosActivity = activity.id === 'utos-meanings' ? UtosMeaningsActivity :
    activity.id === 'utos-sequence' ? UtosSequenceActivity : activity.id === 'utos-stand-up' ? UtosReflectionActivity : null;
  if (UtosActivity) return <View style={styles.inner}>
    <UtosActivity activity={activity} responses={responses} onChange={changeAnswer} onComplete={complete}
      completed={Boolean(saved?.completedAt) && isCabinetResponseComplete(activity, responses)} showErrors={showErrors} />
    {message ? <Text accessibilityRole={showErrors ? "alert" : "text"} accessibilityLiveRegion="polite" style={[styles.message, showErrors && styles.error]}>{message}</Text> : null}
    <Pressable accessibilityRole="button" onPress={onBack} style={[styles.secondary, styles.utosBack]}><Text style={styles.secondaryText}>Bumalik sa korona</Text></Pressable>
  </View>;

  return <View style={styles.inner}>
    {!isDetective && <>
      <Text style={styles.eyebrow}>{isTransformation ? "GAWAIN 02 · PANGKATANG GAWAIN" : activity.mode === "group" ? "PANGKATANG GAWAIN" : "INDIBIDWAL NA GAWAIN"}</Text>
      <Text accessibilityRole="header" style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>{activity.description}</Text>
    </>}
    <View style={styles.savedStatus} accessibilityLiveRegion="polite"><MaterialCommunityIcons name={saved?.completedAt ? isDetective ? "file-document-outline" : "check-circle-outline" : "content-save-outline"} size={17} color={AppTheme.primary} /><Text style={styles.savedText}>{saved?.completedAt ? "Kumpleto · Naka-save sa device" : saved ? "Draft · Naka-save sa device" : "Awtomatikong mase-save ang iyong sagot"}</Text></View>
    {activity.mode === "group" && <>
      <Text nativeID="cabinet-group-label" style={styles.label}>Pangalan ng pangkat (opsyonal)</Text>
      <TextInput accessibilityLabel="Pangalan ng pangkat (opsyonal)" accessibilityLabelledBy="cabinet-group-label" value={groupName} onChangeText={value => { setGroupName(value); saveResponse({ storyId: activity.storyId, activityId: activity.id, responses, groupName: value }); setMessage(""); }} placeholder="Pangalan ng inyong pangkat" placeholderTextColor={AppTheme.muted} style={styles.input} />
    </>}
    {activity.example && !isDetective && <View style={styles.example}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showExample }} onPress={() => setShowExample(value => !value)} style={styles.exampleButton}><MaterialCommunityIcons name="lightbulb-outline" size={18} color={AppTheme.primary} /><Text style={styles.exampleTitle}>{showExample ? "Itago ang halimbawa" : "Tingnan ang halimbawa"}</Text></Pressable>
      {showExample && <Text style={styles.exampleText}>Pangunahing Tauhan: {activity.example.answer}{"\n"}Patunay: {activity.example.evidence}</Text>}
    </View>}
    {isUgatExplore ? <UgatExploreActivity responses={responses} onChange={changeAnswer} onComplete={complete} completed={Boolean(saved?.completedAt)} /> : isUgatTreeMap ? <View onLayout={event => { ugatMapTop.current = event.nativeEvent.layout.y; }}><UgatTreeMapActivity responses={responses} onChange={changeAnswer} onComplete={complete} completed={Boolean(saved?.completedAt)} onViewChange={() => requestAnimationFrame(() => onFocusActivity(ugatMapTop.current))} /></View> : isDetective ? <View onLayout={event => { detectiveTop.current = event.nativeEvent.layout.y; }}><DetectiveActivity activity={activity} story={story} responses={responses} groupName={groupName} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} onViewChange={() => requestAnimationFrame(() => onFocusActivity(detectiveTop.current))} /></View> : isTransformation ? <CharacterTransformationMap fields={activity.fields} responses={responses} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} /> : isUgatCheck ? <UgatCheckActivity activity={activity} responses={responses} onChange={changeAnswer} onComplete={complete} showErrors={showErrors} completed={Boolean(saved?.completedAt)} /> : activity.fields.map((field, index) => {
      const value = responses[field.id] ?? "";
      const invalid = showErrors && (!value.trim() || Boolean(field.options && !field.options.some(option => option.value === value)));
      return <View key={field.id} style={styles.field}>
        <Text nativeID={`cabinet-label-${field.id}`} style={styles.label}>{index + 1}. {field.label}</Text>
        {field.options ? <View accessibilityRole="radiogroup" accessibilityLabel={field.label} style={styles.options}>
          {field.options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.value }} aria-checked={value === option.value} onPress={() => changeAnswer(field.id, option.value)} style={({ pressed }) => [styles.option, value === option.value && styles.optionSelected, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={option.icon ?? (value === option.value ? "radiobox-marked" : "radiobox-blank")} size={option.icon ? 29 : 20} color={value === option.value ? AppTheme.primary : AppTheme.primary} />
            <Text style={styles.optionText}>{option.label}</Text>
            {option.icon && value === option.value && <MaterialCommunityIcons name="check" size={20} color={AppTheme.primary} />}
          </Pressable>)}
        </View> : <TextInput accessibilityLabel={field.label} accessibilityLabelledBy={`cabinet-label-${field.id}`} value={value} onChangeText={text => changeAnswer(field.id, text)} multiline textAlignVertical="top" placeholder={field.placeholder ?? "Isulat ang iyong paliwanag batay sa kuwento…"} placeholderTextColor={AppTheme.muted} style={[styles.input, styles.multiline, invalid && styles.invalid]} />}
        {invalid && <Text style={styles.error}>Kailangan ang sagot sa bahaging ito.</Text>}
      </View>;
    })}
    {message ? <Text accessibilityRole={showErrors ? "alert" : "text"} accessibilityLiveRegion="polite" style={[styles.message, showErrors && styles.error]}>{message}</Text> : null}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondary}><Text style={styles.secondaryText}>{story.id === 'm1-story-3' ? 'Bumalik sa korona ng mga gawain' : story.id === 'm1-story-2' ? 'Bumalik sa puno ng gawain' : 'Bumalik'}</Text></Pressable>
      {onNext && <Pressable accessibilityRole="button" onPress={onNext} style={styles.secondary}><Text style={styles.secondaryText}>Susunod na gawain →</Text></Pressable>}
      {!isDetective && !isTransformation && !isUgatCheck && !isUgatExplore && !isUgatTreeMap && <Pressable accessibilityRole="button" accessibilityLabel="Ipasa" onPress={complete} style={styles.primary}><Text style={styles.primaryText}>Ipasa</Text></Pressable>}
    </View>
    <Text style={styles.storageNote}>{isUgatExplore ? 'Naka-save sa device ang mga pahiwatig na natingnan. Walang marka ang paggalugad na ito.' : 'Ang “kumpleto” ay nangangahulugang napunan ang gawain. Ang guro ang susuri sa nilalaman; wala pang awtomatikong marka o pagpapasa online.'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  utosBack: { alignSelf: 'flex-start', marginTop: 20 },
  ugatMenuScreen: { backgroundColor: AppTheme.background },
  ugatMenuHeader: { backgroundColor: AppTheme.panelStrong, borderBottomColor: AppTheme.border },
  ugatMenuBack: { backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border },
  ugatMenuText: { color: AppTheme.text },
  ugatMenuBody: { color: AppTheme.text },
  woodScreen: { backgroundColor: AppTheme.background },
  woodHeader: { backgroundColor: AppTheme.panelStrong, borderBottomColor: AppTheme.border },
  woodBack: { backgroundColor: AppTheme.surfaceSoft },
  woodCopy: { color: AppTheme.muted },
  parchmentScreen: { backgroundColor: AppTheme.background },
  parchmentHeader: { backgroundColor: AppTheme.panelStrong, borderBottomColor: AppTheme.border },
  parchmentBack: { backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border },
  parchmentText: { color: AppTheme.text },
  screen: { flex: 1 }, flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: AppTheme.border, backgroundColor: AppTheme.panelStrong },
  back: { width: 44, height: 44, backgroundColor: AppTheme.surfaceSoft, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 }, headerTitle: { color: AppTheme.text, fontSize: 16, lineHeight: 23, fontWeight: "800", marginTop: 4 },
  pathLabel: { color: AppTheme.text, fontSize: 10, letterSpacing: 1.5, fontWeight: "800", marginTop: 9 },
  eyebrow: { color: AppTheme.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 40, alignItems: "center" }, inner: { width: "100%", maxWidth: 720 },
  title: { color: AppTheme.text, fontSize: 27, lineHeight: 35, fontWeight: "900", marginTop: 9 },
  subtitle: { color: AppTheme.muted, fontSize: 14, lineHeight: 23, marginTop: 12 },
  progress: { color: AppTheme.text, fontSize: 12, marginTop: 24, marginBottom: 12 },
  individualCabinets: { gap: 14 }, cabinetRow: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  cabinet: { backgroundColor: AppTheme.surfaceSoft, borderWidth: 5, borderColor: AppTheme.border, borderRadius: 14, padding: 12, gap: 12 },
  compartment: { padding: 19, backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 7 },
  compartmentDone: { backgroundColor: AppTheme.successSurface, borderColor: AppTheme.border },
  compartmentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  number: { color: AppTheme.muted, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  activityTitle: { color: AppTheme.text, fontSize: 21, lineHeight: 28, fontWeight: "800" },
  activityMode: { color: AppTheme.muted, fontSize: 12, marginTop: 7 },
  compartmentBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 19 },
  activityStatus: { color: AppTheme.muted, fontSize: 12 }, pressed: { opacity: 0.75 },
  storageNote: { fontSize: 12, lineHeight: 20, color: AppTheme.muted, marginTop: 23 },
  notice: { padding: 20, backgroundColor: AppTheme.surfaceSoft, borderRadius: 14, marginTop: 25 }, noticeText: { fontSize: 15, lineHeight: 23, color: AppTheme.success, marginBottom: 18 },
  savedStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 19 }, savedText: { flex: 1, color: AppTheme.success, fontSize: 12 },
  label: { color: AppTheme.text, fontSize: 14, fontWeight: "700", lineHeight: 23, marginBottom: 8 },
  input: { backgroundColor: AppTheme.surface, color: AppTheme.text, borderRadius: 9, borderWidth: 2, borderColor: AppTheme.border, padding: 12, fontSize: 16, minHeight: 48 },
  multiline: { minHeight: 115, lineHeight: 25 }, invalid: { borderColor: AppTheme.error }, field: { marginTop: 22 },
  options: { gap: 10 }, option: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: AppTheme.surfaceSoft, padding: 15, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 10 },
  optionSelected: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary }, optionText: { flex: 1, fontSize: 15, lineHeight: 23, color: AppTheme.text },
  example: { backgroundColor: AppTheme.panel, padding: 13, marginTop: 19, borderRadius: 12 }, exampleButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9 }, exampleTitle: { color: AppTheme.text, fontSize: 13, fontWeight: "700" }, exampleText: { color: AppTheme.text, fontSize: 14, lineHeight: 24, paddingBottom: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 25 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", padding: 13, backgroundColor: AppTheme.primary, borderRadius: 11 }, primaryText: { color: AppTheme.buttonText, fontWeight: "800", fontSize: 14 },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", padding: 13, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 11 }, secondaryText: { color: AppTheme.text, fontSize: 14, fontWeight: "700" },
  message: { color: AppTheme.text, fontSize: 13, lineHeight: 21, marginTop: 18 }, error: { color: AppTheme.error, fontSize: 12, lineHeight: 20, marginTop: 8 },
});
