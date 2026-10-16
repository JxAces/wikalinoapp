import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { AppTheme } from "@/constants/colors";
import { CLASS_CODE_MAX_LENGTH } from "@/utils/class-code";

export function ClassCodeField(props: TextInputProps) {
  return <View style={styles.field}>
    <Text style={styles.label}>CLASS CODE</Text>
    <TextInput
      accessibilityLabel="Class code"
      placeholder="Code mula sa iyong guro"
      placeholderTextColor={AppTheme.muted}
      selectionColor={AppTheme.primary}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      maxLength={CLASS_CODE_MAX_LENGTH}
      returnKeyType="done"
      {...props}
      style={[styles.input, props.style]}
    />
    <Text style={styles.hint}>Ilagay ang class code na ibinigay ng iyong guro.</Text>
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 10 },
  label: { color: AppTheme.primary, fontWeight: "900", letterSpacing: 1.8, fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: AppTheme.border, backgroundColor: AppTheme.surface, borderRadius: 16, padding: 18, fontSize: 17, color: AppTheme.text },
  hint: { color: AppTheme.muted, fontSize: 12, lineHeight: 19 },
});
