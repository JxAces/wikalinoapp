import { useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../store/useUserStore";

export default function LandingScreen() {
  const router = useRouter();
  const lastPlayed = useUserStore((state) => state.lastPlayed);

  const handleContinue = () => {
    if (lastPlayed && !lastPlayed.isCompleted) {
      router.push({
        pathname: "/challenge-player",
        params: {
          markahan: String(lastPlayed.markahan),
          challengeId: lastPlayed.challengeId,
          challengeIndex: String(lastPlayed.challengeIndex),
        },
      });
      return;
    }

    router.push("/markahan");
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/pageBackground/HomePage.png")}
        style={styles.background}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.spacer} />

            <View style={styles.buttonsWrapper}>
              <HomeButton
                label="MAGSIMULA"
                variant="green"
                onPress={() => router.push("/markahan")}
              />

              <HomeButton
                label="MAGPATULOY"
                variant="yellow"
                onPress={handleContinue}
              />

              <HomeButton
                label="AKING PAG-UNLAD"
                variant="blue"
                onPress={() => router.push("/progress")}
              />

              <HomeButton
                label="TUNGKOL SA APP"
                variant="beige"
                onPress={() => router.push("/about")}
              />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

type HomeButtonProps = {
  label: string;
  variant: "green" | "yellow" | "blue" | "beige";
  onPress: () => void;
};

function HomeButton({ label, variant, onPress }: HomeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.homeButton,
        styles[`${variant}Button`],
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.homeButtonText, styles[`${variant}ButtonText`]]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  spacer: {
    flex: 1,
  },

  buttonsWrapper: {
    gap: 14,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },

  homeButton: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  greenButton: {
    backgroundColor: "#4f9e3f",
    borderColor: "#2f6b24",
  },
  yellowButton: {
    backgroundColor: "#f1bb2b",
    borderColor: "#c98c06",
  },
  blueButton: {
    backgroundColor: "#2f5f97",
    borderColor: "#1c3f66",
  },
  beigeButton: {
    backgroundColor: "#e7d2a2",
    borderColor: "#a7844c",
  },

  homeButtonText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  greenButtonText: {
    color: "#ffffff",
  },
  yellowButtonText: {
    color: "#ffffff",
  },
  blueButtonText: {
    color: "#ffffff",
  },
  beigeButtonText: {
    color: "#4b3416",
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
