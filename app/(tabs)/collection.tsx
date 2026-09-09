import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Colors,
} from "../../constants/colors";

import {
  getAllCollectibles,
} from "../../data/stories";

import {
  useUserStore,
} from "../../store/useUserStore";

export default function CollectionScreen() {
  const unlocked =
    useUserStore(
      (state) =>
        state.unlockedCollectibleIds,
    );

  const collectibles =
    getAllCollectibles();

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        <Text
          style={styles.eyebrow}
        >
          WIKALINO
        </Text>

        <Text style={styles.title}>
          Koleksyon
        </Text>

        <Text
          style={styles.subtitle}
        >
          Kumpletuhin ang mga kwento
          upang makolekta ang mahahalagang
          konsepto sa Maikling Kwento.
        </Text>

        <View style={styles.grid}>
          {collectibles.map(
            (item) => {
              const isUnlocked =
                unlocked.includes(
                  item.id,
                );

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,

                    !isUnlocked &&
                      styles.cardLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.icon,

                      !isUnlocked &&
                        styles.iconLocked,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        isUnlocked
                          ? (item.icon as any)
                          : "lock-outline"
                      }
                      size={30}
                      color={
                        isUnlocked
                          ? Colors.primary
                          : "#85838B"
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.category
                    }
                  >
                    {isUnlocked
                      ? item.category
                      : "NAKA-LOCK"}
                  </Text>

                  <Text
                    style={[
                      styles.cardTitle,

                      !isUnlocked &&
                        styles.lockedText,
                    ]}
                  >
                    {isUnlocked
                      ? item.title
                      : "Hindi pa Nakukuha"}
                  </Text>

                  <Text
                    style={
                      styles.description
                    }
                  >
                    {isUnlocked
                      ? item.description
                      : `Tapusin ang "${item.storyTitle}" upang ma-unlock.`}
                  </Text>
                </View>
              );
            },
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    container: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 30,
    },

    eyebrow: {
      color: Colors.secondary,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    title: {
      marginTop: 5,
      color: Colors.text,
      fontSize: 30,
      fontWeight: "900",
    },

    subtitle: {
      marginTop: 8,
      color: Colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },

    grid: {
      marginTop: 22,
      gap: 13,
    },

    card: {
      padding: 18,

      borderRadius: 21,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.surface,
    },

    cardLocked: {
      backgroundColor:
        Colors.lockedSoft,
    },

    icon: {
      width: 56,
      height: 56,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        Colors.primarySoft,
    },

    iconLocked: {
      backgroundColor:
        "#DFDDE2",
    },

    category: {
      marginTop: 13,

      color: Colors.secondary,

      fontSize: 8,

      fontWeight: "900",

      letterSpacing: 1,
    },

    cardTitle: {
      marginTop: 4,

      color: Colors.text,

      fontSize: 18,

      fontWeight: "900",
    },

    lockedText: {
      color: "#77757D",
    },

    description: {
      marginTop: 7,

      color: Colors.textMuted,

      fontSize: 11,

      lineHeight: 17,
    },
  });