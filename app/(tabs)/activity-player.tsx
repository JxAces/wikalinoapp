import { assessmentLevelTitle, canAnswerQuestion, canEnterStory, canOpenStoryQuiz, questionGroup } from "@/components/story-world/quest-progression";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import * as Haptics from "expo-haptics";

import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";

import { useEffect, useRef, useState } from "react";

import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";

import styles from "@/components/activity-player/styles";
import { SandaangSewingGame } from "@/components/activity-player/sandaang-sewing-game";
import { SandaangWardrobeGame } from "@/components/activity-player/sandaang-wardrobe-game";
import type { ChoiceActivity as SewingActivity } from "../../data/story-types";

import {
  CharacterRaceGame,
  CompassGame,
  DragArcheryGame,
  getActivityIcon,
  getGameInstruction,
  getGameName,
  getSuccessTitle,
  LanternGame,
  PlotPathGame,
  StandardGame,
  UgatFirstScrollGame,
  UgatPathGame,
  UgatTreeGame,
  UgatSharedScrollGame,
} from "@/components/activity-player/games";

import { AppTheme, Colors } from "../../constants/colors";

import { getStoryById, StoryActivity } from "../../data/stories";

import { useUserStore } from "../../store/useUserStore";
import type { AssessmentAnswer } from "../../utils/assessment";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type ChoiceActivity = Extract<
  StoryActivity,
  {
    choices: string[];
  }
>;

function isChoiceActivity(activity: StoryActivity): activity is ChoiceActivity {
  return activity.type !== "plot_sequence";
}

const UGAT_FIRST_SCROLL_GAMES = [
  {
    icon: "run-fast" as const,
    instruction: "Piliin ang karatulang tumutukoy sa pangunahing tauhan upang makatakbo sa unang landas.",
    success: "Nalampasan ang Landas ng Pamilya!",
  },
  {
    icon: "run-fast" as const,
    instruction: "Piliin ang karatulang may tamang kahulugan ng “Ugat” upang makatakbo sa ikalawang landas.",
    success: "Nalampasan ang Landas ng Simbolo!",
  },
  {
    icon: "run-fast" as const,
    instruction: "Piliin ang karatulang patungo sa pinagmulan upang makatakbo sa ikatlong landas.",
    success: "Nalampasan ang Landas ng Pag-uwi!",
  },
  {
    icon: "run-fast" as const,
    instruction: "Piliin ang karatulang nagpapakita ng damdamin ng kuwento upang marating ang huling landas.",
    success: "Natapos ang Pamilyar Level!",
  },
] as const;

const UGAT_SHARED_SCROLL_GAMES = [
  {
    title: "LANDAS NG UGAT",
    icon: "map-marker-path" as const,
    instruction: "Hilahin ang sagot pataas sa tarangkahan upang buksan ang susunod na landas.",
    success: "Nabuksan ang Susunod na Tarangkahan!",
  },
  {
    title: "PUNO NG ALAALA",
    icon: "tree-outline" as const,
    instruction: "Piliin o hilahin ang binhi ng tamang sagot at itanim ito sa gintong bilog upang palaguin ang puno.",
    success: "Lumago ang isang sanga ng Puno ng Alaala!",
  },
] as const;

/*
 * =========================================================
 * ACTIVITY PLAYER
 * =========================================================
 */


export default function ActivityPlayerScreen() {
  const params = useLocalSearchParams<{
    storyId?: string;
    activityIndex?: string;
  }>();

  const focused = useIsFocused();
  const storyId = typeof params.storyId === "string" ? params.storyId : "";

  const parsedActivityIndex = Number(params.activityIndex ?? 0);

  const activityIndex = Number.isInteger(parsedActivityIndex)
    ? Math.max(0, parsedActivityIndex)
    : 0;

  const story = getStoryById(storyId);
  const answers = useUserStore(state => state.activityResults);
  const reading = useUserStore(state => state.readingCompletedStoryIds);
  const cabinetResponses = useUserStore(state => state.cabinetResponses);
  if (!focused) return null;
  if (story && !canEnterStory(story.id, answers)) return <Redirect href="/landing" />;
  if (story && !canOpenStoryQuiz(story.id, reading, answers, cabinetResponses)) return <Redirect href={{ pathname: "/story-room", params: { storyId } }} />;
  if (story && !canAnswerQuestion(story, activityIndex, answers)) return <Redirect href={{ pathname: "/quest-world", params: { storyId } }} />;

  return (
    <ActivityPlayerSession
      key={`${storyId}:${activityIndex}`}
      storyId={storyId}
      activityIndex={activityIndex}
    />
  );
}

function ActivityPlayerSession({
  storyId,
  activityIndex,
}: {
  storyId: string;
  activityIndex: number;
}) {
  const story = getStoryById(storyId);

  const activity = story?.activities[activityIndex] ?? null;

  /*
   * =======================================================
   * STORE
   * =======================================================
   */

  const completeActivity = useUserStore((state) => state.completeActivity);
  const completeStory = useUserStore((state) => state.completeStory);
  const activityResults = useUserStore((state) => state.activityResults);
  const savedResult = activity ? activityResults[activity.id] : undefined;
  const submitted = Boolean(savedResult);
  const correct = savedResult?.correct ?? false;
  const submissionLocked = useRef(submitted);

  /*
   * =======================================================
   * COMMON STATE
   * =======================================================
   */

  const [selectedChoice, setSelectedChoice] = useState<string | null>(
    typeof savedResult?.selectedAnswer === "string" ? savedResult.selectedAnswer : null,
  );

  const [isGameGestureActive, setIsGameGestureActive] = useState(false);

  const [orderedItems, setOrderedItems] = useState<string[]>(
    Array.isArray(savedResult?.selectedAnswer) ? savedResult.selectedAnswer : [],
  );

  const [isResolving, setIsResolving] = useState(false);

  /*
   * =======================================================
   * ARCHERY STATE
   * =======================================================
   */

  const archeryWrongChoice = submitted && !correct ? selectedChoice : null;

  /*
   * =======================================================
   * VOCABULARY
   * =======================================================
   */

  const [lanternActivated, setLanternActivated] = useState(submitted);

  /*
   * =======================================================
   * THEME
   * =======================================================
   */

  const [compassChoiceIndex, setCompassChoiceIndex] = useState<number | null>(
    activity && isChoiceActivity(activity) && typeof savedResult?.selectedAnswer === "string"
      ? activity.choices.indexOf(savedResult.selectedAnswer) : null,
  );

  /*
   * =======================================================
   * GENERAL ANIMATION
   * =======================================================
   */

  const [introFade] = useState(() => new Animated.Value(0));

  const [introY] = useState(() => new Animated.Value(18));

  const [feedbackScale] = useState(() => new Animated.Value(1));

  const [targetShake] = useState(() => new Animated.Value(0));

  const [lanternGlow] = useState(() => new Animated.Value(0));

  const [compassNeedle] = useState(() => new Animated.Value(0));

  const [pathPulse] = useState(() => new Animated.Value(0));

  /*
   * =======================================================
   * ACTIVITY INTRO
   * =======================================================
   */

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introFade, {
        toValue: 1,

        duration: 350,

        useNativeDriver: true,
      }),

      Animated.spring(introY, {
        toValue: 0,

        friction: 8,

        tension: 55,

        useNativeDriver: true,
      }),
    ]).start();
  }, [introFade, introY]);

  /*
   * =======================================================
   * INVALID ROUTE
   * =======================================================
   */

  if (!story || !activity) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <WikalinoBrand />
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={52}
          color={Colors.secondary}
        />

        <Text style={styles.errorTitle}>Hindi mahanap ang hamon</Text>

        <Pressable
          onPress={() => router.replace("/landing")}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Bumalik</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentStory = story;
  const currentActivity = activity;

  /*
   * =======================================================
   * XP
   * =======================================================
   */

  const earnedXp = savedResult?.xpEarned ?? 0;

  async function submitAnswer(answer: AssessmentAnswer) {
    if (submissionLocked.current || useUserStore.getState().activityResults[currentActivity.id]) return;
    submissionLocked.current = true;
    setIsResolving(true);
    completeActivity({ storyId: currentStory.id, activityId: currentActivity.id, answer });
    const result = useUserStore.getState().activityResults[currentActivity.id];
    setIsResolving(false);
    if (!result) {
      submissionLocked.current = false;
      return;
    }

    // The saved answer locks the question before feedback or animation starts.
    feedbackScale.setValue(0.84);
    Animated.spring(feedbackScale, { toValue: 1, friction: 5, tension: 65, useNativeDriver: true }).start();
    if (!result.correct) {
      Animated.sequence([-7, 7, -4, 4, 0].map(toValue =>
        Animated.timing(targetShake, { toValue, duration: 55, useNativeDriver: true }),
      )).start();
    }
    await Haptics.notificationAsync(result.correct
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error).catch(() => undefined);
  }

  async function submitChoice() {
    if (!isChoiceActivity(currentActivity) || !selectedChoice || submitted || isResolving) return;
    await submitAnswer(selectedChoice);
  }

  async function handleUgatAnswer(choice: string) {
    if (currentStory.id !== "m1-story-2" || !isChoiceActivity(currentActivity) || submitted || isResolving) return;
    setSelectedChoice(choice);
    await submitAnswer(choice);
  }

  async function finishCharacterRace(_winner: string) {
    if (currentActivity.type !== "character_race" || !selectedChoice || submitted || isResolving) return;
    await submitAnswer(selectedChoice);
  }

  async function handleArrowHit(choice: string) {
    if (currentActivity.type !== "evidence_hunt" || submitted || isResolving) return;
    setSelectedChoice(choice);
    await submitAnswer(choice);
  }

  function addPlotItem(item: string) {
    if (submitted || orderedItems.includes(item)) {
      return;
    }

    Haptics.selectionAsync();

    setOrderedItems((current) => [...current, item]);

    pathPulse.setValue(0);

    Animated.spring(pathPulse, {
      toValue: 1,

      friction: 6,

      tension: 70,

      useNativeDriver: true,
    }).start();
  }

  function removePlotItem(item: string) {
    if (submitted) {
      return;
    }

    Haptics.selectionAsync();

    setOrderedItems((current) => current.filter((value) => value !== item));
  }

  async function submitPlot() {
    if (
      currentActivity.type !== "plot_sequence" ||
      submitted ||
      orderedItems.length !== currentActivity.answer.length
    ) {
      return;
    }

    await submitAnswer(orderedItems);
  }

  /*
   * =======================================================
   * LANTERN
   * =======================================================
   */

  async function activateLantern() {
    if (lanternActivated) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setLanternActivated(true);

    lanternGlow.setValue(0);

    Animated.sequence([
      Animated.timing(lanternGlow, {
        toValue: 1,

        duration: 450,

        easing: Easing.out(Easing.ease),

        useNativeDriver: true,
      }),

      Animated.timing(lanternGlow, {
        toValue: 0.82,

        duration: 250,

        useNativeDriver: true,
      }),
    ]).start();
  }

  /*
   * =======================================================
   * COMPASS
   * =======================================================
   */

  function selectCompassChoice(choice: string, index: number) {
    if (submitted) {
      return;
    }

    setSelectedChoice(choice);

    setCompassChoiceIndex(index);

    Haptics.selectionAsync();

    Animated.spring(compassNeedle, {
      toValue: index,

      friction: 7,

      tension: 55,

      useNativeDriver: true,
    }).start();
  }

  /*
   * =======================================================
   * NEXT
   * =======================================================
   */

  function continueMission() {
    if (!submitted) return;
    const answers = useUserStore.getState().activityResults;
    if (currentStory.activities.every(item => answers[item.id])) completeStory(currentStory.id);
    if (activityIndex + 1 < group.end) {
      router.replace({ pathname: "/activity-player", params: { storyId: currentStory.id, activityIndex: String(activityIndex + 1) } });
    } else {
      router.replace({ pathname: "/quest-world", params: { storyId: currentStory.id, node: group.id } });
    }
  }

  /*
   * =======================================================
   * PROGRESS
   * =======================================================
   */

  const group = questionGroup(currentStory, activityIndex);
  const missionProgress = Math.round(((activityIndex - group.start + 1) / (group.end - group.start)) * 100);
  const isUgatQuiz = currentStory.id === "m1-story-2";
  const isUgatFirstScroll = isUgatQuiz && group.index === 0;
  const ugatFirstScrollQuestionIndex = activityIndex - group.start;
  const ugatFirstScrollGame = isUgatFirstScroll
    ? UGAT_FIRST_SCROLL_GAMES[ugatFirstScrollQuestionIndex]
    : undefined;
  const ugatSharedScrollGame = isUgatQuiz && group.index > 0
    ? UGAT_SHARED_SCROLL_GAMES[group.index - 1]
    : undefined;
  const activeUgatGame = ugatFirstScrollGame ?? ugatSharedScrollGame;
  const completedGroupQuestions = currentStory.activities
    .slice(group.start, group.end)
    .filter((item) => Boolean(activityResults[item.id])).length;

  if (isUgatQuiz && group.index === 1 && isChoiceActivity(currentActivity)) {
    return <UgatPathGame
      storyTitle={currentStory.title}
      storyAuthor={currentStory.author}
      activity={currentActivity}
      activities={currentStory.activities.slice(group.start, group.end).filter(isChoiceActivity)}
      questionIndex={activityIndex - group.start}
      results={activityResults}
      onAnswer={handleUgatAnswer}
      onContinue={continueMission}
      onBack={() => router.replace({ pathname: "/quest-world", params: { storyId, node: group.id } })}
    />;
  }

  if (isUgatQuiz && group.index === 2 && isChoiceActivity(currentActivity)) {
    return <UgatTreeGame
      storyTitle={currentStory.title}
      storyAuthor={currentStory.author}
      activity={currentActivity}
      activities={currentStory.activities.slice(group.start, group.end).filter(isChoiceActivity)}
      questionIndex={activityIndex - group.start}
      results={activityResults}
      onAnswer={handleUgatAnswer}
      onContinue={continueMission}
      onBack={() => router.replace({ pathname: "/quest-world", params: { storyId, node: group.id } })}
    />;
  }

  if (currentStory.id === "m1-story-1" &&
    ((group.index === 0 && currentActivity.type === "multiple_choice") || (group.index === 1 && currentActivity.type === "evidence_hunt"))) {
    return <SandaangSewingGame
      level={group.index === 0 ? 1 : 2}
      activity={currentActivity}
      activities={currentStory.activities.slice(group.start, group.end).filter((item): item is SewingActivity => item.type !== "plot_sequence" && item.type !== "character_race")}
      questionIndex={activityIndex - group.start}
      results={activityResults}
      onAnswer={submitAnswer}
      onContinue={continueMission}
      onCompleteLevel={continueMission}
      onBack={() => router.replace({ pathname: "/quest-world", params: { storyId, node: group.id } })}
    />;
  }

  if (currentStory.id === "m1-story-1" && group.index === 2 && currentActivity.type === "theme_detective") {
    return <SandaangWardrobeGame
      activity={currentActivity}
      activities={currentStory.activities.slice(group.start, group.end).filter((item): item is SewingActivity => item.type !== "plot_sequence" && item.type !== "character_race")}
      questionIndex={activityIndex - group.start}
      results={activityResults}
      onAnswer={submitAnswer}
      onContinue={continueMission}
      onBack={() => router.replace({ pathname: "/quest-world", params: { storyId, node: group.id } })}
    />;
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <LinearGradient colors={AppTheme.backgroundGradient} style={styles.screen}>
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        {/* =====================================
            HEADER
        ===================================== */}

        <LinearGradient
          colors={[AppTheme.primary, AppTheme.dark]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.header}
        >
          <View style={styles.headerOrb} />

          <View style={styles.headerTop}>
            <Pressable
              onPress={() => router.replace({ pathname: "/quest-world", params: { storyId, node: group.id } })}
              style={({ pressed }) => [
                styles.backButton,

                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={Colors.surface}
              />
            </Pressable>

            <View style={styles.headerStory}>
              <WikalinoBrand color={Colors.accentSoft} />
              <Text numberOfLines={1} style={styles.headerEyebrow}>
                {assessmentLevelTitle(group.index).toUpperCase()} · MGA TANONG
              </Text>

              <Text testID={isUgatQuiz ? "ugat-question-story-credit" : undefined} numberOfLines={isUgatQuiz ? undefined : 1} style={[styles.headerTitle, isUgatQuiz && styles.ugatHeaderTitle]}>
                {isUgatQuiz ? `${currentStory.title} ni ${currentStory.author}` : currentStory.title}
              </Text>
            </View>

            <View style={styles.activityCounter}>
              <Text style={styles.activityCounterText}>
                {activityIndex - group.start + 1}
              </Text>

              <Text style={styles.activityCounterTotal}>
                /{group.end - group.start}
              </Text>
            </View>
          </View>

          <View style={styles.headerProgressRow}>
            <View style={styles.headerProgressTrack}>
              <View
                style={[
                  styles.headerProgressFill,

                  {
                    width: `${missionProgress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.headerProgressText}>{missionProgress}%</Text>
          </View>
        </LinearGradient>

        {/* =====================================
            CONTENT
        ===================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          scrollEnabled={!isGameGestureActive}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: introFade,

              transform: [
                {
                  translateY: introY,
                },
              ],
            }}
          >
            {/* STORY COVER */}

            <View style={styles.storyStrip}>
              <Image
                source={currentStory.coverImage}
                resizeMode="cover"
                style={styles.storyStripImage}
              />

              <LinearGradient
                colors={["rgba(53,41,31,0.04)", "rgba(53,41,31,0.84)"]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.storyStripContent}>
                {!isUgatFirstScroll && <View style={styles.challengeTypeBadge}>
                  <MaterialCommunityIcons
                    name={ugatSharedScrollGame?.icon ?? getActivityIcon(currentActivity.type)}
                    size={13}
                    color={Colors.accent}
                  />

                  <Text style={styles.challengeTypeText}>
                    {ugatSharedScrollGame?.title ?? getGameName(currentActivity.type)}
                  </Text>
                </View>}

                <Text style={styles.activityTitle}>{currentActivity.title}</Text>
              </View>
            </View>

            {/* INSTRUCTION */}

            <View style={styles.instructionCard}>
              <View style={styles.instructionIcon}>
                <MaterialCommunityIcons
                  name="gamepad-variant-outline"
                  size={19}
                  color={Colors.secondary}
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.instructionLabel}>PAANO LARUIN</Text>

                <Text style={styles.instruction}>
                  {activeUgatGame?.instruction ?? getGameInstruction(activity)}
                </Text>
                <Text style={styles.instruction}>
                  Isang sagot lamang bawat tanong. Tama: 1 puntos. Mali: 0 puntos.
                </Text>
              </View>
            </View>

            {/* QUESTION */}

            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>HAMON</Text>

              <Text style={styles.question}>{currentActivity.question}</Text>
            </View>

            {/* =================================
                UGAT · FIRST SCROLL ONLY
            ================================= */}

            {isUgatFirstScroll && isChoiceActivity(currentActivity) && (
              <UgatFirstScrollGame
                activity={currentActivity}
                selectedChoice={selectedChoice}
                onSelectChoice={setSelectedChoice}
                onAnswer={handleUgatAnswer}
                submitted={submitted}
                questionIndex={ugatFirstScrollQuestionIndex}
                totalQuestions={group.end - group.start}
              />
            )}

            {isUgatQuiz && group.index > 0 && isChoiceActivity(currentActivity) && (
              <UgatSharedScrollGame
                activity={currentActivity}
                selectedChoice={selectedChoice}
                onSelectChoice={setSelectedChoice}
                onAnswer={handleUgatAnswer}
                onGestureActiveChange={setIsGameGestureActive}
                submitted={submitted}
                variant={group.index === 1 ? "path" : "tree"}
                completedCount={completedGroupQuestions}
                totalQuestions={group.end - group.start}
              />
            )}

            {/* =================================
                EVIDENCE ARCHERY
            ================================= */}

            {currentActivity.type === "evidence_hunt" && (
              <DragArcheryGame
                activity={currentActivity}
                submitted={submitted}
                correct={correct}
                selectedChoice={selectedChoice}
                wrongChoice={archeryWrongChoice}
                targetShake={targetShake}
                onTargetHit={handleArrowHit}
                onGestureActiveChange={setIsGameGestureActive}
              />
            )}

            {/* =================================
                PLOT
            ================================= */}

            {currentActivity.type === "plot_sequence" && (
              <PlotPathGame
                activity={currentActivity}
                orderedItems={orderedItems}
                onAddItem={addPlotItem}
                onRemoveItem={removePlotItem}
                onReset={() => setOrderedItems([])}
                onSubmit={submitPlot}
                submitted={submitted}
                pathPulse={pathPulse}
              />
            )}

            {/* =================================
                VOCABULARY
            ================================= */}

            {currentActivity.type === "vocabulary" && (
              <LanternGame
                activity={currentActivity}
                activated={lanternActivated}
                onActivate={activateLantern}
                lanternGlow={lanternGlow}
                selectedChoice={selectedChoice}
                onSelectChoice={setSelectedChoice}
                onSubmit={submitChoice}
                submitted={submitted}
              />
            )}

            {/* =================================
                THEME
            ================================= */}

            {currentActivity.type === "theme_detective" && (
              <CompassGame
                activity={currentActivity}
                selectedChoice={selectedChoice}
                selectedIndex={compassChoiceIndex}
                onSelect={selectCompassChoice}
                onSubmit={submitChoice}
                needle={compassNeedle}
                submitted={submitted}
              />
            )}

            {/* =================================
                CHARACTER RACE
            ================================= */}

            {currentActivity.type === "character_race" && (
              <CharacterRaceGame
                activity={currentActivity}
                selectedChoice={selectedChoice}
                submitted={submitted}
                onSelectChoice={setSelectedChoice}
                onFinish={finishCharacterRace}
              />
            )}

            {/* =================================
                FALLBACK
            ================================= */}

            {currentActivity.type === "multiple_choice" && !isUgatQuiz && (
              <StandardGame
                activity={currentActivity}
                selectedChoice={selectedChoice}
                onSelectChoice={setSelectedChoice}
                onSubmit={submitChoice}
                submitted={submitted}
              />
            )}

            {/* =================================
                FINAL FEEDBACK
            ================================= */}

            {submitted && (
              <Animated.View
                style={[
                  styles.feedbackCard,

                  correct ? styles.feedbackCorrect : styles.feedbackWrong,

                  {
                    transform: [
                      {
                        scale: feedbackScale,
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackIcon}>
                    <MaterialCommunityIcons
                      name={correct ? "trophy-outline" : "lightbulb-on-outline"}
                      size={25}
                      color={correct ? AppTheme.success : Colors.secondary}
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={[
                        styles.feedbackTitle,

                        {
                          color: correct ? AppTheme.success : Colors.secondary,
                        },
                      ]}
                    >
                      {correct
                        ? isUgatQuiz && group.index === 2 && activityIndex + 1 === group.end
                          ? "Kumpleto ang Family Tree!"
                          : activeUgatGame?.success ?? getSuccessTitle(currentActivity.type)
                        : "Hindi tama ang sagot."}
                    </Text>

                    <Text style={styles.xpReward}>
                      {correct ? "1 puntos" : "0 puntos"}{correct ? ` · +${earnedXp} XP` : ""}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feedbackBody}>
                  {currentActivity.explanation}
                </Text>

                {!correct && (
                  <Text style={styles.feedbackBody}>
                    Tamang sagot: {Array.isArray(currentActivity.answer) ? currentActivity.answer.join(" → ") : currentActivity.answer}
                  </Text>
                )}
                <Text style={styles.feedbackBody}>
                  {savedResult?.selectedAnswer === undefined
                    ? "Naunang resulta batay sa unang pagsagot. Napanatili ang dati mong XP."
                    : "Naitala na ang sagot. Hindi na ito maaaring baguhin."}
                </Text>
                <Pressable
                  onPress={continueMission}
                  style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
                >
                  <Text style={styles.continueButtonText}>
                    {activityIndex + 1 < group.end ? "SUSUNOD NA TANONG" : "TAPOS ANG LEVEL · SA LANDAS"}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.surface} />
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */
