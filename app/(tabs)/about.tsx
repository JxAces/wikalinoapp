import { useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/landing")}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Tungkol sa WIKALINO</Text>

            <Text style={styles.text}>
              Ang WIKALINO ay isang offline learning app para sa Baitang 9 na
              may mga hamon sa bawat markahan upang maging masaya at mas malinaw
              ang pagkatuto sa Filipino.
            </Text>

            <Text style={styles.footer}>© 2026 WIKALINO</Text>
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
  topBar: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: "900",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    color: Colors.primary,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 10,
    color: Colors.text,
  },
  footer: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
  },
});
