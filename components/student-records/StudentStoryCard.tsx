import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme } from "@/constants/colors";
import type { Story } from "@/data/stories";
import type { StudentActivityRecord, StudentStoryRecord } from "@/utils/student-records";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type Props = { story: Story; index: number; record: StudentStoryRecord; initiallyExpanded?: boolean };

const storyIcons: Record<string, IconName> = {
  "m1-story-1": "tshirt-crew-outline",
  "m1-story-2": "leaf",
  "m1-story-3": "crown-outline",
};

function quizSummary(assessment: StudentStoryRecord["assessment"]) {
  if (!assessment.total) return "Wala pang pagsusulit";
  if (assessment.complete) return `${assessment.correct}/${assessment.total}`;
  if (assessment.answered) return `${assessment.answered}/${assessment.total} nasagutan`;
  return "Hindi pa nasisimulan";
}

/** Read-only view of the player's saved work; expanding a card never changes progress. */
export function StudentStoryCard({ story, index, record, initiallyExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [focused, setFocused] = useState(false);
  const summary = quizSummary(record.assessment);
  const answerRegion = `student-story-answers-${story.id}`;

  return <View style={styles.card} testID={`student-story-${story.id}`}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${story.title}. Pagsusulit: ${summary}. Gawain: ${record.completedActivities} sa ${record.activities.length} kumpleto. ${expanded ? "Itago" : "Ipakita"} ang tala.`}
      accessibilityState={{ expanded }} aria-expanded={expanded} aria-controls={expanded ? answerRegion : undefined}
      onPress={() => setExpanded(open => !open)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      testID={`student-story-toggle-${story.id}`} style={({ pressed }) => [styles.cardHeader, focused && styles.focused, pressed && styles.pressed]}>
      <View style={styles.storyHeading}>
        <View style={styles.storyIcon}><MaterialCommunityIcons name={storyIcons[story.id] ?? "book-open-page-variant-outline"} size={25} color={AppTheme.primary} /></View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>KUWENTO {String(index + 1).padStart(2, "0")}</Text>
          <Text style={styles.storyTitle}>{story.title}</Text>
        </View>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={24} color={AppTheme.muted} />
      </View>
      <View style={styles.chips}>
        <View style={styles.chip}><Text style={styles.chipText}>Pagsusulit · {summary}</Text></View>
        <View style={[styles.chip, record.completedActivities > 0 && styles.completeChip]}>
          <Text style={[styles.chipText, record.completedActivities > 0 && styles.completeChipText]}>Gawain · {record.completedActivities}/{record.activities.length} kumpleto</Text>
        </View>
      </View>
    </Pressable>

    {expanded && <View nativeID={answerRegion} style={styles.cardContent}>
      <QuizScore assessment={record.assessment} />
      <Text accessibilityRole="header" style={styles.sectionLabel}>MGA SAGOT SA GAWAIN</Text>
      {record.activities.length ? record.activities.map((activity, activityIndex) => <ActivityAnswers key={activity.activity.id} record={activity} initiallyExpanded={activityIndex === 0} />)
        : <Text style={styles.empty}>Wala pang nakatalagang Gawain sa kuwentong ito.</Text>}
    </View>}
  </View>;
}

function QuizScore({ assessment }: { assessment: StudentStoryRecord["assessment"] }) {
  if (!assessment.complete) {
    return <View style={styles.scorePanel} testID="student-quiz-progress">
      <View style={styles.flex}>
        <Text style={styles.scoreLabel}>PAGSUSULIT</Text>
        <Text style={styles.pendingTitle}>{!assessment.total ? "Wala pang pagsusulit" : assessment.answered ? "Kasalukuyang sinasagutan" : "Hindi pa nasisimulan"}</Text>
        {assessment.total > 0 && <Text style={styles.scoreDetail}>{assessment.answered}/{assessment.total} tanong ang nasagutan{assessment.answered > 0 ? " · Wala pang pinal na iskor" : ""}</Text>}
      </View>
    </View>;
  }

  return <View style={styles.scorePanel} testID="student-quiz-score" accessibilityLabel={`Iskor sa pagsusulit: ${assessment.correct} sa ${assessment.total}, ${assessment.percentage} porsiyento.`}>
    <Text style={styles.scoreValue}>{assessment.correct}<Text style={styles.scoreTotal}>/{assessment.total}</Text></Text>
    <View style={styles.flex}>
      <Text style={styles.scoreLabel}>ISKOR SA PAGSUSULIT</Text>
      <Text style={styles.scoreStatus}>{assessment.percentage}% · Natapos</Text>
      <Text style={styles.scoreDetail}>{assessment.correct} tama · {assessment.incorrect} mali</Text>
    </View>
  </View>;
}

function ActivityAnswers({ record, initiallyExpanded }: { record: StudentActivityRecord; initiallyExpanded: boolean }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [showAll, setShowAll] = useState(false);
  const [focused, setFocused] = useState(false);
  const { activity, response, fields, answered, completed } = record;
  const groupName = typeof response?.groupName === "string" ? response.groupName.trim() : "";
  const status = completed ? "Kumpleto" : answered > 0 ? `Draft · ${answered}/${fields.length} bahagi napunan` : "Wala pang sagot";
  const mode = activity.mode === "group" ? "Pangkatang gawain" : "Indibidwal na gawain";
  const visibleFields = showAll ? fields : fields.slice(0, 2);
  const answerRegion = `student-activity-answers-${activity.id}`;

  return <View style={styles.activity}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${activity.title}. ${mode}. ${status}. ${expanded ? "Itago" : "Ipakita"} ang mga sagot.`}
      accessibilityState={{ expanded }} aria-expanded={expanded} aria-controls={expanded ? answerRegion : undefined}
      onPress={() => setExpanded(open => !open)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      testID={`student-activity-toggle-${activity.id}`} style={({ pressed }) => [styles.activityHeader, focused && styles.focused, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={completed ? "check-circle-outline" : answered > 0 ? "file-document-edit-outline" : "circle-outline"} size={19} color={completed ? AppTheme.success : AppTheme.muted} />
      <View style={styles.flex}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityMeta}>{mode} · {status}</Text>
      </View>
      <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={AppTheme.muted} />
    </Pressable>

    {expanded && <View nativeID={answerRegion} testID={`student-activity-answers-${activity.id}`}>
      {activity.mode === "group" && Boolean(groupName) && <Text style={styles.groupName}>Pangkat: {groupName}</Text>}
      {activity.id === "ugat-explore" && <Text style={styles.explorationNote}>Tala ng mga pahiwatig na natingnan. Walang marka ang paggalugad na ito.</Text>}
      {visibleFields.map(field => <View key={field.id} style={styles.answer}>
        <Text style={styles.question}>{field.label}</Text>
        <Text selectable style={[styles.answerText, field.answer === null && styles.unanswered]}>{field.answer ?? "Wala pang sagot"}</Text>
      </View>)}
      {fields.length > 2 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAll }} aria-expanded={showAll}
        accessibilityLabel={showAll ? `Ipakita ang unang dalawang sagot sa ${activity.title}` : `Ipakita ang iba pang ${fields.length - 2} sagot sa ${activity.title}`}
        onPress={() => setShowAll(all => !all)} testID={`student-more-answers-${activity.id}`} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name={showAll ? "chevron-up" : "chevron-down"} size={17} color={AppTheme.primary} />
        <Text style={styles.moreText}>{showAll ? "Ipakita ang mas kaunti" : `Ipakita ang iba pang sagot (${fields.length - 2})`}</Text>
      </Pressable>}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 21, overflow: "hidden" },
  cardHeader: { padding: 16, borderWidth: 2, borderColor: "transparent", borderRadius: 20, gap: 14 },
  storyHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  storyIcon: { width: 44, height: 48, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1, lineHeight: 16, color: AppTheme.muted },
  storyTitle: { fontSize: 20, lineHeight: 27, fontWeight: "800", color: AppTheme.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { maxWidth: "100%", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: AppTheme.surfaceSoft },
  chipText: { color: AppTheme.muted, fontSize: 11, lineHeight: 16, fontWeight: "600", flexShrink: 1 },
  completeChip: { backgroundColor: AppTheme.successSurface },
  completeChipText: { color: AppTheme.success },
  cardContent: { paddingHorizontal: 18, paddingBottom: 10 },
  scorePanel: { backgroundColor: AppTheme.surfaceSoft, borderRadius: 15, padding: 17, flexDirection: "row", alignItems: "center", gap: 17, marginBottom: 21 },
  scoreValue: { fontSize: 38, lineHeight: 46, letterSpacing: -1, fontWeight: "800", color: AppTheme.primary },
  scoreTotal: { fontSize: 17, fontWeight: "500", letterSpacing: 0, color: AppTheme.muted },
  scoreLabel: { fontSize: 10, lineHeight: 16, letterSpacing: .8, fontWeight: "800", color: AppTheme.muted },
  scoreStatus: { fontSize: 14, lineHeight: 21, fontWeight: "700", color: AppTheme.text, marginTop: 2 },
  scoreDetail: { fontSize: 12, lineHeight: 19, color: AppTheme.muted, marginTop: 3 },
  pendingTitle: { fontSize: 17, lineHeight: 24, fontWeight: "700", color: AppTheme.text, marginTop: 4 },
  sectionLabel: { fontSize: 11, lineHeight: 18, letterSpacing: 1.1, fontWeight: "800", color: AppTheme.muted, marginBottom: 5 },
  activity: { borderTopWidth: 1, borderTopColor: AppTheme.border },
  activityHeader: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 15, paddingHorizontal: 2, borderRadius: 8, minHeight: 66 },
  activityTitle: { fontSize: 14, lineHeight: 21, fontWeight: "800", color: AppTheme.text },
  activityMeta: { fontSize: 11, lineHeight: 18, color: AppTheme.muted, marginTop: 2 },
  groupName: { fontSize: 12, lineHeight: 20, color: AppTheme.muted, fontWeight: "600", marginBottom: 10 },
  explorationNote: { fontSize: 12, lineHeight: 20, color: AppTheme.muted, marginBottom: 12 },
  answer: { backgroundColor: AppTheme.surfaceSoft, borderRadius: 12, padding: 14, marginBottom: 11 },
  question: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, fontWeight: "700", marginBottom: 6 },
  answerText: { color: AppTheme.text, fontSize: 14, lineHeight: 23 },
  unanswered: { color: AppTheme.muted, fontStyle: "italic" },
  moreButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 10, marginBottom: 6 },
  moreText: { color: AppTheme.primary, fontSize: 12, lineHeight: 20, fontWeight: "700", flexShrink: 1 },
  empty: { color: AppTheme.muted, fontSize: 13, lineHeight: 21, paddingVertical: 12 },
  focused: { backgroundColor: AppTheme.selected },
  pressed: { opacity: .75 },
});
