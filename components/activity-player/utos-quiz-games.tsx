import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { assessmentLevelTitle } from "../story-world/quest-progression";
import { WikalinoBrand } from "../ui/WikalinoBrand";
import { AppTheme } from "../../constants/colors";
import type { StoryActivity } from "../../data/story-types";
import {
  areUtosTilesAdjacent, createUtosQuizGameState, findUtosMatchMove, getUtosQuizGamePoints,
  isUtosQuizGameComplete, isUtosRiddleAnswer, normalizeUtosQuizGameState, swapUtosMatchTiles,
  UTOS_CHARACTERS, UTOS_MATCH_TARGET, UTOS_RIDDLES, type UtosQuizGameState,
} from "../../data/utos-quiz-games";
import type { ActivityResult } from "../../store/useUserStore";
import { UtosCharacterPortrait } from "./utos-character-portrait";
import { useUtosFeedbackSound } from "./use-utos-feedback-sound";

type ChoiceActivity = Extract<StoryActivity, { choices: string[] }>;
type MemoryCard = { character: typeof UTOS_CHARACTERS[number]; portrait: boolean };
const MEMORY_CARDS: MemoryCard[] = [
  { character: UTOS_CHARACTERS[0], portrait: true }, { character: UTOS_CHARACTERS[2], portrait: false },
  { character: UTOS_CHARACTERS[3], portrait: true }, { character: UTOS_CHARACTERS[1], portrait: false },
  { character: UTOS_CHARACTERS[0], portrait: false }, { character: UTOS_CHARACTERS[2], portrait: true },
  { character: UTOS_CHARACTERS[3], portrait: false }, { character: UTOS_CHARACTERS[1], portrait: true },
];
const MATCH_TILES = [
  { icon: "gold" as const, label: "Ginto", color: "#A76C17" },
  { icon: "crown" as const, label: "Korona", color: "#9B6827" },
  { icon: "chess-king" as const, label: "Hari", color: "#80513E" },
];
const GAME_NAMES = ["Antas-Tugma", "Hulaan ang Tauhan!", "Mga Bugtong ni Jojo"];

export function UtosQuizGames({ storyTitle, storyAuthor, level, activity, questionIndex, totalQuestions, results, game: savedGame, onGameChange, onAnswer, onContinue, onBack }: {
  storyTitle: string; storyAuthor: string; level: number;
  activity: ChoiceActivity; questionIndex: number; totalQuestions: number;
  results: Record<string, ActivityResult>; game?: UtosQuizGameState;
  onGameChange: (game: UtosQuizGameState) => void;
  onAnswer: (answer: string) => Promise<void>;
  onContinue: () => void; onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const game = normalizeUtosQuizGameState(level, savedGame) ?? createUtosQuizGameState(level);
  const result = results[activity.id];
  const complete = isUtosQuizGameComplete(level, game);
  // Earlier submitted answers remain reviewable without replaying a newly added game.
  const [showQuestions, setShowQuestions] = useState(Boolean(result) || complete);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [hint, setHint] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [memoryWrong, setMemoryWrong] = useState(false);
  const [riddleDraft, setRiddleDraft] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(typeof result?.selectedAnswer === "string" ? result.selectedAnswer : null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const playFeedbackSound = useUtosFeedbackSound();

  function feedback(copy: string, wrong = false) {
    setMessage(copy); setError(wrong);
    AccessibilityInfo.announceForAccessibility(copy);
    if (wrong && level === 1) playFeedbackSound();
  }

  function selectTile(index: number) {
    if (game.kind !== "match" || complete) return;
    setHint([]);
    if (selectedTile === null || selectedTile === index) { setSelectedTile(selectedTile === index ? null : index); return; }
    if (!areUtosTilesAdjacent(selectedTile, index)) { setSelectedTile(index); feedback("Pumili ng dalawang magkatabing simbolo."); return; }
    const next = swapUtosMatchTiles(game, selectedTile, index);
    setSelectedTile(null);
    if (!next) { feedback("Walang nabuong hanay. Subukan ang ibang magkatabing simbolo.", true); return; }
    onGameChange(next);
    feedback(`Tumpak! ${next.matches} sa ${UTOS_MATCH_TARGET} tugma. +5 puntos sa laro.`);
  }

  function flipCard(index: number) {
    if (game.kind !== "memory" || complete || memoryWrong || flipped.includes(index)) return;
    const card = MEMORY_CARDS[index];
    if (game.matchedIds.includes(card.character.id)) return;
    if (!flipped.length) { setFlipped([index]); return; }
    const first = MEMORY_CARDS[flipped[0]];
    if (first.character.id === card.character.id && first.portrait !== card.portrait) {
      onGameChange({ kind: "memory", matchedIds: [...game.matchedIds, card.character.id] });
      setFlipped([]);
      feedback(`Tumpak! Si ${card.character.name}. +5 puntos sa laro.`);
    } else {
      setFlipped([flipped[0], index]); setMemoryWrong(true);
      feedback("Hindi magkapareha ang larawan at pangalan. Tandaan ang mga kard at subukan muli.", true);
    }
  }

  function submitRiddle() {
    if (game.kind !== "riddles" || complete) return;
    const index = game.answers.findIndex(answer => !answer);
    if (!riddleDraft.trim()) { feedback("Isulat muna ang iyong sagot.", true); return; }
    if (!isUtosRiddleAnswer(index, riddleDraft)) { feedback("Hindi pa tama. Basahin muli ang bugtong at subukan ulit.", true); return; }
    const answers = [...game.answers]; answers[index] = UTOS_RIDDLES[index].answer;
    onGameChange({ kind: "riddles", answers }); setRiddleDraft("");
    feedback(`Tumpak! ${UTOS_RIDDLES[index].answer}. +5 puntos sa laro.`);
  }

  async function submitQuestion() {
    if (!selectedAnswer || result || submittingRef.current || (!complete && !result)) return;
    submittingRef.current = true; setSubmitting(true);
    if (level === 1 && selectedAnswer !== activity.answer) feedback("Hindi tama ang sagot.", true);
    try { await onAnswer(selectedAnswer); }
    catch { feedback("Hindi naitala ang sagot. Subukan muli.", true); }
    finally { submittingRef.current = false; setSubmitting(false); }
  }

  const riddleIndex = game.kind === "riddles" ? game.answers.findIndex(answer => !answer) : -1;
  const points = getUtosQuizGamePoints(game);
  return <LinearGradient colors={AppTheme.backgroundGradient} style={s.screen}>
    <SafeAreaView edges={["top", "bottom"]} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Bumalik sa Pagsusulit" style={s.back}><MaterialCommunityIcons name="arrow-left" size={24} color={AppTheme.primary} /></Pressable>
        <View style={s.headerCopy}><WikalinoBrand color={AppTheme.primary} /><Text style={s.eyebrow}>{assessmentLevelTitle(level).toUpperCase()}</Text><Text style={s.storyCredit}>{storyTitle} ni {storyAuthor}</Text></View>
      </View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.points} accessibilityLabel={`${points} puntos sa laro, hiwalay sa puntos ng pagsusulit`}><MaterialCommunityIcons name="star-circle-outline" size={22} color={AppTheme.primary} /><Text style={s.pointsText}>Puntos sa laro: {points}</Text></View>
        {!showQuestions && <>
          <Text style={s.gameTitle}>{GAME_NAMES[level]}</Text>
          <Text style={s.instruction}>{level === 0 ? "Pindutin ang dalawang magkatabing simbolo upang pagpalitin. Bumuo ng hanay ng tatlo o higit pang magkakatulad. Kumpletuhin ang limang tugma upang mabuksan ang mga tanong." : level === 1 ? "Buksan ang mga kard. Itugma ang bawat larawan sa pangalan ng tauhan. Kumpletuhin ang apat na pares upang mabuksan ang mga tanong." : "Basahin ang bawat bugtong at isulat ang sagot sa patlang. Sagutin ang tatlong bugtong upang mabuksan ang mga tanong."}</Text>

          {game.kind === "match" && <View style={s.panel}>
            <Text testID="utos-match-progress" style={s.progress}>{game.matches}/{UTOS_MATCH_TARGET} tugma</Text>
            <View style={s.board}>{game.board.map((tile, index) => <Pressable
              key={index} testID={`utos-match-tile-${index}`} accessibilityRole="button"
              accessibilityLabel={`${MATCH_TILES[tile].label}, hanay ${Math.floor(index / 4) + 1}, puwesto ${index % 4 + 1}${hint.includes(index) ? ", iminungkahing simbolo sa pahiwatig" : ""}`}
              accessibilityState={{ selected: selectedTile === index, disabled: complete }} disabled={complete}
              onPress={() => selectTile(index)} style={[s.tile, selectedTile === index && s.selected, hint.includes(index) && s.hint]}
            ><MaterialCommunityIcons name={MATCH_TILES[tile].icon} size={34} color={MATCH_TILES[tile].color} /></Pressable>)}</View>
            {!complete && <Pressable accessibilityRole="button" onPress={() => {
              const move = findUtosMatchMove(game.board);
              setHint(move ?? []);
              if (move) feedback(`Pagpalitin ang ${move.map(index => `${MATCH_TILES[game.board[index]].label} sa hanay ${Math.floor(index / 4) + 1}, puwesto ${index % 4 + 1}`).join(" at ang ")}.`);
            }} style={s.secondary}><MaterialCommunityIcons name="lightbulb-outline" size={18} color={AppTheme.primary} /><Text style={s.secondaryText}>Pahiwatig</Text></Pressable>}
          </View>}

          {game.kind === "memory" && <View style={s.panel}>
            <Text testID="utos-memory-progress" style={s.progress}>{game.matchedIds.length}/{UTOS_CHARACTERS.length} pares</Text>
            <View style={s.memoryBoard}>{MEMORY_CARDS.map((card, index) => {
              const matched = game.matchedIds.includes(card.character.id);
              const visible = matched || flipped.includes(index);
              return <Pressable key={index} testID={`utos-memory-card-${index}`} accessibilityRole="button"
                accessibilityLabel={visible ? `${card.portrait ? "Larawan" : "Pangalan"}: ${card.character.name}${matched ? ", naitugma na" : ""}` : `Nakatagong kard ${index + 1}`}
                accessibilityState={{ disabled: matched || memoryWrong, selected: visible }} disabled={matched || memoryWrong}
                onPress={() => flipCard(index)} style={[s.memoryCard, width < 400 && s.memoryCardCompact, visible && s.memoryVisible, matched && s.memoryMatched]}>
                {!visible ? <MaterialCommunityIcons name="crown" size={30} color={AppTheme.buttonText} /> : card.portrait ? <UtosCharacterPortrait characterId={card.character.id} size={65} /> : <Text style={s.cardName}>{card.character.name}</Text>}
                {matched && <Text style={s.matchedMark}>✓</Text>}
              </Pressable>;
            })}</View>
            {memoryWrong && <Pressable accessibilityRole="button" onPress={() => { setFlipped([]); setMemoryWrong(false); setMessage(""); }} style={s.button}><Text style={s.buttonText}>Subukan muli</Text></Pressable>}
            <View style={s.characterGuide}><Text style={s.progress}>Kilalanin ang mga tauhan</Text>{UTOS_CHARACTERS.map(character => <View key={character.id} style={s.guideRow}><UtosCharacterPortrait characterId={character.id} size={43} /><View style={s.guideCopy}><Text style={s.guideName}>{character.name}</Text><Text style={s.guideDetail}>{character.detail}</Text></View></View>)}</View>
          </View>}

          {game.kind === "riddles" && !complete && riddleIndex >= 0 && <View style={s.panel}>
            <Text testID="utos-riddle-progress" style={s.progress}>Bugtong {riddleIndex + 1}/{UTOS_RIDDLES.length}</Text>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={40} color={AppTheme.primary} style={s.riddleIcon} />
            <Text style={s.riddle}>{UTOS_RIDDLES[riddleIndex].question}</Text>
            <Text style={s.inputLabel}>Sagot</Text>
            <TextInput testID="utos-riddle-input" accessibilityLabel={`Sagot sa bugtong ${riddleIndex + 1}`} value={riddleDraft} onChangeText={setRiddleDraft} onSubmitEditing={submitRiddle} placeholder="Isulat ang sagot" placeholderTextColor={AppTheme.muted} autoCapitalize="none" autoCorrect={false} maxLength={80} style={s.input} />
            <Pressable accessibilityRole="button" onPress={submitRiddle} style={s.button}><Text style={s.buttonText}>Suriin ang sagot</Text><MaterialCommunityIcons name="arrow-right" size={19} color={AppTheme.buttonText} /></Pressable>
          </View>}

          {complete && <View testID="utos-game-complete" style={[s.panel, s.completed]}><MaterialCommunityIcons name="check-decagram" size={44} color={AppTheme.success} /><Text style={s.completedTitle}>Natapos ang laro!</Text><Text style={s.instruction}>Nabuksan na ang mga tanong sa {assessmentLevelTitle(level)}.</Text><Pressable testID="utos-open-questions" accessibilityRole="button" onPress={() => { setShowQuestions(true); setMessage(""); }} style={s.button}><Text style={s.buttonText}>Simulan ang mga tanong</Text><MaterialCommunityIcons name="arrow-right" size={19} color={AppTheme.buttonText} /></Pressable></View>}
        </>}

        {showQuestions && <View testID="utos-official-question" style={s.panel}>
          <Text style={s.progress}>Tanong {questionIndex + 1}/{totalQuestions}</Text>
          <Text style={s.question}>{activity.question}</Text>
          <Text style={s.scoring}>Isang sagot bawat tanong. Tama: 1 puntos. Mali: 0 puntos.</Text>
          {activity.choices.map((choice, index) => {
            const correct = Boolean(result) && choice === activity.answer;
            const wrong = Boolean(result) && !result.correct && choice === result.selectedAnswer;
            return <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`${String.fromCharCode(65 + index)}. ${choice}${correct ? ", tamang sagot" : wrong ? ", iyong sagot" : ""}`} accessibilityState={{ checked: choice === selectedAnswer, disabled: Boolean(result) || submitting }} disabled={Boolean(result) || submitting} onPress={() => setSelectedAnswer(choice)} style={[s.answer, choice === selectedAnswer && s.selected, correct && s.correct, wrong && s.wrong]}><Text style={s.answerLetter}>{String.fromCharCode(65 + index)}</Text><Text style={s.answerText}>{choice}</Text>{correct && <MaterialCommunityIcons name="check-circle" size={20} color={AppTheme.success} />}{wrong && <MaterialCommunityIcons name="close-circle" size={20} color={AppTheme.error} />}</Pressable>;
          })}
          {!result ? <Pressable testID="utos-submit-question" accessibilityRole="button" disabled={!selectedAnswer || submitting} onPress={() => void submitQuestion()} style={[s.button, (!selectedAnswer || submitting) && s.disabled]}><Text style={s.buttonText}>{submitting ? "Itinatala…" : "Piliin ang tamang sagot"}</Text></Pressable> : <View style={s.result}>
            <Text style={[s.resultTitle, { color: result.correct ? AppTheme.success : AppTheme.error }]}>{result.correct ? "Tamang sagot! · 1 puntos" : "Hindi tama ang sagot. · 0 puntos"}</Text><Text style={s.instruction}>{activity.explanation}</Text><Text style={s.scoring}>Naitala na ang sagot. Hindi na ito maaaring baguhin.</Text>
            <Pressable testID="utos-next-question" accessibilityRole="button" onPress={onContinue} style={s.button}><Text style={s.buttonText}>{questionIndex + 1 < totalQuestions ? "Susunod na tanong" : "Tapos ang level · Sa landas"}</Text><MaterialCommunityIcons name="arrow-right" size={19} color={AppTheme.buttonText} /></Pressable>
          </View>}
        </View>}

        {Boolean(message) && <View accessibilityLiveRegion="polite" style={[s.feedback, error && s.feedbackError]}><Text style={[s.feedbackText, error && s.feedbackErrorText]}>{message}</Text></View>}
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: AppTheme.border, backgroundColor: AppTheme.panelStrong },
  back: { width: 43, height: 43, backgroundColor: AppTheme.surfaceSoft, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: AppTheme.muted },
  storyCredit: { fontSize: 15, lineHeight: 21, fontWeight: "800", color: AppTheme.text },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 16, gap: 15, paddingBottom: 36 },
  points: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: AppTheme.surfaceSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 15, borderWidth: 1, borderColor: AppTheme.border },
  pointsText: { color: AppTheme.primary, fontSize: 14, fontWeight: "800" },
  gameTitle: { color: AppTheme.text, fontSize: 28, lineHeight: 33, fontWeight: "900" },
  instruction: { color: AppTheme.muted, fontSize: 14, lineHeight: 22 },
  panel: { backgroundColor: AppTheme.surface, padding: 16, borderRadius: 20, gap: 16, borderWidth: 1, borderColor: AppTheme.border },
  progress: { color: AppTheme.primary, fontSize: 13, fontWeight: "900" },
  board: { width: "100%", maxWidth: 360, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  tile: { width: "22.5%", aspectRatio: 1, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft, borderWidth: 2, borderColor: AppTheme.border, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary, borderWidth: 2 },
  hint: { borderColor: AppTheme.success, borderWidth: 3, backgroundColor: AppTheme.successSurface },
  secondary: { flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "center", padding: 10 },
  secondaryText: { color: AppTheme.primary, fontWeight: "800", fontSize: 13 },
  memoryBoard: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  memoryCard: { width: "22.5%", minHeight: 108, borderRadius: 12, backgroundColor: AppTheme.primary, borderWidth: 2, borderColor: AppTheme.primary, alignItems: "center", justifyContent: "center", padding: 3, overflow: "hidden" },
  memoryCardCompact: { width: "47.5%", minHeight: 112 },
  memoryVisible: { backgroundColor: AppTheme.surfaceSoft, borderColor: AppTheme.border },
  memoryMatched: { backgroundColor: AppTheme.successSurface, borderColor: AppTheme.success },
  cardName: { fontSize: 11, lineHeight: 16, textAlign: "center", color: AppTheme.text, fontWeight: "800" },
  matchedMark: { position: "absolute", top: 2, right: 4, fontSize: 14, color: AppTheme.success, fontWeight: "900" },
  characterGuide: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: AppTheme.border },
  guideRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  guideCopy: { flex: 1, gap: 3 },
  guideName: { fontSize: 13, color: AppTheme.text, fontWeight: "800" },
  guideDetail: { fontSize: 12, lineHeight: 18, color: AppTheme.muted },
  riddleIcon: { alignSelf: "center" },
  riddle: { fontSize: 17, lineHeight: 29, color: AppTheme.text },
  inputLabel: { fontSize: 13, fontWeight: "800", color: AppTheme.primary },
  input: { borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, color: AppTheme.text, fontSize: 16 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 10, minHeight: 48, paddingHorizontal: 15, paddingVertical: 14, borderRadius: 14, backgroundColor: AppTheme.primary },
  buttonText: { color: AppTheme.buttonText, fontWeight: "900", fontSize: 14, textAlign: "center" },
  disabled: { opacity: 0.5 },
  completed: { alignItems: "center", backgroundColor: AppTheme.successSurface },
  completedTitle: { color: AppTheme.success, fontSize: 22, fontWeight: "900", textAlign: "center" },
  question: { color: AppTheme.text, fontSize: 21, lineHeight: 29, fontWeight: "900" },
  scoring: { color: AppTheme.muted, fontSize: 12, lineHeight: 19 },
  answer: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: AppTheme.border, padding: 13, backgroundColor: AppTheme.surfaceSoft, borderRadius: 13, minHeight: 52 },
  answerLetter: { fontSize: 15, color: AppTheme.primary, fontWeight: "900" },
  answerText: { flex: 1, color: AppTheme.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  correct: { borderColor: AppTheme.success, backgroundColor: AppTheme.successSurface },
  wrong: { borderColor: AppTheme.error, backgroundColor: AppTheme.errorSurface },
  result: { gap: 12, borderTopWidth: 1, borderTopColor: AppTheme.border, paddingTop: 15 },
  resultTitle: { fontSize: 17, fontWeight: "900" },
  feedback: { padding: 14, borderRadius: 14, backgroundColor: AppTheme.successSurface, borderWidth: 1, borderColor: AppTheme.success },
  feedbackError: { backgroundColor: AppTheme.errorSurface, borderColor: AppTheme.error },
  feedbackText: { color: AppTheme.success, lineHeight: 21, fontWeight: "700", fontSize: 14 },
  feedbackErrorText: { color: AppTheme.error },
});
