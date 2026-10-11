import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { assessmentLevelTitle } from "@/components/story-world/quest-progression";

import { AppTheme, Colors } from "../../constants/colors";
import type { StoryActivity } from "../../data/story-types";
import type { ActivityResult } from "../../store/useUserStore";
import { UgatRunnerChild } from "./other-games";
import { UgatTreeArt } from "./ugat-tree-art";

type ChoiceActivity = Extract<StoryActivity, { choices: string[] }>;
type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };
const THEMES = ["PANANAGUTAN", "PAGBABAGO", "LIPUNAN"];
const inside = (point: Point, bounds: Bounds) => bounds.width > 0 && bounds.height > 0
  && point.x >= bounds.x && point.x <= bounds.x + bounds.width
  && point.y >= bounds.y && point.y <= bounds.y + bounds.height;

function SeedPacket({ choice, index, selected, disabled, correct, wrong, dragging, onSelect, onStart, onMove, onDrop, onFinish }: {
  choice: string; index: number; selected: boolean; disabled: boolean; correct: boolean; wrong: boolean; dragging: boolean;
  onSelect: (choice: string) => void;
  onStart: (choice: string, point: Point) => void;
  onMove: (point: Point) => void;
  onDrop: (choice: string, point: Point) => void;
  onFinish: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  const pan = Gesture.Pan().enabled(!disabled).minDistance(6).runOnJS(true)
    .onStart(event => onStart(choice, { x: event.absoluteX, y: event.absoluteY }))
    .onUpdate(event => onMove({ x: event.absoluteX, y: event.absoluteY }))
    .onEnd(event => onDrop(choice, { x: event.absoluteX, y: event.absoluteY }))
    .onFinalize(onFinish);
  return <View style={[s.answer, selected && s.answerSelected, correct && s.answerCorrect, wrong && s.answerWrong, dragging && s.answerDragging]}>
    <Pressable
      testID={`ugat-tree-choice-${letter}`} accessibilityRole="button"
      accessibilityLabel={`Binhi ${letter}: ${choice}${correct ? ", Tamang sagot" : wrong ? ", Iyong maling sagot" : ""}`}
      accessibilityHint="Piliin ang sagot, saka pindutin ang Itanim ang binhi."
      accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => onSelect(choice)} style={s.answerMain}
    >
      <View style={[s.packet, selected && s.packetSelected]}>
        <MaterialCommunityIcons name="sprout" size={17} color={selected ? Colors.accent : Colors.secondary} />
        <Text style={[s.letter, selected && s.letterSelected]}>{letter}</Text>
      </View>
      <View style={s.answerCopy}><Text style={s.answerText}>{choice}</Text>
        {correct && <Text style={s.correctLabel}>✓ Tamang sagot</Text>}
        {wrong && <Text style={s.wrongLabel}>✕ Iyong sagot</Text>}
      </View>
    </Pressable>
    {!disabled && <GestureDetector gesture={pan} touchAction="none">
      <Pressable testID={`ugat-tree-drag-${letter}`} accessibilityRole="button" accessibilityLabel={`Hilahin ang binhi ${letter}`}
        accessibilityHint="I-drag sa lupang may gintong bilog. Maaari ring pindutin para piliin."
        onPress={() => onSelect(choice)} style={s.dragHandle}>
        <MaterialCommunityIcons name="drag" size={23} color={Colors.secondary} /><Text style={s.dragLabel}>HILAHIN</Text>
      </Pressable>
    </GestureDetector>}
  </View>;
}

export function UgatTreeGame({ storyTitle, storyAuthor, activity, activities, questionIndex, results, onAnswer, onContinue, onBack }: {
  storyTitle: string; storyAuthor: string;
  activity: ChoiceActivity; activities: ChoiceActivity[]; questionIndex: number;
  results: Record<string, ActivityResult>;
  onAnswer: (choice: string) => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 780;
  const compact = !wide && height < 740;
  const result = results[activity.id];
  const answered = activities.filter(item => results[item.id]).length;
  const grown = activities.map(item => Boolean(results[item.id]?.correct));
  const score = grown.filter(Boolean).length;
  const lastQuestion = questionIndex === activities.length - 1;
  const complete = lastQuestion && answered === activities.length;
  const [selected, setSelected] = useState<string | null>(typeof result?.selectedAnswer === "string" ? result.selectedAnswer : null);
  const [animating, setAnimating] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overPlot, setOverPlot] = useState(false);
  const [missedDrop, setMissedDrop] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [growth] = useState(() => new Animated.Value(result?.correct ? 1 : 0));
  const [plantMotion] = useState(() => new Animated.Value(0));
  const reducedMotion = useRef(false);
  const mounted = useRef(true), locked = useRef(Boolean(result)), previouslySubmitted = useRef(Boolean(result));
  const root = useRef<View>(null), target = useRef<View>(null), questionPanel = useRef<ScrollView>(null);
  const rootOrigin = useRef<Point>({ x: 0, y: 0 }), targetBounds = useRef<Bounds | null>(null);
  const dragX = useSharedValue(0), dragY = useSharedValue(0);
  const disabled = Boolean(result) || animating;

  useEffect(() => {
    mounted.current = true;
    const update = (value: boolean) => { if (mounted.current) reducedMotion.current = value; };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", update);
    return () => { mounted.current = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    // Restore saved branches immediately, without replaying rewards on review.
    if (!result || previouslySubmitted.current) return;
    previouslySubmitted.current = true;
    let cancelled = false;
    const reduceMotion = reducedMotion.current;
    const finish = () => {
      if (cancelled || !mounted.current) return;
      setAnimating(false);
      questionPanel.current?.scrollTo({ y: 0, animated: !reduceMotion });
    };
    if (result.correct) {
      Animated.parallel([
        Animated.timing(growth, { toValue: 1, duration: reduceMotion ? 0 : 620, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(plantMotion, { toValue: 1, duration: reduceMotion ? 0 : 620, useNativeDriver: Platform.OS !== "web" }),
      ]).start(finish);
    } else finish();
    return () => { cancelled = true; growth.stopAnimation(); plantMotion.stopAnimation(); };
  }, [growth, plantMotion, result]);

  function selectChoice(choice: string) {
    if (locked.current || disabled) return;
    setSelected(choice); setMissedDrop(false); setSaveError(false);
    void Haptics.selectionAsync().catch(() => undefined);
  }

  async function plantSeed(choice: string) {
    if (locked.current || disabled || !activity.choices.includes(choice)) return;
    // The assessment owns scoring and single-attempt persistence, not the animation.
    locked.current = true;
    setSelected(choice); setDragging(null); setOverPlot(false); setMissedDrop(false); setSaveError(false); setAnimating(true);
    try { await onAnswer(choice); }
    catch {
      if (mounted.current) { locked.current = false; setAnimating(false); setSaveError(true); }
    }
  }

  function measureTargets() {
    root.current?.measureInWindow((x, y) => { rootOrigin.current = { x, y }; });
    target.current?.measureInWindow((x, y, targetWidth, targetHeight) => { targetBounds.current = { x, y, width: targetWidth, height: targetHeight }; });
  }
  function moveDrag(point: Point) {
    dragX.set(point.x - rootOrigin.current.x - 27); dragY.set(point.y - rootOrigin.current.y - 32);
    setOverPlot(Boolean(targetBounds.current && inside(point, targetBounds.current)));
  }
  function startDrag(choice: string, point: Point) {
    if (locked.current || disabled) return;
    measureTargets(); selectChoice(choice); setDragging(choice); moveDrag(point);
  }
  function finishDrag() { setDragging(null); setOverPlot(false); }
  function dropSeed(choice: string, point: Point) {
    if (locked.current || disabled) return;
    // Only the current soil spot submits; an off-target drop costs no attempt.
    target.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      if (!mounted.current) return;
      if (inside(point, { x, y, width: targetWidth, height: targetHeight })) void plantSeed(choice);
      else setMissedDrop(true);
    });
  }

  const floatingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }] }));
  const childLean = plantMotion.interpolate({ inputRange: [0, .4, .7, 1], outputRange: ["0deg", "16deg", "16deg", "0deg"] });
  const childDip = plantMotion.interpolate({ inputRange: [0, .5, 1], outputRange: [0, 7, 0] });
  const sceneMessage = animating ? "Umuusbong ang iyong pag-unawa…"
    : complete ? `${score} sa ${activities.length} sanga ang napalago mo.`
      : result ? result.correct ? "Bagong sanga, bagong pag-unawa!" : "Naitala ang sagot. Basahin ang paliwanag."
        : overPlot ? "Bitawan ang binhi dito!" : `Itanim sa gintong bilog ${questionIndex + 1}`;

  return <LinearGradient colors={AppTheme.backgroundGradient} style={s.screen}>
  <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
    <View ref={root} style={s.screen} onLayout={measureTargets}>
      <View style={[s.header, compact && s.headerCompact]}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Bumalik sa Pagsusulit" style={s.back}><MaterialCommunityIcons name="arrow-left" size={23} color={AppTheme.primary} /></Pressable>
        <View style={s.heading}><WikalinoBrand color={AppTheme.primary} /><Text style={s.eyebrow}>UGAT · {assessmentLevelTitle(2).toUpperCase()}</Text><Text style={[s.title, width < 360 && s.titleCompact]}>Puno ng Alaala</Text><Text testID="ugat-question-story-credit" style={s.storyTitle}>{storyTitle} ni {storyAuthor}</Text></View>
        <View style={s.score} accessibilityLabel={`${score} tamang sagot sa ${activities.length}`}><MaterialCommunityIcons name="leaf" size={19} color={AppTheme.primary} /><Text testID="ugat-tree-score" style={s.scoreText}>{score}/{activities.length}</Text></View>
      </View>
      <View style={s.journey} accessibilityLabel="Natapos ang Lakbay at Landas. Nasa Level 3, Alaala.">
        {["Lakbay", "Landas", "Alaala"].map((label, index) => <View key={label} style={s.journeyStep}>
          <View style={[s.journeyNode, index === 2 && s.journeyCurrent]}>{index === 2 ? <Text style={s.journeyNumber}>3</Text> : <MaterialCommunityIcons name="check" size={15} color={Colors.secondary} />}</View>
          <Text style={[s.journeyLabel, index === 2 && s.journeyLabelCurrent]}>{label}</Text>
          {index < 2 && <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textMuted} />}
        </View>)}
      </View>

      <View style={[s.workspace, wide && s.workspaceWide]}>
        <View style={[s.scenePane, wide && s.scenePaneWide]}>
          {wide && <Text style={s.boardHeading}>MULA SA PAGLALAKBAY, TUNGO SA PAG-UNAWA.</Text>}
          <LinearGradient colors={["#DCE5C2", "#90A778"]} style={[s.scene, { height: wide ? 350 : compact ? 202 : 264 }]}>
            <View pointerEvents="none" style={[s.forestSilhouette, { left: -55 }]} /><View pointerEvents="none" style={[s.forestSilhouette, { right: -75 }]} />
            <View style={[s.artBoard, compact && s.artBoardCompact]}>
              <UgatTreeArt grown={grown} current={questionIndex} growth={growth} />
              <Animated.View pointerEvents="none" testID="ugat-tree-child" style={[s.child, compact && s.childCompact, { transform: [{ rotate: childLean }, { translateY: childDip }] }]}><UgatRunnerChild pose={0} /></Animated.View>
              {activities.map((item, index) => {
                const saved = results[item.id];
                const current = index === questionIndex;
                return <View key={item.id} ref={current ? target : undefined} collapsable={false} onLayout={current ? measureTargets : undefined}
                  style={[s.plotPosition, { left: `${(index + 1) * 25}%` }]}>
                  <Pressable testID={`ugat-tree-plot-${index + 1}`} accessibilityRole="button"
                    accessibilityLabel={`Lupa ${index + 1}: ${THEMES[index]}${saved ? saved.correct ? ", Napalago" : ", Nasagutan" : current ? ", Kasalukuyang taniman" : ", Susunod na taniman"}`}
                    accessibilityHint="Pumili ng binhi, saka pindutin dito upang itanim ang sagot."
                    accessibilityState={{ disabled: !current || disabled || !selected }} disabled={!current || disabled || !selected}
                    onPress={() => { if (selected) void plantSeed(selected); }}
                    style={[s.plot, current && s.plotCurrent, saved?.correct && s.plotGrown, current && overPlot && s.plotOver]}>
                    {saved ? <MaterialCommunityIcons name={saved.correct ? "sprout" : "check"} size={24} color={saved.correct ? "#DEEDB1" : Colors.accent} /> : <Text style={s.plotNumber}>{index + 1}</Text>}
                  </Pressable>
                </View>;
              })}
            </View>
            <View pointerEvents="none" style={s.sceneTop}><Text style={s.sceneTag}>{THEMES[questionIndex]}</Text><Text testID="ugat-tree-progress" style={s.sceneTag}>{answered}/{activities.length} NASAGUTAN</Text></View>
            <View pointerEvents="none" style={s.sceneNote}><Text testID="ugat-tree-scene-status" accessibilityLiveRegion="polite" style={s.sceneNoteText}>{sceneMessage}</Text></View>
          </LinearGradient>
          {wide && <View style={s.boardInstruction}><MaterialCommunityIcons name="sprout-outline" size={27} color={Colors.secondary} /><Text style={s.boardInstructionText}>Narating mo na ang puno. Bawat tamang sagot ay magpapailaw ng ugat at magpapalago ng isang sanga.</Text></View>}
        </View>

        <ScrollView ref={questionPanel} style={s.questionPane} scrollEnabled={!dragging} showsVerticalScrollIndicator={false} contentContainerStyle={s.questionContent}>
          {result && !animating && <View testID="ugat-tree-feedback" accessibilityLiveRegion="polite" style={[s.feedback, !result.correct && s.feedbackWrong]}>
            <View style={s.feedbackTop}><MaterialCommunityIcons name={result.correct ? "sprout" : "information-outline"} size={23} color={result.correct ? Colors.secondary : "#A03932"} /><Text style={s.feedbackTitle}>{result.correct ? "Lumago ang isang sanga!" : "Hindi ito ang tamang binhi."}</Text><Text style={s.points}>{result.correct ? "+1" : "0"} puntos</Text></View>
            <Text style={s.feedbackBody}>{activity.explanation}</Text>
            <Text style={s.savedNote}>Naitala na ang sagot. Hindi na ito maaaring baguhin.</Text>
            {complete && <View testID="ugat-tree-complete" style={s.completion}>
              <Text style={s.completionTitle}>Natapos ang iyong paglalakbay!</Text>
              <Text style={s.completionBody}>{answered}/{activities.length} tanong ang nasagutan · {score}/{activities.length} tamang sagot sa Level 3.</Text>
              <Text style={s.completionBody}>Balikan ang mga paliwanag—dito nagsisimula ang mas malalim na pag-unawa.</Text>
            </View>}
            <Pressable testID="ugat-tree-continue" accessibilityRole="button" onPress={onContinue} style={s.primaryButton}><Text style={s.primaryButtonText}>{lastQuestion ? "Tapusin ang paglalakbay" : "Susunod na binhi"}</Text><MaterialCommunityIcons name="arrow-right" size={19} color={Colors.surface} /></Pressable>
          </View>}
          <View style={s.questionCard}>
            <View style={s.questionMeta}><Text style={s.sectionLabel}>BINHI {questionIndex + 1} · {THEMES[questionIndex]}</Text><Text style={s.sectionLabel}>TANONG {questionIndex + 8}/10</Text></View>
            <Text style={s.questionText}>{activity.question}</Text>
          </View>
          <View style={s.answersHeading}><Text style={s.sectionLabel}>MGA BINHI NG ALAALA</Text><Text style={s.selectHint}>Piliin o hilahin ↑</Text></View>
          {activity.choices.map((choice, index) => <SeedPacket key={choice} choice={choice} index={index}
            selected={selected === choice} disabled={disabled} correct={Boolean(result) && !animating && choice === activity.answer}
            wrong={Boolean(result) && !animating && !result?.correct && selected === choice} dragging={dragging === choice}
            onSelect={selectChoice} onStart={startDrag} onMove={moveDrag} onDrop={dropSeed} onFinish={finishDrag}
          />)}
          {missedDrop && !result && <Text accessibilityLiveRegion="polite" style={s.dropHint}>Ihulog sa gintong bilog {questionIndex + 1}. Hindi pa naitala ang sagot.</Text>}
          {saveError && <Text accessibilityLiveRegion="polite" style={s.dropHint}>Hindi naitala ang sagot. Subukan muling isumite.</Text>}
          {!result && <>
            <Pressable testID="ugat-tree-submit" accessibilityRole="button" accessibilityLabel="Itanim ang binhi"
              accessibilityState={{ disabled: !selected || animating }} disabled={!selected || animating}
              onPress={() => { if (selected) void plantSeed(selected); }} style={[s.primaryButton, (!selected || animating) && s.buttonDisabled]}>
              <MaterialCommunityIcons name="sprout" size={21} color={Colors.accent} /><Text style={s.primaryButtonText}>Itanim ang binhi{selected ? ` ${String.fromCharCode(65 + activity.choices.indexOf(selected))}` : ""}</Text>
            </Pressable>
            <Text style={s.scoringNote}>Piliin ang sagot, saka itanim sa gintong bilog o pindutin ang button. Isang sagot lamang: tama = 1 puntos, mali = 0.</Text>
          </>}
        </ScrollView>
      </View>
      {dragging && <Reanimated.View pointerEvents="none" style={[s.floatingSeed, floatingStyle]}><MaterialCommunityIcons name="sprout" size={24} color={Colors.secondary} /><Text style={s.floatingLetter}>{String.fromCharCode(65 + activity.choices.indexOf(dragging))}</Text></Reanimated.View>}
    </View>
  </SafeAreaView></LinearGradient>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" }, screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: AppTheme.panelStrong },
  headerCompact: { paddingVertical: 10 },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: AppTheme.surfaceSoft },
  heading: { flex: 1, minWidth: 0 }, eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: .8, color: AppTheme.primary },
  title: { fontSize: 21, fontWeight: "900", color: AppTheme.text, marginTop: 3 }, titleCompact: { fontSize: 18 },
  storyTitle: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "700", color: AppTheme.muted },
  score: { flexDirection: "row", alignItems: "center", gap: 5, padding: 9, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft },
  scoreText: { color: AppTheme.text, fontSize: 16, fontWeight: "800" },
  journey: { flexDirection: "row", justifyContent: "center", gap: 12, paddingVertical: 9 },
  journeyStep: { flexDirection: "row", alignItems: "center", gap: 5 },
  journeyNode: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" },
  journeyCurrent: { backgroundColor: Colors.secondary }, journeyNumber: { color: Colors.accent, fontSize: 12, fontWeight: "900" },
  journeyLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: "700" }, journeyLabelCurrent: { color: Colors.secondary },
  workspace: { flex: 1, minHeight: 0 }, workspaceWide: { flexDirection: "row", gap: 22, maxWidth: 1160, width: "100%", alignSelf: "center", padding: 22, paddingTop: 10 },
  scenePane: { paddingHorizontal: 14, paddingBottom: 10 }, scenePaneWide: { width: "45%", paddingHorizontal: 0, paddingTop: 6 },
  boardHeading: { fontSize: 11, lineHeight: 17, fontWeight: "800", letterSpacing: .6, color: Colors.secondary, marginBottom: 12 },
  scene: { overflow: "hidden", borderRadius: 20, borderWidth: 2, borderColor: "#B69156" },
  forestSilhouette: { position: "absolute", width: "60%", height: "70%", top: -100, borderRadius: 100, backgroundColor: "rgba(71,110,59,0.16)" },
  artBoard: { position: "absolute", top: 24, bottom: 32, left: 0, right: 0 },
  artBoardCompact: { bottom: 40 },
  child: { position: "absolute", left: 2, bottom: 7, width: 64, height: 82 }, childCompact: { left: -5 },
  plotPosition: { position: "absolute", top: "89.666667%", width: 52, height: 48, marginLeft: -26, marginTop: -24 },
  plot: { flex: 1, borderRadius: 26, borderWidth: 2, borderColor: "#B28B59", backgroundColor: "#735738", alignItems: "center", justifyContent: "center" },
  plotCurrent: { borderWidth: 3, borderColor: "#FFE092" }, plotGrown: { backgroundColor: "#476E3B", borderColor: "#BDD878" },
  plotOver: { borderColor: Colors.surface, transform: [{ scale: 1.12 }] }, plotNumber: { color: Colors.surface, fontSize: 16, fontWeight: "900" },
  sceneTop: { position: "absolute", top: 9, left: 9, right: 9, flexDirection: "row", justifyContent: "space-between", gap: 6 },
  sceneTag: { fontSize: 9, fontWeight: "800", color: Colors.surface, backgroundColor: AppTheme.dark, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  sceneNote: { position: "absolute", bottom: 0, left: 0, right: 0, minHeight: 28, padding: 6, justifyContent: "center", backgroundColor: AppTheme.dark },
  sceneNoteText: { fontSize: 11, fontWeight: "700", textAlign: "center", color: Colors.surface },
  boardInstruction: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, marginTop: 14, backgroundColor: Colors.primarySoft, borderRadius: 16 },
  boardInstructionText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.secondary, fontWeight: "600" },
  questionPane: { flex: 1, minHeight: 0 }, questionContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 8 },
  questionCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, padding: 14, borderRadius: 17 },
  questionMeta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 5, marginBottom: 6 },
  sectionLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: .4 },
  questionText: { color: Colors.text, fontSize: 16, lineHeight: 23, fontWeight: "800" },
  answersHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 6 },
  selectHint: { color: Colors.textMuted, fontSize: 11, fontWeight: "600" },
  answer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 13 },
  answerSelected: { backgroundColor: Colors.primarySoft, borderColor: Colors.secondary }, answerCorrect: { backgroundColor: Colors.tealSoft, borderColor: Colors.secondary },
  answerWrong: { backgroundColor: AppTheme.errorSurface, borderColor: Colors.error }, answerDragging: { opacity: .55 },
  answerMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9, padding: 10, minHeight: 66 },
  packet: { width: 34, height: 45, borderRadius: 5, borderTopWidth: 4, borderTopColor: "#C9AD78", backgroundColor: "#F1E4C9", alignItems: "center", justifyContent: "center" },
  packetSelected: { backgroundColor: Colors.secondary, borderTopColor: AppTheme.border }, letter: { color: Colors.secondary, fontSize: 13, fontWeight: "900" }, letterSelected: { color: Colors.surface },
  answerCopy: { flex: 1 }, answerText: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  dragHandle: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center", marginRight: 5, borderRadius: 8, backgroundColor: Colors.primarySoft },
  dragLabel: { fontSize: 8, fontWeight: "800", color: Colors.secondary }, correctLabel: { marginTop: 4, color: Colors.secondary, fontSize: 11, fontWeight: "800" }, wrongLabel: { marginTop: 4, color: AppTheme.error, fontSize: 11, fontWeight: "800" },
  dropHint: { fontSize: 12, lineHeight: 18, color: Colors.secondary, padding: 9, backgroundColor: Colors.accentSoft, borderRadius: 9 },
  primaryButton: { minHeight: 48, marginTop: 5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 12, backgroundColor: AppTheme.dark, borderRadius: 13 },
  primaryButtonText: { fontSize: 14, color: Colors.surface, fontWeight: "800" }, buttonDisabled: { opacity: .45 },
  scoringNote: { fontSize: 11, lineHeight: 17, color: Colors.textMuted, textAlign: "center", marginTop: 2 },
  feedback: { padding: 13, borderRadius: 15, borderWidth: 1, borderColor: AppTheme.success, backgroundColor: Colors.tealSoft }, feedbackWrong: { backgroundColor: AppTheme.errorSurface, borderColor: AppTheme.error },
  feedbackTop: { flexDirection: "row", alignItems: "center", gap: 7 }, feedbackTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: Colors.text }, points: { fontSize: 12, color: Colors.text, fontWeight: "800" },
  feedbackBody: { fontSize: 13, lineHeight: 19, color: Colors.text, marginTop: 8 }, savedNote: { fontSize: 11, lineHeight: 16, color: Colors.textMuted, marginTop: 7 },
  completion: { padding: 12, marginVertical: 10, backgroundColor: Colors.accentSoft, borderRadius: 12 }, completionTitle: { fontSize: 16, fontWeight: "900", color: Colors.secondary }, completionBody: { fontSize: 13, lineHeight: 19, marginTop: 5, color: Colors.text },
  floatingSeed: { position: "absolute", top: 0, left: 0, width: 54, height: 64, borderRadius: 9, borderTopWidth: 6, borderTopColor: "#C9AD78", backgroundColor: "#FFF3C8", alignItems: "center", justifyContent: "center", zIndex: 100, elevation: 12 },
  floatingLetter: { fontSize: 19, fontWeight: "900", color: Colors.secondary },
});
