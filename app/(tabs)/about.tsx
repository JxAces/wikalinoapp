import { useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/landing")}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Tungkol sa WIKALINO</Text>

            <Text style={styles.text}>
              Ang WIKALINO ay isang offline learning app na tumutulong sa mga
              mag-aaral sa Baitang 9 upang mapalalim ang kanilang kaalaman sa
              Filipino sa pamamagitan ng mga interaktibong hamon.
            </Text>

            <Text style={styles.text}>
              Layunin nito na gawing masaya at madaling matutunan ang wika sa
              pamamagitan ng mga gawain tulad ng pagpili ng tamang sagot,
              pagsagot, at pag-aayos ng mga salita.
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
    flex: 1,
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
    backgroundColor: "rgba(86, 52, 22, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#fff6d5",
    fontSize: 22,
    fontWeight: "900",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: "rgba(255, 245, 220, 0.95)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#c8a96a",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    color: "#5a3d1e",
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 10,
    color: "#5a3d1e",
  },

  footer: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: "#7a5a2c",
  },
});
