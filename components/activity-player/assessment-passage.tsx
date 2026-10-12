import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "../../constants/colors";

/** Keep the validated excerpt separate from the question and answer choices. */
export function AssessmentPassage({ passage }: { passage?: string }) {
  if (!passage) return null;

  return <View testID="assessment-passage" style={s.passage}>
    <Text style={s.label}>SIPI MULA SA KUWENTO</Text>
    <Text testID="assessment-passage-text" selectable style={s.passageText}>{passage}</Text>
  </View>;
}

export function AssessmentInstruction({ instruction }: { instruction: string }) {
  return <View testID="assessment-instruction" style={s.instruction}>
    <Text style={s.instructionText}>{/^Panuto\s*:/i.test(instruction) ? instruction : `Panuto: ${instruction}`}</Text>
  </View>;
}

const s = StyleSheet.create({
  passage: {
    alignSelf: "stretch", minWidth: 0, padding: 16, marginVertical: 4,
    backgroundColor: AppTheme.surface, borderWidth: 1.5,
    borderColor: AppTheme.border, borderRadius: 12, gap: 8,
  },
  label: { color: AppTheme.primary, fontSize: 10, lineHeight: 15, letterSpacing: .8, fontWeight: "800" },
  passageText: { color: AppTheme.text, fontSize: 16, lineHeight: 25, flexShrink: 1 },
  instruction: { alignSelf: "stretch", minWidth: 0, gap: 4, marginVertical: 4 },
  instructionText: { color: AppTheme.muted, fontSize: 14, lineHeight: 21, flexShrink: 1 },
});
