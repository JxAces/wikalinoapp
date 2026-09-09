import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { StoryActivity } from "../../data/stories";
import styles from "./styles";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ChoiceActivity = Extract<
  StoryActivity,
  {
    choices: string[];
  }
>;

type TargetRect = {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

type FlightPath = {
  endX: number;
  endY: number;
  targetIndex: number | null;
  rotation: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/*
 * =========================================================
 * DRAG ARCHERY GAME
 * =========================================================
 *
 * NO TARGET BUTTONS.
 *
 * Student:
 *
 * 1. presses / holds the bow
 * 2. drags downward
 * 3. moves left/right to aim
 * 4. sees live trajectory
 * 5. releases
 * 6. arrow flies
 * 7. target physically hit = answer
 *
 * Missing all targets does NOT count
 * as an academic attempt.
 * =========================================================
 */

export function DragArcheryGame({
  activity,
  submitted,
  correct,
  selectedChoice,
  wrongChoice,
  hint,
  targetShake,
  onTargetHit,
  onGestureActiveChange,
}: {
  activity: ChoiceActivity;

  submitted: boolean;

  correct: boolean;

  selectedChoice: string | null;

  wrongChoice: string | null;

  hint: string | null;

  targetShake: Animated.Value;

  onTargetHit: (choice: string) => Promise<void>;

  onGestureActiveChange: (active: boolean) => void;
}) {
  /*
   * =======================================================
   * CONSTANTS
   * =======================================================
   */

  const rows = Math.ceil(activity.choices.length / 2);

  const fieldHeight = Math.max(485, 105 + rows * 132 + 120);

  const MAX_PULL_X = 76;

  const MAX_PULL_Y = 110;

  const MIN_PULL_Y = 24;

  const HORIZONTAL_POWER = 2.4;

  const VERTICAL_POWER = 3.05;

  /*
   * =======================================================
   * FIELD
   * =======================================================
   */

  const [fieldWidth, setFieldWidth] = useState(0);

  /*
   * =======================================================
   * DRAG
   * =======================================================
   */

  const pull = useRef(
    new Animated.ValueXY({
      x: 0,
      y: 0,
    }),
  ).current;

  const [aimX, setAimX] = useState(0);

  const [aimY, setAimY] = useState(0);

  const [dragging, setDragging] = useState(false);

  /*
   * =======================================================
   * FLIGHT
   * =======================================================
   */

  const flightProgress = useRef(new Animated.Value(0)).current;

  const [flight, setFlight] = useState<FlightPath | null>(null);

  const [isFlying, setIsFlying] = useState(false);

  /*
   * =======================================================
   * MISS
   * =======================================================
   */

  const [missMessage, setMissMessage] = useState<string | null>(null);

  /*
   * =======================================================
   * TARGETS
   * =======================================================
   */

  const targetRects = useMemo(
    () => getArcheryTargetRects(fieldWidth, activity.choices.length),
    [activity.choices.length, fieldWidth],
  );

  /*
   * =======================================================
   * BOW ORIGIN
   * =======================================================
   */

  const originX = fieldWidth / 2;

  const originY = fieldHeight - 72;

  /*
   * =======================================================
   * LIVE AIM
   * =======================================================
   */

  const liveEnd = getArrowEndpoint({
    originX,
    originY,

    pullX: aimX,
    pullY: aimY,

    fieldWidth,

    horizontalPower: HORIZONTAL_POWER,

    verticalPower: VERTICAL_POWER,
  });

  /*
   * =======================================================
   * TRAJECTORY
   * =======================================================
   */

  const trajectoryDots =
    dragging && aimY >= MIN_PULL_Y && fieldWidth > 0
      ? buildTrajectoryDots(
          originX,
          originY,

          liveEnd.x,
          liveEnd.y,
        )
      : [];

  /*
   * =======================================================
   * VISUAL PULL
   * =======================================================
   */

  const pullVisualX = pull.x.interpolate({
    inputRange: [-MAX_PULL_X, MAX_PULL_X],

    outputRange: [-31, 31],

    extrapolate: "clamp",
  });

  const pullVisualY = pull.y.interpolate({
    inputRange: [0, MAX_PULL_Y],

    outputRange: [0, 42],

    extrapolate: "clamp",
  });

  /*
   * =======================================================
   * IMPORTANT:
   * ALWAYS RESTORE PAGE SCROLLING
   * =======================================================
   */

  useEffect(() => {
    return () => {
      onGestureActiveChange(false);
    };
  }, [onGestureActiveChange]);

  /*
   * =======================================================
   * RESET BOW
   * =======================================================
   */

  function resetBow() {
    setDragging(false);

    setAimX(0);

    setAimY(0);

    setFlight(null);

    setIsFlying(false);

    flightProgress.setValue(0);

    /*
     * Make absolutely sure the
     * page can scroll again.
     */

    onGestureActiveChange(false);

    Animated.spring(pull, {
      toValue: {
        x: 0,
        y: 0,
      },

      friction: 6,

      tension: 70,

      useNativeDriver: true,
    }).start();
  }

  /*
   * =======================================================
   * RELEASE ARROW
   * =======================================================
   */

  async function releaseArrow(rawX: number, rawY: number) {
    /*
     * Finger has left the screen.
     *
     * Player can scroll again while
     * the arrow animation plays.
     */

    onGestureActiveChange(false);

    if (submitted || isFlying || fieldWidth <= 0) {
      resetBow();

      return;
    }

    const pullX = clamp(rawX, -MAX_PULL_X, MAX_PULL_X);

    const pullY = clamp(rawY, 0, MAX_PULL_Y);

    setDragging(false);

    /*
     * Not enough power.
     */

    if (pullY < MIN_PULL_Y) {
      setMissMessage("Hilahin pa pababa upang lumakas ang pana.");

      await Haptics.selectionAsync();

      resetBow();

      setTimeout(() => {
        setMissMessage(null);
      }, 1100);

      return;
    }

    /*
     * Landing position.
     */

    const end = getArrowEndpoint({
      originX,
      originY,

      pullX,
      pullY,

      fieldWidth,

      horizontalPower: HORIZONTAL_POWER,

      verticalPower: VERTICAL_POWER,
    });

    /*
     * Collision detection.
     *
     * 22px aim assist prevents
     * frustrating pixel-perfect aiming.
     */

    const hit = findTargetHit(end.x, end.y, targetRects, 22);

    const finalX = hit ? hit.centerX : end.x;

    const finalY = hit ? hit.centerY : end.y;

    const dx = finalX - originX;

    const dy = finalY - originY;

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

    setFlight({
      endX: finalX,
      endY: finalY,

      targetIndex: hit?.index ?? null,

      rotation: angle,
    });

    setIsFlying(true);

    setMissMessage(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    flightProgress.setValue(0);

    /*
     * Bow snaps back.
     */

    Animated.spring(pull, {
      toValue: {
        x: 0,
        y: 0,
      },

      friction: 5,

      tension: 90,

      useNativeDriver: true,
    }).start();

    requestAnimationFrame(() => {
      Animated.timing(flightProgress, {
        toValue: 1,

        duration: 620,

        easing: Easing.out(Easing.cubic),

        useNativeDriver: true,
      }).start(async ({ finished }) => {
        if (!finished) {
          return;
        }

        /*
         * MISS
         *
         * Does NOT count as a
         * wrong academic answer.
         */

        if (!hit) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );

          setMissMessage(
            "Walang tinamaan! Ayusin ang iyong tutok at subukan muli.",
          );

          setTimeout(() => {
            resetBow();

            setTimeout(() => {
              setMissMessage(null);
            }, 800);
          }, 450);

          return;
        }

        /*
         * Whatever target the
         * arrow hits becomes the answer.
         */

        const choice = activity.choices[hit.index];

        await onTargetHit(choice);

        /*
         * Wrong target:
         * automatically reload bow.
         */

        if (choice !== activity.answer) {
          setTimeout(() => {
            resetBow();
          }, 700);
        }
      });
    });
  }

  /*
   * =======================================================
   * PAN RESPONDER
   * =======================================================
   *
   * THIS IS THE IMPORTANT FIX.
   *
   * Capture the gesture BEFORE
   * ScrollView can claim it.
   * =======================================================
   */

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        /*
         * Claim immediately when
         * the finger touches the bow.
         */

        onStartShouldSetPanResponder: () => !submitted && !isFlying,

        onStartShouldSetPanResponderCapture: () => !submitted && !isFlying,

        /*
         * Continue owning the gesture
         * when movement begins.
         */

        onMoveShouldSetPanResponder: () => !submitted && !isFlying,

        onMoveShouldSetPanResponderCapture: () => !submitted && !isFlying,

        /*
         * Don't allow ScrollView or
         * another parent to steal it.
         */

        onPanResponderTerminationRequest: () => false,

        onShouldBlockNativeResponder: () => true,

        /*
         * Finger touches bow.
         */

        onPanResponderGrant: () => {
          if (submitted || isFlying) {
            return;
          }

          /*
           * TURN OFF PAGE SCROLL.
           */

          onGestureActiveChange(true);

          setDragging(true);

          setMissMessage(null);

          setAimX(0);

          setAimY(0);

          pull.setValue({
            x: 0,
            y: 0,
          });

          Haptics.selectionAsync();
        },

        /*
         * Player is pulling / aiming.
         */

        onPanResponderMove: (_, gesture) => {
          if (submitted || isFlying) {
            return;
          }

          const x = clamp(
            gesture.dx,

            -MAX_PULL_X,

            MAX_PULL_X,
          );

          /*
           * Downward pull only.
           */

          const y = clamp(
            gesture.dy,

            0,

            MAX_PULL_Y,
          );

          pull.setValue({
            x,
            y,
          });

          setAimX(Math.round(x));

          setAimY(Math.round(y));
        },

        /*
         * Finger released = FIRE.
         */

        onPanResponderRelease: (_, gesture) => {
          /*
           * Re-enable page scrolling
           * immediately after release.
           */

          onGestureActiveChange(false);

          void releaseArrow(gesture.dx, gesture.dy);
        },

        /*
         * Gesture unexpectedly cancelled.
         */

        onPanResponderTerminate: () => {
          onGestureActiveChange(false);

          resetBow();
        },
      }),
    [fieldWidth, isFlying, submitted, targetRects, onGestureActiveChange],
  );

  /*
   * =======================================================
   * FLIGHT
   * =======================================================
   */

  const flightX = flight
    ? flightProgress.interpolate({
        inputRange: [0, 1],

        outputRange: [0, flight.endX - originX],
      })
    : flightProgress;

  const flightY = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.5, 1],

        outputRange: [
          0,

          (flight.endY - originY) / 2 - 20,

          flight.endY - originY,
        ],
      })
    : flightProgress;

  const flightScale = flightProgress.interpolate({
    inputRange: [0, 1],

    outputRange: [1, 0.9],
  });

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <View style={styles.archeryGame}>
      {/* GAME TITLE */}

      <View style={styles.gameSectionTitle}>
        <MaterialCommunityIcons
          name="bow-arrow"
          size={22}
          color={Colors.secondary}
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.gameSectionEyebrow}>PANA NG EBIDENSYA</Text>

          <Text style={styles.gameSectionSubtitle}>
            Hilahin ang pana, itutok ang trajectory, at pakawalan.
          </Text>
        </View>
      </View>

      {/* CONTROLS */}

      <View style={styles.archeryControls}>
        <ArcheryControl icon="gesture-tap-hold" number="1" text="Hawakan" />

        <MaterialCommunityIcons
          name="chevron-right"
          size={13}
          color={Colors.textMuted}
        />

        <ArcheryControl icon="gesture-swipe-down" number="2" text="Hilahin" />

        <MaterialCommunityIcons
          name="chevron-right"
          size={13}
          color={Colors.textMuted}
        />

        <ArcheryControl icon="target" number="3" text="Itutok" />

        <MaterialCommunityIcons
          name="chevron-right"
          size={13}
          color={Colors.textMuted}
        />

        <ArcheryControl icon="arrow-up-bold" number="4" text="Bitawan" />
      </View>

      {/* =====================================
          ARCHERY FIELD
      ===================================== */}

      <LinearGradient
        colors={["#F8EED2", "#EEDDB2", "#E6D19D"]}
        style={[
          styles.archeryField,

          {
            height: fieldHeight,
          },
        ]}
        onLayout={(event) => {
          setFieldWidth(event.nativeEvent.layout.width);
        }}
      >
        {/* BACKGROUND */}

        <View style={styles.archerySun} />

        <MaterialCommunityIcons
          name="tree"
          size={29}
          color="#A8B986"
          style={styles.archeryTreeOne}
        />

        <MaterialCommunityIcons
          name="pine-tree"
          size={25}
          color="#A9B985"
          style={styles.archeryTreeTwo}
        />

        <MaterialCommunityIcons
          name="grass"
          size={30}
          color="#AAA77B"
          style={styles.archeryGrass}
        />

        <View style={styles.targetsHeader}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={13}
            color="#826C3F"
          />

          <Text style={styles.targetsHeaderText}>MGA EBIDENSYA</Text>
        </View>

        {/* =================================
            TARGETS
        ================================= */}

        {targetRects.map((target) => {
          const choice = activity.choices[target.index];

          const wrong = wrongChoice === choice;

          const success = submitted && correct && selectedChoice === choice;

          return (
            <Animated.View
              key={`${target.index}-${choice}`}
              pointerEvents="none"
              style={[
                styles.archeryTarget,

                {
                  left: target.left,

                  top: target.top,

                  width: target.width,

                  height: target.height,

                  transform: [
                    {
                      translateX: wrong ? targetShake : 0,
                    },
                  ],
                },

                wrong && styles.archeryTargetWrong,

                success && styles.archeryTargetCorrect,
              ]}
            >
              <View style={styles.archeryTargetTop}>
                <View
                  style={[
                    styles.bullseyeOuter,

                    wrong && styles.bullseyeWrong,

                    success && styles.bullseyeCorrect,
                  ]}
                >
                  <View style={styles.bullseyeMiddle}>
                    <View
                      style={[
                        styles.bullseyeCenter,

                        success && styles.bullseyeCenterCorrect,
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.archeryTargetNumber}>
                  <Text style={styles.archeryTargetNumberText}>
                    {target.index + 1}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={3} style={styles.archeryTargetText}>
                {choice}
              </Text>

              {wrong && (
                <View style={styles.impactWrongBadge}>
                  <MaterialCommunityIcons
                    name="close"
                    size={11}
                    color={Colors.surface}
                  />

                  <Text style={styles.impactBadgeText}>HINDI ITO</Text>
                </View>
              )}

              {success && (
                <View style={styles.impactCorrectBadge}>
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={11}
                    color={Colors.surface}
                  />

                  <Text style={styles.impactBadgeText}>BULLSEYE!</Text>
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* =================================
            TRAJECTORY
        ================================= */}

        {trajectoryDots.map((dot, index) => (
          <View
            pointerEvents="none"
            key={`trajectory-${index}`}
            style={[
              styles.trajectoryDot,

              {
                left: dot.x - 3,

                top: dot.y - 3,

                opacity: 0.35 + index * 0.065,
              },
            ]}
          />
        ))}

        {/* AIM CROSSHAIR */}

        {dragging && aimY >= MIN_PULL_Y && (
          <View
            pointerEvents="none"
            style={[
              styles.trajectoryCrosshair,

              {
                left: liveEnd.x - 14,

                top: liveEnd.y - 14,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="crosshairs"
              size={28}
              color={Colors.teal}
            />
          </View>
        )}

        {/* =================================
            FLYING ARROW
        ================================= */}

        {isFlying && flight && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flightArrow,

              {
                left: originX - 18,

                top: originY - 24,

                transform: [
                  {
                    translateX: flightX,
                  },

                  {
                    translateY: flightY,
                  },

                  {
                    rotate: `${flight.rotation}deg`,
                  },

                  {
                    scale: flightScale,
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-up-bold"
              size={42}
              color="#7B4D28"
            />
          </Animated.View>
        )}

        {/* =================================
            BOW
        ================================= */}

        <View
          style={[
            styles.bowStation,

            {
              left: originX - 62,

              top: originY - 36,
            },
          ]}
        >
          {/* POWER */}

          <View style={styles.powerTrack}>
            <View
              style={[
                styles.powerFill,

                {
                  width: `${Math.min(
                    100,

                    (aimY / MAX_PULL_Y) * 100,
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.powerText}>
            {dragging
              ? `LAKAS ${Math.round((aimY / MAX_PULL_Y) * 100)}%`
              : "HILAHIN ANG PANA"}
          </Text>

          {/* =================================
              THIS AREA OWNS THE TOUCH
          ================================= */}

          {!isFlying && (
            <View {...panResponder.panHandlers} style={styles.bowGestureArea}>
              <View style={styles.bowBase}>
                <MaterialCommunityIcons
                  name="bow-arrow"
                  size={41}
                  color={Colors.secondary}
                />
              </View>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.readyArrow,

                  {
                    transform: [
                      {
                        translateX: pullVisualX,
                      },

                      {
                        translateY: pullVisualY,
                      },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="arrow-up-bold"
                  size={35}
                  color="#74471F"
                />
              </Animated.View>
            </View>
          )}

          <Text style={styles.bowInstruction}>
            {dragging
              ? aimY < MIN_PULL_Y
                ? "Hilahin pa pababa..."
                : "Bitawan para lumipad!"
              : isFlying
                ? "Lumilipad ang pana..."
                : submitted
                  ? "Bullseye!"
                  : "Hawakan at hilahin pababa"}
          </Text>
        </View>

        {/* MISS */}

        {missMessage && (
          <View style={styles.missMessage}>
            <MaterialCommunityIcons
              name="target-variant"
              size={17}
              color={Colors.secondary}
            />

            <Text style={styles.missMessageText}>{missMessage}</Text>
          </View>
        )}
      </LinearGradient>

      {/* WRONG ANSWER HINT */}

      {hint && !submitted && (
        <View style={styles.archeryHint}>
          <View style={styles.archeryHintIcon}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={19}
              color={Colors.secondary}
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text style={styles.archeryHintLabel}>PAHIWATIG</Text>

            <Text style={styles.archeryHintText}>{hint}</Text>

            <Text style={styles.archeryHintRetry}>
              Handa na ang bagong pana. Hilahin muli upang sumubok.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/*
 * =========================================================
 * ARCHERY CONTROL
 * =========================================================
 */

function ArcheryControl({
  icon,
  number,
  text,
}: {
  icon: IconName;
  number: string;
  text: string;
}) {
  return (
    <View style={styles.archeryControl}>
      <View style={styles.archeryControlIcon}>
        <MaterialCommunityIcons name={icon} size={14} color={Colors.primary} />

        <View style={styles.archeryControlNumber}>
          <Text style={styles.archeryControlNumberText}>{number}</Text>
        </View>
      </View>

      <Text style={styles.archeryControlText}>{text}</Text>
    </View>
  );
}

/*
 * =========================================================
 * ARCHERY GEOMETRY
 * =========================================================
 */

function getArcheryTargetRects(
  fieldWidth: number,
  count: number,
): TargetRect[] {
  if (fieldWidth <= 0) {
    return [];
  }

  const sidePadding = 14;

  const gap = 10;

  const availableWidth = fieldWidth - sidePadding * 2 - gap;

  const width = availableWidth / 2;

  const height = 112;

  const firstTop = 52;

  const verticalGap = 18;

  return Array.from({
    length: count,
  }).map((_, index) => {
    const column = index % 2;

    const row = Math.floor(index / 2);

    const left = sidePadding + column * (width + gap);

    const top = firstTop + row * (height + verticalGap);

    return {
      index,

      left,

      top,

      width,

      height,

      centerX: left + width / 2,

      centerY: top + 34,
    };
  });
}

function getArrowEndpoint({
  originX,
  originY,
  pullX,
  pullY,
  fieldWidth,
  horizontalPower,
  verticalPower,
}: {
  originX: number;
  originY: number;
  pullX: number;
  pullY: number;
  fieldWidth: number;
  horizontalPower: number;
  verticalPower: number;
}) {
  /*
   * Horizontal pull controls
   * horizontal aiming directly.
   *
   * Downward pull controls power.
   */

  const x = clamp(
    originX + pullX * horizontalPower,

    12,

    Math.max(12, fieldWidth - 12),
  );

  const y = clamp(
    originY - pullY * verticalPower,

    28,

    originY - 25,
  );

  return {
    x,
    y,
  };
}

function buildTrajectoryDots(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  return Array.from({
    length: 10,
  }).map((_, index) => {
    const t = (index + 1) / 11;

    /*
     * Small parabolic arc.
     */

    const arc = 22 * 4 * t * (1 - t);

    return {
      x: startX + (endX - startX) * t,

      y: startY + (endY - startY) * t - arc,
    };
  });
}

function findTargetHit(
  x: number,
  y: number,
  targets: TargetRect[],
  assist: number,
) {
  /*
   * Collision occurs around the landing
   * point, with an expanded invisible box.
   */

  const matches = targets.filter(
    (target) =>
      x >= target.left - assist &&
      x <= target.left + target.width + assist &&
      y >= target.top - assist &&
      y <= target.top + target.height + assist,
  );

  if (matches.length === 0) {
    return null;
  }

  /*
   * If expanded hit areas overlap,
   * choose nearest target center.
   */

  matches.sort((a, b) => {
    const distanceA = Math.hypot(x - a.centerX, y - a.centerY);

    const distanceB = Math.hypot(x - b.centerX, y - b.centerY);

    return distanceA - distanceB;
  });

  return matches[0];
}

function attemptsLabel(
  activity: ChoiceActivity,
  selectedChoice: string | null,
  wrongChoice: string | null,
) {
  if (wrongChoice) {
    return "Hindi tama";
  }

  if (selectedChoice === activity.answer) {
    return "Tama";
  }

  return "Wala pa";
}
