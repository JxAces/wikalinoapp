import { AppTheme } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import type { CabinetActivity } from '@/data/cabinet-activities';

type MenuActivity = { activity: CabinetActivity; completed: boolean; hasDraft: boolean; locked: boolean };
type Props = { activities: MenuActivity[]; onSelect: (activity: CabinetActivity) => void };

// The adjoining tabs and sockets form one crown, with one target for each activity.
const crownSections = [
  'M50 80 L200 150 L270 65 L400 20 V120 C372 104 372 158 400 142 V235 H290 C306 207 252 207 268 235 H100 Z',
  'M400 20 L530 65 L600 150 L750 80 L700 235 H560 C576 263 522 263 538 235 H400 V142 C372 158 372 104 400 120 Z',
  'M100 235 H268 C252 207 306 207 290 235 H400 V310 C428 294 428 348 400 332 V420 Q250 420 120 385 Z',
  'M400 235 H538 C522 263 576 263 560 235 H700 L680 385 Q550 420 400 420 V332 C428 348 428 294 400 310 Z',
];

export function UtosActivityMenu({ activities, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [float] = useState(() => new Animated.Value(0));
  const gradientId = `utos-crown-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
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
    <Text accessibilityLiveRegion="polite" style={styles.progress}>{completed}/{activities.length} gawaing kumpleto</Text>
    <Animated.View style={[styles.crown, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 800 480" aria-hidden={true} accessible={Platform.OS === 'web' ? undefined : false}>
          <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFF0A9" /><Stop offset="0.48" stopColor="#EBC45F" /><Stop offset="1" stopColor="#D4A445" /></LinearGradient></Defs>
          <Ellipse cx="400" cy="449" rx="267" ry="14" fill={AppTheme.dark} opacity="0.12" />
          {activities.map((item, index) => <Path key={`glow-${item.activity.id}`} d={crownSections[index]} fill="none" stroke="#F3CE64" strokeWidth={item.completed ? 17 : 0} opacity="0.3" />)}
          {activities.map((item, index) => <Path key={item.activity.id} d={crownSections[index]} fill={item.completed ? `url(#${gradientId})` : item.locked ? AppTheme.panelStrong : AppTheme.surfaceSoft} stroke={item.completed ? '#B3862E' : AppTheme.border} strokeWidth="4" strokeLinejoin="round" />)}
          <Path d="M144 365 Q270 396 374 395 M427 395 Q553 396 656 365" fill="none" stroke={AppTheme.primary} strokeWidth="5" opacity="0.35" strokeLinecap="round" />
          <Path d="M270 87 L281 111 L270 135 L259 111 Z M530 87 L541 111 L530 135 L519 111 Z" fill={AppTheme.primary} opacity="0.42" />
        </Svg>
      </View>
      {activities.map((item, index) => {
        const status = item.locked ? 'Nakakandado. Tapusin muna ang naunang gawain.' : item.completed ? 'Kumpleto. Balikan o baguhin ang sagot.' : item.hasDraft ? 'May draft. Ituloy ang gawain.' : 'Simulan ang gawain.';
        return <Pressable key={item.activity.id} testID={`utos-crown-section-${index + 1}`}
          accessibilityRole="button" accessibilityLabel={`${item.activity.title}. ${status}`} accessibilityState={{ disabled: item.locked }}
          disabled={item.locked} onPress={() => onSelect(item.activity)} onFocus={() => setFocusedId(item.activity.id)} onBlur={() => setFocusedId(null)}
          style={({ pressed }) => [styles.section, { left: index % 2 ? '50%' : 0, top: index < 2 ? 0 : '50%' }, focusedId === item.activity.id && styles.focused, pressed && styles.pressed]}>
          <View style={[styles.sectionCopy, index % 2 ? styles.rightCopy : styles.leftCopy, index < 2 ? styles.upperCopy : styles.lowerCopy]}>
            <MaterialCommunityIcons name={item.locked ? 'lock' : item.completed ? 'check-circle' : 'puzzle-outline'} size={width < 360 ? 17 : 22} color={item.locked ? AppTheme.muted : AppTheme.primary} />
            <Text style={[styles.title, width < 600 && styles.titleMedium, width < 360 && styles.titleCompact]}>{item.activity.title}</Text>
          </View>
        </Pressable>;
      })}
    </Animated.View>
    {activities.some(item => item.locked) && <Text style={styles.lockHint}>Tapusin muna ang naunang gawain upang mabuksan ang susunod na bahagi.</Text>}
  </View>;
}

const styles = StyleSheet.create({
  menu: { width: '100%', maxWidth: 850, alignSelf: 'center', paddingTop: 22, paddingBottom: 30 },
  progress: { color: AppTheme.text, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  crown: { width: '100%', aspectRatio: 5 / 3 },
  section: { position: 'absolute', width: '50%', height: '50%', borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  sectionCopy: { position: 'absolute', alignItems: 'center', gap: 5 },
  leftCopy: { left: '19%', right: '6%' }, rightCopy: { left: '6%', right: '19%' },
  upperCopy: { top: '50%' }, lowerCopy: { top: '18%' },
  title: { color: AppTheme.text, fontSize: 17, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
  titleMedium: { fontSize: 13, lineHeight: 18 },
  titleCompact: { fontSize: 11, lineHeight: 16 },
  focused: { borderColor: AppTheme.primary, outlineColor: AppTheme.primary, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 },
  pressed: { opacity: 0.78 },
  lockHint: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, maxWidth: 500, textAlign: 'center', alignSelf: 'center', paddingHorizontal: 14 },
});
