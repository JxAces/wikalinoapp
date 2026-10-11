import { AppTheme, Colors } from "../../constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { assessmentLevelTitle } from "@/components/story-world/quest-progression";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";

import { isWardrobeDressed, SANDAANG_OUTFITS } from "../../data/sandaang-wardrobe";
import type { ChoiceActivity } from "../../data/story-types";
import { useUserStore, type ActivityResult } from "../../store/useUserStore";

type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };
type DragItem = { kind: "answer"; choice: string } | { kind: "garment"; id: number };
const isSameItem = (a: DragItem | null, b: DragItem) => a?.kind === "answer" && b.kind === "answer"
  ? a.choice === b.choice : a?.kind === "garment" && b.kind === "garment" && a.id === b.id;
const contains = (bounds: Bounds | null, point: Point) => Boolean(bounds && bounds.width > 0 && bounds.height > 0 &&
  point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height);

function Draggable({ item, disabled, selected, label, hint, testID, children, style, onSelect, onStart, onMove, onDrop, onFinish }: {
  item: DragItem; disabled: boolean; selected: boolean; label: string; hint: string; testID: string;
  children: ReactNode; style: StyleProp<ViewStyle>;
  onSelect: (item: DragItem) => void; onStart: (item: DragItem, point: Point) => void;
  onMove: (point: Point) => void; onDrop: (item: DragItem, point: Point) => void; onFinish: () => void;
}) {
  const pan = Gesture.Pan().enabled(!disabled).minDistance(8).runOnJS(true)
    .onStart(event => onStart(item, { x: event.absoluteX, y: event.absoluteY }))
    .onUpdate(event => onMove({ x: event.absoluteX, y: event.absoluteY }))
    .onEnd(event => onDrop(item, { x: event.absoluteX, y: event.absoluteY }))
    .onFinalize(onFinish);
  return <GestureDetector gesture={pan} touchAction="none">
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
      accessibilityState={{ disabled, selected }} disabled={disabled} onPress={() => onSelect(item)} style={style}>
      {children}
    </Pressable>
  </GestureDetector>;
}

function OutfitDetails({ index, clipId }: { index: number; clipId: string }) {
  const outfit = SANDAANG_OUTFITS[index];
  return <G clipPath={`url(#${clipId})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d={outfit.detail} stroke={outfit.detailColor} strokeWidth={1.1} />
    {outfit.flowers.map(([x, y, scale], flower) => <Path key={flower}
      d="M0-4C-5-8-8-2-3 0C-8 3-3 8 0 4C3 8 8 3 3 0C8-2 5-8 0-4ZM0 0V14M0 8Q-8 1-7 7Q-4 11 0 10M0 11Q8 4 7 10Q4 14 0 13"
      transform={`translate(${x} ${y}) scale(${scale})`} stroke={outfit.embroideryColor} strokeWidth={1} />)}
  </G>;
}

function Outfit({ index, mannequin = false, dressed = true }: { index: number; mannequin?: boolean; dressed?: boolean }) {
  const clipId = `wardrobe-outfit-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const outfit = SANDAANG_OUTFITS[index];
  return <Svg width="100%" height="100%" viewBox="0 0 160 210" aria-hidden accessible={Platform.OS === "web" ? undefined : false}>
    {mannequin && <G fill="#D8C4A2" stroke="#AA9372" strokeWidth={1.2} strokeLinejoin="round">
      <Circle cx={80} cy={17} r={10} />
      <Path d="M73 28V36L57 43Q51 47 49 60L43 111Q42 118 47 118Q52 118 53 111L59 68L63 99L58 139L64 179Q65 184 70 182L72 144L80 120L88 144L90 182Q95 184 96 179L102 139L97 99L101 68L107 111Q108 118 113 118Q118 118 117 111L111 60Q109 47 103 43L87 36V28Z" />
      <Path d="M80 183V198M57 199H103" fill="none" strokeWidth={2} />
    </G>}
    {dressed && <>
      {outfit.paths.map((path, part) => <Path key={part} d={path} fill={outfit.partColors[part]}
        stroke={"outline" in outfit ? undefined : outfit.outlineColor} strokeWidth={1.3} />)}
      {"outline" in outfit && <Path d={outfit.outline} fill="none" stroke={outfit.outlineColor} strokeWidth={1.3} />}
      <Defs><ClipPath id={clipId}>{outfit.paths.map((path, part) => <Path key={part} d={path} />)}</ClipPath></Defs>
      <OutfitDetails index={index} clipId={clipId} />
    </>}
  </Svg>;
}

type WardrobeGameProps = {
  activity: ChoiceActivity; activities: ChoiceActivity[]; questionIndex: number; results: Record<string, ActivityResult>;
  onAnswer: (choice: string) => Promise<void>; onContinue: () => void; onBack: () => void;
};

export function SandaangWardrobeGame(props: WardrobeGameProps) {
  return <WardrobeQuestion key={props.activity.id} {...props} />;
}

function WardrobeQuestion({ activity, activities, questionIndex, results, onAnswer, onContinue, onBack }: WardrobeGameProps) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 760, compact = height < 720;
  const result = results[activity.id];
  const dressed = activities.map(item => isWardrobeDressed(results[item.id]));
  const score = activities.filter(item => results[item.id]?.correct).length;
  const answered = activities.filter(item => results[item.id]).length;
  const outfitCount = dressed.filter(Boolean).length;
  const dressing = Boolean(result?.correct && !dressed[questionIndex]);
  const lastQuestion = questionIndex === activities.length - 1;
  const complete = answered === activities.length && activities.every((item, index) => !results[item.id]?.correct || dressed[index]);
  const showResult = lastQuestion && complete;
  const ready = Boolean(result) && !dressing && (!lastQuestion || complete);
  const [selected, setSelected] = useState<DragItem | null>(null);
  const [dragging, setDragging] = useState<DragItem | null>(null);
  const [overSlot, setOverSlot] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [animatedSlot, setAnimatedSlot] = useState<number | null>(null);
  const dressOutfit = useUserStore(state => state.dressWardrobeOutfit);
  const root = useRef<View>(null), panel = useRef<ScrollView>(null);
  const targets = useRef<(View | null)[]>([]);
  const bounds = useRef<(Bounds | null)[]>([]);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dragSize = useRef({ width: 180, height: 56 });
  const previouslySubmitted = useRef(Boolean(result));
  const dragX = useSharedValue(0), dragY = useSharedValue(0);
  const [sewMotion] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); sewMotion.stopAnimation(); };
  }, [sewMotion]);

  useEffect(() => {
    if (result && !previouslySubmitted.current) {
      previouslySubmitted.current = true;
      panel.current?.scrollTo({ y: 0, animated: !reduceMotion });
    }
  }, [activity.id, reduceMotion, result]);

  function measureTargets() {
    root.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
    targets.current.forEach((target, index) => target?.measureInWindow((x, y, w, h) => {
      bounds.current[index] = { x, y, width: w, height: h };
    }));
  }

  function moveDrag(point: Point) {
    const size = dragSize.current;
    dragX.set(Math.max(4, Math.min(width - size.width - 4, point.x - origin.current.x - size.width / 2)));
    dragY.set(point.y - origin.current.y - size.height / 2);
    const slot = bounds.current.findIndex(value => contains(value, point));
    setOverSlot(slot < 0 ? null : slot);
  }

  function startDrag(item: DragItem, point: Point) {
    dragSize.current = item.kind === "garment" ? { width: 96, height: 130 } : { width: 180, height: 56 };
    measureTargets();setSelected(item);setMessage("");setDragging(item);moveDrag(point);
  }

  function finishDrag() {
    setDragging(null);setOverSlot(null);
  }

  function select(item: DragItem) {
    setSelected(item);
    setMessage(item.kind === "answer" ? `Pindutin ang mannequin ${questionIndex + 1} upang isumite ang sagot.`
      : `Napili ang damit ${item.id + 1}. Pindutin ang mannequin ${item.id + 1}.`);
  }

  function place(item: DragItem, slot: number) {
    if (item.kind === "answer") {
      if (result) return;
      if (slot !== questionIndex) { setMessage(`Sa naka-highlight na mannequin ${questionIndex + 1} muna. Hindi pa naitala ang sagot.`);return; }
      setSelected(null);setMessage("");void onAnswer(item.choice);
    } else {
      const outfit = item.id;
      if (!results[activities[outfit].id]?.correct || dressed[outfit]) return;
      if (slot !== outfit) { setMessage(`Sa mannequin ${outfit + 1} ang damit na ito. Subukan doon; walang bawas na puntos.`);return; }
      dressOutfit(activities[outfit].id);setSelected(null);
      setMessage(`Nasuotan na ang mannequin ${outfit + 1}!`);
      if (!reduceMotion) {
        setAnimatedSlot(outfit);sewMotion.stopAnimation();sewMotion.setValue(0);
        Animated.timing(sewMotion, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    }
  }

  function drop(item: DragItem, point: Point) {
    // Resolve fresh screen coordinates even if the user rotated or scrolled.
    void Promise.all(targets.current.map(target => new Promise<Bounds | null>(resolve => {
      if (!target) { resolve(null);return; }
      target.measureInWindow((x, y, w, h) => resolve({ x, y, width: w, height: h }));
    }))).then(measured => {
      const slot = measured.findIndex(value => contains(value, point));
      if (slot < 0) setMessage(`Ihulog sa mannequin. Hindi pa naitala ang ${item.kind === "answer" ? "sagot" : "damit"}.`);
      else place(item, slot);
    });
  }

  const dragHandlers = { onSelect: select, onStart: startDrag, onMove: moveDrag, onDrop: drop, onFinish: finishDrag };
  const floatingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }] }));
  const continueLabel = showResult ? "Bumalik sa Pagsusulit" : dressing ? "Isuot muna ang damit"
    : lastQuestion && !complete ? "Kumpletuhin ang nabuksang kasuotan" : "Susunod na tanong";

  const question = <View style={[s.questionCard, wide && s.questionCardWide]}>
    {result && <View testID="wardrobe-feedback" accessibilityLiveRegion="polite" style={[s.feedback, result.correct ? s.feedbackCorrect : s.feedbackWrong]}>
      <View style={s.feedbackRow}>
        <Text style={[s.feedbackTitle, !result.correct && s.wrongText]}>{result.correct ? "Correct!" : "Incorrect"}</Text>
        <Text style={s.points}>{result.correct ? `+1 puntos · +${result.xpEarned} XP` : "0 puntos"}</Text>
      </View>
      <Text style={s.feedbackText}>{result.correct ? `Bukas na ang damit para sa mannequin ${questionIndex + 1}.` : "Naka-highlight ang tamang sagot sa ibaba. Walang damit na nabuksan."}</Text>
    </View>}
    {showResult && <View style={s.result} accessibilityLiveRegion="polite" testID="wardrobe-result">
      <Text style={s.questionLabel}>TAPOS ANG LEVEL 3</Text><Text style={s.finalScore}>{score}/{activities.length}</Text>
      <Text style={s.resultTitle}>{outfitCount === 4 ? "Nasuotan mo ang lahat ng mannequin!" : `${outfitCount} sa 4 mannequin ang nasuotan.`}</Text>
      <Text style={s.explanation}>{score} tamang sagot · {activities.length - score} maling sagot · {outfitCount}/4 damit ang naisuot</Text>
    </View>}
    <Text style={s.questionLabel}>TANONG {questionIndex + 1} SA {activities.length}</Text>
    <Text style={s.question}>{activity.question}</Text>
    {!result && <Text style={s.instruction}>I-drag ang sagot sa mannequin {questionIndex + 1}. O piliin ang sagot, saka pindutin ang mannequin.</Text>}
    <View style={s.choices}>{activity.choices.map((choice, index) => {
      const item: DragItem = { kind: "answer", choice }, letter = String.fromCharCode(65 + index);
      const correct = Boolean(result) && choice === activity.answer;
      const wrong = Boolean(result) && !result?.correct && result?.selectedAnswer === choice;
      return <Draggable key={choice} item={item} disabled={Boolean(result)} selected={isSameItem(selected, item)}
        label={`Sagot ${letter}: ${choice}${correct ? ", Tamang sagot" : wrong ? ", Iyong maling sagot" : ""}`}
        hint={`I-drag sa mannequin ${questionIndex + 1}, o piliin at pindutin ang mannequin.`} testID={`wardrobe-choice-${letter}`}
        style={[s.choice, isSameItem(selected, item) && !result && s.choiceSelected, correct && s.choiceCorrect, wrong && s.choiceWrong, isSameItem(dragging, item) && s.dragging]}
        {...dragHandlers}>
        <View style={s.letter}><Text style={s.letterText}>{letter}</Text></View>
        <View style={s.choiceCopy}><Text style={s.choiceText}>{choice}</Text>
          {correct && <Text style={s.correctLabel}>✓ Tamang sagot</Text>}{wrong && <Text style={s.wrongLabel}>✕ Iyong sagot</Text>}
        </View>
        {!result && <MaterialCommunityIcons name="drag" size={22} color={AppTheme.muted} />}
      </Draggable>;
    })}</View>
    {result && <Text style={s.explanation}>{activity.explanation}</Text>}
  </View>;

  const tray = <View style={[s.tray, wide && s.trayWide]}>
    <View style={s.trayHeading}><Text style={s.trayTitle}>Mga damit</Text><Text testID="wardrobe-garments" style={s.trayCount}>{outfitCount}/4 naisuot</Text></View>
    <Text style={s.instruction}>{dressing ? `I-drag ang damit ${questionIndex + 1} sa mannequin ${questionIndex + 1}. Maaari ring pumili, saka tapikin ang mannequin.`
      : complete ? "✓ Naisuot na ang lahat ng nabuksang damit." : "Bawat tamang sagot ay magbubukas ng isang damit."}</Text>
    <View style={s.garments}>{SANDAANG_OUTFITS.map((_, id) => {
      const unlocked = Boolean(results[activities[id].id]?.correct), done = dressed[id];
      const item: DragItem = { kind: "garment", id };
      return <Draggable key={id} item={item} disabled={!unlocked || done} selected={isSameItem(selected, item)}
        label={`Damit ${id + 1}: ${done ? "naisuot na" : unlocked ? "maaari nang isuot" : "naka-lock"}`}
        hint="I-drag sa katugmang mannequin, o piliin at pindutin ang mannequin." testID={`wardrobe-garment-${id}`}
        style={[s.garment, wide && s.garmentWide, unlocked && !done && s.garmentAvailable, done && s.garmentDone, isSameItem(selected, item) && s.garmentSelected, isSameItem(dragging, item) && s.dragging]}
        {...dragHandlers}>
        <View pointerEvents="none" style={[s.garmentArt, !unlocked && s.lockedArt]}><Outfit index={id} /></View>
        <View pointerEvents="none" style={s.garmentTag}>{done ? <Text style={s.garmentTagText}>✓</Text> : unlocked
          ? <Text style={s.garmentTagText}>{id + 1}</Text> : <MaterialCommunityIcons name="lock" size={13} color={AppTheme.muted} />}</View>
      </Draggable>;
    })}</View>
  </View>;

  return <LinearGradient colors={AppTheme.backgroundGradient} style={s.screen}>
  <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
    <View ref={root} style={s.screen} onLayout={measureTargets}>
      <View style={[s.header, compact && s.headerCompact]}>
        <Pressable onPress={onBack} accessibilityLabel="Bumalik sa mundo" accessibilityRole="button" style={s.back}><MaterialCommunityIcons name="arrow-left" size={23} color={AppTheme.primary} /></Pressable>
        <View style={s.heading}><WikalinoBrand color={AppTheme.primary} /><Text style={s.eyebrow} numberOfLines={1}>PAGSUSULIT · SANDAANG DAMIT</Text><Text style={[s.title, !wide && s.titleSmall]} numberOfLines={2}>Suotan ang mga mannequin</Text></View>
        <View style={s.score} accessibilityLabel={`Iskor sa Level 3: ${score} sa ${activities.length}`}><Text style={s.scoreLabel}>ISKOR · LEVEL 3</Text><Text style={s.scoreValue} testID="wardrobe-score">{score}/{activities.length}</Text></View>
      </View>
      <View style={s.progress}>
        <View style={s.progressLabels}><Text style={s.level}>{assessmentLevelTitle(2)} · Pagbuo ng Kaalaman</Text><Text style={s.count}>{answered}/{activities.length} nasagutan</Text></View>
        <View style={s.tracks}>{activities.map(item => <View key={item.id} style={[s.track, Boolean(results[item.id]) && s.trackDone]} />)}</View>
      </View>
      <View style={s.content}>
        <View style={[s.board, compact && s.boardCompact]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: 5 }, (_, index) => <View key={index} style={[s.woodLine, { top: `${index * 25}%` }]} />)}</View>
          <View style={s.boardHeading}><Text style={s.boardLabel}>ANG IYONG APARADOR</Text><Text style={s.boardLabel} testID="wardrobe-outfits">{outfitCount}/4 kasuotan</Text></View>
          <View style={s.slots}>{SANDAANG_OUTFITS.map((outfit, index) => {
            const active = index === questionIndex && (!result || dressing);
            const done = dressed[index];
            return <View key={outfit.name} ref={node => { targets.current[index] = node; }} collapsable={false} onLayout={measureTargets} style={s.slotWrapper}>
              <Pressable testID={`wardrobe-slot-${index}`} accessibilityRole="button"
                accessibilityLabel={`Mannequin ${index + 1}: ${done ? "nasuotan na" : "wala pang damit"}${active ? ", kasalukuyang gawain" : ""}`}
                accessibilityHint="Piliin muna ang sagot o damit, saka pindutin dito upang ilagay."
                onPress={() => selected ? place(selected, index) : setMessage(`Piliin muna ang ${result ? "damit" : "sagot"}.`)}
                style={[s.slot, active && s.slotActive, overSlot === index && s.slotOver]}>
                <View style={s.slotTop}><View style={[s.number, active && s.numberActive]}><Text style={[s.numberText, active && s.numberTextActive]}>{index + 1}</Text></View>
                  <Text style={[s.slotCount, done && s.correctLabel]}>{done ? "✓" : ""}</Text></View>
                <Animated.View pointerEvents="none" style={{ width: "100%", height: compact ? 82 : wide ? 156 : 110, transform: [{ scale: animatedSlot === index ? sewMotion.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.07, 1] }) : 1 }] }}><Outfit index={index} mannequin dressed={done} /></Animated.View>
              </Pressable>
            </View>;
          })}</View>
          <Text style={s.targetHint} testID="wardrobe-target">{showResult ? "Tapos ang pagsusulit" : !result ? `Sagutan muna ang bilang ${questionIndex + 1}` : dressing ? `Isuot ang damit sa mannequin ${questionIndex + 1}` : "Naitala na ang sagot"}</Text>
        </View>
        <Text accessibilityLiveRegion="polite" testID="wardrobe-hint" style={s.hint}>{message || (dressing ? "Piliin ang damit, saka ang mannequin." : "Sundan ang naka-highlight na bilang.")}</Text>
        <ScrollView ref={panel} style={s.scroll} contentContainerStyle={[s.workArea, wide && s.workAreaWide]} scrollEnabled={!dragging} showsVerticalScrollIndicator={false}>
          {!wide && dressing ? <>{tray}{question}</> : <>{question}{tray}</>}
        </ScrollView>
        {result && <Pressable testID="wardrobe-next" accessibilityRole="button" accessibilityLabel={continueLabel} accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={onContinue} style={[s.next, !ready && s.nextDisabled]}>
          <Text style={s.nextText}>{continueLabel}</Text>{ready && <MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.buttonText} />}
        </Pressable>}
      </View>
      {dragging && <Reanimated.View pointerEvents="none" style={[s.floating, dragging.kind === "garment" && s.floatingGarment, floatingStyle]}>
        {dragging.kind === "answer" ? <Text style={s.floatingText} numberOfLines={3}>{dragging.choice}</Text> : <Outfit index={dragging.id} />}
      </Reanimated.View>}
    </View>
  </SafeAreaView></LinearGradient>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" }, screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: AppTheme.panelStrong },
  headerCompact: { paddingVertical: 7, paddingHorizontal: 10, gap: 7 },
  back: { width: 36, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: AppTheme.surfaceSoft },
  heading: { flex: 1 }, eyebrow: { fontSize: 10, fontWeight: "700", color: AppTheme.primary, letterSpacing: 0.2 },
  title: { fontSize: 23, fontWeight: "800", color: AppTheme.text, marginTop: 3 }, titleSmall: { fontSize: 17, lineHeight: 21 },
  score: { alignItems: "flex-end" }, scoreLabel: { fontSize: 10, color: AppTheme.muted, fontWeight: "700" }, scoreValue: { fontSize: 28, fontWeight: "800", color: AppTheme.text },
  progress: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 9, gap: 7 },
  progressLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, level: { flexShrink: 1, fontSize: 12, fontWeight: "800", color: AppTheme.primary }, count: { fontSize: 11, color: AppTheme.muted },
  tracks: { flexDirection: "row", gap: 6 }, track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: AppTheme.border }, trackDone: { backgroundColor: AppTheme.primary },
  content: { flex: 1, minHeight: 0, width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 10, paddingBottom: 10 },
  board: { borderRadius: 18, backgroundColor: AppTheme.primary, padding: 10, overflow: "hidden" }, boardCompact: { padding: 8 },
  woodLine: { position: "absolute", height: 2, width: "100%", backgroundColor: "#DEC9A525" },
  boardHeading: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 }, boardLabel: { fontSize: 11, fontWeight: "800", color: AppTheme.darkText },
  slots: { flexDirection: "row", gap: 6 }, slotWrapper: { flex: 1 },
  slot: { flex: 1, borderRadius: 12, padding: 5, borderWidth: 2, borderColor: AppTheme.surfaceSoft, backgroundColor: AppTheme.surfaceSoft },
  slotActive: { borderColor: AppTheme.border, backgroundColor: AppTheme.selected }, slotOver: { borderColor: AppTheme.success, backgroundColor: AppTheme.successSurface },
  slotTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 },
  number: { width: 22, height: 22, borderRadius: 11, backgroundColor: AppTheme.panelStrong, justifyContent: "center", alignItems: "center" },
  numberActive: { backgroundColor: AppTheme.border, borderWidth: 2, borderColor: AppTheme.surface }, numberText: { fontSize: 15, fontWeight: "800", color: AppTheme.text }, numberTextActive: { color: AppTheme.text, fontWeight: "900" },
  slotCount: { fontSize: 10, color: AppTheme.muted },
  targetHint: { marginTop: 7, fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center", color: AppTheme.darkText },
  hint: { fontSize: 11, lineHeight: 15, color: AppTheme.muted, paddingVertical: 5, paddingHorizontal: 3 },
  scroll: { flex: 1, minHeight: 0 }, workArea: { gap: 12, paddingBottom: 8 }, workAreaWide: { flexDirection: "row", alignItems: "flex-start" },
  questionCard: { backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 17, padding: 14, gap: 10 }, questionCardWide: { flex: 1.45 },
  questionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, color: AppTheme.muted }, question: { fontSize: 16, lineHeight: 23, fontWeight: "800", color: AppTheme.text },
  instruction: { fontSize: 12, lineHeight: 18, color: AppTheme.muted }, choices: { gap: 8 },
  choice: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, borderRadius: 12, padding: 10, minHeight: 52 },
  choiceSelected: { borderColor: AppTheme.primary }, choiceCorrect: { borderColor: AppTheme.success, backgroundColor: AppTheme.successSurface }, choiceWrong: { borderColor: AppTheme.error, backgroundColor: AppTheme.errorSurface }, dragging: { opacity: 0.35 },
  letter: { width: 28, height: 32, borderRadius: 8, backgroundColor: AppTheme.panelStrong, alignItems: "center", justifyContent: "center" }, letterText: { fontSize: 16, fontWeight: "800", color: AppTheme.text },
  choiceCopy: { flex: 1, gap: 4 }, choiceText: { fontSize: 14, lineHeight: 20, color: AppTheme.text, fontWeight: "600" },
  correctLabel: { fontSize: 11, fontWeight: "800", color: AppTheme.success }, wrongLabel: { fontSize: 11, fontWeight: "800", color: AppTheme.error },
  feedback: { padding: 11, borderRadius: 12, gap: 6 }, feedbackCorrect: { backgroundColor: AppTheme.successSurface }, feedbackWrong: { backgroundColor: AppTheme.errorSurface }, feedbackRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  feedbackTitle: { fontSize: 18, fontWeight: "800", color: AppTheme.success }, wrongText: { color: AppTheme.error }, points: { fontSize: 12, fontWeight: "700", color: AppTheme.muted }, feedbackText: { fontSize: 13, lineHeight: 18, color: AppTheme.muted },
  explanation: { fontSize: 13, lineHeight: 20, color: AppTheme.muted }, result: { alignItems: "center", paddingVertical: 12, gap: 5 }, finalScore: { fontSize: 40, fontWeight: "800", color: AppTheme.success }, resultTitle: { fontSize: 17, fontWeight: "800", color: AppTheme.text, textAlign: "center" },
  tray: { backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 17, padding: 13, gap: 10 }, trayWide: { flex: 1 },
  trayHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 5 }, trayTitle: { fontSize: 14, fontWeight: "800", color: AppTheme.text }, trayCount: { fontSize: 11, fontWeight: "700", color: AppTheme.muted },
  garments: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 7 },
  garment: { width: "23%", height: 119, padding: 3, borderRadius: 9, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft },
  garmentWide: { width: "48%", height: 166, padding: 6 },
  garmentAvailable: { borderColor: AppTheme.border, backgroundColor: AppTheme.selected }, garmentDone: { backgroundColor: AppTheme.successSurface }, garmentSelected: { borderColor: AppTheme.success }, garmentArt: { width: "100%", height: "100%" }, lockedArt: { opacity: 0.4 },
  garmentTag: { position: "absolute", bottom: 3, right: 3, minWidth: 17, height: 17, alignItems: "center", justifyContent: "center", borderRadius: 4, backgroundColor: AppTheme.surface, paddingHorizontal: 2 },
  garmentTagText: { fontSize: 11, fontWeight: "800", color: AppTheme.success },
  next: { minHeight: 46, marginTop: 6, padding: 11, borderRadius: 13, backgroundColor: AppTheme.primary, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" }, nextDisabled: { backgroundColor: Colors.locked }, nextText: { fontSize: 14, fontWeight: "800", color: AppTheme.buttonText, flexShrink: 1, textAlign: "center" },
  floating: { position: "absolute", top: 0, left: 0, zIndex: 100, elevation: 20, width: 180, minHeight: 56, padding: 10, borderRadius: 12, backgroundColor: AppTheme.surface, borderWidth: 2, borderColor: AppTheme.primary, boxShadow: "0 6px 18px #35291F33" },
  floatingGarment: { width: 96, height: 130, padding: 4 }, floatingText: { fontSize: 12, lineHeight: 17, color: AppTheme.text, fontWeight: "600" },
});
