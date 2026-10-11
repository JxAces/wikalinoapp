import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { CabinetActivity } from '@/data/cabinet-activities';

type MenuActivity = { activity: CabinetActivity; completed: boolean; hasDraft: boolean };
type Props = { activities: MenuActivity[]; onSelect: (activity: CabinetActivity) => void };

const summaries: Record<string, { description: string; detail: string }> = {
  'utos-conflict': { description: 'Sino ang naaapektuhan? Suriin ang sitwasyon at piliin ang dahilan.', detail: '3 round · Tunggalian' },
  'utos-meanings': { description: 'Tuklasin ang tatlong kahulugan sa likod ng “Utos ng Hari.”', detail: '3 kahulugan · Interpretasyon' },
  'utos-sequence': { description: 'Ayusin ang anim na pangyayari upang mabuo ang daloy ng kuwento.', detail: '6 story card · Pagkakasunod-sunod' },
  'utos-stand-up': { description: 'Unawain ang pahayag ni Jojo at ipahayag ang sariling paninindigan.', detail: 'Interpretasyon · Pagninilay' },
};

/** Presentation only: navigation and saved responses remain owned by the cabinet screen. */
export function UtosActivityMenu({ activities, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let mounted = true;
    let reducedMotion = true;
    let animation: Animated.CompositeAnimation | undefined;
    const update = () => {
      animation?.stop();
      float.setValue(0);
      if (!mounted || reducedMotion || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) { reducedMotion = value; update(); } }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { reducedMotion = value; update(); });
    const appState = AppState.addEventListener('change', update);
    return () => { mounted = false; motion.remove(); appState.remove(); animation?.stop(); float.stopAnimation(); };
  }, [float]);
  const completed = activities.filter(item => item.completed).length;
  return <View style={styles.menu}>
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.roll, styles.topRoll]}>
      <View style={styles.rollCap} /><View style={styles.rollShine} /><View style={styles.rollCap} />
    </View>
    <View style={styles.intro}>
      <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.heroCrown}>
        <View style={styles.rule} /><MaterialCommunityIcons name="star-four-points" size={18} color={AppTheme.primary} /><View style={styles.rule} />
      </View>
      <Text accessibilityRole="header" style={styles.heading}>Apat na hamon.{"\n"}Isang mas malalim na pag-unawa.</Text>
      <Text style={styles.introCopy}>Pumili ng lumulutang na korona upang buksan ang isang gawain.</Text>
    </View>

    <View style={styles.progress}>
      <Text accessibilityLiveRegion="polite" style={styles.progressText}>{completed} sa {activities.length} na gawain ang kumpleto</Text>
      <View style={styles.markers}>
        {activities.map((item, index) => <View key={item.activity.id} accessible accessibilityLabel={`Hamon ${index + 1}: ${item.completed ? 'Kumpleto at naka-save' : 'Hindi pa kumpleto'}`} style={styles.marker}>
          <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.markerCrown}>
            <MaterialCommunityIcons name={item.completed ? 'crown' : 'crown-outline'} size={26} color={AppTheme.primary} />
            {item.completed && <View style={styles.markerCheck}><MaterialCommunityIcons name="check-circle" size={14} color={AppTheme.primary} /></View>}
          </View>
          <Text style={styles.markerNumber}>{index + 1}</Text>
        </View>)}
      </View>
    </View>

    <View style={[styles.cards, width >= 760 && styles.grid]}>
      {activities.map((item, index) => {
        const { activity, hasDraft } = item;
        const summary = summaries[activity.id];
        const status = item.completed ? 'Kumpleto · Naka-save' : hasDraft ? 'May naka-save na sagot' : 'Hindi pa nasisimulan';
        const action = item.completed ? 'Balikan' : hasDraft ? 'Ipagpatuloy' : 'Simulan';
        return <Pressable key={activity.id} accessibilityRole="button" accessibilityLabel={`Hamon ${index + 1}. ${activity.title}. ${status}. ${action}.`}
          onPress={() => onSelect(activity)} onFocus={() => setFocusedId(activity.id)} onBlur={() => setFocusedId(null)}
          style={({ pressed }) => [styles.card, width >= 760 && styles.gridCard, focusedId === activity.id && styles.focused, pressed && styles.pressed]}>
          <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.floatingStage}>
            <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>
              <MaterialCommunityIcons name="crown" size={80} color={AppTheme.primary} />
              {item.completed && <View style={styles.crownCheck}><MaterialCommunityIcons name="check-circle" size={20} color={AppTheme.primary} /></View>}
            </Animated.View>
            <View style={styles.crownShadow} />
          </View>
          <View style={styles.cardTop}>
            <Text style={styles.eyebrow}>HAMON {String(index + 1).padStart(2, '0')}</Text>
          </View>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <Text style={styles.description}>{summary?.description ?? activity.description}</Text>
          <Text style={styles.detail}>{summary?.detail ?? 'Pagsusuri ng kuwento'}</Text>
          <View style={styles.cardBottom}>
            <View style={styles.statusRow}>
              <MaterialCommunityIcons name={item.completed ? 'check-circle-outline' : hasDraft ? 'pencil-outline' : 'circle-outline'} size={16} color={item.completed ? AppTheme.primary : AppTheme.primary} />
              <Text style={[styles.status, item.completed && styles.doneText]}>{status}</Text>
            </View>
            <View style={styles.action}><Text style={styles.actionText}>{action}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={AppTheme.primary} /></View>
          </View>
        </Pressable>;
      })}
    </View>
    <View style={styles.footer}>
      <MaterialCommunityIcons name="content-save-outline" size={19} color={AppTheme.primary} />
      <Text style={styles.footerText}>Naka-save sa device na ito ang iyong mga sagot. Ipakita ang mga ito sa guro para sa pagsusuri.</Text>
    </View>
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.roll, styles.bottomRoll]}>
      <View style={styles.rollCap} /><View style={styles.rollShine} /><View style={styles.rollCap} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  menu: { width: '100%', maxWidth: 920, alignSelf: 'center', marginVertical: 16, backgroundColor: AppTheme.surfaceSoft, borderWidth: 2, borderColor: AppTheme.border, paddingHorizontal: 12, paddingTop: 30, paddingBottom: 18, shadowColor: AppTheme.dark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 2 },
  intro: { alignItems: 'center', paddingTop: 2 },
  heroCrown: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 14 },
  rule: { width: 42, height: 1, backgroundColor: AppTheme.surfaceSoft },
  heading: { color: AppTheme.text, fontSize: 24, lineHeight: 31, fontWeight: '800', textAlign: 'center', maxWidth: 600 },
  introCopy: { color: AppTheme.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 550, marginTop: 10 },
  progress: { alignItems: 'center', marginTop: 20, marginBottom: 22, gap: 8 },
  progressText: { color: AppTheme.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  markers: { flexDirection: 'row', justifyContent: 'center', gap: 22 },
  marker: { alignItems: 'center', gap: 2 }, markerCrown: { position: 'relative' },
  markerCheck: { position: 'absolute', right: -4, bottom: -2, borderRadius: 8, backgroundColor: AppTheme.surfaceSoft },
  markerNumber: { fontSize: 11, fontWeight: '700', color: AppTheme.muted },
  cards: { gap: 24 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderWidth: 2, borderColor: 'transparent', borderRadius: 12, paddingHorizontal: 10, paddingBottom: 18 },
  gridCard: { width: '48%' },
  focused: { borderColor: AppTheme.primary, outlineColor: AppTheme.primary, outlineStyle: 'solid', outlineWidth: 3, outlineOffset: 3 },
  pressed: { backgroundColor: AppTheme.selected },
  floatingStage: { height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  crownShadow: { width: 56, height: 6, borderRadius: 28, backgroundColor: AppTheme.surfaceSoft, opacity: 0.18, marginTop: 1 },
  crownCheck: { position: 'absolute', bottom: 5, right: -4, backgroundColor: AppTheme.surfaceSoft, borderRadius: 12 },
  roll: { position: 'absolute', left: -10, right: -10, height: 22, borderRadius: 12, borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.panelStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: AppTheme.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  topRoll: { top: -11 }, bottomRoll: { bottom: -11 },
  rollCap: { width: 13, height: 20, borderRadius: 10, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft },
  rollShine: { flex: 1, height: 5, backgroundColor: AppTheme.surfaceSoft, alignSelf: 'flex-start', marginTop: 3, opacity: 0.8 },
  cardTop: { alignItems: 'center' },
  eyebrow: { color: AppTheme.muted, fontSize: 11, lineHeight: 17, letterSpacing: 1.5, fontWeight: '800' },
  cardTitle: { color: AppTheme.text, fontSize: 22, lineHeight: 29, fontWeight: '800', marginTop: 13, textAlign: 'center' },
  description: { color: AppTheme.muted, fontSize: 15, lineHeight: 23, marginTop: 8, textAlign: 'center' },
  detail: { color: AppTheme.text, fontSize: 12, lineHeight: 19, fontWeight: '600', marginTop: 13, marginBottom: 18, textAlign: 'center' },
  cardBottom: { marginTop: 'auto', borderTopWidth: 1, borderColor: AppTheme.border, paddingTop: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, rowGap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  status: { color: AppTheme.muted, fontSize: 12, lineHeight: 18, flexShrink: 1 }, doneText: { color: AppTheme.success },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  actionText: { color: AppTheme.text, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 10, paddingVertical: 24, alignItems: 'flex-start' },
  footerText: { flex: 1, color: AppTheme.muted, fontSize: 12, lineHeight: 20 },
});
