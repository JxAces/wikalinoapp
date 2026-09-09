import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

import {
  Alert,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Colors,
} from "../../constants/colors";

import {
  getAllStories,
  storyUnits,
} from "../../data/stories";

import {
  useUserStore,
} from "../../store/useUserStore";

import {
  getLevelInfo,
} from "../../utils/progression";

export default function ProgressScreen() {
  const profile =
    useUserStore(
      (state) => state.profile,
    );

  const xp =
    useUserStore(
      (state) => state.xp,
    );

  const completedStoryIds =
    useUserStore(
      (state) =>
        state.completedStoryIds,
    );

  const activityResults =
    useUserStore(
      (state) =>
        state.activityResults,
    );

  const getStoryStars =
    useUserStore(
      (state) =>
        state.getStoryStars,
    );

  const clearGameProgress =
    useUserStore(
      (state) =>
        state.clearGameProgress,
    );

  const deleteAccount =
    useUserStore(
      (state) =>
        state.deleteAccount,
    );

  const [isDeleting, setIsDeleting] =
    useState(false);

  const stories =
    getAllStories();

  const totalStars =
    stories.reduce(
      (total, story) =>
        total +
        getStoryStars(story.id),
      0,
    );

  const level =
    getLevelInfo(xp);

  const handleReset = () => {
    Alert.alert(
      "I-reset ang Progreso",
      "Mabubura ang XP, natapos na kwento, stars at koleksyon. Hindi mabubura ang iyong pangalan at pangkat.",

      [
        {
          text: "Kanselahin",
          style: "cancel",
        },

        {
          text: "I-reset",
          style: "destructive",
          onPress:
            clearGameProgress,
        },
      ],
    );
  };

  const confirmAccountDeletion =
    async () => {
      setIsDeleting(true);

      try {
        await deleteAccount();

        router.replace("/onboarding");
      } catch {
        setIsDeleting(false);

        Alert.alert(
          "Hindi Nabura ang Account",
          "Hindi maalis ang naka-save na data. Pakisubukan muli.",
        );
      }
    };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Burahin ang Account?",
      "Permanenteng mabubura ang iyong pangalan, pangkat, XP, progreso, stars, koleksyon, at lahat ng natapos na hamon sa device na ito.",
      [
        {
          text: "Kanselahin",
          style: "cancel",
        },
        {
          text: "Burahin Lahat",
          style: "destructive",
          onPress: () => {
            void confirmAccountDeletion();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        <View
          style={styles.profileCard}
        >
          <View
            style={
              styles.profileIcon
            }
          >
            <MaterialCommunityIcons
              name="account"
              size={30}
              color={Colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.name}
            >
              {profile?.fullName}
            </Text>

            <Text
              style={
                styles.pangkat
              }
            >
              {profile?.pangkat}
            </Text>

            <Text
              style={styles.level}
            >
              Antas {level.level} •{" "}
              {level.title}
            </Text>
          </View>
        </View>

        <View style={styles.xpCard}>
          <View
            style={styles.xpHeader}
          >
            <Text
              style={
                styles.xpTitle
              }
            >
              Kabuuang XP
            </Text>

            <Text
              style={
                styles.xpValue
              }
            >
              {xp}
            </Text>
          </View>

          <View
            style={
              styles.progressOuter
            }
          >
            <View
              style={[
                styles.progressInner,

                {
                  width: `${level.progress}%`,
                },
              ]}
            />
          </View>

          <Text
            style={styles.nextLevel}
          >
            {level.next
              ? `${level.next.minXp - xp} XP bago ang Antas ${level.next.level}`
              : "Pinakamataas na antas"}
          </Text>
        </View>

        <View
          style={styles.summaryRow}
        >
          <Summary
            icon="book-check-outline"
            value={
              completedStoryIds.length
            }
            label="Kwento"
          />

          <Summary
            icon="gamepad-variant-outline"
            value={
              Object.keys(
                activityResults,
              ).length
            }
            label="Hamon"
          />

          <Summary
            icon="star"
            value={totalStars}
            label="Stars"
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          Progreso sa Markahan
        </Text>

        <View style={styles.units}>
          {storyUnits.map(
            (unit) => {
              const completed =
                unit.stories.filter(
                  (story) =>
                    completedStoryIds.includes(
                      story.id,
                    ),
                ).length;

              const total =
                unit.stories.length;

              const percentage =
                total
                  ? Math.round(
                      (completed /
                        total) *
                        100,
                    )
                  : 0;

              return (
                <View
                  key={unit.id}
                  style={styles.unitCard}
                >
                  <View
                    style={
                      styles.unitHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.unitEyebrow
                        }
                      >
                        MARKAHAN{" "}
                        {unit.markahan}
                      </Text>

                      <Text
                        style={
                          styles.unitTitle
                        }
                      >
                        {unit.title}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.unitCount
                      }
                    >
                      {total
                        ? `${completed}/${total}`
                        : "Paparating"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.unitProgress
                    }
                  >
                    <View
                      style={[
                        styles.unitProgressInner,

                        {
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            },
          )}
        </View>

        <Pressable
          style={styles.resetButton}
          onPress={handleReset}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={Colors.error}
          />

          <Text
            style={
              styles.resetButtonText
            }
          >
            I-reset ang Progreso
          </Text>
        </Pressable>

        <View style={styles.accountCard}>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>
              Account at Data
            </Text>

            <Text style={styles.accountDescription}>
              Burahin ang profile at lahat ng naka-save na progreso sa device na ito.
            </Text>
          </View>

          <Pressable
            disabled={isDeleting}
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.deleteAccountButton,
              isDeleting &&
                styles.deleteAccountButtonDisabled,
              pressed &&
                !isDeleting &&
                styles.deleteAccountButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="delete-forever-outline"
              size={20}
              color={Colors.surface}
            />

            <Text
              style={styles.deleteAccountButtonText}
            >
              {isDeleting
                ? "BINUBURA…"
                : "BURAHIN ANG ACCOUNT"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({
  icon,
  value,
  label,
}: {
  icon: any;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.summary}>
      <MaterialCommunityIcons
        name={icon}
        size={23}
        color={Colors.primary}
      />

      <Text
        style={styles.summaryValue}
      >
        {value}
      </Text>

      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    container: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 120,
    },

    profileCard: {
      padding: 18,

      borderRadius: 21,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        Colors.primary,
    },

    profileIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        Colors.background,

      marginRight: 13,
    },

    name: {
      color: Colors.surface,

      fontSize: 18,

      fontWeight: "900",
    },

    pangkat: {
      marginTop: 2,

      color: Colors.accent,

      fontSize: 10,

      fontWeight: "800",
    },

    level: {
      marginTop: 5,

      color:
        "rgba(255,255,255,0.65)",

      fontSize: 9,

      fontWeight: "700",
    },

    xpCard: {
      marginTop: 14,

      padding: 17,

      borderRadius: 19,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.surface,
    },

    xpHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    xpTitle: {
      color: Colors.text,

      fontSize: 13,

      fontWeight: "900",
    },

    xpValue: {
      color: Colors.secondary,

      fontSize: 20,

      fontWeight: "900",
    },

    progressOuter: {
      height: 9,

      marginTop: 12,

      overflow: "hidden",

      borderRadius: 999,

      backgroundColor:
        Colors.primarySoft,
    },

    progressInner: {
      height: "100%",

      backgroundColor:
        Colors.accent,
    },

    nextLevel: {
      marginTop: 7,

      color: Colors.textMuted,

      fontSize: 9,
    },

    summaryRow: {
      flexDirection: "row",

      gap: 9,

      marginTop: 14,
    },

    summary: {
      flex: 1,

      paddingVertical: 14,

      alignItems: "center",

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.surface,
    },

    summaryValue: {
      marginTop: 4,

      color: Colors.text,

      fontSize: 19,

      fontWeight: "900",
    },

    summaryLabel: {
      color: Colors.textMuted,

      fontSize: 8,

      fontWeight: "700",
    },

    sectionTitle: {
      marginTop: 25,

      marginBottom: 12,

      color: Colors.text,

      fontSize: 17,

      fontWeight: "900",
    },

    units: {
      gap: 10,
    },

    unitCard: {
      padding: 16,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.surface,
    },

    unitHeader: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",
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

      fontSize: 14,

      fontWeight: "900",
    },

    unitCount: {
      color: Colors.primary,

      fontSize: 10,

      fontWeight: "900",
    },

    unitProgress: {
      marginTop: 12,

      height: 7,

      borderRadius: 999,

      overflow: "hidden",

      backgroundColor:
        Colors.primarySoft,
    },

    unitProgressInner: {
      height: "100%",

      backgroundColor:
        Colors.teal,
    },

    resetButton: {
      marginTop: 24,

      minHeight: 52,

      flexDirection: "row",

      gap: 7,

      alignItems: "center",

      justifyContent: "center",

      borderRadius: 15,

      borderWidth: 1,

      borderColor: "#E6BDB9",

      backgroundColor: "#FDEDEC",
    },

    resetButtonText: {
      color: Colors.error,

      fontSize: 12,

      fontWeight: "900",
    },

    accountCard: {
      marginTop: 14,

      padding: 16,

      borderRadius: 18,

      borderWidth: 1,

      borderColor: "#E6BDB9",

      backgroundColor: Colors.surface,
    },

    accountCopy: {
      marginBottom: 13,
    },

    accountTitle: {
      color: Colors.text,

      fontSize: 14,

      fontWeight: "900",
    },

    accountDescription: {
      marginTop: 4,

      color: Colors.textMuted,

      fontSize: 10,

      lineHeight: 15,
    },

    deleteAccountButton: {
      minHeight: 48,

      paddingHorizontal: 14,

      borderRadius: 14,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 8,

      backgroundColor: Colors.error,
    },

    deleteAccountButtonPressed: {
      opacity: 0.86,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    deleteAccountButtonDisabled: {
      opacity: 0.55,
    },

    deleteAccountButtonText: {
      color: Colors.surface,

      fontSize: 11,

      fontWeight: "900",

      letterSpacing: 0.4,
    },
  });
