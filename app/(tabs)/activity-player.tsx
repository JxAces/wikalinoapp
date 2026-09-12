import { canAnswerQuestion, questionGroup, QUESTIONS_PER_SCROLL } from "@/components/story-world/quest-progression";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import * as Haptics from "expo-haptics";

import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

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

import styles from "@/components/activity-player/styles";

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
} from "@/components/activity-player/games";

import { Colors } from "../../constants/colors";

import { getStoryById, StoryActivity } from "../../data/stories";

import { useUserStore } from "../../store/useUserStore";

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
  if (!focused) return null;
  if (story && !reading.includes(story.id)) return <Redirect href={{ pathname: "/story", params: { storyId } }} />;
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

  /*
   * =======================================================
   * COMMON STATE
   * =======================================================
   */

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const [isGameGestureActive, setIsGameGestureActive] = useState(false);

  const [orderedItems, setOrderedItems] = useState<string[]>([]);

  const [attempts, setAttempts] = useState(0);

  const [submitted, setSubmitted] = useState(false);

  const [correct, setCorrect] = useState(false);

  const [isResolving, setIsResolving] = useState(false);

  /*
   * =======================================================
   * ARCHERY STATE
   * =======================================================
   */

  const [archeryWrongChoice, setArcheryWrongChoice] = useState<string | null>(
    null,
  );

  const [archeryHint, setArcheryHint] = useState<string | null>(null);

  /*
   * =======================================================
   * VOCABULARY
   * =======================================================
   */

  const [lanternActivated, setLanternActivated] = useState(false);

  /*
   * =======================================================
   * THEME
   * =======================================================
   */

  const [compassChoiceIndex, setCompassChoiceIndex] = useState<number | null>(
    null,
  );

  /*
   * =======================================================
   * GENERAL ANIMATION
   * =======================================================
   */

  const [introFade] = useState(() => new Animated.Value(0));

  const [introY] = useState(() => new Animated.Value(18));

  const [feedbackScale] = useState(() => new Animated.Value(0.9));

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

  const earnedXp = currentActivity.xp + (attempts === 1 ? 5 : 0);

  /*
   * =======================================================
   * CORRECT ANSWER
   * =======================================================
   */

  async function handleCorrect(newAttempts: number) {
    setCorrect(true);

    setSubmitted(true);

    setIsResolving(false);

    /*
     * Your store already prevents
     * repeated XP farming.
     */

    completeActivity({
      storyId: currentStory.id,
      activityId: currentActivity.id,
      attempts: newAttempts,
      firstTryCorrect: newAttempts === 1,
      xpReward: currentActivity.xp,
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    feedbackScale.setValue(0.84);

    Animated.spring(feedbackScale, {
      toValue: 1,

      friction: 5,

      tension: 65,

      useNativeDriver: true,
    }).start();
  }

  /*
   * =======================================================
   * NORMAL WRONG ANSWER
   * =======================================================
   */

  async function handleWrong() {
    setCorrect(false);

    setSubmitted(true);

    setIsResolving(false);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(targetShake, {
        toValue: -7,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 7,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: -4,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 4,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 0,

        duration: 55,

        useNativeDriver: true,
      }),
    ]).start();
  }

  /*
   * =======================================================
   * RETRY STANDARD ACTIVITIES
   * =======================================================
   */

  function retryActivity() {
    setSubmitted(false);

    setCorrect(false);

    setIsResolving(false);

    setSelectedChoice(null);

    setCompassChoiceIndex(null);
  }

  /*
   * =======================================================
   * STANDARD CHOICE
   * =======================================================
   */

  async function submitChoice() {
    if (
      !isChoiceActivity(currentActivity) ||
      !selectedChoice ||
      submitted ||
      isResolving
    ) {
      return;
    }

    setIsResolving(true);

    const newAttempts = attempts + 1;

    setAttempts(newAttempts);

    if (selectedChoice === currentActivity.answer) {
      await handleCorrect(newAttempts);

      return;
    }

    await handleWrong();
  }

  /*
   * =======================================================
   * CHARACTER RACE
   * =======================================================
   */

  async function finishCharacterRace(winner: string) {
    if (
      currentActivity.type !== "character_race" ||
      !selectedChoice ||
      submitted ||
      isResolving
    ) {
      return;
    }

    setIsResolving(true);

    const newAttempts = attempts + 1;

    setAttempts(newAttempts);

    if (
      winner === currentActivity.answer &&
      selectedChoice === currentActivity.answer
    ) {
      await handleCorrect(newAttempts);

      return;
    }

    await handleWrong();
  }

  /*
   * =======================================================
   * ARCHERY HIT
   * =======================================================
   *
   * There is NO answer button.
   *
   * Whatever target the arrow physically
   * lands on becomes selectedChoice.
   * =======================================================
   */

  async function handleArrowHit(choice: string) {
    if (currentActivity.type !== "evidence_hunt") {
      return;
    }

    setSelectedChoice(choice);

    const newAttempts = attempts + 1;

    setAttempts(newAttempts);

    /*
     * Correct target.
     */

    if (choice === currentActivity.answer) {
      setArcheryWrongChoice(null);

      setArcheryHint(null);

      await handleCorrect(newAttempts);

      return;
    }

    /*
     * Wrong TARGET.
     *
     * Unlike the old quiz UI:
     * - no retry button
     * - arrow automatically reloads
     * - clue stays visible
     */

    setCorrect(false);

    setArcheryWrongChoice(choice);

    setArcheryHint(currentActivity.hint);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(targetShake, {
        toValue: -7,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 7,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: -4,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 4,

        duration: 55,

        useNativeDriver: true,
      }),

      Animated.timing(targetShake, {
        toValue: 0,

        duration: 55,

        useNativeDriver: true,
      }),
    ]).start();

    /*
     * Clear the actual selected answer
     * after impact so another arrow can
     * be fired without pressing Retry.
     */

    setTimeout(() => {
      setSelectedChoice(null);

      setArcheryWrongChoice(null);
    }, 850);
  }

  /*
   * =======================================================
   * PLOT
   * =======================================================
   */

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

    const newAttempts = attempts + 1;

    setAttempts(newAttempts);

    setIsResolving(true);

    const isCorrect = currentActivity.answer.every(
      (correctItem, index) => orderedItems[index] === correctItem,
    );

    if (isCorrect) {
      await handleCorrect(newAttempts);

      return;
    }

    await handleWrong();
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
    if (!correct) return;
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

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        {/* =====================================
            HEADER
        ===================================== */}

        <LinearGradient
          colors={["#35664A", Colors.primary, Colors.primaryDark]}
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
              <Text numberOfLines={1} style={styles.headerEyebrow}>
                BALUMBON {Math.floor(group.start / QUESTIONS_PER_SCROLL) + 1} · MGA TANONG
              </Text>

              <Text numberOfLines={1} style={styles.headerTitle}>
                {currentStory.title}
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
                colors={["rgba(25,24,40,0.04)", "rgba(25,24,40,0.84)"]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.storyStripContent}>
                <View style={styles.challengeTypeBadge}>
                  <MaterialCommunityIcons
                    name={getActivityIcon(currentActivity.type)}
                    size={13}
                    color={Colors.accent}
                  />

                  <Text style={styles.challengeTypeText}>
                    {getGameName(currentActivity.type)}
                  </Text>
                </View>

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
                  {getGameInstruction(activity)}
                </Text>
              </View>
            </View>

            {/* QUESTION */}

            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>HAMON</Text>

              <Text style={styles.question}>{currentActivity.question}</Text>
            </View>

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
                hint={archeryHint}
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

            {currentActivity.type === "multiple_choice" && (
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
                      color={correct ? Colors.teal : Colors.secondary}
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
                          color: correct ? Colors.teal : Colors.secondary,
                        },
                      ]}
                    >
                      {correct
                        ? getSuccessTitle(currentActivity.type)
                        : "Hindi pa! Subukan muli."}
                    </Text>

                    {correct && (
                      <Text style={styles.xpReward}>
                        +{earnedXp} XP
                        {attempts === 1 && " • First Try Bonus!"}
                      </Text>
                    )}
                  </View>
                </View>

                <Text style={styles.feedbackBody}>
                  {correct ? currentActivity.explanation : currentActivity.hint}
                </Text>

                {correct ? (
                  <Pressable
                    onPress={continueMission}
                    style={({ pressed }) => [
                      styles.continueButton,

                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.continueButtonText}>
                      {activityIndex + 1 < group.end ? "SUSUNOD NA TANONG" : "TAPOS ANG BALUMBON · SA LANDAS"}
                    </Text>

                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={18}
                      color={Colors.surface}
                    />
                  </Pressable>
                ) : (
                  /*
                   * Evidence Hunt does NOT use
                   * this retry button.
                   *
                   * Wrong arrows automatically
                   * reload inside the archery game.
                   */

                  currentActivity.type !== "evidence_hunt" && (
                    <Pressable
                      onPress={retryActivity}
                      style={({ pressed }) => [
                        styles.retryButton,

                        pressed && styles.pressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="reload"
                        size={18}
                        color={Colors.secondary}
                      />

                      <Text style={styles.retryButtonText}>SUBUKAN MULI</Text>
                    </Pressable>
                  )
                )}
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */
