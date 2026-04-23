import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatChallengeType,
  getChallengesByMarkahan,
  getMarkahanByNumber,
} from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

function renderDifficultyStars(difficulty: 1 | 2 | 3) {
  return "★".repeat(difficulty) + "☆".repeat(3 - difficulty);
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
              onPress={() => router.replace("/markahan")}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          </View>

          <View style={styles.titleWrapper}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>{unit?.title ?? "Mga Hamon"}</Text>
            </View>
          </View>

          <View style={styles.list}>
            {challenges.map((challenge, index) => {
              const done = isChallengeCompleted(challenge.id);

              return (
                <Pressable
                  key={challenge.id}
                  style={styles.challengeCard}
                  onPress={() =>
                    router.push({
                      pathname: "/challenge-player",
                      params: {
                        markahan: String(markahanNumber),
                        challengeId: challenge.id,
                        challengeIndex: String(index),
                      },
                    })
                  }
                >
                  <View style={styles.challengeTextWrap}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>

                    <Text style={styles.challengeType}>
                      {formatChallengeType(challenge.type)}
                    </Text>

                    <Text style={styles.challengeDifficulty}>
                      {renderDifficultyStars(challenge.difficulty)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.challengeStatus,
                      done && styles.challengeStatusDone,
                    ]}
                  >
                    {done ? "✓ Tapos" : `${index + 1}/4`}
                  </Text>
                </Pressable>
              );
            })}
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
    marginBottom: 28,
  },
  titleBadge: {
    minWidth: 260,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
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
  list: {
    gap: 14,
  },
  challengeCard: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "rgba(255,245,220,0.95)",
    borderWidth: 2,
    borderColor: "#ccb07a",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  challengeTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#5a3d1e",
    marginBottom: 4,
  },
  challengeType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7a5a2c",
    marginBottom: 4,
  },
  challengeDifficulty: {
    fontSize: 14,
    fontWeight: "900",
    color: "#d4a017",
    letterSpacing: 1,
  },
  challengeStatus: {
    fontSize: 14,
    fontWeight: "900",
    color: "#8b4f1f",
  },
  challengeStatusDone: {
    color: "#2f8f2f",
  },
});
