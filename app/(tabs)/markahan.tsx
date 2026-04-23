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

type MarkahanCardProps = {
  title: string;
  color: string;
  locked?: boolean;
  completedText: string;
  onPress: () => void;
};

function MarkahanCard({
  title,
  color,
  locked = false,
  completedText,
  onPress,
}: MarkahanCardProps) {
  return (
    <Pressable
      onPress={!locked ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: locked ? "#d9d2c2" : color,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtext}>
        {locked ? "Naka-lock" : completedText}
      </Text>
    </Pressable>
  );
}

export default function MarkahanScreen() {
  const router = useRouter();
  const getCompletedCountByMarkahan = useUserStore(
    (state) => state.getCompletedCountByMarkahan,
  );

  const colors = ["#7ac74f", "#f3cc4d", "#e07a5f", "#8ecae6"];

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
            </View>
          </View>

          <View style={styles.grid}>
            {markahanUnits.map((item, index) => {
              const done = getCompletedCountByMarkahan(item.markahan);

              return (
                <MarkahanCard
                  key={item.id}
                  title={item.title}
                  color={colors[index % colors.length]}
                  locked={item.isLocked}
                  completedText={`${done}/4 natapos`}
                  onPress={() =>
                    router.push({
                      pathname: "/challenges",
                      params: { markahan: String(item.markahan) },
                    })
                  }
                />
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
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  card: {
    width: "47%",
    aspectRatio: 0.9,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: "rgba(121, 88, 45, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 4,
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
