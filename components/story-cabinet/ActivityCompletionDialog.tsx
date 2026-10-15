import { AppTheme } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  activityTitle: string;
  message: string;
  onBack: () => void;
  onReview: () => void;
};

/** Shared final-completion feedback; intermediate activity actions keep their own feedback. */
export function ActivityCompletionDialog({ visible, activityTitle, message, onBack, onReview }: Props) {
  const [focused, setFocused] = useState<'back' | 'review' | null>(null);
  return <Modal visible={visible} transparent animationType="fade" accessibilityLabel="Kumpleto na ang gawain"
    onRequestClose={onReview} onShow={() => AccessibilityInfo.announceForAccessibility(`Kumpleto na ang gawain. ${message}`)}>
    <SafeAreaView style={styles.scrim}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <View testID="cabinet-completion-dialog" accessibilityViewIsModal style={styles.dialog}>
          <MaterialCommunityIcons name="check-circle" size={64} color={AppTheme.success} accessible={false} />
          <Text accessibilityRole="header" style={styles.title}>Kumpleto na ang gawain!</Text>
          <Text style={styles.activity}>{activityTitle}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable testID="cabinet-completion-back" accessibilityRole="button" onPress={onBack}
            onFocus={() => setFocused('back')} onBlur={() => setFocused(null)}
            style={({ pressed }) => [styles.button, focused === 'back' && styles.focused, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Bumalik sa mga gawain</Text>
          </Pressable>
          <Pressable testID="cabinet-completion-review" accessibilityRole="button" onPress={onReview}
            onFocus={() => setFocused('review')} onBlur={() => setFocused(null)}
            style={({ pressed }) => [styles.button, styles.secondary, focused === 'review' && styles.focused, pressed && styles.pressed]}>
            <Text style={[styles.buttonText, styles.secondaryText]}>Balikan ang sagot</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: AppTheme.overlay },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 430, alignItems: 'center', backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 20, padding: 24 },
  title: { color: AppTheme.text, fontSize: 24, lineHeight: 32, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  activity: { color: AppTheme.text, fontSize: 15, lineHeight: 23, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  message: { color: AppTheme.muted, fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 16, marginBottom: 16 },
  button: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.primary, borderWidth: 2, borderColor: AppTheme.primary, borderRadius: 11, padding: 12, marginTop: 12 },
  buttonText: { color: AppTheme.buttonText, fontSize: 14, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  secondary: { backgroundColor: AppTheme.surface, borderColor: AppTheme.border }, secondaryText: { color: AppTheme.text },
  pressed: { opacity: 0.8 }, focused: { borderColor: AppTheme.text, outlineColor: AppTheme.primary, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
});
