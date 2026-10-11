import { AppTheme } from "../../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { assessmentLevelTitle } from "@/components/story-world/quest-progression";
import Svg, { Circle, Defs, G, Path, Pattern, Polygon, Rect, Text as SvgText } from "react-native-svg";

import type { ChoiceActivity } from "../../data/story-types";
import type { ActivityResult } from "../../store/useUserStore";

type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };
type Garment = {
  width: number; height: number;
  pieces: number[][][]; labels: number[][]; outline?: number[][];
  seam: string; neckline?: string;
  title: string; subtitle: string; boardTitle: string;
};
const GARMENTS: Record<1 | 2, Garment> = {
  1: {
    width: 320, height: 280,
    pieces: [
      [[160, 48], [122, 26], [28, 82], [54, 140], [96, 118], [96, 182], [160, 182]],
      [[160, 48], [198, 26], [292, 82], [266, 140], [224, 118], [224, 182], [160, 182]],
      [[96, 182], [224, 182], [230, 264], [90, 264]],
    ],
    labels: [[126, 128], [194, 128], [160, 229]],
    seam: "M103 180H217M160 54V176", neckline: "M122 28Q160 92 198 28",
    title: "Piliin ang tamang sagot", subtitle: "Pamilyar", boardTitle: "ANG IYONG DAMIT",
  },
  2: {
    width: 280, height: 310,
    outline: [[93, 28], [61, 42], [23, 72], [45, 121], [78, 101], [78, 174], [45, 283], [235, 283], [202, 174], [202, 101], [235, 121], [257, 72], [219, 42], [187, 28], [164, 51], [116, 51]],
    pieces: [
      [[93, 28], [61, 42], [23, 72], [45, 121], [78, 101], [78, 77], [93, 63]],
      [[160, 87], [202, 87], [202, 174], [140, 174], [140, 119]],
      [[140, 174], [202, 174], [235, 283], [140, 283]],
    ],
    labels: [[62, 78], [172, 133], [180, 233]],
    seam: "M80 176H200M94 30Q140 100 186 30M54 274H226",
    title: "Tahiin ang damit", subtitle: "Interpretasyon at Hinuha", boardTitle: "KUMPLETUHIN ANG DAMIT",
  },
};
const FABRICS = ["#A2CFBA", "#E8ADB4", "#EDCE85"];
const polygonPoints = (vertices: number[][]) => vertices.map(point => point.join(",")).join(" ");

// Only a release inside the garment counts, not the surrounding table.
function isOnGarment(point: Point, bounds: Bounds, garment: Garment) {
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  const x = (point.x - bounds.x) * garment.width / bounds.width;
  const y = (point.y - bounds.y) * garment.height / bounds.height;
  return (garment.outline ? [garment.outline] : garment.pieces).some(vertices => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const [xi, yi] = vertices[i], [xj, yj] = vertices[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

function FabricChoice({ choice, index, selected, result, answer, onSelect, onStart, onMove, onDrop, onFinish, dragging }: {
  choice: string; index: number; selected: boolean; result?: ActivityResult; answer: string; dragging: boolean;
  onSelect: (choice: string) => void;
  onStart: (choice: string, point: Point) => void;
  onMove: (point: Point) => void;
  onDrop: (choice: string, point: Point) => void;
  onFinish: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  const correct = Boolean(result) && choice === answer;
  const wrong = Boolean(result) && !result?.correct && result?.selectedAnswer === choice;
  const pan = Gesture.Pan().enabled(!result).minDistance(8).runOnJS(true)
    .onStart(event => onStart(choice, { x: event.absoluteX, y: event.absoluteY }))
    .onUpdate(event => onMove({ x: event.absoluteX, y: event.absoluteY }))
    .onEnd(event => onDrop(choice, { x: event.absoluteX, y: event.absoluteY }))
    .onFinalize(onFinish);

  return (
    <GestureDetector gesture={pan} touchAction="none">
      <Pressable
        testID={`sewing-choice-${letter}`}
        accessibilityRole="button"
        accessibilityLabel={`Sagot ${letter}: ${choice}${correct ? ", Tamang sagot" : wrong ? ", Maling sagot" : ""}`}
        accessibilityHint="I-drag sa damit, o piliin ito at pindutin ang damit upang isumite."
        accessibilityState={{ selected, disabled: Boolean(result) }}
        disabled={Boolean(result)}
        onPress={() => onSelect(choice)}
        style={[s.choice, selected && !result && s.choiceSelected, correct && s.choiceCorrect, wrong && s.choiceWrong, dragging && s.choiceDragging]}
      >
        <View style={[s.letter, { backgroundColor: FABRICS[index % 3] }]}><Text style={s.letterText}>{letter}</Text></View>
        <View style={s.choiceCopy}>
          <Text style={s.choiceText}>{choice}</Text>
          {correct && <Text style={s.correctLabel}>✓ Tamang sagot</Text>}
          {wrong && <Text style={s.wrongLabel}>✕ Iyong sagot</Text>}
        </View>
        {!result && <MaterialCommunityIcons name="drag" size={22} color={AppTheme.muted} />}
      </Pressable>
    </GestureDetector>
  );
}

export function SandaangSewingGame({ level, activity, activities, questionIndex, results, onAnswer, onContinue, onCompleteLevel, onBack }: {
  level: 1 | 2;
  activity: ChoiceActivity; activities: ChoiceActivity[]; questionIndex: number;
  results: Record<string, ActivityResult>;
  onAnswer: (choice: string) => Promise<void>;
  onContinue: () => void; onCompleteLevel: () => void; onBack: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 760;
  const compact = !wide && height < 720;
  const garment = GARMENTS[level];
  const result = results[activity.id];
  const score = activities.filter(item => results[item.id]?.correct).length;
  const answered = activities.filter(item => results[item.id]).length;
  const complete = answered === activities.length;
  const showLevelResult = complete && questionIndex === activities.length - 1;
  const continueLabel = showLevelResult
    ? "Bumalik sa Pagsusulit"
    : "Susunod na tanong";
  const [selected, setSelected] = useState<string | null>(typeof result?.selectedAnswer === "string" ? result.selectedAnswer : null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overShirt, setOverShirt] = useState(false);
  const [dropHint, setDropHint] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const root = useRef<View>(null), target = useRef<View>(null);
  const questionPanel = useRef<ScrollView>(null);
  const rootOrigin = useRef<Point>({ x: 0, y: 0 });
  const targetBounds = useRef<Bounds | null>(null);
  const dragX = useSharedValue(0), dragY = useSharedValue(0);
  const [celebration] = useState(() => new Animated.Value(0));
  const previouslySubmitted = useRef(Boolean(result));
  const shirtWidth = wide ? Math.min(360, (width - 80) * 0.43) : compact ? 126 : 174;
  const shirtHeight = shirtWidth * garment.height / garment.width;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); celebration.stopAnimation(); };
  }, [celebration]);

  useEffect(() => {
    if (result && !previouslySubmitted.current) {
      previouslySubmitted.current = true;
      questionPanel.current?.scrollTo({ y: 0, animated: !reduceMotion });
      if (!reduceMotion) {
        celebration.setValue(0);
        Animated.timing(celebration, { toValue: 1, duration: result.correct ? 650 : 320, useNativeDriver: true }).start();
      }
    }
  }, [celebration, reduceMotion, result]);

  function measureTargets() {
    root.current?.measureInWindow((x, y) => { rootOrigin.current = { x, y }; });
    target.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      targetBounds.current = { x, y, width: targetWidth, height: targetHeight };
    });
  }

  function moveDrag(point: Point) {
    dragX.set(point.x - rootOrigin.current.x - 108);
    dragY.set(point.y - rootOrigin.current.y - 66);
    setOverShirt(Boolean(targetBounds.current && isOnGarment(point, targetBounds.current, garment)));
  }

  function startDrag(choice: string, point: Point) {
    measureTargets();
    setSelected(choice);
    setDropHint(false);
    setDragging(choice);
    moveDrag(point);
  }

  function finishDrag() { setDragging(null); setOverShirt(false); }

  function dropChoice(choice: string, point: Point) {
    // Re-measure at release, including after scrolling or rotating the device.
    target.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      if (isOnGarment(point, { x, y, width: targetWidth, height: targetHeight }, garment)) void onAnswer(choice);
      else setDropHint(true);
    });
  }

  const floatingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }] }));
  const shirtMotion = result?.correct
    ? { scale: celebration.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.045, 1] }) }
    : { translateX: celebration.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -4, 4, -2, 0] }) };

  return (
    <LinearGradient colors={AppTheme.backgroundGradient} style={s.screen}>
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View ref={root} style={s.screen} onLayout={measureTargets}>
        <View style={[s.header, compact && s.headerCompact]}>
          <Pressable onPress={onBack} accessibilityLabel="Bumalik sa mundo" accessibilityRole="button" style={s.back}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={AppTheme.primary} />
          </Pressable>
          <View style={s.heading}>
            <WikalinoBrand color={AppTheme.primary} />
            <Text style={[s.eyebrow, compact && s.eyebrowCompact]} numberOfLines={1}>PAGSUSULIT · SANDAANG DAMIT</Text>
            <Text style={[s.title, compact && s.titleCompact]} numberOfLines={2} adjustsFontSizeToFit>{garment.title}</Text>
          </View>
          <View style={s.score} accessibilityLabel={`Iskor sa Level ${level}: ${score} sa ${activities.length}`}>
            <Text style={s.scoreLabel}>ISKOR · LEVEL {level}</Text>
            <Text style={s.scoreValue} testID="sewing-score">{score}/{activities.length}</Text>
          </View>
        </View>

        <View style={s.progress}>
          <View style={s.progressLabels}><Text style={s.level}>{assessmentLevelTitle(level - 1)}{level === 2 ? ` · ${garment.subtitle}` : ""}</Text><Text style={s.count}>{answered}/{activities.length} nasagutan</Text></View>
          <View style={s.progressBars}>{activities.map(item => <View key={item.id} style={[s.progressBar, Boolean(results[item.id]) && s.progressDone]} />)}</View>
        </View>

        <View style={[s.workspace, wide && s.workspaceWide]}>
          <View style={[s.board, wide && s.boardWide]}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: 8 }, (_, index) => <View key={index} style={[s.woodLine, { top: `${index * 14}%` }]} />)}</View>
            <View style={s.boardHeading}><Text style={s.boardTitle}>{garment.boardTitle}</Text><Text style={s.pieceCount} testID="sewing-pieces">{score}/{activities.length} piraso</Text></View>
            <View style={[s.tableContents, wide && s.tableContentsWide]}>
              <View ref={target} collapsable={false} onLayout={measureTargets} style={{ width: shirtWidth, height: shirtHeight }}>
                <Pressable
                  testID="sewing-shirt" accessibilityRole="button" accessibilityLabel={result ? "Damit: naitala na ang sagot" : `Damit: sagutan ang naka-highlight na bilang ${questionIndex + 1}`}
                  accessibilityHint={selected ? "Pindutin upang isumite ang napiling sagot." : "Pumili muna ng sagot, o i-drag ito rito."}
                  accessibilityState={{ disabled: Boolean(result) || !selected }} disabled={Boolean(result) || !selected}
                  onPress={() => { if (selected) void onAnswer(selected); }} style={s.shirtTarget}
                >
                  <Animated.View pointerEvents="none" style={[s.shirtTarget, { transform: [shirtMotion] }]}>
                    <Svg width="100%" height="100%" viewBox={`0 0 ${garment.width} ${garment.height}`}>
                      <Defs>
                        {FABRICS.map((color, index) => <Pattern id={`fabric-${index}`} key={color} width="12" height="12" patternUnits="userSpaceOnUse"><Rect width="12" height="12" fill={color} /><Path d="M0 0H12M0 0V12" stroke="#FFFDF3" strokeOpacity="0.35" strokeWidth="1" /></Pattern>)}
                        <Pattern id="fabric-incomplete" width="10" height="10" patternUnits="userSpaceOnUse"><Rect width="10" height="10" fill="#A9C8C2" /><Path d="M0 0H10M0 0V10" stroke="#EEF9E6" strokeOpacity="0.4" strokeWidth="0.7" /></Pattern>
                      </Defs>
                      {garment.outline && <Polygon points={polygonPoints(garment.outline)} fill="url(#fabric-incomplete)" stroke="#EEF9E6" strokeWidth="1.2" />}
                      {garment.pieces.map((vertices, index) => {
                        const earned = results[activities[index].id]?.correct;
                        const missed = Boolean(results[activities[index].id]) && !earned;
                        const active = index === questionIndex && !result;
                        const [labelX, labelY] = garment.labels[index];
                        return <G key={index}>
                          <Polygon points={polygonPoints(vertices)} fill={earned ? level === 2 ? "url(#fabric-incomplete)" : `url(#fabric-${index})` : active ? "#8D7440" : "#584730"} fillOpacity={level === 2 || earned || active ? 1 : 0.7} stroke={active ? overShirt ? "#FFF7D7" : "#F9D86A" : "#CDBE9D"} strokeWidth={active ? 4 : 2} strokeDasharray={earned || active ? undefined : "7 5"} />
                          {active && <Circle cx={labelX} cy={labelY} r="28" fill="#F9D86A" fillOpacity="0.25" />}
                          <Circle cx={labelX} cy={labelY} r={active ? 22 : 14} fill={active ? "#F9D86A" : earned ? "#275A40" : "#695A44"} stroke={active ? "#FFF7D7" : "none"} strokeWidth={active ? 3 : 0} />
                          <SvgText x={labelX} y={labelY + (active ? 9 : 5)} textAnchor="middle" fill={active ? "#3B3219" : "#FFFFFF"} fontWeight={active ? "900" : "700"} fontSize={active ? 26 : 15}>{earned ? "✓" : missed ? "–" : index + 1}</SvgText>
                        </G>;
                      })}
                      <Path d={garment.seam} fill="none" stroke="#FFF5DB" strokeWidth="2" strokeDasharray="5 5" />
                      {garment.neckline && <Path d={garment.neckline} fill="none" stroke="#E4CEAA" strokeWidth="3" />}
                    </Svg>
                  </Animated.View>
                </Pressable>
              </View>
              <View style={[s.boardNote, wide && s.boardNoteWide]}>
                <MaterialCommunityIcons name={complete ? "check-circle-outline" : "needle"} size={wide ? 27 : 21} color={AppTheme.darkText} />
                <Text style={s.dropLabel}>{result ? complete ? score === activities.length ? "Nabuo mo ang damit!" : `Tapos ang Level ${level}` : "Naitala na ang sagot" : overShirt ? "Bitawan ang sagot dito" : `Sagutan ang bilang ${questionIndex + 1}`}</Text>
                <Text style={[s.legend, compact && s.legendCompact]}>{level === 2 ? "May tela na ang ibang bahagi.\n" : ""}✓ Natahi: tamang sagot{"\n"}– Walang tela: maling sagot</Text>
              </View>
            </View>
          </View>

          <View style={[s.questionPane, wide && s.questionPaneWide]}>
            <ScrollView ref={questionPanel} scrollEnabled={!dragging} contentContainerStyle={s.questionContent} showsVerticalScrollIndicator={false}>
              {result && <View accessibilityLiveRegion="polite" testID="sewing-feedback" style={[s.feedback, result.correct ? s.feedbackCorrect : s.feedbackWrong]}>
                <View style={s.feedbackHeading}>
                  <MaterialCommunityIcons name={result.correct ? "check-circle" : "close-circle"} size={23} color={result.correct ? AppTheme.success : AppTheme.error} />
                  <Text style={[s.feedbackTitle, !result.correct && { color: AppTheme.error }]}>{result.correct ? "Correct!" : "Incorrect"}</Text>
                  <Text style={s.points}>{result.correct ? `+1 puntos · +${result.xpEarned} XP` : "0 puntos"}</Text>
                </View>
                <Text style={s.feedbackText}>{result.correct ? "Natahi ang isang piraso ng damit." : "Naka-highlight ang tamang sagot sa ibaba."}</Text>
                {showLevelResult && <Text style={s.finalScore}>Tapos ang Level {level} · {score} tamang sagot sa {activities.length}</Text>}
              </View>}
              <Text style={s.questionLabel}>TANONG {questionIndex + 1} SA {activities.length}</Text>
              <Text style={s.question}>{activity.question}</Text>
              {!result && <Text style={s.instruction}>I-drag ang sagot sa damit. Maaari ring pumili, saka pindutin ang damit. Isang sagot lamang bawat tanong.</Text>}
              {dropHint && !result && <Text accessibilityLiveRegion="polite" style={s.returnHint}>Ihulog sa loob ng damit. Hindi pa naitala ang sagot.</Text>}
              <View style={s.choices}>{activity.choices.map((choice, index) => <FabricChoice
                key={choice} choice={choice} index={index} selected={selected === choice} result={result} answer={activity.answer}
                dragging={dragging === choice} onSelect={choice => { setSelected(choice); setDropHint(false); }}
                onStart={startDrag} onMove={moveDrag} onDrop={dropChoice} onFinish={finishDrag}
              />)}</View>
              {result && <Text style={s.explanation}>{activity.explanation}</Text>}
            </ScrollView>
            {result && <Pressable accessibilityRole="button" accessibilityLabel={continueLabel} onPress={showLevelResult ? onCompleteLevel : onContinue} style={s.continue}>
              <Text style={s.continueText}>{continueLabel}</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.buttonText} />
            </Pressable>}
          </View>
        </View>
        {dragging && <Reanimated.View pointerEvents="none" style={[s.floating, floatingStyle]}><Text style={s.floatingLetter}>{String.fromCharCode(65 + activity.choices.indexOf(dragging))}</Text><Text style={s.floatingText} numberOfLines={2}>{dragging}</Text></Reanimated.View>}
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: AppTheme.panelStrong },
  headerCompact: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  back: { width: 40, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: AppTheme.surfaceSoft },
  heading: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, color: AppTheme.primary },
  eyebrowCompact: { fontSize: 8, letterSpacing: 0 },
  title: { fontSize: 22, fontWeight: "800", color: AppTheme.text, marginTop: 3 },
  titleCompact: { fontSize: 18 },
  score: { alignItems: "flex-end" },
  scoreLabel: { fontSize: 10, fontWeight: "700", color: AppTheme.muted },
  scoreValue: { fontSize: 28, fontWeight: "800", color: AppTheme.text },
  progress: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 11, gap: 8 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  level: { fontSize: 13, fontWeight: "800", color: AppTheme.primary, flexShrink: 1 },
  count: { fontSize: 12, color: AppTheme.muted, flexShrink: 0 },
  progressBars: { flexDirection: "row", gap: 6 },
  progressBar: { height: 5, borderRadius: 4, flex: 1, backgroundColor: AppTheme.panelStrong },
  progressDone: { backgroundColor: AppTheme.primary },
  workspace: { flex: 1, minHeight: 0, paddingHorizontal: 12, paddingBottom: 12, gap: 12, width: "100%", maxWidth: 1100, alignSelf: "center" },
  workspaceWide: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 24, gap: 20 },
  board: { backgroundColor: AppTheme.primary, borderRadius: 22, padding: 12, borderWidth: 1, borderColor: AppTheme.border, overflow: "hidden" },
  boardWide: { flex: 0.95, alignSelf: "flex-start", padding: 22 },
  woodLine: { position: "absolute", height: 2, width: "100%", backgroundColor: "#DEC9A512" },
  boardHeading: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  boardTitle: { color: AppTheme.darkText, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  pieceCount: { color: AppTheme.darkText, fontSize: 12, fontWeight: "700" },
  tableContents: { flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", gap: 8 },
  tableContentsWide: { flexDirection: "column", paddingTop: 12, gap: 16 },
  shirtTarget: { width: "100%", height: "100%" },
  boardNote: { flex: 1, maxWidth: 170, alignItems: "flex-start", gap: 7 },
  boardNoteWide: { maxWidth: 360, alignItems: "center" },
  dropLabel: { color: AppTheme.darkText, fontSize: 14, fontWeight: "800", lineHeight: 19 },
  legend: { color: AppTheme.darkText, fontSize: 11, lineHeight: 18 },
  legendCompact: { fontSize: 10, lineHeight: 15 },
  questionPane: { flex: 1, minHeight: 0, backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 22, overflow: "hidden" },
  questionPaneWide: { flex: 1.15 },
  questionContent: { padding: 16, gap: 10 },
  questionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: AppTheme.muted },
  question: { fontSize: 17, lineHeight: 25, fontWeight: "800", color: AppTheme.text },
  instruction: { fontSize: 12, lineHeight: 18, color: AppTheme.muted },
  choices: { gap: 9, paddingTop: 2 },
  choice: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 10, padding: 11, backgroundColor: AppTheme.surfaceSoft, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 15 },
  choiceSelected: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected },
  choiceCorrect: { borderColor: AppTheme.success, backgroundColor: AppTheme.successSurface },
  choiceWrong: { borderColor: AppTheme.error, backgroundColor: AppTheme.errorSurface },
  choiceDragging: { opacity: 0.35 },
  letter: { width: 32, height: 36, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  letterText: { fontSize: 16, fontWeight: "800", color: AppTheme.text },
  choiceCopy: { flex: 1, gap: 4 },
  choiceText: { color: AppTheme.text, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  correctLabel: { fontSize: 12, color: AppTheme.success, fontWeight: "800" },
  wrongLabel: { color: AppTheme.error, fontWeight: "800", fontSize: 12 },
  feedback: { borderRadius: 14, padding: 12, gap: 7, borderWidth: 1, marginBottom: 4 },
  feedbackCorrect: { backgroundColor: AppTheme.successSurface, borderColor: AppTheme.success },
  feedbackWrong: { backgroundColor: AppTheme.errorSurface, borderColor: AppTheme.error },
  feedbackHeading: { flexDirection: "row", gap: 7, alignItems: "center", flexWrap: "wrap" },
  feedbackTitle: { fontSize: 18, fontWeight: "800", color: AppTheme.success },
  points: { fontSize: 12, color: AppTheme.muted, fontWeight: "700", marginLeft: "auto" },
  feedbackText: { fontSize: 13, lineHeight: 19, color: AppTheme.muted },
  finalScore: { fontSize: 15, lineHeight: 22, fontWeight: "800", color: AppTheme.primary },
  returnHint: { fontSize: 12, color: "#8A561D", lineHeight: 18 },
  explanation: { fontSize: 13, lineHeight: 20, color: AppTheme.muted, paddingTop: 2 },
  continue: { margin: 12, marginTop: 0, minHeight: 48, paddingHorizontal: 16, gap: 9, borderRadius: 14, backgroundColor: AppTheme.primary, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  continueText: { fontSize: 15, fontWeight: "800", color: AppTheme.buttonText },
  floating: { position: "absolute", top: 0, left: 0, zIndex: 100, elevation: 20, width: 216, minHeight: 58, borderRadius: 14, padding: 10, gap: 8, flexDirection: "row", alignItems: "center", backgroundColor: AppTheme.selected, borderWidth: 2, borderColor: AppTheme.primary, boxShadow: "0 6px 20px #35291F33" },
  floatingLetter: { fontSize: 20, fontWeight: "800", color: AppTheme.primary },
  floatingText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600", color: AppTheme.text },
});
