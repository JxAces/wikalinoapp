import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MarkahanCardProps = {
  title: string;
  color: string;
  icon: any;
  locked?: boolean;
  onPress: () => void;
};

function MarkahanCard({
  title,
  color,
  icon,
  locked = false,
  onPress,
}: MarkahanCardProps) {
  return (
    <Pressable
      onPress={!locked ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: locked ? "#ddd" : color,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={styles.cardTitle}>{title}</Text>

      {locked ? <Ionicons name="lock-closed" size={42} color="#888" /> : icon}
    </Pressable>
  );
}

export default function MarkahanScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/pageBackground/ThirdPage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/landing")}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          </View>

          {/* Title */}
          <View style={styles.titleWrapper}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>Piliin ang Markahan</Text>
            </View>
          </View>

          {/* Cards */}
          <View style={styles.grid}>
            <MarkahanCard
              title="Unang Markahan"
              color="#7ac74f"
              icon={<FontAwesome5 name="flag" size={40} color="#fff" />}
              onPress={() => router.push("/unit")}
            />

            <MarkahanCard
              title="Ikalawang Markahan"
              color="#f4a261"
              icon={<FontAwesome5 name="flag" size={40} color="#fff" />}
              locked
              onPress={() => {}}
            />

            <MarkahanCard
              title="Ikatlong Markahan"
              color="#e76f51"
              icon={<FontAwesome5 name="flag" size={40} color="#fff" />}
              locked
              onPress={() => {}}
            />

            <MarkahanCard
              title="Ikaapat na Markahan"
              color="#4dabf7"
              icon={<FontAwesome5 name="flag" size={40} color="#fff" />}
              locked
              onPress={() => {}}
            />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
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
    aspectRatio: 0.85,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: "rgba(121, 88, 45, 0.35)",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  cardTitle: {
    textAlign: "center",
    color: "#5a3d1e",
    fontSize: 18,
    fontWeight: "900",
  },
});
