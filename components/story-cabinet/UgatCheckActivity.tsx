import { AppTheme } from "@/constants/colors";
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
  "M300 0 C270 43 100 22 100 105 M190 37 Q159 65 155 83 M128 57 L60 80",
  "M300 0 C281 29 317 64 300 105 M303 49 Q334 64 345 86 M299 78 L267 94",
  "M300 0 C330 43 500 22 500 105 M410 37 Q441 65 445 83 M472 57 L540 80",
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
  const [step, setStep] = useState(completed ? 3 : 0);
  const [width, setWidth] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
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

  function review() {
    setAttempted(true);
    if (selected === -1) setStep(0);
    else if (!hasEvidence) setStep(1);
    else if (!hasReflection) setStep(2);
    else { setStep(3); setAttempted(false); }
  }

  function selectRoot(index: number) {
    if (selected !== index) onChange(interpretation.id, options[index].value);
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
        placeholderTextColor={AppTheme.muted}
        style={[styles.input, invalid && styles.invalid]}
      />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Punan ang {field.id === firstProof.id ? 'unang patunay' : field.id === secondProof.id ? 'ikalawang patunay' : 'paliwanag ng pangkat'}.</Text>}
    </View>;
  }

  return <View style={styles.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View accessibilityRole="tablist" accessibilityLabel={`Mga hakbang ng ${activity.title}`} style={styles.steps}>
      {steps.map((label, index) => <Pressable
        key={label}
        accessibilityRole="tab"
        accessibilityLabel={`${index + 1}. ${label}`}
        aria-selected={step === index}
        accessibilityState={{ selected: step === index }}
        onFocus={() => setFocused(`step-${index}`)} onBlur={() => setFocused(null)}
        onPress={() => goTo(index)}
        {...selectionKeys(index, "tab", goTo)}
        style={({ pressed }) => [styles.step, step === index && styles.stepActive, focused === `step-${index}` && styles.focused, pressed && styles.pressed]}
      >
        <View style={[styles.stepNumber, step === index && styles.stepNumberActive]}><Text style={[styles.stepNumberText, step === index && styles.stepActiveText]}>{index + 1}</Text></View>
        <Text style={[styles.stepText, step === index && styles.stepActiveText]}>{label}</Text>
        {done[index] && !compact && <MaterialCommunityIcons name="check" size={15} color={step === index ? AppTheme.primary : AppTheme.primary} />}
      </Pressable>)}
    </View>

    {step === 0 ? <View style={styles.paper}>
      <Text accessibilityRole="header" style={styles.question}>Saan nagmumula ang sakit?</Text>
      <Text style={styles.fieldNote}>Piliin ang ugat na kumakatawan sa pinakamalalim at pinakamalapit na kahulugan ng “ugat” batay sa akda.</Text>
      <View pointerEvents="none" accessible={false} style={styles.tree}>
        <Svg width="100%" height="190" viewBox="0 0 220 160" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
          <Path d="M101 72 H117 L116 130 L126 160 H94 L103 127 Z M109 126 L77 80 L82 76 L113 107 M113 111 L142 76 L147 80 L116 125" fill="#806447" />
          <Ellipse cx="62" cy="69" rx="50" ry="40" fill="#779768" />
          <Ellipse cx="163" cy="65" rx="48" ry="44" fill="#779768" />
          <Ellipse cx="109" cy="48" rx="59" ry="48" fill="#50794B" />
          <Path d="M49 63 Q57 47 76 47 M127 30 Q147 35 153 49" fill="none" stroke="#A9BE8D" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
        </Svg>
      </View>
      <View style={styles.earth}>
        <View style={styles.roots}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%" viewBox="0 0 600 145" preserveAspectRatio="none" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
              {rootPaths.map((d, index) => <Path key={index} d={d} fill="none" stroke={selected === index ? '#F0CF7C' : '#B0895D'} strokeWidth={selected === index ? 9 : 7} strokeLinecap="round" strokeLinejoin="round" />)}
            </Svg>
          </View>
          <View accessibilityRole="radiogroup" accessibilityLabel="Piliin ang ugat A, B, o C" style={styles.rootTargets}>
            {options.map((option, index) => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={`Ugat ${option.label}`} accessibilityState={{ checked: selected === index }} aria-checked={selected === index} onPress={() => selectRoot(index)} {...selectionKeys(index, 'radio', selectRoot)} onFocus={() => setFocused(`root-${index}`)} onBlur={() => setFocused(null)} style={({ pressed }) => [styles.rootTarget, focused === `root-${index}` && styles.focused, pressed && styles.pressed]}>
              <View style={[styles.rootMarker, selected === index && styles.rootMarkerSelected]}><Text style={[styles.rootLetter, selected === index && styles.rootLetterSelected]}>{String.fromCharCode(65 + index)}</Text><MaterialCommunityIcons name={selected === index ? 'radiobox-marked' : 'radiobox-blank'} size={16} color={selected === index ? AppTheme.primary : AppTheme.primary} /></View>
            </Pressable>)}
          </View>
        </View>
        <Text style={styles.rootHint}>Pindutin ang ugat o ang paliwanag nito.</Text>
      </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={interpretation.label} style={[styles.choices, compact && styles.choicesCompact]}>
          {options.map((option, index) => <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            aria-checked={selected === index}
            accessibilityState={{ checked: selected === index }}
            onPress={() => selectRoot(index)}
            {...selectionKeys(index, "radio", selectRoot)}
            onFocus={() => setFocused(`choice-${index}`)} onBlur={() => setFocused(null)}
            style={({ pressed }) => [styles.choice, compact ? styles.choiceCompact : styles.choiceWide, selected === index && styles.choiceSelected, focused === `choice-${index}` && styles.focused, pressed && styles.pressed]}
          >
            <View style={[styles.choiceLetter, compact && styles.choiceLetterCompact]}>
              <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
              <MaterialCommunityIcons name={selected === index ? "radiobox-marked" : "radiobox-blank"} size={19} color={AppTheme.primary} />
            </View>
            <View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{choiceTitles[index]}</Text><Text style={styles.choiceDescription}>{option.label.replace(/^[A-C]\.\s*/, "")}</Text></View>
          </Pressable>)}
        </View>
      <Text accessibilityLiveRegion="polite" style={styles.selection}>{selected === -1 ? "Pumili ng isang interpretasyon sa mga ugat." : `Napili: ${String.fromCharCode(65 + selected)} · ${choiceTitles[selected]}`}</Text>
      {errors && selected === -1 && <Text accessibilityRole="alert" style={styles.error}>Pumili muna ng interpretasyon.</Text>}
      <View style={styles.actions}><Text style={styles.autoSave}>{selected === -1 ? "Awtomatikong mase-save ang pinili." : "Awtomatikong naka-save ang pinili."}</Text><Pressable accessibilityRole="button" accessibilityLabel="Magbigay ng patunay" disabled={selected === -1} accessibilityState={{ disabled: selected === -1 }} onPress={() => goTo(1)} style={({ pressed }) => [styles.primary, selected === -1 && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>Magbigay ng patunay</Text><MaterialCommunityIcons name="arrow-right" size={17} color={AppTheme.buttonText} /></Pressable></View>
    </View> : step === 1 || step === 2 ? <View style={styles.paper}>
      <View style={styles.selectedSummary}><MaterialCommunityIcons name="source-branch" size={18} color={AppTheme.primary} /><Text style={styles.selectedSummaryText}>{options[selected]?.label}</Text></View>
      <Text accessibilityRole="header" style={styles.question}>{step === 1 ? "Anong mga detalye ang sumusuporta rito?" : reflection.label}</Text>
      {step === 1 ? <>{renderInput(firstProof)}{renderInput(secondProof)}</> : <>
        <View style={styles.proofReview}>{[firstProof, secondProof].map(field => <View key={field.id}><Text style={styles.label}>{field.label}</Text><Text selectable style={styles.reviewText}>{responses[field.id]}</Text></View>)}</View>
        {renderInput(reflection, "Paliwanag ng pangkat")}
      </>}
      <Text style={styles.fieldNote}>Ibatay ang sagot sa mga pangyayari at detalye mula sa kuwento.</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? "Palitan ang pinili" : "Balikan ang patunay"} onPress={() => goTo(step - 1)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-left" size={16} color={AppTheme.primary} /><Text style={styles.secondaryText}>{step === 1 ? "Palitan ang pinili" : "Balikan ang patunay"}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? "Pagnilayan" : "Suriin ang mga sagot"} onPress={step === 1 ? () => goTo(2) : review} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{step === 1 ? "Pagnilayan" : "Suriin ang mga sagot"}</Text><MaterialCommunityIcons name="arrow-right" size={17} color={AppTheme.buttonText} /></Pressable>
      </View>
    </View> : <View style={styles.paper}>
      <View style={styles.reviewHeading}><MaterialCommunityIcons name="check-circle-outline" size={25} color={AppTheme.primary} /><Text accessibilityRole="header" style={styles.question}>Mga sagot ng pangkat</Text></View>
      <Text style={styles.fieldNote}>{completed ? "Kumpleto at naka-save sa device. Maaari nang ipakita sa guro." : "Suriin ang naka-save na draft. Pindutin ang Ipasa kapag handa na."}</Text>
      {activity.fields.map((field, index) => <View key={field.id} style={styles.reviewField}><Text style={styles.label}>{field.label}</Text><Text selectable style={styles.reviewText}>{field.options ? field.options.find(option => option.value === responses[field.id])?.label : responses[field.id]}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Baguhin: ${field.label}`} onPress={() => goTo(index === 0 ? 0 : index === 3 ? 2 : 1)} style={styles.edit}><Text style={styles.secondaryText}>Baguhin</Text></Pressable></View>)}
      <Text style={styles.fieldNote}>Ang guro ang susuri sa interpretasyon at paliwanag. Walang awtomatikong marka.</Text>
      <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={completed ? 'Kumpleto na' : 'Ipasa'} disabled={completed} accessibilityState={{ disabled: completed }} onPress={() => { if (selected !== -1 && hasEvidence && hasReflection) onComplete(); else review(); }} style={[styles.primary, completed && styles.disabled]}><Text style={styles.primaryText}>{completed ? 'Kumpleto na' : 'Ipasa'}</Text></Pressable></View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  steps: { flexDirection: "row", gap: 6, marginBottom: 18 },
  step: { flex: 1, minHeight: 48, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 11, borderWidth: 1, borderColor: AppTheme.border },
  stepActive: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary },
  stepNumber: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: AppTheme.border, alignItems: "center", justifyContent: "center" },
  stepNumberActive: { borderColor: AppTheme.primary },
  stepNumberText: { color: AppTheme.muted, fontSize: 11, fontWeight: "700" },
  stepText: { color: AppTheme.text, fontSize: 12, fontWeight: "700" },
  stepActiveText: { color: AppTheme.text },
  paper: { padding: 18, borderRadius: 18, backgroundColor: AppTheme.surface },
  question: { color: AppTheme.text, fontSize: 21, fontWeight: "800", lineHeight: 29, flexShrink: 1 },
  tree: { alignItems: "center", marginTop: 20, backgroundColor: AppTheme.surfaceSoft, paddingTop: 16, borderTopLeftRadius: 80, borderTopRightRadius: 80 },
  earth: { backgroundColor: "#514332", borderTopWidth: 3, borderTopColor: "#94A169", borderBottomLeftRadius: 18, borderBottomRightRadius: 18, paddingBottom: 12 },
  roots: { height: 145 }, rootTargets: { flex: 1, flexDirection: 'row' }, rootTarget: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  rootMarker: { minWidth: 48, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, gap: 1 },
  rootMarkerSelected: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary }, rootLetter: { color: AppTheme.text, fontSize: 16, fontWeight: '900' }, rootLetterSelected: { color: AppTheme.text }, rootHint: { color: AppTheme.buttonText, fontSize: 11, textAlign: 'center', paddingHorizontal: 8 },
  choices: { flexDirection: "row", alignItems: "stretch", gap: 9, marginTop: 14 },
  choicesCompact: { flexDirection: "column" },
  choice: { padding: 12, backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 10 },
  choiceWide: { flex: 1 },
  choiceCompact: { flexDirection: "row", gap: 10 },
  choiceSelected: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary, borderWidth: 2 },
  choiceLetter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  choiceLetterCompact: { flexDirection: "column", gap: 7, justifyContent: "flex-start", marginBottom: 0 },
  letter: { color: AppTheme.text, fontSize: 12, fontWeight: "800" },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: AppTheme.text, fontSize: 15, fontWeight: "800", lineHeight: 21, marginBottom: 6 },
  choiceDescription: { color: AppTheme.muted, fontSize: 13, lineHeight: 20 },
  selection: { color: AppTheme.text, fontSize: 12, lineHeight: 20, marginTop: 15 },
  selectedSummary: { flexDirection: "row", alignItems: "center", gap: 9, paddingBottom: 17, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: AppTheme.primary },
  selectedSummaryText: { flex: 1, color: AppTheme.text, fontSize: 13, lineHeight: 21 },
  field: { marginTop: 20 },
  label: { color: AppTheme.text, fontSize: 14, lineHeight: 22, fontWeight: "700", marginBottom: 8 },
  input: { minHeight: 125, padding: 13, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 10, color: AppTheme.text, backgroundColor: AppTheme.surface, fontSize: 16, lineHeight: 25 },
  invalid: { borderColor: AppTheme.error, borderWidth: 2 },
  error: { color: AppTheme.error, fontSize: 13, lineHeight: 21, marginTop: 9 },
  fieldNote: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 20 },
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: 12, backgroundColor: AppTheme.primary, borderRadius: 10 },
  primaryText: { flexShrink: 1, color: AppTheme.buttonText, fontSize: 13, fontWeight: "800" },
  secondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 46, padding: 10, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 10 },
  secondaryText: { flexShrink: 1, color: AppTheme.text, fontSize: 13, fontWeight: "700" },
  autoSave: { color: AppTheme.muted, fontSize: 11, lineHeight: 18, flexShrink: 1 },
  reviewHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  reviewField: { borderTopWidth: 1, borderTopColor: AppTheme.border, marginTop: 18, paddingTop: 18 },
  reviewText: { color: AppTheme.text, fontSize: 15, lineHeight: 25 },
  proofReview: { backgroundColor: AppTheme.surfaceSoft, padding: 13, borderRadius: 12, gap: 15, marginTop: 15 },
  edit: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginTop: 5 },
  focused: { borderColor: AppTheme.primary, borderWidth: 2 }, disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
