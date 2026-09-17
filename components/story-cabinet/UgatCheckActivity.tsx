import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type KeyboardEvent } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";

import type { CabinetActivity, CabinetField } from "@/data/cabinet-activities";

type Props = {
  activity: CabinetActivity;
  responses: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
  showErrors: boolean;
  completed: boolean;
};

const steps = ["Piliin", "Patunayan", "Pagnilayan"];
const choiceTitles = ["Literal", "Panlipunan", "Lipunan at sarili"];
const rootPaths = [
  "M300 0 C270 28 100 16 100 64 M185 27 Q155 43 151 55",
  "M300 0 C290 20 310 37 300 64 M301 29 Q326 37 335 54",
  "M300 0 C330 28 500 16 500 64 M413 27 Q444 42 450 55",
];

// React Native Web's Pressable handles Enter; radio/tab roles also need Space and arrow keys.
function selectionKeys(index: number, role: "radio" | "tab", select: (index: number) => void) {
  if (Platform.OS !== "web") return {};
  return { onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
    const peers = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(`[role="${role}"]`);
    if (!peers?.length) return;
    let next: number;
    if (event.key === " " || event.key === "Spacebar") next = index;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % peers.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + peers.length - 1) % peers.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = peers.length - 1;
    else return;
    event.preventDefault();
    select(next);
    peers[next].focus();
  } };
}

/** Tree-and-roots presentation of the existing Ugat Check response fields. */
export function UgatCheckActivity({ activity, responses, onChange, onComplete, showErrors, completed }: Props) {
  const [step, setStep] = useState(0);
  const [width, setWidth] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const compact = width < 540;
  const [interpretation, firstProof, secondProof, reflection] = activity.fields;
  const options = interpretation.options ?? [];
  const selected = options.findIndex(option => option.value === responses[interpretation.id]);
  const hasEvidence = Boolean(responses[firstProof.id]?.trim() && responses[secondProof.id]?.trim());
  const hasReflection = Boolean(responses[reflection.id]?.trim());
  const errors = attempted || showErrors;
  const done = [selected !== -1, hasEvidence, hasReflection];

  function goTo(next: number) {
    if (next > 0 && selected === -1) { setAttempted(true); setStep(0); return; }
    if (next > 1 && !hasEvidence) { setAttempted(true); setStep(1); return; }
    setStep(next);
    setAttempted(false);
  }

  function finish() {
    setAttempted(true);
    if (selected === -1) setStep(0);
    else if (!hasEvidence) setStep(1);
    else if (!hasReflection) setStep(2);
    else { setStep(3); setAttempted(false); }
    onComplete();
  }

  function renderInput(field: CabinetField, label = field.label) {
    const invalid = errors && !responses[field.id]?.trim();
    return <View key={field.id} style={styles.field}>
      <Text nativeID={`ugat-check-${field.id}`} style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={field.label}
        accessibilityLabelledBy={`ugat-check-${field.id}`}
        value={responses[field.id] ?? ""}
        onChangeText={value => onChange(field.id, value)}
        multiline
        textAlignVertical="top"
        placeholder={field.placeholder ?? "Iugnay ang inyong mga patunay sa kaniyang napagtanto…"}
        placeholderTextColor="#68755C"
        style={[styles.input, invalid && styles.invalid]}
      />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Kailangan ang sagot sa bahaging ito.</Text>}
    </View>;
  }

  return <View style={styles.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View accessibilityRole="tablist" accessibilityLabel="Mga hakbang ng Ugat Check" style={styles.steps}>
      {steps.map((label, index) => <Pressable
        key={label}
        accessibilityRole="tab"
        accessibilityLabel={`${index + 1}. ${label}`}
        aria-selected={step === index}
        onPress={() => goTo(index)}
        {...selectionKeys(index, "tab", goTo)}
        style={({ pressed }) => [styles.step, step === index && styles.stepActive, pressed && styles.pressed]}
      >
        <View style={[styles.stepNumber, step === index && styles.stepNumberActive]}><Text style={[styles.stepNumberText, step === index && styles.stepActiveText]}>{index + 1}</Text></View>
        <Text style={[styles.stepText, step === index && styles.stepActiveText]}>{label}</Text>
        {done[index] && !compact && <MaterialCommunityIcons name="check" size={15} color={step === index ? "#294437" : "#DFEBCB"} />}
      </Pressable>)}
    </View>

    {step === 0 ? <View style={styles.paper}>
      <Text accessibilityRole="header" style={styles.question}>Ano ang kahulugan ng “ugat” sa kuwento?</Text>
      <View pointerEvents="none" accessible={false} style={styles.tree}>
        <Svg width="220" height="160" viewBox="0 0 220 160" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
          <Path d="M101 72 H117 L116 130 L126 160 H94 L103 127 Z M109 126 L77 80 L82 76 L113 107 M113 111 L142 76 L147 80 L116 125" fill="#806447" />
          <Ellipse cx="62" cy="69" rx="50" ry="40" fill="#779768" />
          <Ellipse cx="163" cy="65" rx="48" ry="44" fill="#779768" />
          <Ellipse cx="109" cy="48" rx="59" ry="48" fill="#50794B" />
          <Path d="M49 63 Q57 47 76 47 M127 30 Q147 35 153 49" fill="none" stroke="#A9BE8D" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
        </Svg>
      </View>
      <View style={styles.earth}>
        <View pointerEvents="none" accessible={false} style={[styles.roots, compact && styles.rootsCompact]}>
          <Svg width="100%" height="100%" viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
            {rootPaths.map((d, index) => <Path key={index} d={d} fill="none" stroke={selected === index ? "#345D37" : "#9A8764"} strokeWidth={selected === index ? 4 : 2.5} opacity={selected === index ? 1 : 0.6} />)}
          </Svg>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={interpretation.label} style={[styles.choices, compact && styles.choicesCompact]}>
          {options.map((option, index) => <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            aria-checked={selected === index}
            onPress={() => { if (selected !== index) onChange(interpretation.id, option.value); }}
            {...selectionKeys(index, "radio", next => { if (selected !== next) onChange(interpretation.id, options[next].value); })}
            style={({ pressed }) => [styles.choice, compact ? styles.choiceCompact : styles.choiceWide, selected === index && styles.choiceSelected, pressed && styles.pressed]}
          >
            <View style={[styles.choiceLetter, compact && styles.choiceLetterCompact]}>
              <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
              <MaterialCommunityIcons name={selected === index ? "radiobox-marked" : "radiobox-blank"} size={19} color="#345D37" />
            </View>
            <View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{choiceTitles[index]}</Text><Text style={styles.choiceDescription}>{option.label.replace(/^[A-C]\.\s*/, "")}</Text></View>
          </Pressable>)}
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.selection}>{selected === -1 ? "Pumili ng isang interpretasyon sa mga ugat." : `Napili: ${String.fromCharCode(65 + selected)} · ${choiceTitles[selected]}`}</Text>
      {errors && selected === -1 && <Text accessibilityRole="alert" style={styles.error}>Pumili muna ng interpretasyon.</Text>}
      <View style={styles.actions}><Text style={styles.autoSave}>{selected === -1 ? "Awtomatikong mase-save ang pinili." : "Awtomatikong naka-save ang pinili."}</Text><Pressable accessibilityRole="button" accessibilityLabel="Magbigay ng patunay" onPress={() => goTo(1)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Magbigay ng patunay</Text><MaterialCommunityIcons name="arrow-right" size={17} color="#FFEDBE" /></Pressable></View>
    </View> : step === 1 || step === 2 ? <View style={styles.paper}>
      <View style={styles.selectedSummary}><MaterialCommunityIcons name="source-branch" size={18} color="#345D37" /><Text style={styles.selectedSummaryText}>{options[selected]?.label}</Text></View>
      <Text accessibilityRole="header" style={styles.question}>{step === 1 ? "Anong mga detalye ang sumusuporta rito?" : reflection.label}</Text>
      {step === 1 ? <>{renderInput(firstProof)}{renderInput(secondProof)}</> : renderInput(reflection, "Paliwanag ng pangkat")}
      <Text style={styles.fieldNote}>Ibatay ang sagot sa mga pangyayari at detalye mula sa kuwento.</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? "Palitan ang pinili" : "Balikan ang patunay"} onPress={() => goTo(step - 1)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-left" size={16} color="#345D37" /><Text style={styles.secondaryText}>{step === 1 ? "Palitan ang pinili" : "Balikan ang patunay"}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? "Pagnilayan" : "Tapusin ang gawain"} onPress={step === 1 ? () => goTo(2) : finish} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{step === 1 ? "Pagnilayan" : completed ? "Naka-save na" : "Tapusin ang gawain"}</Text><MaterialCommunityIcons name={step === 1 ? "arrow-right" : "check"} size={17} color="#FFEDBE" /></Pressable>
      </View>
    </View> : <View style={styles.paper}>
      <View style={styles.reviewHeading}><MaterialCommunityIcons name="check-circle-outline" size={25} color="#345D37" /><Text accessibilityRole="header" style={styles.question}>Mga sagot ng pangkat</Text></View>
      <Text style={styles.fieldNote}>{completed ? "Kumpleto at naka-save sa device. Maaari nang ipakita sa guro." : "Draft na naka-save sa device. Balikan ang mga sagot upang tapusin ang gawain."}</Text>
      {activity.fields.map(field => <View key={field.id} style={styles.reviewField}><Text style={styles.label}>{field.label}</Text><Text style={styles.reviewText}>{field.options ? field.options.find(option => option.value === responses[field.id])?.label : responses[field.id]}</Text></View>)}
      <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Baguhin ang mga sagot" onPress={() => goTo(1)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><MaterialCommunityIcons name="pencil-outline" size={17} color="#345D37" /><Text style={styles.secondaryText}>Baguhin ang mga sagot</Text></Pressable></View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  steps: { flexDirection: "row", gap: 6, marginBottom: 18 },
  step: { flex: 1, minHeight: 48, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 11, borderWidth: 1, borderColor: "#6C805F" },
  stepActive: { backgroundColor: "#FFEDBE", borderColor: "#FFEDBE" },
  stepNumber: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#C4D5B6", alignItems: "center", justifyContent: "center" },
  stepNumberActive: { borderColor: "#345D37" },
  stepNumberText: { color: "#DDE7C9", fontSize: 11, fontWeight: "700" },
  stepText: { color: "#DDE7C9", fontSize: 12, fontWeight: "700" },
  stepActiveText: { color: "#294437" },
  paper: { padding: 18, borderRadius: 18, backgroundColor: "#FFF5D9" },
  question: { color: "#294437", fontSize: 21, fontWeight: "800", lineHeight: 29, flexShrink: 1 },
  tree: { alignItems: "center", marginTop: 23 },
  earth: { backgroundColor: "#E9DFC9", borderTopWidth: 1, borderTopColor: "#C7BC9F", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 10, paddingBottom: 12 },
  roots: { height: 64 }, rootsCompact: { height: 40 },
  choices: { flexDirection: "row", alignItems: "stretch", gap: 9 },
  choicesCompact: { flexDirection: "column" },
  choice: { padding: 12, backgroundColor: "#FFFDF5", borderWidth: 1, borderColor: "#B8BC9F", borderRadius: 10 },
  choiceWide: { flex: 1 },
  choiceCompact: { flexDirection: "row", gap: 10 },
  choiceSelected: { backgroundColor: "#E1ECD3", borderColor: "#345D37" },
  choiceLetter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  choiceLetterCompact: { flexDirection: "column", gap: 7, justifyContent: "flex-start", marginBottom: 0 },
  letter: { color: "#566447", fontSize: 12, fontWeight: "800" },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: "#294437", fontSize: 15, fontWeight: "800", lineHeight: 21, marginBottom: 6 },
  choiceDescription: { color: "#566447", fontSize: 13, lineHeight: 20 },
  selection: { color: "#345D37", fontSize: 12, lineHeight: 20, marginTop: 15 },
  selectedSummary: { flexDirection: "row", alignItems: "center", gap: 9, paddingBottom: 17, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#D2D4B8" },
  selectedSummaryText: { flex: 1, color: "#345D37", fontSize: 13, lineHeight: 21 },
  field: { marginTop: 20 },
  label: { color: "#294437", fontSize: 14, lineHeight: 22, fontWeight: "700", marginBottom: 8 },
  input: { minHeight: 125, padding: 13, borderWidth: 1, borderColor: "#ABB592", borderRadius: 10, color: "#294437", backgroundColor: "#FFFDF5", fontSize: 16, lineHeight: 25 },
  invalid: { borderColor: "#A33F28", borderWidth: 2 },
  error: { color: "#96351F", fontSize: 13, lineHeight: 21, marginTop: 9 },
  fieldNote: { color: "#5D6A50", fontSize: 12, lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 20 },
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: 12, backgroundColor: "#193E34", borderRadius: 10 },
  primaryText: { flexShrink: 1, color: "#FFEDBE", fontSize: 13, fontWeight: "800" },
  secondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 46, padding: 10, borderWidth: 1, borderColor: "#ABB592", borderRadius: 10 },
  secondaryText: { flexShrink: 1, color: "#345D37", fontSize: 13, fontWeight: "700" },
  autoSave: { color: "#5D6A50", fontSize: 11, lineHeight: 18, flexShrink: 1 },
  reviewHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  reviewField: { borderTopWidth: 1, borderTopColor: "#D2D4B8", marginTop: 18, paddingTop: 18 },
  reviewText: { color: "#294437", fontSize: 15, lineHeight: 25 },
  pressed: { opacity: 0.75 },
});
