import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

import { AppTheme, Colors } from "../../constants/colors";
import { StoryActivity } from "../../data/stories";
import styles from "./styles";

type ChoiceActivity = Extract<
  StoryActivity,
  {
    choices: string[];
  }
>;

type PlotActivity = Extract<
  StoryActivity,
  {
    type: "plot_sequence";
  }
>;

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/*
 * =========================================================
 * PLOT PATH GAME
 * =========================================================
 */

export function PlotPathGame({
  activity,
  orderedItems,
  onAddItem,
  onRemoveItem,
  onReset,
  onSubmit,
  submitted,
  pathPulse,
}: {
  activity: PlotActivity;

  orderedItems: string[];

  onAddItem: (item: string) => void;

  onRemoveItem: (item: string) => void;

  onReset: () => void;

  onSubmit: () => void;

  submitted: boolean;

  pathPulse: Animated.Value;
}) {
  const remaining = activity.items.filter(
    (item) => !orderedItems.includes(item),
  );

  const newestScale = pathPulse.interpolate({
    inputRange: [0, 1],

    outputRange: [0.92, 1],
  });

  return (
    <View style={styles.plotGame}>
      <View style={styles.gameSectionTitle}>
        <MaterialCommunityIcons
          name="map-marker-path"
          size={21}
          color={Colors.secondary}
        />

        <View>
          <Text style={styles.gameSectionEyebrow}>LANDAS NG BANGHAY</Text>

          <Text style={styles.gameSectionSubtitle}>
            Buuin ang tamang landas ng mga pangyayari.
          </Text>
        </View>
      </View>

      <LinearGradient colors={AppTheme.backgroundGradient} style={styles.plotMap}>
        <View style={styles.plotRoad} />

        <View style={styles.plotStart}>
          <MaterialCommunityIcons
            name="flag-checkered"
            size={17}
            color={Colors.surface}
          />

          <Text style={styles.plotStartText}>SIMULA</Text>
        </View>

        {activity.answer.map((_, index) => {
          const item = orderedItems[index];

          const newest = index === orderedItems.length - 1;

          return (
            <Animated.View
              key={`slot-${index}`}
              style={[
                styles.plotCheckpoint,

                {
                  transform: [
                    {
                      scale: newest ? newestScale : 1,
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.plotCheckpointNumber,

                  item && styles.plotCheckpointFilled,
                ]}
              >
                <Text
                  style={[
                    styles.plotCheckpointNumberText,

                    item && styles.plotCheckpointNumberTextFilled,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <Pressable
                disabled={!item || submitted}
                onPress={() => {
                  if (item) {
                    onRemoveItem(item);
                  }
                }}
                style={[styles.plotSlot, item && styles.plotSlotFilled]}
              >
                {item ? (
                  <>
                    <Text style={styles.plotSlotText}>{item}</Text>

                    {!submitted && (
                      <Text style={styles.plotRemoveText}>Tap para alisin</Text>
                    )}
                  </>
                ) : (
                  <View style={styles.plotEmpty}>
                    <MaterialCommunityIcons
                      name="map-marker-plus-outline"
                      size={19}
                      color="#AA9E7B"
                    />

                    <Text style={styles.plotEmptyText}>
                      Pangyayari {index + 1}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        <View style={styles.plotFinish}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={18}
            color={Colors.accent}
          />

          <Text style={styles.plotFinishText}>WAKAS</Text>
        </View>
      </LinearGradient>

      {!submitted && (
        <>
          <View style={styles.eventHeader}>
            <Text style={styles.eventHeaderTitle}>MGA PANGYAYARI</Text>

            {orderedItems.length > 0 && (
              <Pressable onPress={onReset}>
                <Text style={styles.resetText}>I-reset</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.eventChoices}>
            {remaining.map((item) => (
              <Pressable
                key={item}
                onPress={() => onAddItem(item)}
                style={({ pressed }) => [
                  styles.eventStone,

                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="foot-print"
                  size={16}
                  color={Colors.secondary}
                />

                <Text style={styles.eventStoneText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            disabled={orderedItems.length !== activity.answer.length}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.primaryGameButton,

              orderedItems.length !== activity.answer.length &&
                styles.disabledButton,

              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="map-check-outline"
              size={19}
              color={Colors.surface}
            />

            <Text style={styles.primaryGameButtonText}>SURIIN ANG LANDAS</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

/*
 * =========================================================
 * LANTERN GAME
 * =========================================================
 */

export function LanternGame({
  activity,
  activated,
  onActivate,
  lanternGlow,
  selectedChoice,
  onSelectChoice,
  onSubmit,
  submitted,
}: {
  activity: ChoiceActivity;

  activated: boolean;

  onActivate: () => void;

  lanternGlow: Animated.Value;

  selectedChoice: string | null;

  onSelectChoice: (choice: string) => void;

  onSubmit: () => void;

  submitted: boolean;
}) {
  const glowScale = lanternGlow.interpolate({
    inputRange: [0, 1],

    outputRange: [0.7, 1.4],
  });

  const glowOpacity = lanternGlow.interpolate({
    inputRange: [0, 1],

    outputRange: [0, 0.75],
  });

  return (
    <View style={styles.lanternGame}>
      <View style={styles.gameSectionTitle}>
        <MaterialCommunityIcons
          name="lightbulb-on-outline"
          size={21}
          color={Colors.secondary}
        />

        <View>
          <Text style={styles.gameSectionEyebrow}>ILAWAN ANG PAHIWATIG</Text>

          <Text style={styles.gameSectionSubtitle}>
            Sindihan ang ilawan upang makita ang kahulugan.
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={[AppTheme.primary, AppTheme.dark]}
        style={styles.darkManuscript}
      >
        <Text style={styles.manuscriptLabel}>PAHIWATIG SA KONTEKSTO</Text>

        <Text style={styles.manuscriptQuestion}>{activity.question}</Text>

        <Pressable
          disabled={activated}
          onPress={onActivate}
          style={styles.lanternArea}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.lanternGlow,

              {
                opacity: glowOpacity,

                transform: [
                  {
                    scale: glowScale,
                  },
                ],
              },
            ]}
          />

          <View
            style={[
              styles.lanternCircle,

              activated && styles.lanternCircleActive,
            ]}
          >
            <MaterialCommunityIcons
              name={activated ? "lightbulb-on" : "lightbulb-outline"}
              size={38}
              color={activated ? Colors.accent : "rgba(255,255,255,0.55)"}
            />
          </View>

          <Text style={styles.lanternInstruction}>
            {activated ? "Nagliwanag ang mga salita!" : "Tap upang sindihan"}
          </Text>
        </Pressable>
      </LinearGradient>

      <Animated.View
        pointerEvents={activated && !submitted ? "auto" : "none"}
        style={[
          styles.lanternChoices,

          {
            opacity: activated ? 1 : 0.18,
          },
        ]}
      >
        {activity.choices.map((choice, index) => {
          const selected = selectedChoice === choice;

          return (
            <Pressable
              key={choice}
              onPress={() => {
                Haptics.selectionAsync();

                onSelectChoice(choice);
              }}
              style={({ pressed }) => [
                styles.lanternChoice,

                selected && styles.lanternChoiceSelected,

                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.lanternChoiceLetter,

                  selected && styles.lanternChoiceLetterSelected,
                ]}
              >
                <Text
                  style={[
                    styles.lanternChoiceLetterText,

                    selected && styles.lanternChoiceLetterTextSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <Text style={styles.lanternChoiceText}>{choice}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {activated && !submitted && (
        <Pressable
          disabled={!selectedChoice}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.primaryGameButton,

            !selectedChoice && styles.disabledButton,

            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={19}
            color={Colors.surface}
          />

          <Text style={styles.primaryGameButtonText}>ILAWAN ANG SAGOT</Text>
        </Pressable>
      )}
    </View>
  );
}

/*
 * =========================================================
 * COMPASS GAME
 * =========================================================
 */

export function CompassGame({
  activity,
  selectedChoice,
  selectedIndex,
  onSelect,
  onSubmit,
  needle,
  submitted,
}: {
  activity: ChoiceActivity;

  selectedChoice: string | null;

  selectedIndex: number | null;

  onSelect: (choice: string, index: number) => void;

  onSubmit: () => void;

  needle: Animated.Value;

  submitted: boolean;
}) {
  const rotation = needle.interpolate({
    inputRange: [0, 1, 2, 3],

    outputRange: ["0deg", "90deg", "180deg", "270deg"],

    extrapolate: "clamp",
  });

  return (
    <View style={styles.compassGame}>
      <View style={styles.gameSectionTitle}>
        <MaterialCommunityIcons
          name="compass-outline"
          size={22}
          color={Colors.secondary}
        />

        <View>
          <Text style={styles.gameSectionEyebrow}>KOMPAS NG TEMA</Text>

          <Text style={styles.gameSectionSubtitle}>
            Ituro ang kompas sa mensahe ng kwento.
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={AppTheme.backgroundGradient}
        style={styles.compassBoard}
      >
        <View style={styles.compassCircle}>
          <Text style={[styles.compassDirection, styles.compassNorth]}>H</Text>

          <Text style={[styles.compassDirection, styles.compassEast]}>S</Text>

          <Text style={[styles.compassDirection, styles.compassSouth]}>T</Text>

          <Text style={[styles.compassDirection, styles.compassWest]}>K</Text>

          <View style={styles.compassInner}>
            <Animated.View
              style={[
                styles.compassNeedle,

                {
                  transform: [
                    {
                      rotate: rotation,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.needleTop} />

              <View style={styles.needleBottom} />
            </Animated.View>

            <View style={styles.compassCenter} />
          </View>
        </View>

        <Text style={styles.compassHint}>
          {selectedIndex === null
            ? "Pumili ng direksiyon"
            : `Direksiyon ${selectedIndex + 1} ang napili`}
        </Text>
      </LinearGradient>

      <View style={styles.themeChoices}>
        {activity.choices.map((choice, index) => {
          const selected = selectedChoice === choice;

          return (
            <Pressable
              key={choice}
              disabled={submitted}
              onPress={() => onSelect(choice, index)}
              style={({ pressed }) => [
                styles.themeChoice,

                selected && styles.themeChoiceSelected,

                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.directionBadge,

                  selected && styles.directionBadgeSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name="navigation-variant"
                  size={15}
                  color={selected ? Colors.surface : Colors.primary}
                  style={{
                    transform: [
                      {
                        rotate: `${index * 90}deg`,
                      },
                    ],
                  }}
                />
              </View>

              <Text
                style={[
                  styles.themeChoiceText,

                  selected && styles.themeChoiceTextSelected,
                ]}
              >
                {choice}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && (
        <Pressable
          disabled={!selectedChoice}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.primaryGameButton,

            !selectedChoice && styles.disabledButton,

            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="compass-outline"
            size={19}
            color={Colors.surface}
          />

          <Text style={styles.primaryGameButtonText}>SUNDAN ANG KOMPAS</Text>
        </Pressable>
      )}
    </View>
  );
}

/*
 * =========================================================
 * UGAT · FIRST SCROLL GAMES
 * =========================================================
 */

type UgatDropTargetConfig = {
  icon: IconName;
  eyebrow: string;
  label: string;
  instruction: string;
  accent: string;
  background: string;
  dark?: boolean;
};

function UgatDropTarget({ config }: { config: UgatDropTargetConfig }) {
  return (
    <View
      accessibilityLabel={`${config.label}. ${config.instruction}`}
      style={[
        styles.ugatDropTarget,
        {
          backgroundColor: config.background,
          borderColor: config.accent,
        },
      ]}
    >
      <View
        style={[
          styles.ugatDropTargetIcon,
          {
            backgroundColor: config.dark
              ? "rgba(255,255,255,0.12)"
              : `${config.accent}18`,
            borderColor: config.dark
              ? "rgba(255,255,255,0.28)"
              : `${config.accent}55`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={27}
          color={config.dark ? Colors.accent : config.accent}
        />
      </View>

      <View style={styles.ugatDropTargetCopy}>
        <Text
          style={[
            styles.ugatDropTargetEyebrow,
            { color: config.dark ? Colors.accent : config.accent },
          ]}
        >
          {config.eyebrow}
        </Text>

        <Text
          style={[
            styles.ugatDropTargetLabel,
            config.dark && styles.ugatDropTargetLabelDark,
          ]}
        >
          {config.label}
        </Text>

        <Text
          style={[
            styles.ugatDropTargetInstruction,
            config.dark && styles.ugatDropTargetInstructionDark,
          ]}
        >
          {config.instruction}
        </Text>
      </View>

      <View style={styles.ugatDropArrow}>
        <MaterialCommunityIcons
          name="chevron-up"
          size={17}
          color={config.dark ? Colors.accent : config.accent}
        />
        <Text
          style={[
            styles.ugatDropArrowText,
            { color: config.dark ? Colors.accent : config.accent },
          ]}
        >
          DALHIN DITO
        </Text>
      </View>
    </View>
  );
}

function UgatDraggableChoice({
  choice,
  choiceLetter,
  selected,
  disabled,
  style,
  children,
  onSelect,
  onAnswer,
  onGestureActiveChange,
}: {
  choice: string;
  choiceLetter: string;
  selected: boolean;
  disabled: boolean;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
  onSelect: (choice: string) => void;
  onAnswer: (choice: string) => Promise<void>;
  onGestureActiveChange: (active: boolean) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const committed = useSharedValue(false);

  useEffect(() => {
    if (!disabled) {
      committed.set(false);
      translateX.set(0);
      translateY.set(0);
      scale.set(1);
      opacity.set(1);
    }

    return () => {
      onGestureActiveChange(false);
    };
  }, [committed, disabled, onGestureActiveChange, opacity, scale, translateX, translateY]);

  function selectChoice() {
    if (disabled || committed.get()) {
      return;
    }

    onSelect(choice);
    void Haptics.selectionAsync();
  }

  function rejectShortDrag() {
    onGestureActiveChange(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function commitChoice() {
    if (disabled || committed.get()) {
      return;
    }

    committed.set(true);
    onGestureActiveChange(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void onAnswer(choice);
  }

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetY([-10, 10])
    .shouldCancelWhenOutside(false)
    .onStart(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      translateX.set(0);
      translateY.set(0);
      scale.set(withSpring(1.035, { damping: 16, stiffness: 220 }));
      scheduleOnRN(onGestureActiveChange, true);
      scheduleOnRN(selectChoice);
    })
    .onUpdate((event) => {
      translateX.set(Math.max(-52, Math.min(52, event.translationX)));
      translateY.set(Math.max(-180, Math.min(18, event.translationY)));
    })
    .onEnd((event) => {
      scheduleOnRN(onGestureActiveChange, false);

      if (event.translationY <= -68) {
        scheduleOnRN(commitChoice);
        translateX.set(withSpring(0, { damping: 17, stiffness: 220 }));
        translateY.set(
          withTiming(-245, { duration: 240 }),
        );
        scale.set(withTiming(0.72, { duration: 240 }));
        opacity.set(withTiming(0.12, { duration: 240 }));
        return;
      }

      translateX.set(withSpring(0, { damping: 15, stiffness: 210 }));
      translateY.set(withSpring(0, { damping: 15, stiffness: 210 }));
      scale.set(withSpring(1, { damping: 15, stiffness: 210 }));
      scheduleOnRN(rejectShortDrag);
    })
    .onFinalize(() => {
      scheduleOnRN(onGestureActiveChange, false);
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((_event, success) => {
      if (success) {
        scheduleOnRN(selectChoice);
      }
    });

  const choiceGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { rotate: `${translateX.get() / 18}deg` },
      { scale: scale.get() },
    ],
    zIndex: Math.abs(translateY.get()) > 2 ? 20 : 1,
  }));

  return (
    <GestureDetector gesture={choiceGesture}>
      <Reanimated.View
        accessible
        accessibilityHint="I-drag pataas upang ihulog sa target. Pindutin lamang upang piliin at basahin."
        accessibilityLabel={`Sagot ${choiceLetter}: ${choice}${selected ? ", napili" : ""}`}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        onAccessibilityTap={commitChoice}
        style={[style, animatedStyle, selected && styles.ugatDragChoiceActive]}
      >
        {children}

        <View style={styles.ugatDragHandle}>
          <MaterialCommunityIcons
            name="gesture-swipe-up"
            size={17}
            color={selected ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.ugatDragHandleText,
              selected && styles.ugatDragHandleTextActive,
            ]}
          >
            HILAHIN
          </Text>
        </View>
      </Reanimated.View>
    </GestureDetector>
  );
}

const ugatFirstScrollGames = [
  {
    checkpoint: "TANONG 1 · PAMILYA",
    sceneLabel: "ALBUM NG PINAGMULAN",
    icon: "account-group-outline" as const,
  },
  {
    checkpoint: "TANONG 2 · SIMBOLO",
    sceneLabel: "MALALALIM NA UGAT",
    icon: "tree-outline" as const,
  },
  {
    checkpoint: "TANONG 3 · PAG-UWI",
    sceneLabel: "LANDAS PABALIK",
    icon: "home-map-marker" as const,
  },
  {
    checkpoint: "TANONG 4 · PUSO",
    sceneLabel: "PUNO NG PAGMAMAHAL",
    icon: "heart-outline" as const,
  },
] as const;

const ugatRootRoutes = [
  "M180 370 C176 346 164 329 148 310 C125 282 118 246 109 198 C102 160 94 141 88 126",
  "M180 370 C184 346 196 329 212 310 C235 282 242 246 251 198 C258 160 266 141 272 126",
  "M180 370 C174 347 163 333 151 318 C135 298 126 273 114 251 C103 237 95 229 88 220",
  "M180 370 C186 347 197 333 209 318 C225 298 234 273 246 251 C257 237 265 229 272 220",
] as const;

export function UgatRunnerChild({ pose }: { pose: 0 | 1 | 2 }) {
  const leftLeg =
    pose === 0
      ? "M27 55 L25 70 L22 78"
      : pose === 1
        ? "M27 55 L18 68 L12 75"
        : "M27 55 L34 68 L40 76";
  const rightLeg =
    pose === 0
      ? "M35 55 L36 70 L40 78"
      : pose === 1
        ? "M35 55 L42 67 L47 74"
        : "M35 55 L27 68 L20 76";
  const leftArm =
    pose === 1 ? "M26 34 L17 45 L12 41" : "M26 34 L20 43 L14 50";
  const rightArm =
    pose === 2 ? "M39 34 L49 42 L52 36" : "M39 34 L47 45 L52 51";

  return (
    <Svg
      accessibilityLabel="Batang manlalakbay"
      height={82}
      viewBox="0 0 64 82"
      width={64}
    >
      <G>
        <Path
          d={leftLeg}
          fill="none"
          stroke={Colors.primaryDark}
          strokeLinecap="round"
          strokeWidth={7}
        />
        <Path
          d={rightLeg}
          fill="none"
          stroke={Colors.primary}
          strokeLinecap="round"
          strokeWidth={7}
        />
        <Path
          d="M20 76 L11 77"
          fill="none"
          stroke={Colors.secondary}
          strokeLinecap="round"
          strokeWidth={5}
        />
        <Path
          d="M43 76 L52 77"
          fill="none"
          stroke={Colors.secondary}
          strokeLinecap="round"
          strokeWidth={5}
        />
        <Rect
          fill="#B77A45"
          height={25}
          rx={7}
          stroke={Colors.surface}
          strokeWidth={2}
          width={15}
          x={17}
          y={31}
        />
        <Path
          d={leftArm}
          fill="none"
          stroke="#C98B62"
          strokeLinecap="round"
          strokeWidth={6}
        />
        <Path
          d={rightArm}
          fill="none"
          stroke="#C98B62"
          strokeLinecap="round"
          strokeWidth={6}
        />
        <Path
          d="M25 30 Q32 26 41 31 L39 57 Q32 61 25 56 Z"
          fill={Colors.teal}
          stroke={Colors.surface}
          strokeLinejoin="round"
          strokeWidth={2}
        />
        <Circle
          cx={38}
          cy={20}
          fill="#D79A70"
          r={12}
          stroke={Colors.surface}
          strokeWidth={2}
        />
        <Path
          d="M27 19 Q29 5 43 8 Q51 11 50 20 Q43 15 31 17 Z"
          fill={Colors.primaryDark}
        />
        <Circle cx={44} cy={20} fill={Colors.primaryDark} r={1.5} />
        <Path
          d="M48 25 Q44 29 40 26"
          fill="none"
          stroke="#8B4E3D"
          strokeLinecap="round"
          strokeWidth={1.5}
        />
        <Path
          d="M23 13 Q35 2 49 10"
          fill="none"
          stroke={Colors.accent}
          strokeLinecap="round"
          strokeWidth={4}
        />
      </G>
    </Svg>
  );
}

export function UgatFirstScrollGame({
  activity,
  selectedChoice,
  onSelectChoice,
  onAnswer,
  submitted,
  questionIndex,
  totalQuestions,
}: {
  activity: ChoiceActivity;

  selectedChoice: string | null;

  onSelectChoice: (choice: string) => void;

  onAnswer: (choice: string) => Promise<void>;

  submitted: boolean;

  questionIndex: number;

  totalQuestions: number;

}) {
  const game = ugatFirstScrollGames[questionIndex] ?? ugatFirstScrollGames[0];
  const [runnerProgress] = useState(() => new Animated.Value(0));
  const [choiceShake] = useState(() => new Animated.Value(0));
  const answerLocked = useRef(false);
  const poseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [runnerPose, setRunnerPose] = useState<0 | 1 | 2>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sceneWidth, setSceneWidth] = useState(0);

  const selectedRouteIndex = Math.max(
    0,
    activity.choices.findIndex((choice) => choice === selectedChoice),
  );
  const routeDirection = selectedRouteIndex % 2 === 0 ? -1 : 1;
  const routeIsTop = selectedRouteIndex < 2;
  const routeTargetX = sceneWidth * 0.255 * routeDirection;
  const routeTargetY = routeIsTop ? -170 : -75;
  const travelX = runnerProgress.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0, routeTargetX * 0.42, routeTargetX],
  });
  const travelY = runnerProgress.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0, routeTargetY * 0.43, routeTargetY],
  });
  const runnerRotate = runnerProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      "0deg",
      routeDirection < 0 ? "-4deg" : "4deg",
      "0deg",
    ],
  });
  const checkpointComplete = submitted;
  const journeyCompletedCount = Math.min(
    totalQuestions,
    questionIndex + (checkpointComplete ? 1 : 0),
  );

  useEffect(() => {
    if (!submitted) {
      answerLocked.current = false;
      runnerProgress.setValue(0);
      choiceShake.setValue(0);

      if (poseTimer.current) {
        clearInterval(poseTimer.current);
        poseTimer.current = null;
      }
    }

    return () => {
      if (poseTimer.current) {
        clearInterval(poseTimer.current);
        poseTimer.current = null;
      }
    };
  }, [choiceShake, runnerProgress, submitted]);

  function stopStride() {
    if (poseTimer.current) {
      clearInterval(poseTimer.current);
      poseTimer.current = null;
    }

    setRunnerPose(0);
    setIsRunning(false);
  }

  function chooseRoad(choice: string) {
    if (submitted || answerLocked.current) {
      return;
    }

    answerLocked.current = true;
    onSelectChoice(choice);
    void onAnswer(choice);
    void Haptics.selectionAsync();

    if (choice === activity.answer) {
      setIsRunning(true);
      setRunnerPose(1);
      poseTimer.current = setInterval(() => {
        setRunnerPose((current) => (current === 1 ? 2 : 1));
      }, 105);

      Animated.timing(runnerProgress, {
        toValue: 1,
        duration: 620,
        useNativeDriver: true,
      }).start(() => {
        stopStride();
      });

      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(choiceShake, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(choiceShake, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(choiceShake, {
        toValue: 4,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(choiceShake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <View style={styles.ugatRunnerGame}>
      <View style={styles.ugatRunnerHeader}>
        <View style={styles.ugatRunnerTitleRow}>
          <MaterialCommunityIcons
            color={Colors.accent}
            name="run-fast"
            size={23}
          />
          <View style={styles.ugatRunnerTitleCopy}>
            <Text style={styles.ugatRunnerSubtitle}>
              Piliin ang tamang landas upang tumakbo sa susunod na tanong.
            </Text>
          </View>
          <View
            accessibilityLabel="Isang sagot lamang bawat tanong"
            style={styles.ugatRunnerLives}
          >
            <Text style={styles.ugatRunnerHudText}>1 SAGOT</Text>
          </View>
        </View>

        <View style={styles.ugatRunnerHud}>
          <View style={styles.ugatRunnerHudItem}>
            <MaterialCommunityIcons
              color={Colors.accent}
              name="poker-chip"
              size={17}
            />
            <Text style={styles.ugatRunnerHudText}>
              {journeyCompletedCount}/{totalQuestions} NASAGUTAN
            </Text>
          </View>
          <View style={styles.ugatRunnerHudItem}>
            <MaterialCommunityIcons
              color={Colors.accent}
              name={game.icon}
              size={17}
            />
            <Text style={styles.ugatRunnerHudText}>{game.checkpoint}</Text>
          </View>
        </View>
      </View>

      <View
        accessibilityLabel={`Mapa ng landas. ${journeyCompletedCount} sa ${totalQuestions} tanong ang nasagutan.`}
        style={styles.ugatRunnerMap}
      >
        {Array.from({ length: totalQuestions }, (_, index) => {
          const complete = index < journeyCompletedCount;
          const current = index === questionIndex && !checkpointComplete;

          return (
            <View key={index} style={styles.ugatRunnerMapStepWrap}>
              {index > 0 && (
                <View
                  style={[
                    styles.ugatRunnerMapLine,
                    complete && styles.ugatRunnerMapLineComplete,
                  ]}
                />
              )}
              <View
                style={[
                  styles.ugatRunnerMapNode,
                  complete && styles.ugatRunnerMapNodeComplete,
                  current && styles.ugatRunnerMapNodeCurrent,
                ]}
              >
                <MaterialCommunityIcons
                  color={complete ? Colors.surface : current ? Colors.primary : Colors.locked}
                  name={complete ? "check" : current ? "run-fast" : "map-marker-outline"}
                  size={15}
                />
              </View>
              <Text
                style={[
                  styles.ugatRunnerMapText,
                  current && styles.ugatRunnerMapTextCurrent,
                ]}
              >
                {index + 1}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        onLayout={(event) => setSceneWidth(event.nativeEvent.layout.width)}
        style={styles.ugatRunnerScene}
      >
        <Image
          blurRadius={1.1}
          resizeMode="cover"
          source={require("../../assets/images/stories/sa-ilalim-ng-punong-kahoy.png")}
          style={styles.ugatRunnerBackdrop}
        />
        <View style={styles.ugatRunnerBackdropShade} />

        <Svg
          height="100%"
          pointerEvents="none"
          style={styles.ugatRunnerTrailSvg}
          viewBox="0 0 360 380"
          width="100%"
        >
          {ugatRootRoutes.map((route, index) => {
            const routeChoice = activity.choices[index];
            const selected = selectedChoice === routeChoice;
            const wrong = selected && submitted && routeChoice !== activity.answer;

            return (
              <G key={route}>
                <Path
                  d={route}
                  fill="none"
                  stroke="rgba(24,40,59,0.38)"
                  strokeLinecap="round"
                  strokeWidth={11}
                />
                <Path
                  d={route}
                  fill="none"
                  stroke={wrong ? Colors.error : selected ? Colors.accent : "#B98955"}
                  strokeLinecap="round"
                  strokeWidth={selected ? 8 : 6}
                />
                <Path
                  d={route}
                  fill="none"
                  opacity={selected ? 1 : 0.34}
                  stroke={selected ? "#FFF5C8" : "#DCC191"}
                  strokeDasharray={selected ? "7 10" : undefined}
                  strokeLinecap="round"
                  strokeWidth={2}
                />
              </G>
            );
          })}
          <Path
            d="M176 354 C158 360 147 371 137 382 M184 354 C202 360 213 371 223 382 M148 310 C129 315 119 326 111 340 M212 310 C231 315 241 326 249 340 M112 249 C94 257 82 270 74 287 M248 249 C266 257 278 270 286 287 M107 198 C91 202 82 211 76 222 M253 198 C269 202 278 211 284 222"
            fill="none"
            opacity={0.82}
            stroke="#765433"
            strokeLinecap="round"
            strokeWidth={3}
          />
        </Svg>

        <Animated.View
          style={[
            styles.ugatRunnerChild,
            {
              transform: [
                { translateX: travelX },
                { translateY: travelY },
                { rotate: runnerRotate },
              ],
            },
          ]}
        >
          <UgatRunnerChild pose={runnerPose} />
        </Animated.View>

        {activity.choices.map((choice, index) => {
          const selected = selectedChoice === choice;
          const wrong = selected && submitted && choice !== activity.answer;
          const choiceLetter = String.fromCharCode(65 + index);

          return (
            <Animated.View
              key={choice}
              style={[
                styles.ugatRootChoiceWrap,
                index === 0 && styles.ugatRootChoiceTopLeft,
                index === 1 && styles.ugatRootChoiceTopRight,
                index === 2 && styles.ugatRootChoiceBottomLeft,
                index === 3 && styles.ugatRootChoiceBottomRight,
                selected && { transform: [{ translateX: choiceShake }] },
              ]}
            >
              <Pressable
                accessibilityLabel={`Landas ${choiceLetter}: ${choice}`}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: submitted || isRunning }}
                disabled={submitted || isRunning}
                onPress={() => chooseRoad(choice)}
                style={({ pressed }) => [
                  styles.ugatRootChoice,
                  selected && styles.ugatRootChoiceSelected,
                  wrong && styles.ugatRootChoiceWrong,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.ugatRootChoiceSign,
                    selected && styles.ugatRootChoiceSignSelected,
                    wrong && styles.ugatRootChoiceSignWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.ugatRootChoiceLetter,
                      selected && styles.ugatRootChoiceLetterSelected,
                    ]}
                  >
                    {choiceLetter}
                  </Text>
                </View>
                <Text
                  numberOfLines={3}
                  style={[
                    styles.ugatRootChoiceText,
                    selected && styles.ugatRootChoiceTextSelected,
                  ]}
                >
                  {choice}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}

        <View style={styles.ugatRunnerSceneLabel}>
          <MaterialCommunityIcons
            color={Colors.accent}
            name={game.icon}
            size={15}
          />
          <Text style={styles.ugatRunnerSceneLabelText}>
            {isRunning ? "TUMATAKBO SA TAMANG LANDAS..." : game.sceneLabel}
          </Text>
        </View>
      </View>

      <View style={styles.ugatRunnerInstruction}>
        <MaterialCommunityIcons
          color={Colors.secondary}
          name="sign-direction"
          size={18}
        />
        <Text style={styles.ugatRunnerInstructionText}>
          Pumili ng karatula. Tatakbo lamang ang bata kapag tama ang landas.
        </Text>
      </View>

    </View>
  );
}

/*
 * =========================================================
 * UGAT · SHARED SCROLL GAMES
 * =========================================================
 */

const ugatSharedTargets = {
  path: {
    icon: "gate" as const,
    eyebrow: "TARGET NG TANONG",
    label: "TARANGKAHAN NG LANDAS",
    instruction: "Hilahin pataas ang sagot na magbubukas ng tarangkahan.",
    accent: AppTheme.primary,
    background: AppTheme.surfaceSoft,
  },
  tree: {
    icon: "tree" as const,
    eyebrow: "TARGET NG TANONG",
    label: "KORONA NG FAMILY TREE",
    instruction: "Hilahin pataas ang dahon upang maidugtong sa puno.",
    accent: Colors.accent,
    background: Colors.primary,
    dark: true,
  },
} as const;

export function UgatSharedScrollGame({
  activity,
  selectedChoice,
  onSelectChoice,
  onAnswer,
  onGestureActiveChange,
  submitted,
  variant,
  completedCount,
  totalQuestions,
}: {
  activity: ChoiceActivity;

  selectedChoice: string | null;

  onSelectChoice: (choice: string) => void;

  onAnswer: (choice: string) => Promise<void>;

  onGestureActiveChange: (active: boolean) => void;

  submitted: boolean;

  variant: "path" | "tree";

  completedCount: number;

  totalQuestions: number;
}) {
  const isPath = variant === "path";
  const target = isPath ? ugatSharedTargets.path : ugatSharedTargets.tree;

  return (
    <View style={styles.ugatSharedScrollGame}>
      <View
        style={[
          styles.ugatSharedHeader,
          isPath ? styles.ugatPathHeader : styles.treeFinaleHeader,
        ]}
      >
        <View style={styles.gameSectionTitle}>
          <MaterialCommunityIcons
            name={isPath ? "map-marker-path" : "tree-outline"}
            size={22}
            color={isPath ? Colors.secondary : Colors.accent}
          />

          <View style={styles.ugatGameHeading}>
            <Text
              style={[
                styles.gameSectionEyebrow,
                !isPath && styles.treeFinaleTitle,
              ]}
            >
              {isPath ? "LANDAS NG UGAT" : "FAMILY TREE FINALE"}
            </Text>

            <Text
              style={[
                styles.gameSectionSubtitle,
                !isPath && styles.treeFinaleSubtitle,
              ]}
            >
              {isPath
                ? "Sagutin ang bawat tanong upang magpatuloy sa susunod na tarangkahan."
                : "Kumpletuhin ang mga tanong sa puno. Bawat tamang sagot ay may 1 puntos."}
            </Text>
          </View>
        </View>

        <View
          accessibilityLabel={`${completedCount} sa ${totalQuestions} bahagi ang kumpleto`}
          style={isPath ? styles.ugatPathProgress : styles.treeFinaleProgress}
        >
          {Array.from({ length: totalQuestions }, (_, index) => {
            const complete = index < completedCount;
            const current = index === completedCount;

            return (
              <View key={index} style={styles.ugatProgressStepWrap}>
                {index > 0 && (
                  <View
                    style={[
                      styles.ugatProgressConnector,
                      complete && styles.ugatProgressConnectorComplete,
                    ]}
                  />
                )}

                <View
                  style={[
                    styles.ugatProgressStep,
                    isPath ? styles.ugatPathStep : styles.treeFinaleStep,
                    complete && styles.ugatProgressStepComplete,
                    current && styles.ugatProgressStepCurrent,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isPath
                        ? complete
                          ? "check"
                          : "map-marker-outline"
                        : complete
                          ? "leaf"
                          : "sprout-outline"
                    }
                    size={17}
                    color={
                      complete
                        ? Colors.surface
                        : isPath
                          ? Colors.secondary
                          : Colors.accent
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.ugatProgressStepText,
                    !isPath && styles.treeFinaleStepText,
                  ]}
                >
                  {isPath ? `TARANGKAHAN ${index + 1}` : ["UGAT", "SANGA", "BUNGA"][index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <UgatDropTarget config={target} />

      <View style={styles.ugatDragInstructionRow}>
        <MaterialCommunityIcons
          name="gesture-swipe-up"
          size={18}
          color={Colors.secondary}
        />
        <Text style={styles.ugatDragInstructionText}>
          Pindutin para piliin. Hilahin pataas at bitawan sa target para
          isumite.
        </Text>
      </View>

      {activity.choices.map((choice, index) => {
        const selected = selectedChoice === choice;
        const choiceLetter = String.fromCharCode(65 + index);

        return (
          <UgatDraggableChoice
            choice={choice}
            choiceLetter={choiceLetter}
            disabled={submitted}
            key={choice}
            onAnswer={onAnswer}
            onGestureActiveChange={onGestureActiveChange}
            onSelect={onSelectChoice}
            selected={selected}
            style={[
              isPath ? styles.ugatPathChoice : styles.treeFinaleChoice,
              selected && (isPath ? styles.ugatPathChoiceSelected : styles.treeFinaleChoiceSelected),
            ]}
          >
            <View
              style={[
                isPath ? styles.ugatPathSign : styles.treeFinaleLeaf,
                selected && (isPath ? styles.ugatPathSignSelected : styles.treeFinaleLeafSelected),
              ]}
            >
              {isPath ? (
                <Text
                  style={[
                    styles.memoryChoiceLetterText,
                    selected && styles.memoryChoiceLetterTextSelected,
                  ]}
                >
                  {choiceLetter}
                </Text>
              ) : (
                <MaterialCommunityIcons
                  name="leaf"
                  size={19}
                  color={selected ? Colors.surface : Colors.secondary}
                />
              )}
            </View>

            <View style={styles.ugatChoiceContent}>
              <Text
                style={[
                  styles.ugatChoiceLabel,
                  !isPath && styles.treeFinaleChoiceLabel,
                ]}
              >
                {isPath ? `LANDAS ${choiceLetter}` : `DAHON ${choiceLetter}`}
              </Text>

              <Text
                style={[
                  styles.memoryChoiceText,
                  selected && styles.memoryChoiceTextSelected,
                ]}
              >
                {choice}
              </Text>
            </View>
          </UgatDraggableChoice>
        );
      })}
    </View>
  );
}

/*
 * =========================================================
 * STANDARD GAME
 * =========================================================
 */

export function StandardGame({
  activity,
  selectedChoice,
  onSelectChoice,
  onSubmit,
  submitted,
}: {
  activity: ChoiceActivity;

  selectedChoice: string | null;

  onSelectChoice: (choice: string) => void;

  onSubmit: () => void;

  submitted: boolean;
}) {
  return (
    <View style={styles.standardGame}>
      <View style={styles.gameSectionTitle}>
        <MaterialCommunityIcons
          name="cards-outline"
          size={21}
          color={Colors.secondary}
        />

        <View>
          <Text style={styles.gameSectionEyebrow}>PILIIN ANG LANDAS</Text>

          <Text style={styles.gameSectionSubtitle}>
            Piliin ang pinakamainam na sagot.
          </Text>
        </View>
      </View>

      {activity.choices.map((choice, index) => {
        const selected = selectedChoice === choice;

        return (
          <Pressable
            key={choice}
            disabled={submitted}
            onPress={() => {
              Haptics.selectionAsync();

              onSelectChoice(choice);
            }}
            style={({ pressed }) => [
              styles.standardChoice,

              selected && styles.standardChoiceSelected,

              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.standardChoiceNumber,

                selected && styles.standardChoiceNumberSelected,
              ]}
            >
              <Text
                style={[
                  styles.standardChoiceNumberText,

                  selected && styles.standardChoiceNumberTextSelected,
                ]}
              >
                {index + 1}
              </Text>
            </View>

            <Text
              style={[
                styles.standardChoiceText,

                selected && styles.standardChoiceTextSelected,
              ]}
            >
              {choice}
            </Text>
          </Pressable>
        );
      })}

      {!submitted && (
        <Pressable
          disabled={!selectedChoice}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.primaryGameButton,

            !selectedChoice && styles.disabledButton,

            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryGameButtonText}>KUMPIRMAHIN</Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={Colors.surface}
          />
        </Pressable>
      )}
    </View>
  );
}
