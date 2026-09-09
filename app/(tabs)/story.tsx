import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { getStoryById } from "../../data/stories";
import { useUserStore } from "../../store/useUserStore";

export default function StoryScreen() {
  const { storyId } =
    useLocalSearchParams<{
      storyId: string;
    }>();

  const story =
    getStoryById(
      String(storyId),
    );

  const sceneIndexes =
    useUserStore(
      (state) =>
        state.storySceneIndexes,
    );

  const setStoryScene =
    useUserStore(
      (state) =>
        state.setStoryScene,
    );

  const completeStoryReading =
    useUserStore(
      (state) =>
        state.completeStoryReading,
    );

  const [sceneIndex, setSceneIndex] =
    useState(0);

  const [
    predictionChoice,
    setPredictionChoice,
  ] =
    useState<string | null>(null);

  useEffect(() => {
    if (!story) {
      return;
    }

    const saved =
      sceneIndexes[story.id] ?? 0;

    setSceneIndex(
      Math.min(
        saved,
        story.scenes.length - 1,
      ),
    );
  }, [
    sceneIndexes,
    story?.id,
  ]);

  useEffect(() => {
    setPredictionChoice(null);
  }, [sceneIndex]);

  if (!story) {
    return (
      <View
        style={styles.notFound}
      >
        <Text>
          Hindi makita ang kwento.
        </Text>
      </View>
    );
  }

  const scene =
    story.scenes[sceneIndex];

  const lastScene =
    sceneIndex ===
    story.scenes.length - 1;

  const canContinue =
    !scene.prediction ||
    predictionChoice !== null;

  const handleNext = () => {
    if (!canContinue) {
      return;
    }

    Haptics.selectionAsync();

    if (!lastScene) {
      const next =
        sceneIndex + 1;

      setSceneIndex(next);

      setStoryScene(
        story.id,
        next,
      );

      return;
    }

    completeStoryReading(
      story.id,
    );

    router.replace({
      pathname:
        "/activity-player",

      params: {
        storyId: story.id,
        activityIndex: "0",
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        {/* TOP BAR */}

        <Animated.View
          entering={FadeInUp}
          style={styles.topBar}
        >
          <Pressable
            onPress={() =>
              router.replace(
                "/landing",
              )
            }
            style={
              styles.backButton
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={21}
              color={Colors.text}
            />
          </Pressable>

          <View
            style={
              styles.sceneBadge
            }
          >
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={13}
              color={
                Colors.primary
              }
            />

            <Text
              style={
                styles.sceneBadgeText
              }
            >
              {sceneIndex + 1}/
              {story.scenes.length}
            </Text>
          </View>
        </Animated.View>

        {/* PROGRESS */}

        <View
          style={
            styles.progressOuter
          }
        >
          <View
            style={[
              styles.progressInner,

              {
                width: `${
                  ((sceneIndex + 1) /
                    story.scenes.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* STORY COVER */}

          <Animated.View
            entering={FadeInDown
              .duration(500)}
            style={
              styles.coverCard
            }
          >
            <Image
              source={
                story.coverImage
              }
              style={
                styles.coverImage
              }
            />

            <View
              style={
                styles.coverOverlay
              }
            />

            <View
              style={
                styles.coverContent
              }
            >
              <Text
                style={
                  styles.episodeLabel
                }
              >
                KWENTO {story.order}
              </Text>

              <Text
                style={
                  styles.coverTitle
                }
              >
                {story.title}
              </Text>

              <Text
                style={
                  styles.coverSubtitle
                }
              >
                {story.subtitle}
              </Text>
            </View>
          </Animated.View>

          {/* SCENE */}

          <Animated.View
            key={scene.id}
            entering={FadeInDown
              .duration(350)}
          >
            <Text
              style={
                styles.sceneEyebrow
              }
            >
              EKSENA {sceneIndex + 1}
            </Text>

            <Text
              style={
                styles.sceneTitle
              }
            >
              {scene.title}
            </Text>

            <View
              style={
                styles.paperCard
              }
            >
              {scene.paragraphs.map(
                (
                  paragraph,
                  index,
                ) => (
                  <Text
                    key={index}
                    style={
                      styles.paragraph
                    }
                  >
                    {paragraph}
                  </Text>
                ),
              )}
            </View>

            {scene.prediction && (
              <View
                style={
                  styles.predictionCard
                }
              >
                <View
                  style={
                    styles.predictionHeader
                  }
                >
                  <MaterialCommunityIcons
                    name="thought-bubble-outline"
                    size={24}
                    color={
                      Colors.secondary
                    }
                  />

                  <Text
                    style={
                      styles.predictionLabel
                    }
                  >
                    ANO SA TINGIN MO?
                  </Text>
                </View>

                <Text
                  style={
                    styles.predictionQuestion
                  }
                >
                  {
                    scene.prediction
                      .question
                  }
                </Text>

                <View
                  style={
                    styles.choiceList
                  }
                >
                  {scene.prediction.choices.map(
                    (choice) => {
                      const selected =
                        predictionChoice ===
                        choice;

                      return (
                        <Pressable
                          key={
                            choice
                          }
                          onPress={() => {
                            Haptics.selectionAsync();

                            setPredictionChoice(
                              choice,
                            );
                          }}
                          style={[
                            styles.choice,

                            selected &&
                              styles.choiceSelected,
                          ]}
                        >
                          <View
                            style={[
                              styles.choiceDot,

                              selected &&
                                styles.choiceDotSelected,
                            ]}
                          />

                          <Text
                            style={[
                              styles.choiceText,

                              selected &&
                                styles.choiceTextSelected,
                            ]}
                          >
                            {choice}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>

                {predictionChoice && (
                  <Animated.View
                    entering={FadeIn}
                    style={
                      styles.revealCard
                    }
                  >
                    <View
                      style={
                        styles.revealIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="book-open-variant"
                        size={18}
                        color={
                          Colors.teal
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.revealLabel
                        }
                      >
                        ANO ANG
                        NANGYARI?
                      </Text>

                      <Text
                        style={
                          styles.revealText
                        }
                      >
                        {
                          scene
                            .prediction
                            .reveal
                        }
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* FOOTER */}

        <View
          style={styles.footer}
        >
          <Pressable
            disabled={!canContinue}
            onPress={handleNext}
            style={[
              styles.nextButton,

              !canContinue &&
                styles.nextButtonDisabled,
            ]}
          >
            <Text
              style={
                styles.nextButtonText
              }
            >
              {lastScene
                ? "Harapin ang mga Hamon"
                : "Magpatuloy"}
            </Text>

            <MaterialCommunityIcons
              name={
                lastScene
                  ? "sword-cross"
                  : "arrow-right"
              }
              size={19}
              color={
                Colors.surface
              }
            />
          </Pressable>
        </View>
      </View>
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
      flex: 1,
    },

    notFound: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",
    },

    topBar: {
      paddingHorizontal: 20,
      paddingTop: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    backButton: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        Colors.surface,

      borderWidth: 1,

      borderColor:
        Colors.border,
    },

    sceneBadge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      paddingHorizontal: 11,
      paddingVertical: 7,

      borderRadius: 999,

      backgroundColor:
        Colors.primarySoft,
    },

    sceneBadgeText: {
      color: Colors.primary,

      fontSize: 10,

      fontWeight: "900",
    },

    progressOuter: {
      marginHorizontal: 20,
      marginTop: 13,

      height: 7,

      borderRadius: 999,

      overflow: "hidden",

      backgroundColor:
        Colors.primarySoft,
    },

    progressInner: {
      height: "100%",

      borderRadius: 999,

      backgroundColor:
        Colors.secondary,
    },

    scrollContent: {
      paddingHorizontal: 20,

      paddingTop: 20,
      paddingBottom: 25,
    },

    coverCard: {
      height: 210,

      borderRadius: 24,

      overflow: "hidden",

      position: "relative",

      backgroundColor: "#222",
    },

    coverImage: {
      width: "100%",
      height: "100%",

      resizeMode: "cover",
    },

    coverOverlay: {
      position: "absolute",

      left: 0,
      right: 0,
      top: 0,
      bottom: 0,

      backgroundColor:
        "rgba(36,36,58,0.42)",
    },

    coverContent: {
      position: "absolute",

      left: 18,
      right: 18,
      bottom: 18,
    },

    episodeLabel: {
      color: Colors.accent,

      fontSize: 9,

      fontWeight: "900",

      letterSpacing: 1.4,
    },

    coverTitle: {
      marginTop: 4,

      color: Colors.surface,

      fontSize: 27,

      lineHeight: 31,

      fontWeight: "900",
    },

    coverSubtitle: {
      marginTop: 4,

      color:
        "rgba(255,255,255,0.75)",

      fontSize: 11,

      fontWeight: "700",
    },

    sceneEyebrow: {
      marginTop: 24,

      color: Colors.secondary,

      fontSize: 8,

      fontWeight: "900",

      letterSpacing: 1.4,
    },

    sceneTitle: {
      marginTop: 5,

      color: Colors.text,

      fontSize: 26,

      lineHeight: 31,

      fontWeight: "900",
    },

    paperCard: {
      marginTop: 15,

      padding: 20,

      borderRadius: 21,

      backgroundColor:
        Colors.surface,

      borderWidth: 1,

      borderColor:
        Colors.border,
    },

    paragraph: {
      marginBottom: 15,

      color: Colors.text,

      fontSize: 16,

      lineHeight: 27,
    },

    predictionCard: {
      marginTop: 16,

      padding: 18,

      borderRadius: 21,

      backgroundColor:
        Colors.secondarySoft,

      borderWidth: 1,

      borderColor: "#EAC7BB",
    },

    predictionHeader: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,
    },

    predictionLabel: {
      color: Colors.secondary,

      fontSize: 9,

      fontWeight: "900",

      letterSpacing: 1.2,
    },

    predictionQuestion: {
      marginTop: 10,

      color: Colors.text,

      fontSize: 16,

      lineHeight: 22,

      fontWeight: "800",
    },

    choiceList: {
      marginTop: 14,

      gap: 9,
    },

    choice: {
      minHeight: 50,

      flexDirection: "row",

      alignItems: "center",

      gap: 10,

      paddingHorizontal: 13,

      borderRadius: 14,

      backgroundColor:
        Colors.surface,

      borderWidth: 1,

      borderColor:
        Colors.border,
    },

    choiceSelected: {
      borderColor:
        Colors.primary,

      backgroundColor:
        Colors.primarySoft,
    },

    choiceDot: {
      width: 18,
      height: 18,

      borderRadius: 9,

      borderWidth: 2,

      borderColor:
        "#B9B7BF",
    },

    choiceDotSelected: {
      borderWidth: 5,

      borderColor:
        Colors.primary,
    },

    choiceText: {
      flex: 1,

      color: Colors.text,

      fontSize: 12,

      fontWeight: "700",
    },

    choiceTextSelected: {
      color: Colors.primary,
    },

    revealCard: {
      marginTop: 14,

      padding: 13,

      borderRadius: 15,

      flexDirection: "row",

      gap: 10,

      backgroundColor:
        Colors.surface,
    },

    revealIcon: {
      width: 37,
      height: 37,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        Colors.tealSoft,
    },

    revealLabel: {
      color: Colors.teal,

      fontSize: 8,

      fontWeight: "900",

      letterSpacing: 1,
    },

    revealText: {
      marginTop: 4,

      color: Colors.text,

      fontSize: 11,

      lineHeight: 17,
    },

    footer: {
      paddingHorizontal: 20,

      paddingTop: 11,
      paddingBottom: 16,

      backgroundColor:
        Colors.surface,

      borderTopWidth: 1,

      borderTopColor:
        Colors.border,
    },

    nextButton: {
      minHeight: 56,

      borderRadius: 16,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,

      backgroundColor:
        Colors.primary,
    },

    nextButtonDisabled: {
      opacity: 0.38,
    },

    nextButtonText: {
      color: Colors.surface,

      fontSize: 14,

      fontWeight: "900",
    },
  });