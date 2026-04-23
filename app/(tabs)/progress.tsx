import { useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markahanUnits } from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

export default function ProgressScreen() {
  const router = useRouter();
  const getCompletedCountByMarkahan = useUserStore(
    (state) => state.getCompletedCountByMarkahan,
  );
  const clearProgress = useUserStore((state) => state.clearProgress);

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

          <View style={styles.card}>
            <Text style={styles.title}>Aking Pag-unlad</Text>

            <View style={styles.list}>
              {markahanUnits.map((item) => {
                const done = getCompletedCountByMarkahan(item.markahan);

                return (
                  <View key={item.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowValue}>{done}/4</Text>
                  </View>
                );
              })}
            </View>

            <Pressable style={styles.resetButton} onPress={clearProgress}>
              <Text style={styles.resetButtonText}>I-reset ang Progress</Text>
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
    paddingHorizontal: 24,
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
  },
  backText: {
    color: "#fff6d5",
    fontSize: 24,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "rgba(255,245,220,0.96)",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#ccb07a",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#5a3d1e",
    textAlign: "center",
    marginBottom: 18,
  },
  list: {
    gap: 12,
  },
  row: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#fff7e4",
    borderWidth: 2,
    borderColor: "#ccb07a",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#5a3d1e",
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4f9e3f",
  },
  resetButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#c0392b",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});
