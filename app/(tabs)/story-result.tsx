import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useEffect,
} from "react";

import {
  Pressable,
  ScrollView,
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
  getNextStory,
  getStoryById,
} from "../../data/stories";

import {
  useUserStore,
} from "../../store/useUserStore";

import {
  StoryRewardVisual,
} from "../../components/three/integrations/StoryRewardVisual";

export default function StoryResultScreen() {
  const { storyId } =
    useLocalSearchParams<{
      storyId: string;
    }>();

  const story =
    getStoryById(
      String(storyId),
    );

  const activityResults =
    useUserStore(
      (state) =>
        state.activityResults,
    );

  const completedStoryIds =
    useUserStore(
      (state) =>
        state.completedStoryIds,
    );

  const completeStory =
    useUserStore(
      (state) =>
        state.completeStory,
    );

  const getStoryStars =
    useUserStore(
      (state) =>
        state.getStoryStars,
    );

  const allCompleted =
    story?.activities.every(
      (activity) =>
        !!activityResults[
          activity.id
        ],
    ) ?? false;

  const alreadyCompleted =
    story
      ? completedStoryIds.includes(
          story.id,
        )
      : false;

  useEffect(() => {
    if (
      story &&
      allCompleted &&
      !alreadyCompleted
    ) {
      completeStory(story.id);
    }
  }, [
    allCompleted,
    alreadyCompleted,
    completeStory,
    story,
  ]);

  if (!story) {
    return null;
  }

  const stars =
    getStoryStars(story.id);

  const activityXp =
    story.activities.reduce(
      (sum, activity) =>
        sum +
        (activityResults[
          activity.id
        ]?.xpEarned ?? 0),
      0,
    );

  const totalStoryXp =
    story.readingXp +
    activityXp +
    story.completionXp;

  const nextStory =
    getNextStory(story.id);

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
        <StoryRewardVisual />

        <Text
          style={styles.eyebrow}
        >
          KWENTO COMPLETE
        </Text>

        <Text style={styles.title}>
          Mahusay!
        </Text>

        <Text
          style={styles.storyTitle}
        >
          {story.title}
        </Text>

        <View style={styles.stars}>
          {[0, 1, 2].map(
            (item) => (
              <MaterialCommunityIcons
                key={item}
                name={
                  item < stars
                    ? "star"
                    : "star-outline"
                }
                size={38}
                color={
                  Colors.accent
                }
              />
            ),
          )}
        </View>

        <View
          style={styles.xpCard}
        >
          <Text
            style={
              styles.xpLabel
            }
          >
            NAKUHANG XP
          </Text>

          <Text
            style={
              styles.xpValue
            }
          >
            +{totalStoryXp}
          </Text>
        </View>

        <View
          style={
            styles.collectibleCard
          }
        >
          <View
            style={
              styles.collectibleIcon
            }
          >
            <MaterialCommunityIcons
              name={
                story.collectible
                  .icon as any
              }
              size={30}
              color={
                Colors.primary
              }
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.unlockedLabel
              }
            >
              BAGONG KAALAMAN
            </Text>

            <Text
              style={
                styles.collectibleTitle
              }
            >
              {
                story.collectible
                  .title
              }
            </Text>

            <Text
              style={
                styles.collectibleText
              }
            >
              {
                story.collectible
                  .description
              }
            </Text>
          </View>
        </View>

        <Pressable
          style={
            styles.primaryButton
          }
          onPress={() =>
            router.replace(
              "/landing",
            )
          }
        >
          <MaterialCommunityIcons
            name="map-marker-path"
            size={20}
            color={Colors.surface}
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            Bumalik sa Landas
          </Text>
        </Pressable>

        {nextStory && (
          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              router.replace({
                pathname: "/story",

                params: {
                  storyId:
                    nextStory.id,
                },
              })
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Tingnan ang Susunod na
              Kwento
            </Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={19}
              color={
                Colors.primary
              }
            />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
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
      flexGrow: 1,

      alignItems: "center",

      paddingHorizontal: 22,

      paddingTop: 50,

      paddingBottom: 30,
    },

    eyebrow: {
      marginTop: 24,

      color: Colors.secondary,

      fontSize: 9,

      fontWeight: "900",

      letterSpacing: 1.5,
    },

    title: {
      marginTop: 6,

      color: Colors.text,

      fontSize: 32,

      fontWeight: "900",
    },

    storyTitle: {
      marginTop: 4,

      color: Colors.textMuted,

      fontSize: 14,

      fontWeight: "700",
    },

    stars: {
      marginTop: 18,

      flexDirection: "row",

      gap: 4,
    },

    xpCard: {
      width: "100%",

      marginTop: 22,

      padding: 17,

      borderRadius: 19,

      alignItems: "center",

      backgroundColor:
        Colors.primary,
    },

    xpLabel: {
      color:
        "rgba(255,255,255,0.65)",

      fontSize: 8,

      fontWeight: "900",

      letterSpacing: 1,
    },

    xpValue: {
      marginTop: 3,

      color: Colors.accent,

      fontSize: 28,

      fontWeight: "900",
    },

    collectibleCard: {
      width: "100%",

      marginTop: 15,

      padding: 16,

      borderRadius: 20,

      flexDirection: "row",

      gap: 12,

      backgroundColor:
        Colors.surface,

      borderWidth: 1,

      borderColor:
        Colors.border,
    },

    collectibleIcon: {
      width: 55,
      height: 55,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        Colors.primarySoft,
    },

    unlockedLabel: {
      color: Colors.secondary,

      fontSize: 8,

      fontWeight: "900",

      letterSpacing: 1,
    },

    collectibleTitle: {
      marginTop: 3,

      color: Colors.text,

      fontSize: 15,

      fontWeight: "900",
    },

    collectibleText: {
      marginTop: 4,

      color: Colors.textMuted,

      fontSize: 10,

      lineHeight: 15,
    },

    primaryButton: {
      width: "100%",

      marginTop: 24,

      minHeight: 56,

      borderRadius: 16,

      flexDirection: "row",

      gap: 7,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        Colors.primary,
    },

    primaryButtonText: {
      color: Colors.surface,

      fontSize: 14,

      fontWeight: "900",
    },

    secondaryButton: {
      width: "100%",

      marginTop: 10,

      minHeight: 54,

      borderRadius: 16,

      flexDirection: "row",

      gap: 7,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        Colors.primarySoft,
    },

    secondaryButtonText: {
      color: Colors.primary,

      fontSize: 13,

      fontWeight: "900",
    },
  });
