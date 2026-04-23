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
import { useUserStore } from "../../store/useUserStore";

export default function LandingScreen() {
  const router = useRouter();
  const lastPlayed = useUserStore((state) => state.lastPlayed);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, floatAnim]);

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
        resizeMode="stretch"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.spacer} />

            <Animated.View
              style={[
                styles.animatedButtonsWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { translateY: floatAnim },
                  ],
                },
              ]}
            >
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
            </Animated.View>
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.homeButton, styles[`${variant}Button`]]}
      >
        <Text style={[styles.homeButtonText, styles[`${variant}ButtonText`]]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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

  animatedButtonsWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  buttonsWrapper: {
    gap: 14,
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
});
