import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ComponentProps } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { StoryUnit, storyUnits } from "../../data/stories";
import { useUserStore } from "../../store/useUserStore";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type UnitStatus = "active" | "completed" | "locked" | "coming-soon";

export default function MarkahanScreen() {
  const completedStoryIds = useUserStore(
    (state) => state.completedStoryIds,
  );

  const getUnitStatus = (
    unit: StoryUnit,
    index: number,
  ): UnitStatus => {
    /*
     * If the Markahan doesn't have stories yet,
     * show it as "coming soon".
     */
    if (unit.stories.length === 0) {
      return "coming-soon";
    }

    const completedCount = unit.stories.filter((story) =>
      completedStoryIds.includes(story.id),
    ).length;

    /*
     * Entire Markahan completed.
     */
    if (completedCount === unit.stories.length) {
      return "completed";
    }

    /*
     * First Markahan is always available.
     */
    if (index === 0) {
      return "active";
    }

    /*
     * The previous Markahan must exist,
     * contain stories, and be completely finished.
     */
    const previousUnit = storyUnits[index - 1];

    if (!previousUnit || previousUnit.stories.length === 0) {
      return "locked";
    }

    const previousCompleted = previousUnit.stories.every((story) =>
      completedStoryIds.includes(story.id),
    );

    return previousCompleted ? "active" : "locked";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/landing")}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={21}
              color={Colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>WIKALINO</Text>

            <Text style={styles.headerTitle}>Mga Markahan</Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* INTRO */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={29}
                color={Colors.primary}
              />
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introEyebrow}>BAITANG 9 • MAIKLING KWENTO</Text>

              <Text style={styles.introTitle}>Piliin ang Iyong Markahan</Text>

              <Text style={styles.introText}>
                Kumpletuhin ang mga kwento at hamon upang ma-unlock ang susunod
                na bahagi ng iyong paglalakbay.
              </Text>
            </View>
          </View>

          {/* MARKAHAN CARDS */}
          <View style={styles.unitsList}>
            {storyUnits.map((unit, index) => {
              const status = getUnitStatus(unit, index);

              const totalStories = unit.stories.length;

              const completedCount = unit.stories.filter((story) =>
                completedStoryIds.includes(story.id),
              ).length;

              const percentage =
                totalStories > 0
                  ? Math.round((completedCount / totalStories) * 100)
                  : 0;

              return (
                <MarkahanCard
                  key={unit.id}
                  unit={unit}
                  index={index}
                  status={status}
                  completedCount={completedCount}
                  totalStories={totalStories}
                  percentage={percentage}
                  onPress={() => {
                    if (
                      status === "locked" ||
                      status === "coming-soon"
                    ) {
                      return;
                    }

                    router.replace({
                      pathname: "/landing",
                      params: {
                        markahan: String(unit.markahan),
                      },
                    });
                  }}
                />
              );
            })}
          </View>

          {/* INFO */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Colors.teal}
            />

            <Text style={styles.infoText}>
              Bawat Markahan ay binubuo ng mga Maikling Kwento, interactive na
              pagbasa, at mga hamon sa pag-unawa.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function MarkahanCard({
  unit,
  index,
  status,
  completedCount,
  totalStories,
  percentage,
  onPress,
}: {
  unit: StoryUnit;
  index: number;
  status: UnitStatus;
  completedCount: number;
  totalStories: number;
  percentage: number;
  onPress: () => void;
}) {
  const locked = status === "locked";
  const comingSoon = status === "coming-soon";
  const completed = status === "completed";
  const active = status === "active";

  const icon = getStatusIcon(status);

  const statusLabel = getStatusLabel(status);

  return (
    <Pressable
      disabled={locked || comingSoon}
      onPress={onPress}
      style={({ pressed }) => [
        styles.unitCard,

        active && styles.unitCardActive,

        completed && styles.unitCardCompleted,

        locked && styles.unitCardLocked,

        comingSoon && styles.unitCardComingSoon,

        pressed &&
          !locked &&
          !comingSoon &&
          styles.unitCardPressed,
      ]}
    >
      {/* NUMBER */}
      <View
        style={[
          styles.unitNumber,
          active && styles.unitNumberActive,
          completed && styles.unitNumberCompleted,
          (locked || comingSoon) && styles.unitNumberLocked,
        ]}
      >
        <Text
          style={[
            styles.unitNumberText,
            (active || completed) && styles.unitNumberTextActive,
          ]}
        >
          {String(index + 1).padStart(2, "0")}
        </Text>
      </View>

      <View style={styles.unitContent}>
        {/* TOP */}
        <View style={styles.unitHeader}>
          <View style={styles.unitTitleWrap}>
            <Text
              style={[
                styles.unitEyebrow,
                (locked || comingSoon) && styles.mutedText,
              ]}
            >
              MARKAHAN {unit.markahan}
            </Text>

            <Text
              style={[
                styles.unitTitle,
                (locked || comingSoon) && styles.lockedTitle,
              ]}
            >
              {unit.title}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,

              active && styles.statusActive,

              completed && styles.statusCompleted,

              locked && styles.statusLocked,

              comingSoon && styles.statusComingSoon,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={13}
              color={
                completed
                  ? Colors.text
                  : active
                    ? Colors.surface
                    : Colors.textMuted
              }
            />

            <Text
              style={[
                styles.statusText,

                active && styles.statusTextLight,

                completed && styles.statusTextCompleted,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <Text
          style={[
            styles.unitSubtitle,
            (locked || comingSoon) && styles.mutedText,
          ]}
        >
          {unit.subtitle}
        </Text>

        {comingSoon ? (
          <View style={styles.comingSoonContent}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={17}
              color={Colors.textMuted}
            />

            <Text style={styles.comingSoonText}>
              Ang mga kwento para sa markahang ito ay ihahanda pa.
            </Text>
          </View>
        ) : (
          <>
            {/* PROGRESS TEXT */}
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelRow}>
                <MaterialCommunityIcons
                  name="book-check-outline"
                  size={15}
                  color={
                    locked
                      ? Colors.textMuted
                      : completed
                        ? Colors.teal
                        : Colors.primary
                  }
                />

                <Text
                  style={[
                    styles.progressLabel,
                    locked && styles.mutedText,
                  ]}
                >
                  {completedCount}/{totalStories} kwento natapos
                </Text>
              </View>

              <Text
                style={[
                  styles.progressPercentage,
                  locked && styles.mutedText,
                ]}
              >
                {percentage}%
              </Text>
            </View>

            {/* PROGRESS BAR */}
            <View
              style={[
                styles.progressOuter,
                locked && styles.progressOuterLocked,
              ]}
            >
              <View
                style={[
                  styles.progressInner,

                  completed && styles.progressInnerCompleted,

                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>

            {/* BOTTOM */}
            <View style={styles.unitFooter}>
              {locked ? (
                <View style={styles.lockMessage}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={15}
                    color={Colors.textMuted}
                  />

                  <Text style={styles.lockMessageText}>
                    Kumpletuhin muna ang naunang Markahan
                  </Text>
                </View>
              ) : completed ? (
                <View style={styles.completeMessage}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={Colors.teal}
                  />

                  <Text style={styles.completeMessageText}>
                    Natapos mo na ang Markahan na ito
                  </Text>
                </View>
              ) : (
                <View style={styles.continueMessage}>
                  <Text style={styles.continueMessageText}>
                    {completedCount > 0 ? "Ipagpatuloy" : "Simulan"}
                  </Text>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color={Colors.primary}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

function getStatusIcon(status: UnitStatus): IconName {
  switch (status) {
    case "completed":
      return "star";

    case "active":
      return "play";

    case "locked":
      return "lock-outline";

    case "coming-soon":
      return "clock-outline";
  }
}

function getStatusLabel(status: UnitStatus) {
  switch (status) {
    case "completed":
      return "Tapos";

    case "active":
      return "Bukas";

    case "locked":
      return "Naka-lock";

    case "coming-soon":
      return "Paparating";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /*
   * HEADER
   */

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.surface,

    borderWidth: 1,
    borderColor: Colors.border,
  },

  buttonPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  headerText: {
    flex: 1,
    alignItems: "center",
  },

  headerEyebrow: {
    color: Colors.secondary,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1.3,
  },

  headerTitle: {
    marginTop: 2,

    color: Colors.text,

    fontSize: 17,
    fontWeight: "900",
  },

  headerPlaceholder: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,

    paddingTop: 14,
    paddingBottom: 32,
  },

  /*
   * INTRO
   */

  introCard: {
    padding: 18,

    flexDirection: "row",

    borderRadius: 22,

    backgroundColor: Colors.primary,
  },

  introIcon: {
    width: 55,
    height: 55,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.background,

    marginRight: 13,
  },

  introContent: {
    flex: 1,
  },

  introEyebrow: {
    color: Colors.accent,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1,
  },

  introTitle: {
    marginTop: 4,

    color: Colors.surface,

    fontSize: 19,
    lineHeight: 24,

    fontWeight: "900",
  },

  introText: {
    marginTop: 5,

    color: "rgba(255,255,255,0.68)",

    fontSize: 10,
    lineHeight: 15,

    fontWeight: "500",
  },

  /*
   * LIST
   */

  unitsList: {
    marginTop: 18,

    gap: 13,
  },

  unitCard: {
    flexDirection: "row",

    padding: 16,

    borderRadius: 22,

    backgroundColor: Colors.surface,

    borderWidth: 1.5,
    borderColor: Colors.border,

    overflow: "hidden",
  },

  unitCardActive: {
    borderColor: Colors.primary,
  },

  unitCardCompleted: {
    borderColor: "#C8E4DD",

    backgroundColor: "#FAFFFD",
  },

  unitCardLocked: {
    backgroundColor: Colors.lockedSoft,

    borderColor: "#DEDBE1",
  },

  unitCardComingSoon: {
    backgroundColor: "#F3F1F4",

    borderColor: "#E1DFE3",
  },

  unitCardPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],

    opacity: 0.94,
  },

  /*
   * NUMBER
   */

  unitNumber: {
    width: 48,
    height: 48,

    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.primarySoft,

    marginRight: 13,
  },

  unitNumberActive: {
    backgroundColor: Colors.primary,
  },

  unitNumberCompleted: {
    backgroundColor: Colors.teal,
  },

  unitNumberLocked: {
    backgroundColor: "#DDDADF",
  },

  unitNumberText: {
    color: Colors.textMuted,

    fontSize: 13,
    fontWeight: "900",
  },

  unitNumberTextActive: {
    color: Colors.surface,
  },

  /*
   * CONTENT
   */

  unitContent: {
    flex: 1,
  },

  unitHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 8,
  },

  unitTitleWrap: {
    flex: 1,
  },

  unitEyebrow: {
    color: Colors.secondary,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1,
  },

  unitTitle: {
    marginTop: 3,

    color: Colors.text,

    fontSize: 16,
    lineHeight: 21,

    fontWeight: "900",
  },

  lockedTitle: {
    color: "#74727A",
  },

  unitSubtitle: {
    marginTop: 7,

    color: Colors.textMuted,

    fontSize: 10,
    lineHeight: 15,
  },

  mutedText: {
    color: "#8B8990",
  },

  /*
   * STATUS
   */

  statusBadge: {
    minHeight: 27,

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    paddingHorizontal: 8,

    borderRadius: 999,
  },

  statusActive: {
    backgroundColor: Colors.primary,
  },

  statusCompleted: {
    backgroundColor: Colors.accent,
  },

  statusLocked: {
    backgroundColor: "#DCD9DF",
  },

  statusComingSoon: {
    backgroundColor: "#E5E2E7",
  },

  statusText: {
    color: Colors.textMuted,

    fontSize: 8,
    fontWeight: "900",
  },

  statusTextLight: {
    color: Colors.surface,
  },

  statusTextCompleted: {
    color: Colors.text,
  },

  /*
   * PROGRESS
   */

  progressHeader: {
    marginTop: 14,
    marginBottom: 7,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  progressLabelRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  progressLabel: {
    color: Colors.textMuted,

    fontSize: 9,
    fontWeight: "700",
  },

  progressPercentage: {
    color: Colors.primary,

    fontSize: 9,
    fontWeight: "900",
  },

  progressOuter: {
    height: 8,

    overflow: "hidden",

    borderRadius: 999,

    backgroundColor: Colors.primarySoft,
  },

  progressOuterLocked: {
    backgroundColor: "#DCD9DF",
  },

  progressInner: {
    height: "100%",

    borderRadius: 999,

    backgroundColor: Colors.secondary,
  },

  progressInnerCompleted: {
    backgroundColor: Colors.teal,
  },

  /*
   * FOOTER MESSAGES
   */

  unitFooter: {
    marginTop: 11,
  },

  continueMessage: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,
  },

  continueMessageText: {
    color: Colors.primary,

    fontSize: 10,
    fontWeight: "900",
  },

  lockMessage: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  lockMessageText: {
    flex: 1,

    color: Colors.textMuted,

    fontSize: 9,
    lineHeight: 13,

    fontWeight: "600",
  },

  completeMessage: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  completeMessageText: {
    color: Colors.teal,

    fontSize: 9,
    fontWeight: "800",
  },

  /*
   * COMING SOON
   */

  comingSoonContent: {
    marginTop: 13,

    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    padding: 11,

    borderRadius: 13,

    backgroundColor: "#E9E6EA",
  },

  comingSoonText: {
    flex: 1,

    color: Colors.textMuted,

    fontSize: 9,
    lineHeight: 14,
  },

  /*
   * INFO
   */

  infoCard: {
    marginTop: 18,

    padding: 14,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    backgroundColor: Colors.tealSoft,
  },

  infoText: {
    flex: 1,

    color: Colors.textMuted,

    fontSize: 10,
    lineHeight: 15,

    fontWeight: "600",
  },
});