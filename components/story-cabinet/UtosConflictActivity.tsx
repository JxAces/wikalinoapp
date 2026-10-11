import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CabinetActivity, CabinetField } from '@/data/cabinet-activities';
import { utosConflictJumbles, utosConflictRounds } from '@/data/utos-learning';

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

function NameJumble({ index, value, onChange }: { index: 0 | 1; value: string; onChange: Props['onChange'] }) {
  const jumble = utosConflictJumbles[index];
  const correct = value === jumble.answer;
  return <View style={[styles.jumble, correct && styles.jumbleDone]} testID={`utos-jumble-${index}`}>
    <View style={[styles.jumbleCrown, correct && styles.crownGlow]}><MaterialCommunityIcons name="crown" size={52} color={correct ? '#C28B24' : AppTheme.muted} /></View>
    <Text accessibilityRole="header" style={styles.question}>Buuin ang pangalan ng tauhan</Text>
    <Text style={styles.copy}>Piliin ang mga titik sa tamang ayos, o isulat ang pangalan.</Text>
    <View style={styles.letters}>{jumble.letters.map((letter, tile) => {
      const used = [...value].filter(char => char === letter).length >= jumble.letters.filter(char => char === letter).length;
      return <Pressable key={tile} testID={`utos-jumble-${index}-letter-${tile}`} accessibilityRole="button" accessibilityLabel={`Titik ${letter}, ${tile + 1}`} accessibilityState={{ disabled: correct || used }} disabled={correct || used}
        onPress={() => onChange(jumble.fieldId, (value + letter).slice(0, jumble.answer.length))} style={[styles.letterTile, (correct || used) && styles.disabled]}><Text style={styles.letterText}>{letter}</Text></Pressable>;
    })}</View>
    <TextInput testID={`utos-jumble-${index}-input`} accessibilityLabel={`Pangalan ng tauhan sa yugto ${index + 1}`} value={value} maxLength={jumble.answer.length}
      autoCapitalize="characters" autoCorrect={false} onChangeText={text => onChange(jumble.fieldId, text.toUpperCase().replace(/[^A-Z]/g, ''))} style={styles.jumbleInput} />
    <Pressable accessibilityRole="button" accessibilityLabel="Burahin ang mga titik" onPress={() => onChange(jumble.fieldId, '')} style={styles.jumbleClear}><Text style={styles.secondaryText}>Burahin</Text></Pressable>
    <Text accessibilityLiveRegion="polite" testID={`utos-jumble-${index}-feedback`} style={correct ? styles.jumbleCorrect : styles.copy}>{correct ? 'Tama! Lumiwanag ang korona.' : value.length === jumble.answer.length ? 'Ayusin muli ang mga titik upang mabuo ang pangalan.' : 'Buuin ang pangalan upang makumpleto ang yugtong ito.'}</Text>
  </View>;
}

function AnswerChoices({ field, label, value, onChange, compact = false }: { field: CabinetField; label: string; value?: string; onChange: Props['onChange']; compact?: boolean }) {
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
  const answeredYugtos = done.filter(Boolean).length;
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
    <Text style={styles.eyebrow}>UTOS NG HARI</Text>
    <Text accessibilityRole="header" style={styles.title}>{activity.title}</Text>
    <Text style={styles.intro}>Basahin ang sitwasyon, buuin ang pangalan ng tauhan, at piliin ang angkop na sagot.</Text>
    <View style={styles.saveRow} accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name={completed ? 'check-circle-outline' : 'content-save-outline'} size={17} color={AppTheme.primary} />
      <Text style={styles.saveText}>{completed ? 'Kumpleto · Naka-save sa device' : hasDraft ? 'Draft · Naka-save sa device' : 'Awtomatikong mase-save ang iyong sagot'}</Text>
    </View>
    <View style={styles.steps} accessibilityLabel="Mga yugto ng Suri-Tunggali">
      {utosConflictRounds.map((item, index) => {
        const available = done.slice(0, index).every(Boolean);
        return <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`Yugto ${index + 1}: ${item.title}`}
          accessibilityState={{ selected: step === index, disabled: !available }} disabled={!available} onPress={() => goTo(index)}
          onFocus={() => setFocused(item.title)} onBlur={() => setFocused(null)}
          style={({ pressed }) => [styles.step, step === index && styles.activeStep, !available && styles.disabled, focused === item.title && styles.focused, pressed && styles.pressed]}>
          <View style={[styles.stepNumber, step === index && styles.activeStepNumber]}><Text style={[styles.stepDigit, step === index && styles.activeStepDigit]}>{index + 1}</Text></View>
          <Text style={styles.stepLabel}>{item.title}</Text>
          <Text style={styles.stepStatus}>{step === index ? 'Kasalukuyan' : done[index] ? 'Nasagutan' : 'Susunod'}</Text>
        </Pressable>;
      })}
    </View>
    <Text style={styles.roundCount}>{answeredYugtos} sa 3 yugto ang nasagutan</Text>

    <View ref={heading} {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} style={styles.paper}>
      <View pointerEvents="none" style={styles.paperRule} />
      {step === 3 ? <>
        <View style={styles.reviewCrown}><MaterialCommunityIcons name="crown" size={45} color={AppTheme.primary} /></View>
        <Text accessibilityRole="header" style={styles.reviewTitle}>{completed ? 'Ang iyong mga sagot' : 'Balikan bago tapusin'}</Text>
        <Text style={styles.copy}>Suriin ang iyong mga pinili sa tatlong yugto. Maaari mong baguhin ang alinmang sagot.</Text>
        {utosConflictRounds.map((item, index) => <View key={item.title} style={styles.reviewYugto}>
          <Text style={styles.eyebrow}>YUGTO {index + 1} · {item.title.toUpperCase()}</Text>
          <Text style={styles.question}>{item.question}</Text>
          <Text style={styles.reviewAnswer}>{optionLabel(item.fieldIds[0])}</Text>
          {index === 0 && <><Text style={styles.reasonLabel}>BAKIT?</Text><Text style={styles.reviewAnswer}>{optionLabel('round-1-reason')}</Text></>}
          {button(`Baguhin ang Yugto ${index + 1}`, () => goTo(index), false, true)}
        </View>)}
        {completed && <Text accessibilityLiveRegion="polite" style={styles.savedNotice}>Naka-save na ang iyong mga sagot. Handa nang ipakita sa guro.</Text>}
        <View style={styles.actions}>{button('Ipasa', onComplete, !ready || completed)}</View>
      </> : <>
        <View style={styles.roundHeading}><Text style={styles.eyebrow}>YUGTO {step + 1} / 3</Text><View style={[styles.roundBadge, step === 2 && styles.bossBadge]}><MaterialCommunityIcons name={step === 2 ? 'crown' : 'book-open-page-variant-outline'} size={16} color={step === 2 ? AppTheme.buttonText : AppTheme.primary} /><Text style={[styles.badgeText, step === 2 && styles.bossText]}>{step === 2 ? 'BOSS LEVEL' : round.title}</Text></View></View>
        <Text accessibilityRole="header" style={styles.roundTitle}>{round.theme}</Text>
        <View style={styles.situation}><Text style={styles.eyebrow}>SITWASYON</Text><Text style={styles.situationText}>{round.situation}</Text></View>
        {step < 2 && <NameJumble index={step as 0 | 1} value={responses[utosConflictJumbles[step].fieldId] ?? ''} onChange={onChange} />}
        <Text accessibilityRole="header" style={styles.question}>{round.question}</Text>
        <AnswerChoices field={field} label={round.question} value={responses[field.id]} onChange={onChange} compact={step === 0 && width >= 330} />
        {step === 0 && valid('round-1-character') && <View style={styles.reasonSection}>
          <Text accessibilityLiveRegion="polite" style={styles.selectedSummary}>Napili mong tauhan: {optionLabel('round-1-character').replace(/^[A-D]\. /, '')}</Text>
          <Text accessibilityRole="header" style={styles.reasonTitle}>Bakit?</Text>
          <Text style={styles.copy}>Pumili ng dahilan para sa iyong sagot.</Text>
          <AnswerChoices field={reason} label="Bakit? Pumili ng dahilan." value={responses[reason.id]} onChange={onChange} />
        </View>}
        <Text accessibilityLiveRegion="polite" style={styles.selectionHint}>{done[step] ? 'Naitala ang iyong pinili. Maaari ka nang magpatuloy.' : step < 2 && !valid(utosConflictJumbles[step].fieldId) ? 'Buuin muna ang pangalan ng tauhan.' : step === 0 && valid('round-1-character') ? 'Piliin din ang dahilan bago magpatuloy.' : 'Pumili ng sagot upang magpatuloy.'}</Text>
        <View style={styles.actions}>
          {step > 0 && button('Nakaraang yugto', () => goTo(step - 1), false, true)}
          {button(step === 2 ? 'Suriin ang mga sagot' : 'Susunod na yugto →', () => goTo(step + 1), !done[step])}
        </View>
      </>}
    </View>
    <View style={styles.backRow}>{button('Bumalik sa mga gawain', onBack, false, true)}</View>
    <Text style={styles.footer}>Ang “kumpleto” ay nangangahulugang nasagutan ang gawain. Ang guro ang susuri sa mga sagot; wala pang awtomatikong marka o pagpapasa online.</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', maxWidth: 720 },
  jumble: { padding: 14, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, marginTop: 18 },
  jumbleDone: { borderColor: AppTheme.success, backgroundColor: AppTheme.successSurface }, jumbleCrown: { alignSelf: 'center', padding: 8, borderRadius: 40 }, crownGlow: { backgroundColor: AppTheme.selected, boxShadow: '0 0 24px #DAB05188' },
  letters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginBottom: 12 }, letterTile: { minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surface, borderRadius: 8 }, letterText: { color: AppTheme.text, fontSize: 22, fontWeight: '800' },
  jumbleInput: { minHeight: 48, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 9, padding: 10, backgroundColor: AppTheme.surface, color: AppTheme.text, fontSize: 23, fontWeight: '800', textAlign: 'center', letterSpacing: 3 }, jumbleClear: { minHeight: 44, alignSelf: 'center', padding: 10 }, jumbleCorrect: { color: AppTheme.success, fontWeight: '800', lineHeight: 22 },
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
  question: { color: AppTheme.text, fontSize: 17, lineHeight: 25, fontWeight: '800', marginTop: 12, marginBottom: 12 },
  choices: { gap: 10 }, choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, choice: { borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, minHeight: 64 }, shortChoice: { width: '48%', flexDirection: 'column', gap: 5 }, shortChoiceText: { flex: 0, textAlign: 'center' }, selectedChoice: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected }, choiceCrown: { width: 28, alignItems: 'center' }, choiceText: { flex: 1, color: AppTheme.text, fontSize: 15, lineHeight: 23 }, selectedText: { fontWeight: '700', color: AppTheme.text },
  reasonSection: { marginTop: 22, borderTopWidth: 1, borderColor: AppTheme.border, paddingTop: 17 }, selectedSummary: { color: AppTheme.text, fontSize: 13, fontWeight: '700', lineHeight: 21 }, reasonTitle: { color: AppTheme.text, fontSize: 22, fontWeight: '800', marginTop: 12 }, copy: { color: AppTheme.muted, fontSize: 14, lineHeight: 22, marginTop: 6, marginBottom: 14 },
  selectionHint: { color: AppTheme.text, fontSize: 12, lineHeight: 20, marginTop: 18 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.primary, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: AppTheme.buttonText, fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center' }, secondaryButton: { backgroundColor: 'transparent', borderColor: AppTheme.border }, secondaryText: { color: AppTheme.text },
  focused: { borderColor: AppTheme.primary, outlineColor: AppTheme.primary, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 }, pressed: { opacity: 0.8 }, disabled: { opacity: 0.48 },
  reviewCrown: { alignItems: 'center' }, reviewTitle: { color: AppTheme.text, fontSize: 24, lineHeight: 31, fontWeight: '800', textAlign: 'center', marginTop: 10 }, reviewYugto: { paddingVertical: 18, borderTopWidth: 1, borderColor: AppTheme.border, gap: 5 }, reviewAnswer: { color: AppTheme.text, fontSize: 15, lineHeight: 24, marginBottom: 10 }, reasonLabel: { color: AppTheme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, savedNotice: { color: AppTheme.success, fontSize: 14, lineHeight: 22, backgroundColor: AppTheme.successSurface, padding: 12, borderRadius: 8 },
  backRow: { alignItems: 'flex-start', marginTop: 20 }, footer: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, marginTop: 16 },
});
