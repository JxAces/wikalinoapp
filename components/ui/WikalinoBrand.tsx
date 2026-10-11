import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { AppTheme } from "@/constants/colors";

type Props = { color?: string; style?: StyleProp<TextStyle> };

/** Shared wordmark for screen headers, including full-screen readers and lineups. */
export function WikalinoBrand({ color = AppTheme.primary, style }: Props) {
  return <Text accessibilityRole="header" style={[styles.brand, { color }, style]}>WIKALINO</Text>;
}

const styles = StyleSheet.create({
  brand: { fontSize: 18, lineHeight: 24, fontWeight: "900", letterSpacing: 2.4 },
});
