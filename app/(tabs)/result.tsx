import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getChallengesByMarkahan } from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

export default function ResultScreen() {
  const router = useRouter();
  const { markahan } = useLocalSearchParams<{ markahan: string }>();

  const markahanNumber = Number(markahan);
  const challenges = getChallengesByMarkahan(markahanNumber);
  const completedCount = useUserStore((state) =>
    state.getCompletedCountByMarkahan(markahanNumber),
  );

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Magaling!</Text>
            <Text style={styles.score}>
              Natapos mo ang {completedCount} sa {challenges.length} hamon
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => router.replace("/markahan")}
            >
              <Text style={styles.buttonText}>Bumalik sa Markahan</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.replace("/progress")}
            >
              <Text style={styles.secondaryButtonText}>Aking Pag-unlad</Text>
            </Pressable>
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(255,245,220,0.96)",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#ccb07a",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#5a3d1e",
    marginBottom: 12,
  },
  score: {
    fontSize: 18,
    fontWeight: "800",
    color: "#7a5a2c",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#4f9e3f",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#e7d2a2",
  },
  secondaryButtonText: {
    color: "#4b3416",
    fontWeight: "900",
    fontSize: 16,
  },
});
