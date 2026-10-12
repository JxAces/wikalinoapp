import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { assessmentLevelTitle } from "@/components/story-world/quest-progression";
import Svg, { Path } from "react-native-svg";

import { AppTheme, Colors } from "../../constants/colors";
import type { StoryActivity } from "../../data/story-types";
import type { ActivityResult } from "../../store/useUserStore";
import { UgatRunnerChild } from "./other-games";
import { AssessmentInstruction, AssessmentPassage } from "./assessment-passage";

type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };
type ChoiceActivity = Extract<StoryActivity, { choices: string[] }>;
const CHECKPOINTS = ["PAHIWATIG", "TUNGGALIAN", "PAGGUNITA"];
const inside = (point: Point, bounds: Bounds) => bounds.width > 0 && bounds.height > 0
  && point.x >= bounds.x && point.x <= bounds.x + bounds.width
  && point.y >= bounds.y && point.y <= bounds.y + bounds.height;

function AnswerKey({ choice, index, selected, disabled, correct, wrong, dragging, onSelect, onStart, onMove, onDrop, onFinish }: {
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
  return (
    <View style={[s.answer, selected && s.answerSelected, correct && s.answerCorrect, wrong && s.answerWrong, dragging && s.answerDragging]}>
      <Pressable
        testID={`ugat-path-choice-${letter}`} accessibilityRole="button"
        accessibilityLabel={`Susi ${letter}: ${choice}${correct ? ", Tamang sagot" : wrong ? ", Iyong maling sagot" : ""}`}
        accessibilityHint="Piliin ang sagot, saka pindutin ang Buksan ang tarangkahan."
        accessibilityState={{ selected, disabled }} disabled={disabled}
        onPress={() => onSelect(choice)} style={s.answerMain}
      >
        <View style={[s.letter, selected && s.letterSelected]}><Text style={[s.letterText, selected && s.letterTextSelected]}>{letter}</Text></View>
        <View style={s.answerCopy}>
          <Text style={s.answerText}>{choice}</Text>
          {correct && <Text style={s.correctLabel}>✓ Tamang sagot</Text>}
          {wrong && <Text style={s.wrongLabel}>✕ Iyong sagot</Text>}
        </View>
      </Pressable>
      {!disabled && (
        <GestureDetector gesture={pan} touchAction="none">
          <Pressable
            testID={`ugat-path-drag-${letter}`} accessibilityRole="button" accessibilityLabel={`Hilahin ang susi ${letter}`}
            accessibilityHint="I-drag sa tanawin ng tarangkahan. Maaari ring pindutin para piliin."
            onPress={() => onSelect(choice)} style={s.dragHandle}
          >
            <MaterialCommunityIcons name="key-variant" size={22} color={Colors.secondary} />
            <Text style={s.dragLabel}>HILAHIN</Text>
          </Pressable>
        </GestureDetector>
      )}
    </View>
  );
}

export function UgatPathGame({ storyTitle, storyAuthor, activity, activities, questionIndex, results, onAnswer, onContinue, onBack }: {
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
  const score = activities.filter(item => results[item.id]?.correct).length;
  const lastQuestion = questionIndex === activities.length - 1;
  const [selected, setSelected] = useState<string | null>(typeof result?.selectedAnswer === "string" ? result.selectedAnswer : null);
  const [animating, setAnimating] = useState(false);
  const [pose, setPose] = useState<0 | 1 | 2>(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overGate, setOverGate] = useState(false);
  const [missedDrop, setMissedDrop] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const reducedMotion = useRef(false);
  const [sceneWidth, setSceneWidth] = useState(300);
  const [doorProgress] = useState(() => new Animated.Value(result?.correct ? 1 : 0));
  const [walkProgress] = useState(() => new Animated.Value(result?.correct ? 1 : 0));
  const [gateShake] = useState(() => new Animated.Value(0));
  const root = useRef<View>(null), target = useRef<View>(null), questionPanel = useRef<ScrollView>(null);
  const rootOrigin = useRef<Point>({ x: 0, y: 0 });
  const targetBounds = useRef<Bounds | null>(null);
  const locked = useRef(Boolean(result));
  const mounted = useRef(true);
  const previouslySubmitted = useRef(Boolean(result));
  const dragX = useSharedValue(0), dragY = useSharedValue(0);
  const disabled = Boolean(result) || animating;

  useEffect(() => {
    mounted.current = true;
    const updateMotion = (value: boolean) => { if (mounted.current) reducedMotion.current = value; };
    void AccessibilityInfo.isReduceMotionEnabled().then(updateMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", updateMotion);
    return () => { mounted.current = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!result || previouslySubmitted.current) return;
    previouslySubmitted.current = true;
    const reduceMotion = reducedMotion.current;
    let cancelled = false;
    let stride: ReturnType<typeof setInterval> | undefined;
    const finish = () => {
      if (stride) clearInterval(stride);
      if (cancelled || !mounted.current) return;
      setPose(0);
      setAnimating(false);
      questionPanel.current?.scrollTo({ y: 0, animated: !reduceMotion });
    };
    if (result.correct) {
      Animated.timing(doorProgress, { toValue: 1, duration: reduceMotion ? 0 : 220, useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
        if (!finished || cancelled) return;
        if (!reduceMotion) {
          setPose(1);
          stride = setInterval(() => setPose(current => current === 1 ? 2 : 1), 105);
        }
        Animated.timing(walkProgress, { toValue: 1, duration: reduceMotion ? 0 : 620, useNativeDriver: Platform.OS !== "web" }).start(finish);
      });
    } else {
      Animated.sequence((reduceMotion ? [0] : [-5, 5, -3, 3, 0]).map(toValue =>
        Animated.timing(gateShake, { toValue, duration: reduceMotion ? 0 : 50, useNativeDriver: Platform.OS !== "web" }),
      )).start(finish);
    }
    return () => {
      cancelled = true;
      if (stride) clearInterval(stride);
      doorProgress.stopAnimation(); walkProgress.stopAnimation(); gateShake.stopAnimation();
    };
  }, [doorProgress, gateShake, result, walkProgress]);

  function selectChoice(choice: string) {
    if (locked.current || disabled) return;
    setSelected(choice); setMissedDrop(false); setSaveError(false);
    void Haptics.selectionAsync().catch(() => undefined);
  }

  async function submitKey(choice: string) {
    if (locked.current || disabled || !activity.choices.includes(choice)) return;
    // Persist through the existing assessment before playing any reward animation.
    locked.current = true;
    setSelected(choice); setDragging(null); setOverGate(false); setMissedDrop(false); setSaveError(false); setAnimating(true);
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
    dragX.set(point.x - rootOrigin.current.x - 38);
    dragY.set(point.y - rootOrigin.current.y - 26);
    setOverGate(Boolean(targetBounds.current && inside(point, targetBounds.current)));
  }
  function startDrag(choice: string, point: Point) {
    if (locked.current) return;
    measureTargets(); selectChoice(choice); setDragging(choice); moveDrag(point);
  }
  function finishDrag() { setDragging(null); setOverGate(false); }
  function dropKey(choice: string, point: Point) {
    if (locked.current) return;
    // Release coordinates are checked against fresh bounds, including after scrolling.
    target.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      if (!mounted.current) return;
      if (inside(point, { x, y, width: targetWidth, height: targetHeight })) void submitKey(choice);
      else setMissedDrop(true);
    });
  }

  const floatingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }] }));
  const walkX = walkProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, sceneWidth * 0.31, sceneWidth * 0.67] });
  const walkY = walkProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, -21] });
  const openScale = doorProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] });
  const leftDoorX = doorProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -17] });
  const rightDoorX = doorProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 17] });
  const lockOpacity = doorProgress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0, 0] });
  const sceneMessage = animating ? result?.correct ? "Bukas ang landas! Naglalakbay…" : "Sinusuri ang susi…"
    : result ? result.correct ? "Nabuksan ang tarangkahan!" : "Hindi nabuksan ang tarangkahan."
      : overGate ? "Bitawan ang susi dito" : "Ihulog dito ang susi ng tamang sagot";

  return (
    <LinearGradient colors={AppTheme.backgroundGradient} style={s.screen}>
    <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
      <View ref={root} style={s.screen} onLayout={measureTargets}>
        <View style={[s.header, compact && s.headerCompact]}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Bumalik sa Pagsusulit" style={s.back}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={AppTheme.primary} />
          </Pressable>
          <View style={s.heading}><WikalinoBrand color={AppTheme.primary} /><Text style={s.eyebrow}>UGAT · {assessmentLevelTitle(1).toUpperCase()}</Text><Text style={[s.title, width < 360 && s.titleCompact]}>Landas ng Ugat</Text><Text testID="ugat-question-story-credit" style={s.storyTitle}>{storyTitle} ni {storyAuthor}</Text></View>
          <View style={s.score} accessibilityLabel={`${score} tamang sagot sa ${activities.length}`}>
            <MaterialCommunityIcons name="leaf" size={19} color={AppTheme.primary} />
            <Text style={s.scoreText} testID="ugat-path-score">{score}/{activities.length}</Text>
          </View>
        </View>

        <View style={s.progress} accessibilityLabel={`${answered} sa ${activities.length} tanong ang nasagutan`}>
          {activities.map((item, index) => {
            const checkpointResult = results[item.id];
            const current = index === questionIndex;
            return <View key={item.id} style={s.progressItem}>
              {index > 0 && width >= 360 && <View style={s.connector} />}
              <View style={[s.node, current && s.nodeCurrent, checkpointResult && (checkpointResult.correct ? s.nodeDone : s.nodeWrong)]}>
                {checkpointResult ? <MaterialCommunityIcons name={checkpointResult.correct ? "check" : "close"} size={17} color={Colors.surface} /> : <Text style={[s.nodeText, current && s.nodeTextCurrent]}>{index + 1}</Text>}
              </View>
              <Text style={[s.nodeLabel, current && s.nodeLabelCurrent]}>{CHECKPOINTS[index]}</Text>
            </View>;
          })}
        </View>

        <View style={[s.workspace, wide && s.workspaceWide]}>
          <View style={[s.scenePane, wide && s.scenePaneWide]}>
            <View ref={target} collapsable={false} onLayout={event => { setSceneWidth(event.nativeEvent.layout.width); measureTargets(); }} style={[s.scene, { height: wide ? 300 : compact ? 168 : 205 }, overGate && s.sceneOver]}>
              <Pressable
                testID="ugat-path-gate" accessibilityRole="button" accessibilityLabel={`Tarangkahan ${questionIndex + 1}: ${CHECKPOINTS[questionIndex]}`}
                accessibilityHint="Pumili ng sagot at pindutin dito, o ihulog ang susi sa tanawin."
                accessibilityState={{ disabled: disabled || !selected }} disabled={disabled || !selected}
                onPress={() => { if (selected) void submitKey(selected); }} style={s.sceneTarget}
              >
                <Image source={require("../../assets/images/stories/sa-ilalim-ng-punong-kahoy.png")} resizeMode="cover" style={s.backdrop} />
                <View style={s.shade} />
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <Svg width="100%" height={100} viewBox="0 0 400 100" preserveAspectRatio="none" style={s.road}>
                    <Path d="M-15 75 C90 57 164 71 225 51 C286 31 330 38 413 30" fill="none" stroke="#785C3D" strokeWidth={42} strokeLinecap="round" />
                    <Path d="M-15 71 C90 53 164 67 225 47 C286 27 330 34 413 26" fill="none" stroke="#BEA374" strokeWidth={31} strokeLinecap="round" />
                    <Path d="M-15 69 C90 51 164 65 225 45 C286 25 330 32 413 24" fill="none" stroke="#E2C997" strokeWidth={20} strokeLinecap="round" />
                    <Path d="M83 78 Q76 92 60 98 M165 77 Q178 94 186 99 M316 49 Q331 68 350 69" fill="none" stroke="#765433" strokeWidth={4} strokeLinecap="round" />
                  </Svg>
                  <Animated.View testID="ugat-path-gate-doors" style={[s.gate, { transform: [{ translateX: gateShake }] }]}>
                    <View style={[s.gatePost, { left: 0 }]} /><View style={[s.gatePost, { right: 0 }]} />
                    <View style={s.lintel}><Text style={s.lintelText}>{CHECKPOINTS[questionIndex]}</Text></View>
                    {[false, true].map(right => <Animated.View key={String(right)} style={[s.door, right ? { right: 9 } : { left: 9 }, { transform: [{ translateX: right ? rightDoorX : leftDoorX }, { scaleX: openScale }] }]}>
                      <View style={[s.plank, { left: 8 }]} /><View style={[s.plank, { left: 21 }]} /><View style={s.doorBrace} />
                    </Animated.View>)}
                    <Animated.View style={[s.lock, { opacity: lockOpacity }]}><MaterialCommunityIcons name="lock" size={20} color={Colors.secondary} /></Animated.View>
                  </Animated.View>
                  <Animated.View testID="ugat-path-child" style={[s.child, { transform: [{ translateX: walkX }, { translateY: walkY }] }]}><UgatRunnerChild pose={pose} /></Animated.View>
                  <View style={s.sceneTop}><View style={s.sceneTag}><Text style={s.sceneTagText}>{answered}/{activities.length} NASAGUTAN</Text></View></View>
                  <View style={s.sceneNote}><Text testID="ugat-path-scene-status" style={s.sceneNoteText}>{sceneMessage}</Text></View>
                </View>
              </Pressable>
            </View>
            {wide && <View style={s.boardInstruction}><MaterialCommunityIcons name="key-variant" size={22} color={Colors.secondary} /><Text style={s.boardInstructionText}>Piliin ang tamang susi upang buksan ang tarangkahan at maipagpatuloy ang paglalakbay.</Text></View>}
          </View>

          <ScrollView ref={questionPanel} style={s.questionPane} scrollEnabled={!dragging} showsVerticalScrollIndicator={false} contentContainerStyle={s.questionContent}>
            {result && !animating && <View testID="ugat-path-feedback" accessibilityLiveRegion="polite" style={[s.feedback, !result.correct && s.feedbackWrong]}>
              <View style={s.feedbackTop}><MaterialCommunityIcons name={result.correct ? "check-circle-outline" : "close-circle-outline"} size={22} color={result.correct ? Colors.secondary : Colors.error} /><Text style={s.feedbackTitle}>{result.correct ? "Nabuksan ang tarangkahan!" : "Hindi ito ang tamang susi."}</Text><Text style={s.points}>{result.correct ? "+1" : "0"} puntos</Text></View>
              <Text style={s.feedbackBody}>{activity.explanation}</Text>
              <Text style={s.savedNote}>Naitala na ang sagot. Hindi na ito maaaring baguhin.</Text>
              {lastQuestion && answered === activities.length && <Text style={s.finalScore}>Tapos ang Level 2 · {score}/{activities.length} tamang sagot</Text>}
              <Pressable testID="ugat-path-continue" accessibilityRole="button" onPress={onContinue} style={s.primaryButton}><Text style={s.primaryButtonText}>{lastQuestion ? "Bumalik sa Pagsusulit" : "Susunod na tanong"}</Text><MaterialCommunityIcons name="arrow-right" size={19} color={Colors.surface} /></Pressable>
            </View>}
            <AssessmentInstruction instruction={activity.instruction} />
            <AssessmentPassage passage={"passage" in activity ? activity.passage : undefined} />
            <View style={s.questionCard}>
              <View style={s.questionMeta}><Text style={s.sectionLabel}>HAMON</Text><Text style={s.sectionLabel}>TANONG {questionIndex + 4} / 10</Text></View>
              <Text testID="assessment-question" style={s.questionText}>{activity.question}</Text>
            </View>
            <View style={s.answersHeading}><Text style={s.sectionLabel}>MGA SUSI NG LANDAS</Text><Text style={s.selectHint}>Piliin o hilahin ↑</Text></View>
            {activity.choices.map((choice, index) => <AnswerKey
              key={choice} choice={choice} index={index} selected={selected === choice} disabled={disabled}
              correct={Boolean(result) && !animating && choice === activity.answer}
              wrong={Boolean(result) && !animating && !result?.correct && selected === choice}
              dragging={dragging === choice} onSelect={selectChoice} onStart={startDrag} onMove={moveDrag} onDrop={dropKey} onFinish={finishDrag}
            />)}
            {missedDrop && !result && <Text accessibilityLiveRegion="polite" style={s.dropHint}>Ihulog sa tanawin ng tarangkahan. Hindi pa naitala ang sagot.</Text>}
            {saveError && <Text accessibilityLiveRegion="polite" style={s.dropHint}>Hindi naitala ang sagot. Subukan muling isumite.</Text>}
            {!result && <>
              <Pressable testID="ugat-path-submit" accessibilityRole="button" accessibilityLabel="Buksan ang tarangkahan" accessibilityState={{ disabled: !selected || animating }} disabled={!selected || animating} onPress={() => { if (selected) void submitKey(selected); }} style={[s.primaryButton, (!selected || animating) && s.buttonDisabled]}>
                <MaterialCommunityIcons name="key-variant" size={21} color={Colors.accent} /><Text style={s.primaryButtonText}>Buksan ang tarangkahan</Text>
              </Pressable>
              <Text style={s.scoringNote}>Isang sagot bawat tanong. Tama: 1 puntos. Mali: 0 puntos.</Text>
            </>}
          </ScrollView>
        </View>

        {dragging && <Reanimated.View pointerEvents="none" style={[s.floatingKey, floatingStyle]}><MaterialCommunityIcons name="key-variant" size={28} color={Colors.accent} /><Text style={s.floatingLetter}>{String.fromCharCode(65 + activity.choices.indexOf(dragging))}</Text></Reanimated.View>}
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: AppTheme.panelStrong },
  headerCompact: { paddingVertical: 10 },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: AppTheme.surfaceSoft },
  heading: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: .8, color: AppTheme.primary },
  title: { fontSize: 21, fontWeight: "900", color: AppTheme.text, marginTop: 3 },
  titleCompact: { fontSize: 18 },
  storyTitle: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "700", color: AppTheme.muted },
  score: { flexDirection: "row", alignItems: "center", gap: 5, padding: 9, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft },
  scoreText: { color: AppTheme.text, fontSize: 16, fontWeight: "800" },
  progress: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 22 },
  progressItem: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 5 },
  connector: { position: "absolute", left: -10, width: 15, height: 2, backgroundColor: Colors.border },
  node: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" },
  nodeCurrent: { backgroundColor: Colors.primary },
  nodeDone: { backgroundColor: Colors.secondary },
  nodeWrong: { backgroundColor: Colors.error },
  nodeText: { color: Colors.textMuted, fontSize: 12, fontWeight: "800" },
  nodeTextCurrent: { color: Colors.accent },
  nodeLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "800" },
  nodeLabelCurrent: { color: Colors.secondary },
  workspace: { flex: 1, minHeight: 0 },
  workspaceWide: { flexDirection: "row", gap: 22, maxWidth: 1160, width: "100%", alignSelf: "center", padding: 22, paddingTop: 10 },
  scenePane: { paddingHorizontal: 14, paddingBottom: 10 },
  scenePaneWide: { width: "45%", paddingHorizontal: 0, paddingTop: 6 },
  scene: { overflow: "hidden", borderRadius: 20, borderWidth: 2, borderColor: "#B69156", backgroundColor: "#304E36" },
  sceneOver: { borderColor: Colors.accent, borderWidth: 3 },
  sceneTarget: { flex: 1 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", opacity: .85 },
  shade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(26,58,39,0.2)" },
  road: { position: "absolute", bottom: 7, left: 0 },
  gate: { position: "absolute", right: "15%", bottom: 39, width: 96, height: 101 },
  gatePost: { position: "absolute", width: 9, top: 10, bottom: 0, backgroundColor: "#795737", borderWidth: 2, borderColor: "#C39B61", borderRadius: 3 },
  lintel: { position: "absolute", top: 0, left: -6, right: -6, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 2, borderColor: "#D2AE68", backgroundColor: "#274733", zIndex: 4 },
  lintelText: { fontSize: 11, color: "#F7E4AB", fontWeight: "900", letterSpacing: .6 },
  door: { position: "absolute", top: 25, bottom: 2, width: 38, backgroundColor: "#986D44", borderWidth: 2, borderColor: "#C1985D", overflow: "hidden" },
  plank: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#6D4B31" },
  doorBrace: { position: "absolute", left: 0, right: 0, top: 38, height: 5, backgroundColor: "#CAAA72", transform: [{ rotate: "-25deg" }] },
  lock: { position: "absolute", top: 50, left: 33, width: 31, height: 31, borderRadius: 16, backgroundColor: "#ECD49C", alignItems: "center", justifyContent: "center", zIndex: 3 },
  child: { position: "absolute", left: "4%", bottom: 27, width: 64, height: 82, zIndex: 5 },
  sceneTop: { position: "absolute", top: 9, left: 9, right: 9, flexDirection: "row", justifyContent: "flex-end", gap: 6 },
  sceneTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: AppTheme.dark },
  sceneTagText: { color: Colors.surface, fontSize: 10, fontWeight: "800" },
  sceneNote: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 6, backgroundColor: AppTheme.overlay },
  sceneNoteText: { fontSize: 11, fontWeight: "700", textAlign: "center", color: Colors.surface },
  boardInstruction: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, marginTop: 14, backgroundColor: Colors.primarySoft, borderRadius: 16 },
  boardInstructionText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.secondary, fontWeight: "600" },
  questionPane: { flex: 1, minHeight: 0 },
  questionContent: { paddingHorizontal: 14, paddingBottom: 24, gap: 8 },
  questionCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, padding: 14, borderRadius: 17 },
  questionMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sectionLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: .6 },
  questionText: { color: Colors.text, fontSize: 16, lineHeight: 23, fontWeight: "800" },
  answersHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 6 },
  selectHint: { color: Colors.textMuted, fontSize: 11, fontWeight: "600" },
  answer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 13 },
  answerSelected: { backgroundColor: Colors.primarySoft, borderColor: Colors.secondary },
  answerCorrect: { backgroundColor: Colors.tealSoft, borderColor: Colors.secondary },
  answerWrong: { backgroundColor: AppTheme.errorSurface, borderColor: Colors.error },
  answerDragging: { opacity: .55 },
  answerMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9, padding: 10, minHeight: 62 },
  letter: { width: 30, height: 32, borderRadius: 8, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" },
  letterSelected: { backgroundColor: Colors.secondary },
  letterText: { color: Colors.secondary, fontSize: 13, fontWeight: "900" },
  letterTextSelected: { color: Colors.surface },
  answerCopy: { flex: 1 },
  answerText: { color: Colors.text, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  dragHandle: { width: 46, minHeight: 48, alignItems: "center", justifyContent: "center", marginRight: 5, borderRadius: 8, backgroundColor: Colors.primarySoft },
  dragLabel: { fontSize: 8, fontWeight: "800", color: Colors.secondary, marginTop: 2 },
  correctLabel: { marginTop: 4, color: Colors.secondary, fontSize: 11, fontWeight: "800" },
  wrongLabel: { marginTop: 4, color: AppTheme.error, fontSize: 11, fontWeight: "800" },
  dropHint: { fontSize: 12, lineHeight: 18, color: Colors.secondary, padding: 9, backgroundColor: Colors.accentSoft, borderRadius: 9 },
  primaryButton: { minHeight: 48, marginTop: 5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 12, backgroundColor: AppTheme.dark, borderRadius: 13 },
  primaryButtonText: { fontSize: 14, color: Colors.surface, fontWeight: "800" },
  buttonDisabled: { opacity: .45 },
  scoringNote: { fontSize: 11, lineHeight: 17, color: Colors.textMuted, textAlign: "center", marginTop: 2 },
  feedback: { padding: 13, borderRadius: 15, borderWidth: 1, borderColor: AppTheme.success, backgroundColor: Colors.tealSoft },
  feedbackWrong: { backgroundColor: AppTheme.errorSurface, borderColor: AppTheme.error },
  feedbackTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  feedbackTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: Colors.text },
  points: { fontSize: 12, color: Colors.text, fontWeight: "800" },
  feedbackBody: { fontSize: 13, lineHeight: 19, color: Colors.text, marginTop: 8 },
  savedNote: { fontSize: 11, lineHeight: 16, color: Colors.textMuted, marginTop: 7 },
  finalScore: { fontSize: 15, fontWeight: "800", color: Colors.secondary, marginTop: 9 },
  floatingKey: { position: "absolute", top: 0, left: 0, width: 76, height: 52, borderRadius: 14, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.accent, flexDirection: "row", gap: 5, alignItems: "center", justifyContent: "center", zIndex: 100, elevation: 12 },
  floatingLetter: { fontSize: 18, fontWeight: "900", color: Colors.surface },
});
