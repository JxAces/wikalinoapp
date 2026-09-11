import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import type { PlayerCharacterId } from "@/data/player-characters";

export type CharacterModelPreviewProps = {
  characterId: PlayerCharacterId;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CharacterModelPreview({ style }: CharacterModelPreviewProps) {
  return (
    <View style={[styles.root, style]}>
      <MaterialCommunityIcons color={Colors.secondary} name="account" size={54} />
      <Text style={styles.text}>3D preview ay para sa mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: "#A9D8C4",
    justifyContent: "center",
    minHeight: 220,
  },
  text: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
  },
});
