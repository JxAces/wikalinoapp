import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
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

      <LinearGradient colors={["#F8F0D8", "#F1E5C3"]} style={styles.plotMap}>
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
        colors={["#24243A", "#302E4D"]}
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
        colors={["#F9F1D8", "#EFE0B8"]}
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
