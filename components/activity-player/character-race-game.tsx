import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ComponentProps, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Reanimated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "../../constants/colors";
import { CharacterRaceActivity } from "../../data/stories";
import styles from "./character-race-game.styles";

const RACE_SEGMENT_DURATIONS = [1050, 1150, 1200, 1250, 1300, 1050] as const;
const RACE_DURATION_MS = RACE_SEGMENT_DURATIONS.reduce(
  (total, duration) => total + duration,
  0,
);

const WINNER_CHECKPOINTS = [0.11, 0.26, 0.43, 0.61, 0.79, 1] as const;
const CHALLENGER_CHECKPOINTS = [
  [0.19, 0.37, 0.5, 0.62, 0.75, 0.9],
  [0.1, 0.24, 0.53, 0.71, 0.85, 0.96],
  [0.15, 0.32, 0.4, 0.57, 0.72, 0.88],
] as const;

function getRaceCheckpoints(
  racerIndex: number,
  winnerIndex: number,
): readonly [number, number, number, number, number, number] {
  if (racerIndex === winnerIndex) {
    return WINNER_CHECKPOINTS;
  }

  const challengerIndexes = [0, 1, 2, 3].filter(
    (index) => index !== winnerIndex,
  );
  const challengerRank = challengerIndexes.indexOf(racerIndex);

  return CHALLENGER_CHECKPOINTS[Math.max(0, challengerRank) % 3];
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type Racer = CharacterRaceActivity["racers"][number];

type RaceLaneProps = {
  racer: Racer;
  progress: SharedValue<number>;
  distance: number;
  isWinner: boolean;
};

function RaceLane({ racer, progress, distance, isWinner }: RaceLaneProps) {
  const runnerStyle = useAnimatedStyle(() => {
    const currentProgress = progress.get();
    const stride = Math.sin(currentProgress * Math.PI * 18);

    return {
      transform: [
        { translateX: currentProgress * distance },
        { translateY: stride * 2.5 },
        { rotate: `${stride * 3}deg` },
        { scale: 1 + Math.max(0, stride) * 0.035 },
      ],
    };
  });

  return (
    <View style={styles.track}>
      <View style={styles.laneStripe} />
      <View style={styles.finishLine} />

      <Reanimated.View style={[styles.runner, runnerStyle]}>
        <View style={[styles.runnerAvatar, { backgroundColor: racer.color }]}>
          <MaterialCommunityIcons
            name={racer.icon as IconName}
            size={23}
            color={Colors.surface}
          />
        </View>
        <Text numberOfLines={1} style={styles.runnerName}>
          {racer.name}
        </Text>
      </Reanimated.View>

      {isWinner && (
        <View style={styles.winnerBadge}>
          <MaterialCommunityIcons name="trophy" size={11} color="#8B6718" />
          <Text style={styles.winnerText}>PANALO</Text>
        </View>
      )}
    </View>
  );
}

export function CharacterRaceGame({
  activity,
  selectedChoice,
  submitted,
  onSelectChoice,
  onFinish,
}: {
  activity: CharacterRaceActivity;
  selectedChoice: string | null;
  submitted: boolean;
  onSelectChoice: (choice: string) => void;
  onFinish: (winner: string) => Promise<void>;
}) {
  const [isRacing, setIsRacing] = useState(false);
  const [racePhase, setRacePhase] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const racerOne = useSharedValue(0);
  const racerTwo = useSharedValue(0);
  const racerThree = useSharedValue(0);
  const racerFour = useSharedValue(0);
  const progressValues = [racerOne, racerTwo, racerThree, racerFour];

  useEffect(() => {
    if (!submitted) {
      racerOne.set(0);
      racerTwo.set(0);
      racerThree.set(0);
      racerFour.set(0);
    }

    return () => {
      cancelAnimation(racerOne);
      cancelAnimation(racerTwo);
      cancelAnimation(racerThree);
      cancelAnimation(racerFour);
    };
  }, [racerFour, racerOne, racerThree, racerTwo, submitted]);

  useEffect(() => {
    if (!isRacing) {
      return;
    }

    const finishTimer = setTimeout(() => {
      setIsRacing(false);
      void onFinish(activity.answer);
    }, RACE_DURATION_MS + 80);

    const phaseTimers = [
      setTimeout(() => setRacePhase(1), 1500),
      setTimeout(() => setRacePhase(2), 3400),
      setTimeout(() => setRacePhase(3), 5500),
    ];

    return () => {
      clearTimeout(finishTimer);
      phaseTimers.forEach(clearTimeout);
    };
  }, [activity.answer, isRacing, onFinish]);

  function selectRacer(name: string) {
    if (isRacing || submitted) {
      return;
    }

    void Haptics.selectionAsync();
    onSelectChoice(name);
  }

  function startRace() {
    if (!selectedChoice || isRacing || submitted || trackWidth <= 0) {
      return;
    }

    const winnerIndex = activity.racers.findIndex(
      (racer) => racer.name === activity.answer,
    );

    if (winnerIndex < 0) {
      setIsRacing(false);

      return;
    }

    setRacePhase(0);
    setIsRacing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    progressValues.forEach((progress, index) => {
      const checkpoints = getRaceCheckpoints(index, winnerIndex);

      progress.set(
        withSequence(
          withTiming(checkpoints[0], {
            duration: RACE_SEGMENT_DURATIONS[0],
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(checkpoints[1], {
            duration: RACE_SEGMENT_DURATIONS[1],
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(checkpoints[2], {
            duration: RACE_SEGMENT_DURATIONS[2],
            easing: Easing.inOut(Easing.cubic),
          }),
          withTiming(checkpoints[3], {
            duration: RACE_SEGMENT_DURATIONS[3],
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(checkpoints[4], {
            duration: RACE_SEGMENT_DURATIONS[4],
            easing: Easing.inOut(Easing.cubic),
          }),
          withTiming(checkpoints[5], {
            duration: RACE_SEGMENT_DURATIONS[5],
            easing: Easing.in(Easing.cubic),
          }),
        ),
      );
    });
  }

  const raceDistance = Math.max(0, trackWidth - 58);
  const winnerIndex = activity.racers.findIndex(
    (racer) => racer.name === activity.answer,
  );
  const challengers = activity.racers.filter(
    (_, index) => index !== winnerIndex,
  );
  const raceMessages = [
    "At sila ay kumaripas mula sa simula!",
    `Mabilis ang simula ni ${challengers[0]?.name ?? "isang tauhan"}!`,
    `Umu-overtake si ${challengers[1]?.name ?? "isa pang tauhan"}!`,
    `Humahabol si ${activity.answer}—huling hataw!`,
  ];

  return (
    <View style={styles.game}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <MaterialCommunityIcons
            name="run-fast"
            size={24}
            color={Colors.secondary}
          />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>KARERA NG MGA TAUHAN</Text>
          <Text style={styles.subtitle}>
            Hulaan ang tamang tauhan, pagkatapos ay panoorin ang karera.
          </Text>
        </View>
      </View>

      <Text style={styles.predictionLabel}>Sino ang pipiliin mong manalo?</Text>

      <View style={styles.roster}>
        {activity.racers.map((racer, index) => {
          const selected = racer.name === selectedChoice;

          return (
            <Pressable
              key={racer.name}
              disabled={isRacing || submitted}
              onPress={() => selectRacer(racer.name)}
              style={({ pressed }) => [
                styles.racerChoice,
                selected && styles.racerChoiceSelected,
                (isRacing || submitted) && styles.racerChoiceDisabled,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View
                style={[styles.choiceAvatar, { backgroundColor: racer.color }]}
              >
                <MaterialCommunityIcons
                  name={racer.icon as IconName}
                  size={21}
                  color={Colors.surface}
                />
              </View>
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={styles.choiceName}>{racer.name}</Text>
              </View>
              {selected && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={Colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View
        style={styles.raceBoard}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width - 24)}
      >
        <View style={styles.boardHeader}>
          <Text style={styles.boardTitle}>DAAN PAUWI</Text>
          <Text style={styles.finishLabel}>🏁 HANTUNGAN</Text>
        </View>

        {activity.racers.map((racer, index) => (
          <RaceLane
            key={racer.name}
            racer={racer}
            progress={progressValues[index]}
            distance={raceDistance}
            isWinner={submitted && racer.name === activity.answer}
          />
        ))}
      </View>

      {isRacing ? (
        <View style={styles.runningStatus}>
          <MaterialCommunityIcons
            name="run-fast"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.runningStatusText}>
            {raceMessages[racePhase]}
          </Text>
        </View>
      ) : (
        !submitted && (
          <Pressable
            disabled={!selectedChoice}
            onPress={startRace}
            style={({ pressed }) => [
              styles.startButton,
              !selectedChoice && styles.startButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialCommunityIcons
              name="flag-checkered"
              size={20}
              color={Colors.surface}
            />
            <Text style={styles.startButtonText}>SIMULAN ANG KARERA</Text>
          </Pressable>
        )
      )}
    </View>
  );
}
