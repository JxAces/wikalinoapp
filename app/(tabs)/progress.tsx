import { useRouter } from "expo-router";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markahanUnits } from "../../data/markahan";
import { useUserStore } from "../../store/useUserStore";

type ProgressCardProps = {
  title: string;
  subtitle: string;
  completedText: string;
  statusText: string;
  color: string;
  locked?: boolean;
  completed?: boolean;
  onPress: () => void;
};

function ProgressCard({
  title,
  subtitle,
  completedText,
  statusText,
  color,
  locked = false,
  completed = false,
  onPress,
}: ProgressCardProps) {
  return (
    <Pressable
      onPress={!locked ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: locked ? "#d9d2c2" : "#fff7e8",
          opacity: pressed ? 0.92 : 1,
          borderColor: locked ? "#b8ad9a" : color,
        },
      ]}
    >
      <View
        style={[
          styles.cardTopAccent,
          { backgroundColor: locked ? "#bdb3a4" : color },
        ]}
      />

      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            locked
              ? styles.statusLocked
              : completed
                ? styles.statusCompleted
                : styles.statusActive,
          ]}
        >
          <Text style={styles.statusBadgeText}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progreso</Text>
        <Text style={styles.progressValue}>{completedText}</Text>
      </View>
    </Pressable>
  );
}

export default function ProgressScreen() {
  const router = useRouter();

  const getCompletedCountByMarkahan = useUserStore(
    (state) => state.getCompletedCountByMarkahan,
  );
  const clearProgress = useUserStore((state) => state.clearProgress);

  const colors = ["#67c23a", "#f0b429", "#e67e22", "#5dade2"];

  const progressData = markahanUnits.map((item, index) => {
    const done = getCompletedCountByMarkahan(item.markahan);

    const previousCompleted =
      index === 0
        ? true
        : getCompletedCountByMarkahan(markahanUnits[index - 1].markahan) >= 4;

    const isCompleted = done >= 4;
    const isLocked = !!item.isLocked || !previousCompleted;

    let statusText = "Magpatuloy";
    if (isLocked) {
      statusText = "Naka-lock";
    } else if (isCompleted) {
      statusText = "Tapos na";
    }

    return {
      ...item,
      done,
      isCompleted,
      isLocked,
      statusText,
      color: colors[index % colors.length],
    };
  });

  const totalDone = progressData.reduce((sum, item) => sum + item.done, 0);
  const totalAll = progressData.length * 4;

  const handleReset = () => {
    Alert.alert(
      "I-reset ang Progress",
      "Sigurado ka bang gusto mong burahin ang lahat ng progress?",
      [
        { text: "Kanselahin", style: "cancel" },
        {
          text: "I-reset",
          style: "destructive",
          onPress: clearProgress,
        },
      ],
    );
  };

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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.headerCard}>
              <Text style={styles.headerSmall}>Aking Pag-unlad</Text>
              <Text style={styles.headerTitle}>Tingnan ang iyong progreso</Text>
              <Text style={styles.headerSubtext}>
                Piliin ang markahan para makita at ipagpatuloy ang mga hamon.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Natapos</Text>
                <Text style={styles.summaryValue}>{totalDone}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Kabuuang Hamon</Text>
                <Text style={styles.summaryValue}>{totalAll}</Text>
              </View>
            </View>

            <View style={styles.cardsList}>
              {progressData.map((item) => (
                <ProgressCard
                  key={item.id}
                  title={item.title}
                  subtitle={`Markahan ${item.markahan}`}
                  completedText={`${item.done}/4 natapos`}
                  statusText={item.statusText}
                  color={item.color}
                  locked={item.isLocked}
                  completed={item.isCompleted}
                  onPress={() =>
                    router.push({
                      pathname: "/challenges",
                      params: { markahan: String(item.markahan) },
                    })
                  }
                />
              ))}
            </View>

            <Pressable style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>I-reset ang Progress</Text>
            </Pressable>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },

  topBar: {
    marginBottom: 14,
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

  scrollContent: {
    paddingBottom: 24,
  },

  headerCard: {
    backgroundColor: "#39bf18",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: "#2d9813",
    marginBottom: 16,
    elevation: 4,
  },

  headerSmall: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },

  headerSubtext: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255,245,220,0.96)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ccb07a",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7a5b2c",
    marginBottom: 6,
    textAlign: "center",
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4f9e3f",
  },

  cardsList: {
    gap: 14,
  },

  card: {
    borderRadius: 20,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 4,
  },

  cardTopAccent: {
    height: 10,
    width: "100%",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },

  cardTitleWrap: {
    flex: 1,
  },

  cardSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a3d",
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#5a3d1e",
  },

  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statusActive: {
    backgroundColor: "#dff5d8",
    borderWidth: 1,
    borderColor: "#79bf62",
  },

  statusCompleted: {
    backgroundColor: "#fff1b8",
    borderWidth: 1,
    borderColor: "#e0b100",
  },

  statusLocked: {
    backgroundColor: "#ece7df",
    borderWidth: 1,
    borderColor: "#b9ae9f",
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5a3d1e",
  },

  progressRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7a5b2c",
  },

  progressValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4f9e3f",
  },

  resetButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#c0392b",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  resetButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});
