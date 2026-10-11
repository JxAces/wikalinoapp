import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { CabinetActivity, CabinetField } from '@/data/cabinet-activities';
import { utosConflictRounds } from '@/data/utos-learning';

type Props = {
  activity: CabinetActivity;
  responses: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
  onBack: () => void;
  onViewChange?: () => void;
  completed: boolean;
  hasDraft: boolean;
};

/** A neutral balance: the PDF does not assign meanings or correctness to its pans. */
function BalanceScale() {
  return <View pointerEvents="none" style={styles.scale}>
    <Svg width="100%" height="100%" viewBox="0 0 360 190" aria-hidden accessible={Platform.OS === 'web' ? undefined : false}>
      <Ellipse cx="180" cy="176" rx="91" ry="8" fill="#8B672E" opacity="0.12" />
      <Circle cx="180" cy="88" r="79" fill="#EBDDAD" opacity="0.45" />
      <Path d="M164 154 L170 65 H190 L196 154 Z" fill="#BD9046" stroke="#805D29" strokeWidth="2" />
      <Path d="M173 66 H180 V153 H168 Z" fill="#E3C078" />
      <Path d="M73 60 Q180 45 287 60" fill="none" stroke="#805D29" strokeWidth="8" strokeLinecap="round" />
      <Path d="M73 57 Q180 42 287 57" fill="none" stroke="#D9B56B" strokeWidth="4" strokeLinecap="round" />
      {[77, 283].map(x => <G key={x}>
        <Circle cx={x} cy="59" r="5" fill="#FAE6AD" stroke="#805D29" strokeWidth="2" />
        <Path d={`M${x} 64 L${x - 35} 119 M${x} 64 L${x + 35} 119 M${x} 65 V119`} fill="none" stroke="#997137" strokeWidth="2" />
        <Path d={`M${x - 40} 120 H${x + 40} Q${x + 32} 146 ${x} 147 Q${x - 32} 146 ${x - 40} 120Z`} fill="#D7B36A" stroke="#805D29" strokeWidth="2" />
        <Path d={`M${x - 33} 125 H${x + 30}`} stroke="#F7E6B7" strokeWidth="3" strokeLinecap="round" />
      </G>)}
      <Path d="M165 42 L161 20 L173 29 L180 12 L187 29 L199 20 L195 42 Z" fill="#BC8A34" stroke="#805D29" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="180" cy="56" r="10" fill="#F9E7B8" stroke="#805D29" strokeWidth="3" />
      <Circle cx="180" cy="56" r="3" fill="#997137" />
      <Path d="M157 151 H203 L217 167 H143 Z" fill="#BD9046" stroke="#805D29" strokeWidth="2" />
      <Rect x="136" y="166" width="88" height="8" rx="4" fill="#805D29" />
      <G fill="#BC8A34" opacity="0.65"><Path d="M38 41 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z" /><Path d="M326 82 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z" /></G>
    </Svg>
  </View>;
}

function CrownChoices({ field, label, value, onChange, compact = false }: { field: CabinetField; label: string; value?: string; onChange: Props['onChange']; compact?: boolean }) {
  const [focused, setFocused] = useState<string | null>(null);
  const options = field.options ?? [];
  function keys(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const directions: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number;
    if (event.key in directions) next = (index + directions[event.key] + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === ' ' || event.key === 'Enter') next = index;
    else return;
    event.preventDefault();
    if (options[next].value !== value) onChange(field.id, options[next].value);
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.choices, compact && styles.choiceGrid]}>
    {options.map((option, index) => {
      const selected = option.value === value;
      return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: selected }}
        {...(Platform.OS === 'web' ? { 'aria-checked': selected, onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => keys(event, index) } : {})}
        onPress={() => { if (!selected) onChange(field.id, option.value); }} onFocus={() => setFocused(option.value)} onBlur={() => setFocused(null)}
        style={({ pressed }) => [styles.choice, compact && styles.shortChoice, selected && styles.selectedChoice, focused === option.value && styles.focused, pressed && styles.pressed]}>
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.choiceCrown}>
          <MaterialCommunityIcons name={selected ? 'crown' : 'crown-outline'} size={25} color={AppTheme.primary} />
        </View>
        <Text style={[styles.choiceText, compact && styles.shortChoiceText, selected && styles.selectedText]}>{option.label}</Text>
        <MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={19} color={AppTheme.primary} />
      </Pressable>;
    })}
  </View>;
}

export function UtosConflictActivity({ activity, responses, onChange, onComplete, onBack, onViewChange, completed, hasDraft }: Props) {
  const valid = (id: string) => Boolean(activity.fields.find(field => field.id === id)?.options?.some(option => option.value === responses[id]));
  const done = utosConflictRounds.map(round => round.fieldIds.every(valid));
  const firstMissing = done.findIndex(value => !value);
  const [step, setStep] = useState(() => firstMissing === -1 ? 3 : completed ? 0 : firstMissing);
  const [focused, setFocused] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const heading = useRef<View>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (Platform.OS !== 'web') return;
    const frame = requestAnimationFrame(() => (heading.current as unknown as HTMLElement | null)?.focus?.());
    return () => cancelAnimationFrame(frame);
  }, [step]);
  const round = utosConflictRounds[Math.min(step, 2)];
  const field = activity.fields.find(item => item.id === round.fieldIds[0])!;
  const reason = activity.fields.find(item => item.id === 'round-1-reason')!;
  const ready = done.every(Boolean);
  const answeredRounds = done.filter(Boolean).length;
  const optionLabel = (id: string) => activity.fields.find(item => item.id === id)?.options?.find(option => option.value === responses[id])?.label ?? 'Wala pang napili';

  function goTo(next: number) {
    if (next > 0 && done.slice(0, Math.min(next, 3)).some(value => !value)) return;
    setStep(next);
    onViewChange?.();
  }

  function button(label: string, onPress: () => void, disabled = false, secondary = false) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress} onFocus={() => setFocused(label)} onBlur={() => setFocused(null)}
      style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && styles.disabled, focused === label && styles.focused, pressed && styles.pressed]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>;
  }

  return <View style={styles.root} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Text style={styles.eyebrow}>HAMON 01 · UTOS NG HARI</Text>
    <Text accessibilityRole="header" style={styles.title}>{activity.title}</Text>
    <Text style={styles.intro}>Basahin ang sitwasyon. Timbangin ang tunggalian at piliin ang angkop na sagot.</Text>
    <View style={styles.saveRow} accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name={completed ? 'check-circle-outline' : 'content-save-outline'} size={17} color={AppTheme.primary} />
      <Text style={styles.saveText}>{completed ? 'Kumpleto · Naka-save sa device' : hasDraft ? 'Draft · Naka-save sa device' : 'Awtomatikong mase-save ang iyong sagot'}</Text>
    </View>
    <View style={styles.steps} accessibilityLabel="Mga round ng Timbangan ng Tunggalian">
      {utosConflictRounds.map((item, index) => {
        const available = done.slice(0, index).every(Boolean);
        return <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`Round ${index + 1}: ${item.title}`}
          accessibilityState={{ selected: step === index, disabled: !available }} disabled={!available} onPress={() => goTo(index)}
          onFocus={() => setFocused(item.title)} onBlur={() => setFocused(null)}
          style={({ pressed }) => [styles.step, step === index && styles.activeStep, !available && styles.disabled, focused === item.title && styles.focused, pressed && styles.pressed]}>
          <View style={[styles.stepNumber, step === index && styles.activeStepNumber]}><Text style={[styles.stepDigit, step === index && styles.activeStepDigit]}>{index + 1}</Text></View>
          <Text style={styles.stepLabel}>{item.title}</Text>
          <Text style={styles.stepStatus}>{step === index ? 'Kasalukuyan' : done[index] ? 'Nasagutan' : 'Susunod'}</Text>
        </Pressable>;
      })}
    </View>
    <Text style={styles.roundCount}>{answeredRounds} sa 3 round ang nasagutan</Text>

    <View ref={heading} {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} style={styles.paper}>
      <View pointerEvents="none" style={styles.paperRule} />
      {step === 3 ? <>
        <View style={styles.reviewCrown}><MaterialCommunityIcons name="crown" size={45} color={AppTheme.primary} /></View>
        <Text accessibilityRole="header" style={styles.reviewTitle}>{completed ? 'Ang iyong mga sagot' : 'Balikan bago tapusin'}</Text>
        <Text style={styles.copy}>Suriin ang iyong mga pinili sa tatlong round. Maaari mong baguhin ang alinmang sagot.</Text>
        {utosConflictRounds.map((item, index) => <View key={item.title} style={styles.reviewRound}>
          <Text style={styles.eyebrow}>ROUND {index + 1} · {item.title.toUpperCase()}</Text>
          <Text style={styles.question}>{item.question}</Text>
          <Text style={styles.reviewAnswer}>{optionLabel(item.fieldIds[0])}</Text>
          {index === 0 && <><Text style={styles.reasonLabel}>BAKIT?</Text><Text style={styles.reviewAnswer}>{optionLabel('round-1-reason')}</Text></>}
          {button(`Baguhin ang Round ${index + 1}`, () => goTo(index), false, true)}
        </View>)}
        {completed && <Text accessibilityLiveRegion="polite" style={styles.savedNotice}>Naka-save na ang iyong mga sagot. Handa nang ipakita sa guro.</Text>}
        <View style={styles.actions}>{button('Ipasa', onComplete, !ready || completed)}</View>
      </> : <>
        <View style={styles.roundHeading}><Text style={styles.eyebrow}>ROUND {step + 1} / 3</Text><View style={[styles.roundBadge, step === 2 && styles.bossBadge]}><MaterialCommunityIcons name={step === 2 ? 'crown' : 'book-open-page-variant-outline'} size={16} color={step === 2 ? AppTheme.buttonText : AppTheme.primary} /><Text style={[styles.badgeText, step === 2 && styles.bossText]}>{step === 2 ? 'BOSS LEVEL' : round.title}</Text></View></View>
        <Text accessibilityRole="header" style={styles.roundTitle}>{round.theme}</Text>
        <View style={styles.situation}><Text style={styles.eyebrow}>SITWASYON</Text><Text style={styles.situationText}>{round.situation}</Text></View>
        <BalanceScale />
        <Text style={styles.scaleCaption}>Timbangin ang sitwasyon bago pumili.</Text>
        <Text accessibilityRole="header" style={styles.question}>{round.question}</Text>
        <CrownChoices field={field} label={round.question} value={responses[field.id]} onChange={onChange} compact={step === 0 && width >= 330} />
        {step === 0 && valid('round-1-character') && <View style={styles.reasonSection}>
          <Text accessibilityLiveRegion="polite" style={styles.selectedSummary}>Napili mong tauhan: {optionLabel('round-1-character').replace(/^[A-D]\. /, '')}</Text>
          <Text accessibilityRole="header" style={styles.reasonTitle}>Bakit?</Text>
          <Text style={styles.copy}>Pumili ng dahilan para sa iyong sagot.</Text>
          <CrownChoices field={reason} label="Bakit? Pumili ng dahilan." value={responses[reason.id]} onChange={onChange} />
        </View>}
        <Text accessibilityLiveRegion="polite" style={styles.selectionHint}>{done[step] ? 'Naitala ang iyong pinili. Maaari ka nang magpatuloy.' : step === 0 && valid('round-1-character') ? 'Piliin din ang dahilan bago magpatuloy.' : 'Pumili ng sagot upang magpatuloy.'}</Text>
        <View style={styles.actions}>
          {step > 0 && button('Nakaraang round', () => goTo(step - 1), false, true)}
          {button(step === 2 ? 'Suriin ang mga sagot' : 'Susunod na round →', () => goTo(step + 1), !done[step])}
        </View>
      </>}
    </View>
    <View style={styles.backRow}>{button('Bumalik sa mga hamon', onBack, false, true)}</View>
    <Text style={styles.footer}>Ang “kumpleto” ay nangangahulugang nasagutan ang gawain. Ang guro ang susuri sa mga sagot; wala pang awtomatikong marka o pagpapasa online.</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', maxWidth: 720 },
  eyebrow: { color: AppTheme.muted, fontSize: 11, lineHeight: 18, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: AppTheme.text, fontSize: 28, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  intro: { color: AppTheme.text, fontSize: 14, lineHeight: 22, marginTop: 10 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 17 }, saveText: { flex: 1, color: AppTheme.success, fontSize: 12, lineHeight: 18 },
  steps: { flexDirection: 'row', gap: 8 }, step: { flex: 1, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 12, alignItems: 'center', paddingHorizontal: 3, paddingVertical: 10, backgroundColor: AppTheme.surfaceSoft, gap: 5 },
  activeStep: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected }, stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: AppTheme.surfaceSoft, justifyContent: 'center', alignItems: 'center' },
  activeStepNumber: { backgroundColor: AppTheme.primary }, stepDigit: { color: AppTheme.text, fontWeight: '800', fontSize: 13 }, activeStepDigit: { color: AppTheme.buttonText },
  stepLabel: { color: AppTheme.text, fontSize: 13, fontWeight: '800', textAlign: 'center' }, stepStatus: { color: AppTheme.muted, fontSize: 10, textAlign: 'center' }, roundCount: { color: AppTheme.muted, fontSize: 12, marginTop: 10, marginBottom: 18, textAlign: 'right' },
  paper: { backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 16, padding: 18, paddingTop: 23 }, paperRule: { height: 3, backgroundColor: AppTheme.surfaceSoft, width: 52, alignSelf: 'center', marginBottom: 20, borderRadius: 2 },
  roundHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, roundBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: AppTheme.surfaceSoft }, badgeText: { color: AppTheme.text, fontSize: 11, fontWeight: '800' }, bossBadge: { backgroundColor: AppTheme.primary }, bossText: { color: AppTheme.buttonText },
  roundTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800', color: AppTheme.text, marginTop: 14 },
  situation: { marginTop: 16, padding: 14, backgroundColor: AppTheme.panel, borderLeftWidth: 3, borderColor: AppTheme.border, borderRadius: 5 }, situationText: { color: AppTheme.text, fontSize: 15, lineHeight: 24, marginTop: 6 },
  scale: { width: '100%', maxWidth: 360, height: 175, alignSelf: 'center', marginTop: 12 }, scaleCaption: { color: AppTheme.text, fontSize: 11, textAlign: 'center', marginTop: -3, marginBottom: 14 },
  question: { color: AppTheme.text, fontSize: 17, lineHeight: 25, fontWeight: '800', marginTop: 12, marginBottom: 12 },
  choices: { gap: 10 }, choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, choice: { borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, minHeight: 64 }, shortChoice: { width: '48%', flexDirection: 'column', gap: 5 }, shortChoiceText: { flex: 0, textAlign: 'center' }, selectedChoice: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected }, choiceCrown: { width: 28, alignItems: 'center' }, choiceText: { flex: 1, color: AppTheme.text, fontSize: 15, lineHeight: 23 }, selectedText: { fontWeight: '700', color: AppTheme.text },
  reasonSection: { marginTop: 22, borderTopWidth: 1, borderColor: AppTheme.border, paddingTop: 17 }, selectedSummary: { color: AppTheme.text, fontSize: 13, fontWeight: '700', lineHeight: 21 }, reasonTitle: { color: AppTheme.text, fontSize: 22, fontWeight: '800', marginTop: 12 }, copy: { color: AppTheme.muted, fontSize: 14, lineHeight: 22, marginTop: 6, marginBottom: 14 },
  selectionHint: { color: AppTheme.text, fontSize: 12, lineHeight: 20, marginTop: 18 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.primary, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: AppTheme.buttonText, fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center' }, secondaryButton: { backgroundColor: 'transparent', borderColor: AppTheme.border }, secondaryText: { color: AppTheme.text },
  focused: { borderColor: AppTheme.primary, outlineColor: AppTheme.primary, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.48 },
  reviewCrown: { alignItems: 'center' }, reviewTitle: { color: AppTheme.text, fontSize: 24, lineHeight: 31, fontWeight: '800', textAlign: 'center', marginTop: 10 }, reviewRound: { paddingVertical: 18, borderTopWidth: 1, borderColor: AppTheme.border, gap: 5 }, reviewAnswer: { color: AppTheme.text, fontSize: 15, lineHeight: 24, marginBottom: 10 }, reasonLabel: { color: AppTheme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, savedNotice: { color: AppTheme.success, fontSize: 14, lineHeight: 22, backgroundColor: AppTheme.successSurface, padding: 12, borderRadius: 8 },
  backRow: { alignItems: 'flex-start', marginTop: 20 }, footer: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, marginTop: 16 },
});
