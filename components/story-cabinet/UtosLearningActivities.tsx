import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { UtosPortraitArt } from '@/components/activity-player/utos-character-portrait';
import { AppTheme } from '@/constants/colors';
import type { CabinetActivity, CabinetField } from '@/data/cabinet-activities';
import { utosFaceFieldIds, utosMeaningAnswers } from '@/data/utos-learning';

export type UtosLearningActivityProps = {
  activity: CabinetActivity;
  responses: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onComplete: () => void;
  completed: boolean;
  showErrors: boolean;
};

type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };

function ActivityHeading({ activity, completed }: Pick<UtosLearningActivityProps, 'activity' | 'completed'>) {
  return <>
    <Text style={s.eyebrow}>UTOS NG HARI</Text>
    <Text accessibilityRole="header" style={s.title}>{activity.title}</Text>
    <Text style={s.description}>{activity.description}</Text>
    <Text accessibilityLiveRegion="polite" style={s.saveStatus}>{completed ? 'Kumpleto · Naka-save sa device' : 'Awtomatikong nase-save ang iyong mga sagot sa device.'}</Text>
  </>;
}

function Action({ children, onPress, disabled = false, secondary = false, testID }: {
  children: string; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={children} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [s.button, secondary && s.secondaryButton, focused && s.focused, disabled && s.disabled, pressed && s.pressed]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{children}</Text>
  </Pressable>;
}

function Choices({ field, value, onChange, prefix }: {
  field: CabinetField; value?: string; onChange: UtosLearningActivityProps['onChange']; prefix: string;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const options = field.options ?? [];
  function onKey(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const directions: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number;
    if (event.key in directions) next = (index + directions[event.key] + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === ' ' || event.key === 'Enter') next = index;
    else return;
    event.preventDefault();
    onChange(field.id, options[next].value);
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
  return <View accessibilityRole="radiogroup" accessibilityLabel={field.label} style={s.choices}>
    {options.map((option, index) => {
      const selected = value === option.value;
      return <Pressable key={option.value} testID={`${prefix}-choice-${option.value}`} accessibilityRole="radio" accessibilityLabel={option.label}
        accessibilityState={{ checked: selected }} {...(Platform.OS === 'web' ? { 'aria-checked': selected, onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => onKey(event, index) } : {})}
        onPress={() => onChange(field.id, option.value)} onFocus={() => setFocused(option.value)} onBlur={() => setFocused(null)}
        style={({ pressed }) => [s.choice, selected && s.choiceSelected, focused === option.value && s.focused, pressed && s.pressed]}>
        <Text style={[s.choiceText, selected && s.bold]}>{option.label}</Text>
        <MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={AppTheme.primary} />
      </Pressable>;
    })}
  </View>;
}

function SchoolGate({ progress }: { progress: number }) {
  const open = progress === 3;
  const studentX = [26, 88, 158, 282][progress];
  return <View testID="utos-school-gate" style={s.gateArt} accessibilityLabel={open ? 'Bukas ang gate. Nakapasok na ang mag-aaral sa paaralan.' : `Sarado ang gate. ${progress} sa 3 tamang sagot.`}>
    <Svg width="100%" height="100%" viewBox="0 0 360 170" aria-hidden accessible={Platform.OS === 'web' ? undefined : false}>
      <Rect x="0" y="0" width="360" height="170" rx="14" fill={AppTheme.surfaceSoft} />
      <Path d="M0 149Q90 131 180 145T360 144V170H0Z" fill={AppTheme.successSurface} />
      <Path d="M210 54L271 17L334 54Z" fill={AppTheme.primary} />
      <Rect x="219" y="54" width="105" height="91" fill={AppTheme.panelStrong} stroke={AppTheme.primary} strokeWidth="2" />
      <Rect x="259" y="98" width="26" height="47" fill={AppTheme.dark} />
      {[231, 293].map(x => <G key={x}><Rect x={x} y="70" width="18" height="22" fill={AppTheme.surface} stroke={AppTheme.border} strokeWidth="2" /><Path d={`M${x + 9} 70V92M${x} 81H${x + 18}`} stroke={AppTheme.border} /></G>)}
      <Rect x="258" y="42" width="28" height="9" rx="2" fill={AppTheme.surface} />
      <Path d="M21 150H314" stroke={AppTheme.border} strokeWidth="3" strokeDasharray="8 5" />
      <G stroke={AppTheme.primary} strokeWidth="4" fill="none" strokeLinecap="round">
        <Path d="M193 147V80M237 147V80" />
        {open ? <Path d="M193 90L179 96V142L193 147M237 90L251 96V142L237 147" /> : <Path d="M193 92H237M193 137H237M202 93V137M215 93V137M228 93V137" />}
      </G>
      <G transform={`translate(${studentX} 0)`}>
        <Path d="M-8 122L-10 146M8 122L10 146" stroke={AppTheme.dark} strokeWidth="7" strokeLinecap="round" />
        <Path d="M-12 95Q0 86 12 95L10 124H-10Z" fill={AppTheme.success} />
        <Path d="M-12 98L-18 116M12 98L18 116" stroke="#C38F63" strokeWidth="6" strokeLinecap="round" />
        <Circle cx="0" cy="82" r="12" fill="#D5A271" />
        <Path d="M-12 81Q-16 62 1 66Q14 64 13 82L5 73L-5 73Z" fill={AppTheme.dark} />
        <Path d="M-10 148H-18M10 148H18" stroke={AppTheme.dark} strokeWidth="5" strokeLinecap="round" />
      </G>
      {open && <Path d="M325 109L331 116L344 99" stroke={AppTheme.success} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  </View>;
}

const meaningIds = ['literal', 'power', 'interpretation'] as const;

export function UtosMeaningsActivity({ activity, responses, onChange, onComplete, completed, showErrors }: UtosLearningActivityProps) {
  const correct = meaningIds.map(id => responses[id] === utosMeaningAnswers[id]);
  const firstMissing = correct.findIndex(value => !value);
  const prefix = firstMissing < 0 ? 3 : firstMissing;
  const [requestedStep, setStep] = useState(() => Math.min(prefix, 2));
  const step = Math.min(requestedStep, prefix, 2);
  const field = activity.fields.find(item => item.id === meaningIds[step])!;
  const ready = correct.every(Boolean);
  const chosen = responses[field.id];
  return <View style={s.root} testID="utos-meanings">
    <ActivityHeading activity={activity} completed={completed} />
    <SchoolGate progress={prefix} />
    <Text style={s.copy}>Piliin ang tamang sagot upang makalapit sa gate. Bubukas ito kapag nasagot nang tama ang tatlong tanong.</Text>
    <View style={s.steps}>{meaningIds.map((id, index) => <Action key={id} testID={`utos-meanings-step-${index}`} secondary={step !== index}
      disabled={index > prefix} onPress={() => setStep(index)}>{`Tanong ${index + 1}${correct[index] ? ' ✓' : ''}`}</Action>)}</View>
    <View style={s.paper}>
      <Text style={s.eyebrow}>TANONG {step + 1} SA 3</Text>
      <Text accessibilityRole="header" style={s.question}>{field.label}</Text>
      <Choices field={field} value={chosen} onChange={onChange} prefix={`utos-meanings-${field.id}`} />
      <Text accessibilityLiveRegion="polite" testID="utos-meanings-feedback" style={[s.feedback, chosen && !correct[step] ? s.errorText : s.successText]}>
        {chosen ? correct[step] ? ready ? 'Tama! Bukas na ang gate ng paaralan.' : 'Tama! Maaari ka nang magpatuloy sa susunod na tanong.' : 'Hindi pa tama. Sarado pa ang gate; subukan muli.' : 'Pumili ng sagot upang magpatuloy.'}
      </Text>
      <View style={s.actions}>
        {step > 0 && <Action secondary onPress={() => setStep(step - 1)}>Nakaraang tanong</Action>}
        {step < 2 ? <Action testID="utos-meanings-next" disabled={!correct[step]} onPress={() => setStep(step + 1)}>Susunod na tanong</Action>
          : <Action testID="utos-meanings-submit" disabled={!ready || completed} onPress={onComplete}>Ipasa</Action>}
      </View>
      {showErrors && !ready && <Text style={s.errorText}>Sagutin nang tama ang lahat ng tanong upang makumpleto ang gawain.</Text>}
    </View>
  </View>;
}

function SequenceCrown({ answers }: { answers: ('correct' | 'wrong' | 'empty')[] }) {
  const clipId = `utos-sequence-crown-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const correct = answers.filter(answer => answer === 'correct').length;
  const cracks = ['M42 45L55 60L49 78L61 96', 'M85 59L76 77L89 90L82 112', 'M123 35L115 60L130 76L118 93', 'M166 45L154 69L161 82L149 106', 'M59 113L72 126L66 143', 'M142 107L131 125L143 143'];
  return <View style={[s.crownArt, correct === 6 && s.crownGlow]} testID="utos-sequence-crown" accessibilityLabel={`${correct} sa 6 bahagi ng korona ang nabuo. ${answers.filter(answer => answer === 'wrong').length} bitak mula sa maling ayos.`}>
    <Svg width="100%" height="100%" viewBox="0 0 210 160" aria-hidden accessible={Platform.OS === 'web' ? undefined : false}>
      <Defs><ClipPath id={clipId}><Path d="M29 118L15 36L62 65L105 15L148 65L195 36L181 118Z" /></ClipPath></Defs>
      <Path d="M29 118L15 36L62 65L105 15L148 65L195 36L181 118Z" fill={AppTheme.panelStrong} />
      <G clipPath={`url(#${clipId})`}>{answers.map((answer, index) => <Rect key={index} x={15 + index * 30} y="15" width="30" height="105" fill={answer === 'correct' ? '#D5A843' : answer === 'wrong' ? '#C9AA8B' : AppTheme.panelStrong} />)}</G>
      <Path d="M29 118L15 36L62 65L105 15L148 65L195 36L181 118Z" fill="none" stroke={AppTheme.primary} strokeWidth="3" strokeLinejoin="round" />
      <Rect x="29" y="118" width="152" height="28" rx="5" fill={correct === 6 ? '#D5A843' : AppTheme.selected} stroke={AppTheme.primary} strokeWidth="3" />
      {[55, 105, 155].map(x => <Circle key={x} cx={x} cy="132" r="5" fill={AppTheme.success} />)}
      {answers.map((answer, index) => answer === 'wrong' && <Path key={index} d={cracks[index]} stroke={AppTheme.dark} strokeWidth="3" fill="none" strokeLinecap="round" />)}
    </Svg>
  </View>;
}

export function UtosSequenceActivity({ activity, responses, onChange, onComplete, completed, showErrors }: UtosLearningActivityProps) {
  const fields = activity.fields.filter(field => field.id.startsWith('position-'));
  const answers = fields.map((field, index) => !responses[field.id] ? 'empty' : responses[field.id] === String.fromCharCode(65 + index) ? 'correct' : 'wrong') as ('correct' | 'wrong' | 'empty')[];
  const ready = answers.every(answer => answer === 'correct');
  const [step, setStep] = useState(0);
  const field = fields[step];
  return <View style={s.root} testID="utos-sequence">
    <ActivityHeading activity={activity} completed={completed} />
    <SequenceCrown answers={answers} />
    <Text style={s.copy}>Nabubuo ang korona sa tamang ayos. Kapag may maling sagot, nagkakaroon ito ng bitak; itama ang sagot upang maayos ito.</Text>
    <Text accessibilityLiveRegion="polite" testID="utos-sequence-progress" style={s.progress}>{answers.filter(answer => answer === 'correct').length}/6 tamang ayos</Text>
    <View style={s.steps}>{fields.map((item, index) => <Action key={item.id} testID={`utos-sequence-step-${index}`} secondary={step !== index} onPress={() => setStep(index)}>{`${index + 1}${answers[index] === 'correct' ? ' ✓' : answers[index] === 'wrong' ? ' !' : ''}`}</Action>)}</View>
    <View style={s.paper}>
      <Text style={s.eyebrow}>BILANG {step + 1} SA 6</Text>
      <Text accessibilityRole="header" style={s.question}>{field.label}</Text>
      <Choices field={field} value={responses[field.id]} onChange={onChange} prefix={`utos-sequence-${field.id}`} />
      <Text accessibilityLiveRegion="polite" testID="utos-sequence-feedback" style={[s.feedback, answers[step] === 'wrong' ? s.errorText : s.successText]}>
        {answers[step] === 'correct' ? 'Tama ang puwesto ng pangyayaring ito. Naayos ang bahaging ito ng korona.' : answers[step] === 'wrong' ? 'May bitak ang korona. Balikan ang kuwento at pumili ng ibang pangyayari para sa bilang na ito.' : 'Piliin ang pangyayaring akma sa bilang na ito.'}
      </Text>
      <View style={s.actions}>
        {step > 0 && <Action secondary onPress={() => setStep(step - 1)}>Nakaraang bilang</Action>}
        {step < fields.length - 1 && <Action testID="utos-sequence-next" disabled={!responses[field.id]} onPress={() => setStep(step + 1)}>Susunod na bilang</Action>}
        <Action testID="utos-sequence-submit" disabled={!ready || completed} onPress={onComplete}>Ipasa</Action>
      </View>
      {showErrors && !ready && <Text style={s.errorText}>Ayusin ang anim na pangyayari bago ipasa ang gawain.</Text>}
    </View>
  </View>;
}

function FacePieceArt({ piece }: { piece: number }) {
  const clipId = `minyong-face-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const x = piece % 2 * 80, y = Math.floor(piece / 2) * 60;
  return <Svg width="100%" height="100%" viewBox={`${x} ${y} 80 60`} aria-hidden accessible={Platform.OS === 'web' ? undefined : false}>
    <Defs><ClipPath id={clipId}><Rect x={x} y={y} width="80" height="60" /></ClipPath></Defs>
    <G clipPath={`url(#${clipId})`}><UtosPortraitArt characterId="minyong" /></G>
  </Svg>;
}

function DraggableFacePiece({ piece, disabled, selected, children, onSelect, onStart, onMove, onDrop, onFinish }: {
  piece: number; disabled: boolean; selected: boolean; children: ReactNode;
  onSelect: (piece: number) => void; onStart: (piece: number, point: Point) => void;
  onMove: (point: Point) => void; onDrop: (piece: number, point: Point) => void; onFinish: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const pan = Gesture.Pan().enabled(!disabled).minDistance(8).runOnJS(true)
    .onStart(event => onStart(piece, { x: event.absoluteX, y: event.absoluteY }))
    .onUpdate(event => onMove({ x: event.absoluteX, y: event.absoluteY }))
    .onEnd(event => onDrop(piece, { x: event.absoluteX, y: event.absoluteY }))
    .onFinalize(onFinish);
  return <GestureDetector gesture={pan} touchAction="none">
    <Pressable testID={`utos-face-piece-${piece}`} accessibilityRole="button" accessibilityLabel={`Piraso ${piece + 1} ng mukha ni Minyong`}
      accessibilityHint="I-drag sa larawan, o piliin at saka pindutin ang puwesto." accessibilityState={{ disabled, selected }} disabled={disabled}
      onPress={() => onSelect(piece)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [s.faceTile, selected && s.faceSelected, disabled && s.facePlaced, focused && s.focused, pressed && s.pressed]}>
      {children}
    </Pressable>
  </GestureDetector>;
}

const faceTrayOrder = [4, 1, 5, 0, 3, 2];
const contains = (bounds: Bounds | null, point: Point) => Boolean(bounds && point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height);

function MinyongFacePuzzle({ responses, onChange }: Pick<UtosLearningActivityProps, 'responses' | 'onChange'>) {
  const placed = utosFaceFieldIds.map((id, index) => responses[id] === String(index));
  const complete = placed.every(Boolean);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [focusedTarget, setFocusedTarget] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [width, setWidth] = useState(0);
  const root = useRef<View>(null);
  const targets = useRef<(View | null)[]>([]);
  const bounds = useRef<(Bounds | null)[]>([]);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dragX = useSharedValue(0), dragY = useSharedValue(0);
  const floatingStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() }, { translateY: dragY.get() }] }));

  function move(point: Point) {
    dragX.set(Math.max(0, Math.min(width - 88, point.x - origin.current.x - 44)));
    dragY.set(point.y - origin.current.y - 33);
    const target = bounds.current.findIndex(value => contains(value, point));
    setOver(target < 0 ? null : target);
  }
  function start(piece: number, point: Point) {
    root.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
    targets.current.forEach((target, index) => target?.measureInWindow((x, y, w, h) => { bounds.current[index] = { x, y, width: w, height: h }; }));
    setSelected(piece);setDragging(piece);setNotice('');move(point);
  }
  function place(piece: number, target: number) {
    if (placed[piece]) return;
    if (piece !== target) { setNotice('Hindi tugma ang piraso sa puwestong ito. Subukan muli.');return; }
    onChange(utosFaceFieldIds[piece], String(piece));
    setSelected(null);setNotice(`Nailagay ang piraso ${piece + 1} sa tamang puwesto.`);
  }
  function drop(piece: number, point: Point) {
    // Re-measure at drop so scrolling or rotating never uses stale coordinates.
    void Promise.all(targets.current.map(target => new Promise<Bounds | null>(resolve => {
      if (!target) { resolve(null);return; }
      target.measureInWindow((x, y, w, h) => resolve({ x, y, width: w, height: h }));
    }))).then(measured => {
      const target = measured.findIndex(value => contains(value, point));
      if (target < 0) setNotice('Ihulog ang piraso sa larawan, o piliin ito at pindutin ang tamang puwesto.');
      else place(piece, target);
    });
  }
  function select(piece: number) {
    setSelected(piece);setNotice(`Napili ang piraso ${piece + 1}. Pindutin ang tamang puwesto sa larawan.`);
  }
  function finish() { setDragging(null);setOver(null); }

  return <View ref={root} testID="utos-face-puzzle" style={s.puzzle} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Text accessibilityRole="header" style={s.question}>Buuin ang mukha ni Minyong</Text>
    <Text style={s.copy}>I-drag ang bawat piraso sa tamang puwesto. Maaari ring piliin ang piraso at pindutin ang puwesto sa larawan.</Text>
    <View style={[s.puzzleLayout, width >= 540 && s.puzzleWide]}>
      <View testID="utos-face-board" style={s.faceBoard}>{utosFaceFieldIds.map((id, index) => <View key={id} ref={node => { targets.current[index] = node; }} collapsable={false} style={s.faceSlotWrap}>
        <Pressable testID={`utos-face-slot-${index}`} accessibilityRole="button" accessibilityLabel={`Puwesto ${index + 1}, ${placed[index] ? 'may tamang piraso' : 'walang piraso'}`}
          accessibilityHint={selected === null ? 'Pumili muna ng piraso sa ibaba.' : `Ilagay ang napiling piraso ${selected + 1}.`}
          onPress={() => selected === null ? setNotice('Pumili muna ng piraso sa ibaba ng larawan.') : place(selected, index)}
          onFocus={() => setFocusedTarget(index)} onBlur={() => setFocusedTarget(null)}
          style={({ pressed }) => [s.faceSlot, over === index && s.faceSelected, focusedTarget === index && s.focused, pressed && s.pressed]}>
          {placed[index] ? <FacePieceArt piece={index} /> : <Text style={s.faceSlotNumber}>{index + 1}</Text>}
        </Pressable>
      </View>)}</View>
      <View style={[s.faceTray, width >= 540 && s.faceTrayWide]} testID="utos-face-tray">{faceTrayOrder.map(piece => <DraggableFacePiece key={piece} piece={piece} disabled={placed[piece]} selected={selected === piece}
        onSelect={select} onStart={start} onMove={move} onDrop={drop} onFinish={finish}>
        <FacePieceArt piece={piece} /><View pointerEvents="none" style={s.pieceNumber}><Text style={s.pieceNumberText}>{placed[piece] ? '✓' : piece + 1}</Text></View>
      </DraggableFacePiece>)}</View>
    </View>
    <Text accessibilityLiveRegion="polite" testID="utos-face-feedback" style={[s.feedback, complete && s.successText]}>{complete ? 'Nabuo mo ang mukha ni Minyong! Maaari ka nang sumagot at magpahayag ng iyong paninindigan.' : notice || `${placed.filter(Boolean).length}/6 piraso ang nailagay.`}</Text>
    {dragging !== null && <Reanimated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.floatingPiece, floatingStyle]}><FacePieceArt piece={dragging} /></Reanimated.View>}
  </View>;
}

export function UtosReflectionActivity({ activity, responses, onChange, onComplete, completed, showErrors }: UtosLearningActivityProps) {
  const faceComplete = utosFaceFieldIds.every((id, index) => responses[id] === String(index));
  const meaning = activity.fields.find(field => field.id === 'meaning')!;
  const reflection = activity.fields.find(field => field.id === 'reflection')!;
  const correct = responses.meaning === 'A';
  const ready = faceComplete && correct && Boolean(responses.reflection?.trim());
  return <View style={s.root} testID="utos-reflection">
    <ActivityHeading activity={activity} completed={completed} />
    <MinyongFacePuzzle responses={responses} onChange={onChange} />
    {faceComplete && <View style={s.paper}>
      <Text accessibilityRole="header" style={s.question}>{meaning.label}</Text>
      <Choices field={meaning} value={responses.meaning} onChange={onChange} prefix="utos-reflection-meaning" />
      <Text accessibilityLiveRegion="polite" testID="utos-reflection-feedback" style={[s.feedback, responses.meaning && !correct ? s.errorText : s.successText]}>
        {correct ? 'Tama! Iugnay ang aral ng kuwento sa iyong sariling paninindigan.' : responses.meaning ? 'Balikan ang paninindigan ni Jojo at subukan muli.' : 'Piliin ang tamang sagot.'}
      </Text>
      <Text style={s.question}>{reflection.label}</Text>
      <TextInput testID="utos-reflection-answer" accessibilityLabel={reflection.label} multiline textAlignVertical="top" value={responses.reflection ?? ''}
        onChangeText={value => onChange('reflection', value)} placeholder="Isulat at ipaliwanag ang iyong paninindigan…" placeholderTextColor={AppTheme.muted}
        style={[s.reflectionInput, showErrors && !responses.reflection?.trim() && s.invalidInput]} />
      {showErrors && !responses.reflection?.trim() && <Text style={s.errorText}>Ipaliwanag muna ang iyong paninindigan.</Text>}
      <View style={s.actions}><Action testID="utos-reflection-submit" disabled={!ready || completed} onPress={onComplete}>Ipasa</Action></View>
      <Text style={s.footer}>Naka-save sa device ang iyong sagot. Ang guro ang susuri sa iyong paliwanag.</Text>
    </View>}
  </View>;
}

const s = StyleSheet.create({
  root: { width: '100%', maxWidth: 720 },
  eyebrow: { color: AppTheme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, lineHeight: 18 },
  title: { color: AppTheme.text, fontSize: 28, fontWeight: '900', lineHeight: 36, marginTop: 5 },
  description: { color: AppTheme.text, fontSize: 15, lineHeight: 24, marginTop: 12 },
  saveStatus: { color: AppTheme.success, fontSize: 12, lineHeight: 20, marginTop: 12, marginBottom: 20 },
  paper: { borderWidth: 1, borderColor: AppTheme.border, borderRadius: 16, backgroundColor: AppTheme.surface, padding: 16, marginTop: 14 },
  question: { color: AppTheme.text, fontSize: 17, fontWeight: '800', lineHeight: 26, marginBottom: 13 },
  copy: { color: AppTheme.muted, fontSize: 14, lineHeight: 22, marginVertical: 12 },
  choices: { gap: 10 }, choice: { minHeight: 56, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 10, backgroundColor: AppTheme.surface, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  choiceSelected: { backgroundColor: AppTheme.selected, borderColor: AppTheme.primary }, choiceText: { color: AppTheme.text, fontSize: 15, lineHeight: 23, flex: 1 }, bold: { fontWeight: '700' },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  button: { minHeight: 48, borderWidth: 2, borderColor: AppTheme.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: AppTheme.primary },
  buttonText: { color: AppTheme.buttonText, fontSize: 14, fontWeight: '800', lineHeight: 21, textAlign: 'center' }, secondaryButton: { backgroundColor: AppTheme.surfaceSoft, borderColor: AppTheme.border }, secondaryText: { color: AppTheme.text },
  disabled: { opacity: 0.48 }, pressed: { opacity: 0.8 }, focused: { borderColor: AppTheme.primary, outlineColor: AppTheme.primary, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 },
  feedback: { color: AppTheme.muted, fontSize: 13, lineHeight: 21, marginTop: 14 }, errorText: { color: AppTheme.error, fontSize: 13, lineHeight: 21 }, successText: { color: AppTheme.success },
  gateArt: { width: '100%', aspectRatio: 360 / 170, maxHeight: 260 }, crownArt: { width: 210, height: 160, alignSelf: 'center', borderRadius: 50 }, crownGlow: { backgroundColor: AppTheme.selected, boxShadow: '0 0 25px #DAB05188' }, progress: { color: AppTheme.primary, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
  puzzle: { borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, borderRadius: 16, padding: 14, marginBottom: 8, position: 'relative' },
  puzzleLayout: { alignItems: 'center', gap: 18 }, puzzleWide: { flexDirection: 'row', justifyContent: 'center' },
  faceBoard: { width: 220, height: 248, borderWidth: 3, borderColor: AppTheme.primary, borderRadius: 7, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: AppTheme.panelStrong },
  faceSlotWrap: { width: '50%', height: '33.333333%' }, faceSlot: { width: '100%', height: '100%', borderWidth: 1, borderColor: AppTheme.border, justifyContent: 'center', alignItems: 'center' }, faceSlotNumber: { color: AppTheme.muted, fontSize: 24, fontWeight: '800' },
  faceTray: { width: '100%', maxWidth: 292, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }, faceTrayWide: { width: 260 }, faceTile: { width: 82, height: 64, borderRadius: 7, overflow: 'hidden', borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surface },
  faceSelected: { borderColor: AppTheme.primary, borderWidth: 3, backgroundColor: AppTheme.selected }, facePlaced: { opacity: 0.35 },
  pieceNumber: { position: 'absolute', left: 2, bottom: 2, borderRadius: 8, backgroundColor: AppTheme.surface, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }, pieceNumberText: { color: AppTheme.text, fontWeight: '800', fontSize: 11 },
  floatingPiece: { position: 'absolute', top: 0, left: 0, width: 88, height: 66, borderWidth: 2, borderColor: AppTheme.primary, borderRadius: 5, overflow: 'hidden', zIndex: 20, boxShadow: '0 4px 14px #35291F44' },
  reflectionInput: { minHeight: 150, backgroundColor: AppTheme.surface, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 10, padding: 12, color: AppTheme.text, fontSize: 16, lineHeight: 25 }, invalidInput: { borderColor: AppTheme.error }, footer: { color: AppTheme.muted, fontSize: 12, lineHeight: 20, marginTop: 16 },
});
