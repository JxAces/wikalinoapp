import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import {
  getChallengesByMarkahan,
  getMarkahanByNumber,
} from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

type ChallengeRowProps = {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  locked?: boolean;
  completed?: boolean;
  active?: boolean;
  index: number;
  onPress: () => void;
};

function ChallengeRow({
  title,
  subtitle,
  icon,
  color,
  locked = false,
  completed = false,
  active = false,
  index,
  onPress,
}: ChallengeRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: index * 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  useEffect(() => {
    if (!active || locked) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [active, locked, floatAnim]);

  const handlePressIn = () => {
    if (locked) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (locked) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.challengeRowWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { translateY: floatAnim }],
        },
      ]}
    >
      <View style={styles.challengeRow}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPress={!locked ? onPress : undefined}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.iconButton,
              {
                backgroundColor: locked ? Colors.locked : color,
                borderColor: locked ? Colors.locked : Colors.primary,
              },
              completed && styles.iconButtonCompleted,
              active && !locked && styles.iconButtonActive,
            ]}
          >
            <Text style={styles.iconText}>
              {locked ? "🔒" : completed ? "✓" : icon}
            </Text>
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={!locked ? onPress : undefined}
          style={[
            styles.lessonCard,
            locked && styles.lessonCardLocked,
            completed && styles.lessonCardCompleted,
            active && !locked && styles.lessonCardActive,
          ]}
        >
          <Text
            style={[styles.lessonTitle, locked && styles.lessonTitleLocked]}
          >
            {title}
          </Text>

          {!!subtitle && (
            <Text
              style={[
                styles.lessonSubtitle,
                locked && styles.lessonSubtitleLocked,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ChallengesScreen() {
  const router = useRouter();
  const { markahan } = useLocalSearchParams<{ markahan: string }>();

  const markahanNumber = Number(markahan);
  const unit = getMarkahanByNumber(markahanNumber);
  const challenges = getChallengesByMarkahan(markahanNumber);

  const isChallengeCompleted = useUserStore(
    (state) => state.isChallengeCompleted,
  );

  const lessonItems = useMemo(() => {
    return challenges.map((challenge, index) => {
      const completed = isChallengeCompleted(challenge.id);
      const previousCompleted =
        index === 0 ? true : isChallengeCompleted(challenges[index - 1].id);
      const locked = !previousCompleted;
      const active = !locked && !completed;

      const icons = ["⚑", "⚔", "🧩", "📖", "🎯", "✏"];
      const colors = [
        Colors.teal,
        "#78A85A",
        Colors.accent,
        "#5C91B8",
        Colors.secondary,
      ];

      return {
        ...challenge,
        completed,
        locked,
        active,
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
      };
    });
  }, [challenges, isChallengeCompleted]);

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/markahan")}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          </View>

          <View style={styles.screenCard}>
            <Text style={styles.markahanTitle}>
              {unit?.title ?? `Markahan ${markahanNumber}`}
            </Text>

            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>
                Unit 1: {unit?.title ?? `Markahan ${markahanNumber}`}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.pathArea}>
                <View style={styles.pathLine} />

                {lessonItems.map((item, index) => (
                  <View key={item.id} style={styles.lessonBlock}>
                    <ChallengeRow
                      index={index}
                      title={item.title}
                      subtitle={item.instruction}
                      icon={item.icon}
                      color={item.color}
                      locked={item.locked}
                      completed={item.completed}
                      active={item.active}
                      onPress={() =>
                        router.push({
                          pathname: "/challenge-player",
                          params: {
                            markahan: String(markahanNumber),
                            challengeId: item.id,
                            challengeIndex: String(index),
                          },
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.background,
    flex: 1,
  },

  backgroundImage: {
    opacity: 0.1,
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  topBar: {
    marginBottom: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  backText: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: "900",
  },

  screenCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    paddingTop: 18,
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  markahanTitle: {
    textAlign: "center",
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },

  unitBadge: {
    alignSelf: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    elevation: 4,
  },

  unitBadgeText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  scrollContent: {
    paddingBottom: 28,
  },

  pathArea: {
    position: "relative",
    paddingLeft: 8,
    paddingRight: 6,
    paddingTop: 8,
    paddingBottom: 12,
  },

  pathLine: {
    position: "absolute",
    left: 34,
    top: 20,
    bottom: 20,
    width: 8,
    borderRadius: 999,
    backgroundColor: Colors.border,
  },

  lessonBlock: {
    marginBottom: 18,
  },

  challengeRowWrap: {
    width: "100%",
  },

  challengeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 5,
  },

  iconButtonActive: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  iconButtonCompleted: {
    backgroundColor: Colors.success,
  },

  iconText: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.surface,
  },

  lessonCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    elevation: 2,
  },

  lessonCardActive: {
    backgroundColor: Colors.tealSoft,
    borderColor: Colors.teal,
  },

  lessonCardCompleted: {
    backgroundColor: Colors.tealSoft,
    borderColor: Colors.success,
  },

  lessonCardLocked: {
    backgroundColor: Colors.lockedSoft,
    borderColor: Colors.border,
  },

  lessonTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
  },

  lessonTitleLocked: {
    color: Colors.locked,
  },

  lessonSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },

  lessonSubtitleLocked: {
    color: Colors.locked,
  },
});
