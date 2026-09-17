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

const stageNames = ["Bago", "Suliranin", "Pagbabago", "Wakas", "Paliwanag"];
const placeholders = [
  "Ilarawan ang pangunahing tauhan sa simula ng kuwento.",
  "Anong suliranin ang kinakaharap ng pangunahing tauhan?",
  "Ilarawan kung paano siya tumugon sa kaniyang suliranin.",
  "Ibahagi ang natuklasan sa pagtatapos ng kuwento.",
  "Ipaliwanag ang pagbabago sa kaniyang katangian gamit ang inyong map.",
];

/** A presentation of the existing five fields; all persistence stays in the cabinet editor. */
export function CharacterTransformationMap({ fields, responses, onChange, onComplete, showErrors, completed }: Props) {
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(0);
  const input = useRef<TextInput>(null);
  const compact = width < 480;
  const rows = compact ? [[0, 1], [2, 3]] : [[0, 1, 2, 3]];
  const field = fields[active];
  const value = responses[field.id] ?? "";
  const answered = fields.slice(0, 4).filter(item => responses[item.id]?.trim()).length;
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
        <Text accessibilityRole="header" style={styles.mapTitle}>Character Transformation Map</Text>
        <Text accessibilityLiveRegion="polite" style={styles.count}>{answered}/4 nasagutan</Text>
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
                <Path d="M29 31 L44 29 Q56 42 68 29 L83 31 L110 48 L95 74 L82 65 L96 135 H16 L30 65 L17 74 L2 48 Z" fill={selected ? "#FFEDBE" : "#D8C695"} />
                <Path d="M43 31 Q56 47 69 31 M30 123 H82" fill="none" stroke="#827344" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              </Svg>
              <Text style={[styles.clothNumber, compact && styles.compactNumber]}>{String(index + 1).padStart(2, "0")}</Text>
            </View>
            <Text style={[styles.garmentName, selected && styles.selectedName]}>{stageNames[index].toUpperCase()}</Text>
            <View style={styles.garmentStatus}>
              {hasAnswer && <MaterialCommunityIcons name="check" size={13} color="#F4E7BE" />}
              <Text style={[styles.statusText, selected && styles.selectedStatus, missing && styles.missingStatus]}>{status}</Text>
            </View>
          </Pressable>;
        })}
      </View>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Paliwanag: Bakit tauhang bilog?" aria-selected={active === 4} onPress={() => setActive(4)} style={({ pressed }) => [styles.reflection, pressed && styles.pressed]}>
        <Text style={[styles.reflectionText, active === 4 && styles.selectedName]}>Pagkatapos: Bakit tauhang bilog?</Text>
        <MaterialCommunityIcons name={responses[fields[4].id]?.trim() ? "check-circle-outline" : "arrow-right"} size={19} color="#F4E7BE" />
      </Pressable>
    </View>
    <Text style={styles.mapHint}>Pindutin ang damit upang buksan o balikan ang tanong.</Text>
    <View style={styles.paper}>
      <View style={styles.paperHeading}>
        <Text style={styles.paperEyebrow}>{String(active + 1).padStart(2, "0")} · {stageNames[active].toUpperCase()}</Text>
        <Text style={styles.paperEyebrow}>{active + 1} SA 5</Text>
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
        placeholderTextColor="#707C62"
        style={[styles.answer, invalid && styles.invalid]}
      />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Kailangan ang sagot sa bahaging ito.</Text>}
      <Text style={styles.fieldNote}>Ibatay ang sagot sa mga pangyayari at detalye sa kuwento.</Text>
      <View style={styles.actions}>
        {active > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Nauna" onPress={() => setActive(index => index - 1)} style={({ pressed }) => [styles.previous, pressed && styles.pressed]}><MaterialCommunityIcons name="arrow-left" size={16} color="#294437" /><Text style={styles.previousText}>Nauna</Text></Pressable> : <View style={styles.autoSave}><MaterialCommunityIcons name="content-save-check-outline" size={15} color="#596A49" /><Text style={styles.autoSaveText}>Awtomatikong save</Text></View>}
        <Pressable accessibilityRole="button" accessibilityLabel={active === 4 ? "Tapusin ang gawain" : `Susunod: ${stageNames[active + 1]}`} onPress={active === 4 ? finish : () => setActive(index => index + 1)} style={({ pressed }) => [styles.next, pressed && styles.pressed]}>
          <Text style={styles.nextText}>{active === 4 ? completed ? "Naka-save na" : "Tapusin ang gawain" : `Susunod: ${stageNames[active + 1]}`}</Text>
          <MaterialCommunityIcons name={active === 4 ? "check" : "arrow-right"} size={17} color="#FFEDBE" />
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 24 },
  wardrobe: { backgroundColor: "#6C4E35", borderWidth: 3, borderColor: "#A78150", borderRadius: 18, padding: 16 },
  mapHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
  mapTitle: { flex: 1, color: "#FFEDBE", fontSize: 14, lineHeight: 20, fontWeight: "800" },
  count: { color: "#F4E7BE", fontSize: 11, lineHeight: 20 },
  clothesline: { flexDirection: "row", gap: 10, marginBottom: 18 },
  thread: { position: "absolute", top: 10, left: 0, right: 0, height: 2, backgroundColor: "#C8AA72" },
  garment: { flex: 1, alignItems: "center", paddingVertical: 2, borderRadius: 10, minWidth: 0 },
  illustration: { width: 112, height: 140, maxWidth: "100%" },
  compactIllustration: { width: 90, height: 113 },
  clothNumber: { position: "absolute", top: 72, alignSelf: "center", fontSize: 25, lineHeight: 31, fontWeight: "800", color: "#4B5841" },
  compactNumber: { top: 57, fontSize: 22, lineHeight: 29 },
  garmentName: { color: "#F5E4B7", fontSize: 12, lineHeight: 19, fontWeight: "800", textAlign: "center", marginTop: 9 },
  selectedName: { color: "#FFF7DC", fontWeight: "900" },
  garmentStatus: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 3, minHeight: 18 },
  statusText: { color: "#EAD8B6", fontSize: 11, lineHeight: 17, textAlign: "center", flexShrink: 1 },
  selectedStatus: { color: "#FFF7DC", textDecorationLine: "underline" },
  missingStatus: { color: "#FFD6C9" },
  reflection: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "#A4855C", paddingTop: 13, minHeight: 48 },
  reflectionText: { flex: 1, fontSize: 13, lineHeight: 21, color: "#F4E7BE" },
  mapHint: { color: "#CDDBBF", fontSize: 12, lineHeight: 20, marginTop: 10, marginBottom: 17 },
  paper: { backgroundColor: "#FFF5D9", borderRadius: 18, padding: 20 },
  paperHeading: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  paperEyebrow: { color: "#59684A", fontSize: 11, lineHeight: 18, fontWeight: "800", letterSpacing: 1 },
  question: { color: "#294437", fontSize: 21, lineHeight: 29, fontWeight: "800", marginBottom: 15 },
  answer: { backgroundColor: "#FFFDF5", borderWidth: 1, borderColor: "#AEB696", borderRadius: 10, color: "#294437", fontSize: 16, lineHeight: 25, minHeight: 128, padding: 13 },
  invalid: { borderColor: "#AD4028", borderWidth: 2 },
  error: { color: "#96351F", fontSize: 13, lineHeight: 21, marginTop: 9 },
  fieldNote: { color: "#5F6E4F", fontSize: 12, lineHeight: 20, marginTop: 9 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 17 },
  previous: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 44, gap: 7, paddingRight: 12 },
  previousText: { color: "#294437", fontSize: 13, fontWeight: "700" },
  autoSave: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 36 },
  autoSaveText: { color: "#596A49", fontSize: 11 },
  next: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: 12, backgroundColor: "#193E34", borderRadius: 11 },
  nextText: { flexShrink: 1, color: "#FFEDBE", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
