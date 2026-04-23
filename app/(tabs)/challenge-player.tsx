import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Challenge,
  formatChallengeType,
  getChallengeById,
  getChallengesByMarkahan,
} from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function renderDifficultyStars(difficulty: 1 | 2 | 3) {
  return "★".repeat(difficulty) + "☆".repeat(3 - difficulty);
}

function isCorrectAnswer(
  challenge: Challenge,
  userAnswer: string | boolean | string[],
) {
  switch (challenge.type) {
    case "multiple_choice":
    case "identification":
      return (
        normalizeText(String(userAnswer)) === normalizeText(challenge.answer)
      );

    case "true_false":
      return userAnswer === challenge.answer;

    case "arrange":
      return JSON.stringify(userAnswer) === JSON.stringify(challenge.answer);

    default:
      return false;
  }
}

export default function ChallengePlayerScreen() {
  const router = useRouter();
  const { markahan, challengeId, challengeIndex } = useLocalSearchParams<{
    markahan: string;
    challengeId: string;
    challengeIndex: string;
  }>();

  const markahanNumber = Number(markahan);
  const challengeIndexNumber = Number(challengeIndex);

  const challenge = useMemo(() => {
    if (!markahanNumber || !challengeId) return undefined;
    return getChallengeById(markahanNumber, String(challengeId));
  }, [markahanNumber, challengeId]);

  const allChallenges = useMemo(() => {
    if (!markahanNumber) return [];
    return getChallengesByMarkahan(markahanNumber);
  }, [markahanNumber]);

  const setLastPlayed = useUserStore((state) => state.setLastPlayed);
  const completeChallenge = useUserStore((state) => state.completeChallenge);
  const isChallengeCompleted = useUserStore(
    (state) => state.isChallengeCompleted,
  );

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [boolValue, setBoolValue] = useState<boolean | null>(null);
  const [arrangedWords, setArrangedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    if (!challenge) return;

    setLastPlayed({
      markahan: markahanNumber,
      challengeId: challenge.id,
      challengeIndex: challengeIndexNumber,
      isCompleted: isChallengeCompleted(challenge.id),
    });

    setSelectedChoice(null);
    setInputValue("");
    setBoolValue(null);
    setArrangedWords([]);
    setSubmitted(false);
    setCorrect(false);
  }, [
    challenge?.id,
    markahanNumber,
    challengeIndexNumber,
    setLastPlayed,
    isChallengeCompleted,
    challenge,
  ]);

  if (!challenge) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Challenge not found.</Text>
      </View>
    );
  }

  const handleSubmit = () => {
    let userAnswer: string | boolean | string[] = "";

    switch (challenge.type) {
      case "multiple_choice":
        userAnswer = selectedChoice ?? "";
        break;
      case "identification":
        userAnswer = inputValue;
        break;
      case "true_false":
        userAnswer = boolValue ?? false;
        break;
      case "arrange":
        userAnswer = arrangedWords;
        break;
    }

    const result = isCorrectAnswer(challenge, userAnswer);

    setCorrect(result);
    setSubmitted(true);

    if (result) {
      completeChallenge({
        markahan: markahanNumber,
        challengeId: challenge.id,
        challengeIndex: challengeIndexNumber,
      });
    }
  };

  const handleNext = () => {
    const nextChallenge = allChallenges[challengeIndexNumber + 1];

    if (nextChallenge) {
      router.replace({
        pathname: "/challenge-player",
        params: {
          markahan: String(markahanNumber),
          challengeId: nextChallenge.id,
          challengeIndex: String(challengeIndexNumber + 1),
        },
      });
      return;
    }

    router.replace({
      pathname: "/result",
      params: {
        markahan: String(markahanNumber),
      },
    });
  };

  const handleRetry = () => {
    setSubmitted(false);
    setCorrect(false);
    setSelectedChoice(null);
    setInputValue("");
    setBoolValue(null);
    setArrangedWords([]);
  };

  const handleArrangeAdd = (word: string) => {
    if (submitted) return;
    setArrangedWords((prev) => [...prev, word]);
  };

  const handleArrangeReset = () => {
    if (submitted) return;
    setArrangedWords([]);
  };

  const getRemainingWords = () => {
    if (challenge.type !== "arrange") return [];

    const remaining = [...challenge.words];

    arrangedWords.forEach((usedWord) => {
      const index = remaining.findIndex((item) => item === usedWord);
      if (index !== -1) {
        remaining.splice(index, 1);
      }
    });

    return remaining;
  };

  const availableWords = getRemainingWords();

  const isSubmitDisabled = (() => {
    switch (challenge.type) {
      case "multiple_choice":
        return !selectedChoice;
      case "identification":
        return inputValue.trim().length === 0;
      case "true_false":
        return boolValue === null;
      case "arrange":
        return arrangedWords.length !== challenge.answer.length;
      default:
        return true;
    }
  })();

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
              onPress={() =>
                router.replace({
                  pathname: "/challenges",
                  params: { markahan: String(markahanNumber) },
                })
              }
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.progressText}>
              {challengeIndexNumber + 1}/{allChallenges.length}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{challenge.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.typeText}>
                {formatChallengeType(challenge.type)}
              </Text>
              <Text style={styles.difficultyText}>
                {renderDifficultyStars(challenge.difficulty)}
              </Text>
            </View>

            <Text style={styles.instruction}>{challenge.instruction}</Text>
            <Text style={styles.question}>{challenge.question}</Text>

            {challenge.type === "multiple_choice" && (
              <View style={styles.choicesWrap}>
                {challenge.choices.map((choice) => (
                  <Pressable
                    key={choice}
                    style={[
                      styles.choiceButton,
                      selectedChoice === choice && styles.choiceButtonSelected,
                    ]}
                    onPress={() => !submitted && setSelectedChoice(choice)}
                  >
                    <Text style={styles.choiceText}>{choice}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {challenge.type === "identification" && (
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                editable={!submitted}
                placeholder="Ilagay ang sagot dito..."
                placeholderTextColor="#9a855e"
              />
            )}

            {challenge.type === "true_false" && (
              <View style={styles.booleanWrap}>
                <Pressable
                  style={[
                    styles.booleanButton,
                    boolValue === true && styles.choiceButtonSelected,
                  ]}
                  onPress={() => !submitted && setBoolValue(true)}
                >
                  <Text style={styles.choiceText}>Tama</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.booleanButton,
                    boolValue === false && styles.choiceButtonSelected,
                  ]}
                  onPress={() => !submitted && setBoolValue(false)}
                >
                  <Text style={styles.choiceText}>Mali</Text>
                </Pressable>
              </View>
            )}

            {challenge.type === "arrange" && (
              <View>
                <View style={styles.arrangedBox}>
                  <Text style={styles.arrangedLabel}>Napiling ayos:</Text>
                  <Text style={styles.arrangedText}>
                    {arrangedWords.length
                      ? arrangedWords.join(" | ")
                      : "Wala pa"}
                  </Text>
                </View>

                <View style={styles.choicesWrap}>
                  {availableWords.map((word, index) => (
                    <Pressable
                      key={`${word}-${index}`}
                      style={styles.choiceButton}
                      onPress={() => handleArrangeAdd(word)}
                    >
                      <Text style={styles.choiceText}>{word}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={styles.resetButton}
                  onPress={handleArrangeReset}
                >
                  <Text style={styles.resetButtonText}>I-reset</Text>
                </Pressable>
              </View>
            )}

            {!submitted ? (
              <Pressable
                style={[
                  styles.submitButton,
                  isSubmitDisabled && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              >
                <Text style={styles.submitButtonText}>Suriin</Text>
              </Pressable>
            ) : (
              <View style={styles.resultWrap}>
                <Text
                  style={[
                    styles.resultText,
                    correct ? styles.correctText : styles.wrongText,
                  ]}
                >
                  {correct ? "Tamang sagot!" : "Maling sagot."}
                </Text>

                {correct ? (
                  <Pressable
                    style={[styles.submitButton, styles.nextButton]}
                    onPress={handleNext}
                  >
                    <Text style={styles.submitButtonText}>
                      {challengeIndexNumber + 1 < allChallenges.length
                        ? "Susunod"
                        : "Tingnan ang Resulta"}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.submitButton, styles.retryButton]}
                    onPress={handleRetry}
                  >
                    <Text style={styles.submitButtonText}>Subukan Muli</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7ecd6",
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5a3d1e",
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  topBar: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(86, 52, 22, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#fff6d5",
    fontSize: 24,
    fontWeight: "900",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#5a3d1e",
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(255,245,220,0.96)",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#ccb07a",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#5a3d1e",
    textAlign: "center",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7a5a2c",
    textTransform: "capitalize",
    flex: 1,
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#d4a017",
    letterSpacing: 1,
  },
  instruction: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7a5a2c",
    textAlign: "center",
    marginBottom: 14,
  },
  question: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5a3d1e",
    marginBottom: 18,
    textAlign: "center",
  },
  choicesWrap: {
    gap: 12,
  },
  choiceButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#fff7e4",
    borderWidth: 2,
    borderColor: "#ccb07a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceButtonSelected: {
    backgroundColor: "#d9f2c7",
    borderColor: "#4f9e3f",
  },
  choiceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#5a3d1e",
    textAlign: "center",
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ccb07a",
    backgroundColor: "#fff7e4",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#5a3d1e",
  },
  booleanWrap: {
    flexDirection: "row",
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#fff7e4",
    borderWidth: 2,
    borderColor: "#ccb07a",
    alignItems: "center",
    justifyContent: "center",
  },
  arrangedBox: {
    backgroundColor: "#fff7e4",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ccb07a",
    padding: 12,
    marginBottom: 12,
  },
  arrangedLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7a5a2c",
    marginBottom: 6,
  },
  arrangedText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5a3d1e",
  },
  resetButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#e7d2a2",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#a7844c",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: "#4b3416",
    fontWeight: "900",
  },
  submitButton: {
    marginTop: 20,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#8b4f1f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#fff6d5",
    fontSize: 16,
    fontWeight: "900",
  },
  resultWrap: {
    marginTop: 20,
    gap: 12,
  },
  resultText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
  },
  correctText: {
    color: "#2f8f2f",
  },
  wrongText: {
    color: "#c0392b",
  },
  nextButton: {
    backgroundColor: "#4f9e3f",
  },
  retryButton: {
    backgroundColor: "#f1bb2b",
  },
});
