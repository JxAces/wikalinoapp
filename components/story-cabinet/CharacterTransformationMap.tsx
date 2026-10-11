import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { CabinetField } from "@/data/cabinet-activities";

type Props = {
  fields: CabinetField[];
  responses: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
  showErrors: boolean;
  completed: boolean;
};

const stageNames = ["Bago", "Suliranin", "Pagbabago", "Wakas"];
const placeholders = [
  "Ilarawan ang pangunahing tauhan sa simula ng kuwento.",
  "Anong suliranin ang kinakaharap ng pangunahing tauhan?",
  "Ilarawan kung paano siya tumugon sa kaniyang suliranin.",
  "Ibahagi ang natuklasan sa pagtatapos ng kuwento.",
];

/** Four garments share the original response keys; persistence stays in the cabinet editor. */
export function CharacterTransformationMap({ fields, responses, onChange, onComplete, showErrors }: Props) {
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(0);
  const input = useRef<TextInput>(null);
  const compact = width < 480;
  const rows = compact ? [[0, 1], [2, 3]] : [[0, 1, 2, 3]];
  const field = fields[active];
  const value = responses[field.id] ?? "";
  const answered = fields.filter(item => responses[item.id]?.trim()).length;
  const lastStage = active === fields.length - 1;
  const invalid = showErrors && !value.trim();
  const question = field.label.includes(" · ") ? field.label.split(" · ")[1] : field.label;

  function finish() {
    const missing = fields.findIndex(item => !responses[item.id]?.trim());
    if (missing !== -1) {
      setActive(missing);
      input.current?.focus();
    }
    onComplete();
  }

  return <View style={styles.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View style={styles.wardrobe}>
      <View style={styles.mapHeading}>
        <Text accessibilityLiveRegion="polite" style={styles.count}>{answered}/{fields.length} nasagutan</Text>
      </View>
      {rows.map((row, rowIndex) => <View key={rowIndex} style={styles.clothesline}>
        <View pointerEvents="none" style={styles.thread} />
        {row.map(index => {
          const selected = active === index;
          const hasAnswer = Boolean(responses[fields[index].id]?.trim());
          const missing = showErrors && !hasAnswer;
          const status = missing ? "Kailangan ng sagot" : hasAnswer ? "May sagot" : selected ? "Sinasagutan" : "Pindutin";
          return <Pressable
            key={fields[index].id}
            accessibilityRole="button"
            accessibilityLabel={`${stageNames[index]}: ${status}`}
            aria-selected={selected}
            onPress={() => setActive(index)}
            style={({ pressed }) => [styles.garment, pressed && styles.pressed]}
          >
            <View pointerEvents="none" accessible={false} style={[styles.illustration, compact && styles.compactIllustration, { transform: [{ rotate: selected ? "0deg" : index % 2 ? "3deg" : "-3deg" }] }]}>
              <Svg width="100%" height="100%" viewBox="0 0 112 140" aria-hidden={true} accessible={Platform.OS === "web" ? undefined : false}>
                <Path d="M51 9 C48 1 62 1 62 9 C62 14 56 14 56 19 M56 19 L35 31 Q31 34 36 35 H76 Q81 34 77 31 Z" fill="none" stroke="#E9C67F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M29 31 L44 29 Q56 42 68 29 L83 31 L110 48 L95 74 L82 65 L96 135 H16 L30 65 L17 74 L2 48 Z" fill={hasAnswer ? "#B9D49A" : selected ? "#FFEDBE" : "#D8C695"} stroke={selected ? "#FFEDBE" : "none"} strokeWidth={2} />
                <Path d="M43 31 Q56 47 69 31 M30 123 H82" fill="none" stroke="#827344" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              </Svg>
              <Text style={[styles.clothNumber, compact && styles.compactNumber]}>{String(index + 1).padStart(2, "0")}</Text>
            </View>
            <Text style={[styles.garmentName, selected && styles.selectedName]}>{stageNames[index].toUpperCase()}</Text>
            <View style={styles.garmentStatus}>
              {hasAnswer && <MaterialCommunityIcons name="check" size={13} color={AppTheme.primary} />}
              <Text style={[styles.statusText, selected && styles.selectedStatus, missing && styles.missingStatus]}>{status}</Text>
            </View>
          </Pressable>;
        })}
      </View>)}
    </View>
    <Text style={styles.mapHint}>Pindutin ang damit upang buksan o balikan ang tanong.</Text>
    <View style={styles.paper}>
      <View style={styles.paperHeading}>
        <Text style={styles.paperEyebrow}>{String(active + 1).padStart(2, "0")} · {stageNames[active].toUpperCase()}</Text>
        <Text style={styles.paperEyebrow}>{active + 1} SA {fields.length}</Text>
      </View>
      <Text nativeID="transformation-question" accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.question}>{question}</Text>
      <TextInput
        ref={input}
        accessibilityLabel={field.label}
        accessibilityLabelledBy="transformation-question"
        value={value}
        onChangeText={text => onChange(field.id, text)}
        multiline
        textAlignVertical="top"
        placeholder={placeholders[active]}
        placeholderTextColor={AppTheme.muted}
        style={[styles.answer, invalid && styles.invalid]}
      />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Kailangan ang sagot sa bahaging ito.</Text>}
      <Text style={styles.fieldNote}>Ibatay ang sagot sa mga pangyayari at detalye sa kuwento.</Text>
      <View style={styles.actions}>
        {active > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Nauna" onPress={() => setActive(index => index - 1)} style={({ pressed }) => [styles.previous, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-left" size={16} color={AppTheme.primary} /><Text style={styles.previousText}>Nauna</Text></Pressable> : <View style={styles.autoSave}><MaterialCommunityIcons name="content-save-check-outline" size={15} color={AppTheme.primary} /><Text style={styles.autoSaveText}>Awtomatikong save</Text></View>}
        <Pressable accessibilityRole="button" accessibilityLabel={lastStage ? "Ipasa" : `Susunod: ${stageNames[active + 1]}`} onPress={lastStage ? finish : () => setActive(index => index + 1)} style={({ pressed }) => [styles.next, pressed && styles.pressed]}>
          <Text style={styles.nextText}>{lastStage ? "Ipasa" : `Susunod: ${stageNames[active + 1]}`}</Text>
          <MaterialCommunityIcons name={lastStage ? "check" : "arrow-right"} size={17} color={AppTheme.buttonText} />
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  wardrobe: { backgroundColor: AppTheme.panelStrong, borderWidth: 3, borderColor: AppTheme.border, borderRadius: 18, padding: 16 },
  mapHeading: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  count: { color: AppTheme.muted, fontSize: 11, lineHeight: 20 },
  clothesline: { flexDirection: "row", gap: 10, marginBottom: 18 },
  thread: { position: "absolute", top: 10, left: 0, right: 0, height: 2, backgroundColor: AppTheme.panelStrong },
  garment: { flex: 1, alignItems: "center", paddingVertical: 2, borderRadius: 10, minWidth: 0 },
  illustration: { width: 112, height: 140, maxWidth: "100%" },
  compactIllustration: { width: 90, height: 113 },
  clothNumber: { position: "absolute", top: 72, alignSelf: "center", fontSize: 25, lineHeight: 31, fontWeight: "800", color: AppTheme.muted },
  compactNumber: { top: 57, fontSize: 22, lineHeight: 29 },
  garmentName: { color: AppTheme.text, fontSize: 12, lineHeight: 19, fontWeight: "800", textAlign: "center", marginTop: 9 },
  selectedName: { color: AppTheme.text, fontWeight: "900" },
  garmentStatus: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 3, minHeight: 18 },
  statusText: { color: AppTheme.muted, fontSize: 11, lineHeight: 17, textAlign: "center", flexShrink: 1 },
  selectedStatus: { color: AppTheme.muted, textDecorationLine: "underline" },
  missingStatus: { color: AppTheme.error },
  mapHint: { color: AppTheme.text, fontSize: 12, lineHeight: 20, marginTop: 10, marginBottom: 17 },
  paper: { backgroundColor: AppTheme.surface, borderRadius: 18, padding: 20 },
  paperHeading: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  paperEyebrow: { color: AppTheme.muted, fontSize: 11, lineHeight: 18, fontWeight: "800", letterSpacing: 1 },
  question: { color: AppTheme.text, fontSize: 21, lineHeight: 29, fontWeight: "800", marginBottom: 15 },
  answer: { backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 10, color: AppTheme.text, fontSize: 16, lineHeight: 25, minHeight: 128, padding: 13 },
  invalid: { borderColor: AppTheme.error, borderWidth: 2 },
  error: { color: AppTheme.error, fontSize: 13, lineHeight: 21, marginTop: 9 },
  fieldNote: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, marginTop: 9 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 17 },
  previous: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 44, gap: 7, paddingRight: 12 },
  previousText: { color: AppTheme.text, fontSize: 13, fontWeight: "700" },
  autoSave: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 36 },
  autoSaveText: { color: AppTheme.success, fontSize: 11 },
  next: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: 12, backgroundColor: AppTheme.primary, borderRadius: 11 },
  nextText: { flexShrink: 1, color: AppTheme.buttonText, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
