import { router } from "expo-router";
import { useEffect } from "react";
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const landingBackground = require("../../assets/images/pageBackground/LandingPage.png");

export default function LoadingScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/landing");
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground
      source={landingBackground}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <View style={styles.spacer} />

          <View style={styles.loadingWrap}>
            <Text style={styles.loadingTitle}>LOADING...</Text>
            <View style={styles.loadingBarOuter}>
              <View style={styles.loadingBarInner} />
            </View>
            <Text style={styles.loadingSubtitle}>
              Inihahanda ang WIKALINO...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#d7eefc",
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 28,
  },
  spacer: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: "center",
    paddingBottom: 36,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 14,
  },
  loadingBarOuter: {
    width: "82%",
    height: 22,
    backgroundColor: "#4a2a12",
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#ffffff",
    padding: 3,
    overflow: "hidden",
  },
  loadingBarInner: {
    width: "68%",
    height: "100%",
    backgroundColor: "#58c84d",
    borderRadius: 999,
  },
  loadingSubtitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
