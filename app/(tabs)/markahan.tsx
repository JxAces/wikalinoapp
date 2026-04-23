import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markahanUnits } from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

type MarkahanCardProps = {
  title: string;
  color: string;
  locked?: boolean;
  completed?: boolean;
  completedText: string;
  statusText: string;
  delay: number;
  onPress: () => void;
};

function MarkahanCard({
  title,
  color,
  locked = false,
  completed = false,
  completedText,
  statusText,
  delay,
  onPress,
}: MarkahanCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, translateY]);

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
        styles.cardOuter,
        {
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={!locked ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: locked ? "#d9d2c2" : color,
            borderColor: locked ? "#b8ad9a" : "rgba(121, 88, 45, 0.35)",
          },
        ]}
      >
        <View
          style={[
            styles.statusBadge,
            locked
              ? styles.lockedBadge
              : completed
                ? styles.completedBadge
                : styles.activeBadge,
          ]}
        >
          <Text style={styles.statusBadgeText}>{statusText}</Text>
        </View>

        <Text style={styles.cardEmoji}>
          {locked ? "🔒" : completed ? "⭐" : "📘"}
        </Text>

        <Text style={styles.cardTitle}>{title}</Text>

        <Text style={styles.cardSubtext}>{completedText}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function MarkahanScreen() {
  const router = useRouter();
  const getCompletedCountByMarkahan = useUserStore(
    (state) => state.getCompletedCountByMarkahan,
  );

  const colors = ["#7ac74f", "#f3cc4d", "#e07a5f", "#8ecae6"];

  const markahanProgress = markahanUnits.map((item, index) => {
    const done = getCompletedCountByMarkahan(item.markahan);

    const previousMarkahanCompleted =
      index === 0
        ? true
        : getCompletedCountByMarkahan(markahanUnits[index - 1].markahan) >= 4;

    const locked = !previousMarkahanCompleted;
    const completed = done >= 4;

    let statusText = "Magpatuloy";
    if (locked) {
      statusText = "Naka-lock";
    } else if (completed) {
      statusText = "Tapos na";
    }

    return {
      ...item,
      done,
      locked,
      completed,
      statusText,
    };
  });

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/landing")}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          </View>

          <View style={styles.titleWrapper}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>Piliin ang Markahan</Text>
              <Text style={styles.titleSubtext}>
                Tapusin muna ang naunang markahan bago ma-unlock ang susunod.
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            {markahanProgress.map((item, index) => (
              <MarkahanCard
                key={item.id}
                title={item.title}
                color={colors[index % colors.length]}
                locked={item.locked}
                completed={item.completed}
                completedText={`${item.done}/4 natapos`}
                statusText={item.statusText}
                delay={index * 120}
                onPress={() =>
                  router.push({
                    pathname: "/challenges",
                    params: { markahan: String(item.markahan) },
                  })
                }
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
  },

  topBar: {
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(86, 52, 22, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  backText: {
    color: "#fff6d5",
    fontSize: 24,
    fontWeight: "900",
  },

  titleWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },

  titleBadge: {
    width: "100%",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#8b4f1f",
    borderWidth: 3,
    borderColor: "#6e3d15",
    elevation: 4,
  },

  titleText: {
    textAlign: "center",
    color: "#fff6d5",
    fontSize: 22,
    fontWeight: "900",
  },

  titleSubtext: {
    textAlign: "center",
    color: "#fff0cc",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 18,
  },

  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },

  cardOuter: {
    width: "47%",
  },

  card: {
    width: "100%",
    aspectRatio: 0.9,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 4,
    position: "relative",
  },

  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  completedBadge: {
    backgroundColor: "rgba(255,245,157,0.95)",
  },

  lockedBadge: {
    backgroundColor: "rgba(110,98,82,0.22)",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#5a3d1e",
  },

  cardEmoji: {
    fontSize: 34,
    marginTop: 8,
  },

  cardTitle: {
    textAlign: "center",
    color: "#5a3d1e",
    fontSize: 18,
    fontWeight: "900",
  },

  cardSubtext: {
    textAlign: "center",
    color: "#5a3d1e",
    fontSize: 14,
    fontWeight: "700",
  },
});
