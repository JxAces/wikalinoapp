import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { ugatClues, ugatIdeaCards, ugatMapZones, type UgatZoneId } from '@/data/ugat-learning';
import { getCabinetActivity, getUgatMapSelection, isCabinetResponseComplete } from '@/data/cabinet-activities';

type Props = {
  responses: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onComplete: () => void;
  completed: boolean;
  onViewChange?: () => void;
};

function TreeArt({ roots = false }: { roots?: boolean }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%" viewBox="0 0 400 380" preserveAspectRatio="none" aria-hidden={true} accessible={Platform.OS === 'web' ? undefined : false}>
      <Ellipse cx="200" cy="129" rx="177" ry="111" fill="#3D6B47" />
      <Path d="M55 131 Q19 63 96 57 Q124 0 182 39 Q235 1 279 42 Q372 36 351 113 Q391 188 301 203 Q248 251 202 208 Q109 250 84 193 Q32 200 55 131Z" fill="#5B844E" stroke="#89A666" strokeWidth="2" />
      <Path d="M183 280 L189 143 L122 103 M206 282 L210 149 L279 96 M200 209 L205 74" fill="none" stroke="#A77344" strokeWidth="19" strokeLinecap="round" />
      <Path d="M195 274 L201 163" stroke="#E0B67A" strokeWidth="4" strokeLinecap="round" />
      <Path d="M0 288 Q91 265 182 280 Q278 265 400 289 V380 H0Z" fill="#3C4B31" />
      <Path d="M0 287 Q91 264 182 279 Q278 264 400 288" fill="none" stroke="#94A965" strokeWidth="3" />
      {roots && <G stroke={AppTheme.panelStrong} fill="none" strokeLinecap="round"><Path d="M190 281 Q176 324 81 340 M205 281 Q223 326 326 340 M196 286 L172 355 M207 302 L236 357" strokeWidth="10" /><Path d="M132 331 L106 356 M272 333 L298 354" strokeWidth="4" /></G>}
    </Svg>
  </View>;
}

export function UgatExploreActivity({ responses, onChange, onComplete, completed }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const viewed = ugatClues.filter(clue => responses[`viewed-${clue.id}`] === 'viewed').length;
  const rootsVisible = viewed === ugatClues.length;
  const clue = active === null ? null : ugatClues[active];
  return <View style={s.section}>
    <Text accessibilityLiveRegion="polite" style={s.helper}>{viewed}/4 pahiwatig na natingnan</Text>
    <View testID="ugat-explore-tree" style={s.exploreTree}>
      <TreeArt roots={rootsVisible} />
      <View style={s.leaves}>
        {ugatClues.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}${responses[`viewed-${item.id}`] === 'viewed' ? ', natingnan' : ''}`} onPress={() => {
          setActive(index);
          if (responses[`viewed-${item.id}`] !== 'viewed') onChange(`viewed-${item.id}`, 'viewed');
        }} style={({ pressed }) => [s.leaf, responses[`viewed-${item.id}`] === 'viewed' && s.selected, pressed && s.pressed]}>
          <MaterialCommunityIcons name={responses[`viewed-${item.id}`] === 'viewed' ? 'check-circle-outline' : 'leaf'} color={AppTheme.primary} size={24} />
          <Text style={s.leafLabel}>{item.title}</Text>
        </Pressable>)}
      </View>
      {!rootsVisible && <View style={s.mystery}><Text style={s.questionMarks}>?   ?   ?</Text><Text style={s.mysteryLabel}>UGAT NG KUWENTO</Text></View>}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.helper}>{rootsVisible ? 'Nabunyag na ang mga ugat matapos mong tingnan ang apat na pahiwatig.' : 'Nakatago pa ang mga ugat. Tuklasin muna ang mga pangyayari sa ibabaw.'}</Text>
    <Pressable testID="ugat-explore-submit" accessibilityRole="button" accessibilityLabel={completed ? 'Kumpleto na' : 'Ipasa'} accessibilityState={{ disabled: !rootsVisible || completed }} disabled={!rootsVisible || completed} onPress={onComplete} style={({ pressed }) => [s.primary, (!rootsVisible || completed) && s.disabled, pressed && s.pressed]}><Text style={s.primaryText}>{completed ? '✓ Kumpleto na' : 'Ipasa'}</Text></Pressable>
    <Text style={s.helper}>Ang paggalugad ay kumpleto kapag natingnan ang apat na pahiwatig. Hindi ito pagsusulit.</Text>
    <Modal visible={clue !== null} transparent animationType="none" onRequestClose={() => setActive(null)}>
      <View style={s.scrim}><View accessibilityViewIsModal aria-modal={true} role="dialog" accessibilityLabel={clue?.title ?? 'Pahiwatig'} style={s.dialog}>
        <View style={s.dialogHeader}><Text accessibilityRole="header" style={s.paperTitle}>{clue?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Isara ang pahiwatig" onPress={() => setActive(null)} style={s.close}><MaterialCommunityIcons name="close" size={24} color={AppTheme.primary} /></Pressable></View>
        <ScrollView contentContainerStyle={s.paperBody}>{clue?.paragraphs.map(paragraph => <Text key={paragraph} selectable style={s.paperText}>{paragraph}</Text>)}</ScrollView>
        <Pressable accessibilityRole="button" onPress={() => setActive(null)} style={s.primary}><Text style={s.primaryText}>Bumalik sa puno</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

type MapStage = 0 | 1;
type NavigationKey = { key: string; preventDefault: () => void };
const mapStages = ['Pumili', 'Ipaliwanag'] as const;

function keyboardIndex(event: NavigationKey, index: number, length: number) {
  let next: number;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + length - 1) % length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = length - 1;
  else if (event.key === ' ' || event.key === 'Spacebar') next = index;
  else return null;
  event.preventDefault();
  return next;
}

export function UgatTreeMapActivity({ responses, onChange, onComplete, completed, onViewChange }: Props) {
  const selection = getUgatMapSelection(responses);
  const [stage, setStage] = useState<MapStage>(() => completed && selection ? 1 : 0);
  const [cardIndex, setCardIndex] = useState(() => selection ? ugatIdeaCards.findIndex(card => card.id === selection.card.id) : 0);
  const [notice, setNotice] = useState('');
  const [attempted, setAttempted] = useState(false);
  const stageRefs = useRef<(View | null)[]>([]);
  const choiceRefs = useRef<Partial<Record<UgatZoneId, View | null>>>({});
  const evidenceRef = useRef<TextInput | null>(null);
  const currentCard = ugatIdeaCards[cardIndex];
  const definition = getCabinetActivity('m1-story-2', 'ugat-tree-map')!;
  const ready = isCabinetResponseComplete(definition, responses);
  const chosenZone = selection?.card.id === currentCard.id ? selection.zone : null;

  function changeStage(next: MapStage) {
    if (stage === next) return;
    setStage(next);
    setNotice('');
    onViewChange?.();
  }
  function place(zone: UgatZoneId) {
    if (selection?.card.id === currentCard.id && selection.zone.id === zone) return;
    const evidence = selection?.card.id === currentCard.id ? responses[`note-${selection.zone.id}`] ?? '' : '';
    // The marker makes one idea active while retaining older saved work.
    onChange('selected-idea', currentCard.id);
    onChange(`card-${currentCard.id}`, zone);
    onChange(`note-${zone}`, evidence);
    setAttempted(false);
    setNotice(`Napili ang Ideya ${cardIndex + 1} bilang ${ugatMapZones.find(item => item.id === zone)?.title}. Ito lamang ang ipaliliwanag.`);
  }
  function moveIdea(next: number) {
    setCardIndex(next);
    setNotice('');
  }

  return <View style={s.section}>
    <View accessibilityRole="tablist" accessibilityLabel="Mga hakbang sa Banyuhay" style={s.stageTabs}>
      {mapStages.map((label, index) => <Pressable key={label} testID={`ugat-map-stage-${index + 1}`} ref={node => { stageRefs.current[index] = node; }} accessibilityRole="tab" accessibilityLabel={`Hakbang ${index + 1}: ${label}`} accessibilityState={{ selected: stage === index }} aria-selected={stage === index} onPress={() => changeStage(index as MapStage)} {...(Platform.OS === 'web' ? { tabIndex: stage === index ? 0 : -1, onKeyDown: (event: NavigationKey) => {
        const next = keyboardIndex(event, index, mapStages.length);
        if (next !== null) { changeStage(next as MapStage); stageRefs.current[next]?.focus(); }
      } } : {})} style={({ pressed }) => [s.stageTab, stage === index && s.selected, pressed && s.pressed]}>
        <Text style={s.stepNumber}>{index + 1}</Text><Text style={s.stageLabel}>{label}</Text>
      </Pressable>)}
    </View>

    {stage === 0 && <View testID="ugat-map-stage-panel-1" style={s.stageContent}>
      <Text accessibilityRole="header" style={s.panelTitle}>1. Pumili</Text>
      <Text style={s.light}>Pumili ng isang ideya at kategoryang babagay dito. Isa lamang ang ipaliliwanag.</Text>
      <View style={s.pager}>
        <Pressable testID="ugat-idea-previous" accessibilityRole="button" accessibilityLabel="Nakaraang ideya" accessibilityState={{ disabled: cardIndex === 0 }} disabled={cardIndex === 0} onPress={() => moveIdea(cardIndex - 1)} style={[s.ideaArrow, cardIndex === 0 && s.disabled]}><MaterialCommunityIcons name="arrow-left" size={25} color={AppTheme.primary} /></Pressable>
        <Text accessibilityLiveRegion="polite" style={s.progressLabel}>IDEYA {cardIndex + 1} / {ugatIdeaCards.length}</Text>
        <Pressable testID="ugat-idea-next" accessibilityRole="button" accessibilityLabel="Susunod na ideya" accessibilityState={{ disabled: cardIndex === ugatIdeaCards.length - 1 }} disabled={cardIndex === ugatIdeaCards.length - 1} onPress={() => moveIdea(cardIndex + 1)} style={[s.ideaArrow, cardIndex === ugatIdeaCards.length - 1 && s.disabled]}><MaterialCommunityIcons name="arrow-right" size={25} color={AppTheme.primary} /></Pressable>
      </View>
      <View testID="ugat-map-current-idea" style={s.idea}><Text style={s.paperText}>{currentCard.text}</Text><Text style={s.paperSmall}>{chosenZone ? `Napiling ideya · ${chosenZone.title}` : 'Pumili ng kategorya upang piliin ang ideyang ito.'}</Text></View>
      <View accessibilityRole="radiogroup" accessibilityLabel={`Kategorya para sa Ideya ${cardIndex + 1}`} style={s.categoryChoices}>
        {ugatMapZones.map((zone, index) => <Pressable key={zone.id} testID={`ugat-map-category-${zone.id}`} ref={node => { choiceRefs.current[zone.id] = node; }} accessibilityRole="radio" accessibilityLabel={`${zone.title}. ${zone.helper}`} accessibilityState={{ checked: chosenZone?.id === zone.id }} aria-checked={chosenZone?.id === zone.id} onPress={() => place(zone.id)} {...(Platform.OS === 'web' ? { tabIndex: chosenZone ? chosenZone.id === zone.id ? 0 : -1 : index === 0 ? 0 : -1, onKeyDown: (event: NavigationKey) => {
          const next = keyboardIndex(event, index, ugatMapZones.length);
          if (next !== null) { place(ugatMapZones[next].id); choiceRefs.current[ugatMapZones[next].id]?.focus(); }
        } } : {})} style={({ pressed }) => [s.categoryChoice, chosenZone?.id === zone.id && s.selected, pressed && s.pressed]}>
          <MaterialCommunityIcons name={chosenZone?.id === zone.id ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={AppTheme.primary} />
          <View style={s.choiceCopy}><Text style={s.choiceTitle}>{zone.title}</Text><Text style={[s.helper, s.categoryHelp]}>{zone.helper}</Text></View>
        </Pressable>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={s.helper}>{notice || (selection ? `Napili ang Ideya ${ugatIdeaCards.findIndex(card => card.id === selection.card.id) + 1} bilang ${selection.zone.title}. Ang pagpili ng iba ay papalit dito.` : 'Wala pang napiling ideya. Pumili ng isang kategorya sa ideyang nais mong ipaliwanag.')}</Text>
    </View>}

    {stage === 1 && <View testID="ugat-map-stage-panel-2" style={s.stageContent}>
      <Text accessibilityRole="header" style={s.panelTitle}>2. Ipaliwanag</Text>
      {selection ? <>
        <Text style={s.light}>Ipaliwanag ang napiling ideya gamit ang patunay mula sa kuwento.</Text>
        <View style={s.panel}>
          <Text accessibilityRole="header" style={s.panelTitle}>{selection.zone.title}</Text>
          <Text style={s.light}>{selection.zone.prompt}</Text>
          <Text style={s.progressLabel}>ANG NAPILING IDEYA</Text>
          <View style={s.assignedCard}><Text style={s.paperText}>{selection.card.text}</Text></View>
          <Text nativeID="ugat-map-evidence-label" style={s.progressLabel}>PATUNAY MULA SA KUWENTO</Text>
          <TextInput ref={evidenceRef} key={`${selection.card.id}-${selection.zone.id}`} testID={`ugat-map-note-${selection.zone.id}`} accessibilityLabel={`Patunay mula sa kuwento para sa ${selection.zone.title}`} accessibilityLabelledBy="ugat-map-evidence-label" multiline textAlignVertical="top" value={responses[`note-${selection.zone.id}`] ?? ''} onChangeText={text => onChange(`note-${selection.zone.id}`, text)} placeholder="Magbigay ng pangyayari o pahayag mula sa kuwento na sumusuporta sa napiling ideya…" placeholderTextColor={AppTheme.muted} style={s.input} />
          {attempted && !ready && <Text accessibilityRole="alert" style={s.error}>Magbigay ng patunay mula sa kuwento bago ipasa.</Text>}
        </View>
        <Pressable testID="ugat-map-submit" accessibilityRole="button" accessibilityLabel={completed ? 'Kumpleto na' : 'Ipasa'} accessibilityState={{ disabled: completed }} disabled={completed} onPress={() => { setAttempted(true); if (ready) onComplete(); else evidenceRef.current?.focus(); }} style={({ pressed }) => [s.primary, completed && s.disabled, pressed && s.pressed]}><Text style={s.primaryText}>{completed ? '✓ Kumpleto na' : 'Ipasa'}</Text></Pressable>
      </> : <Text accessibilityRole="alert" style={s.helper}>Pumili muna ng isang ideya at kategorya sa Pumili.</Text>}
    </View>}

    <View style={s.stageNavigation}>
      {stage > 0 && <Pressable testID="ugat-map-previous-stage" accessibilityRole="button" accessibilityLabel={`Bumalik sa hakbang ${stage}: ${mapStages[stage - 1]}`} onPress={() => changeStage((stage - 1) as MapStage)} style={s.secondary}><MaterialCommunityIcons name="arrow-left" size={20} color={AppTheme.primary} /><Text style={s.linkText}>Bumalik</Text></Pressable>}
      {stage === 0 && <Pressable testID="ugat-map-next-stage" accessibilityRole="button" accessibilityLabel="Susunod: Ipaliwanag" accessibilityState={{ disabled: !selection }} disabled={!selection} onPress={() => changeStage(1)} style={({ pressed }) => [s.secondary, s.nextStage, !selection && s.disabled, pressed && s.pressed]}><Text style={[s.linkText, s.choiceCopy]}>Susunod: Ipaliwanag</Text><MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.primary} /></Pressable>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  section: { marginTop: 18, gap: 12 }, helper: { color: AppTheme.muted, fontSize: 12, lineHeight: 20 }, light: { color: AppTheme.text, fontSize: 14, lineHeight: 22 },
  exploreTree: { minHeight: 355, borderRadius: 22, overflow: 'hidden', backgroundColor: AppTheme.surfaceSoft, justifyContent: 'space-between' },
  leaves: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20 },
  leaf: { width: '46%', flexGrow: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderTopLeftRadius: 28, borderBottomRightRadius: 28, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft },
  selected: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected }, leafLabel: { color: AppTheme.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  mystery: { alignItems: 'center', padding: 17, marginTop: 67 }, questionMarks: { color: AppTheme.surfaceSoft, fontSize: 24, fontWeight: '800', letterSpacing: 5 }, mysteryLabel: { color: AppTheme.surfaceSoft, fontSize: 12, lineHeight: 20 },
  primary: { minHeight: 48, backgroundColor: AppTheme.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 13 }, primaryText: { color: AppTheme.buttonText, fontWeight: '800', fontSize: 14 }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.8 },
  scrim: { flex: 1, backgroundColor: AppTheme.overlay, padding: 20, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 620, maxHeight: '90%', backgroundColor: AppTheme.surface, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: AppTheme.border, flexShrink: 1 },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, paperTitle: { color: AppTheme.text, fontSize: 24, fontWeight: '900', flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, paperBody: { paddingVertical: 14, gap: 14 }, paperText: { fontSize: 15, lineHeight: 25, color: AppTheme.text }, paperSmall: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, marginTop: 8 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, ideaArrow: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border }, idea: { backgroundColor: AppTheme.surfaceSoft, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: AppTheme.border },
  stageTabs: { flexDirection: 'row', gap: 7 }, stageTab: { flex: 1, minWidth: 0, minHeight: 80, paddingVertical: 10, paddingHorizontal: 5, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, alignItems: 'center', justifyContent: 'center', gap: 5 },
  stepNumber: { color: AppTheme.primary, fontSize: 18, fontWeight: '900' }, stageLabel: { color: AppTheme.text, fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center' }, stageContent: { gap: 14 }, progressLabel: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, fontWeight: '800' },
  categoryChoices: { gap: 10 }, categoryChoice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft }, choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { color: AppTheme.text, fontSize: 16, lineHeight: 24, fontWeight: '800' }, categoryHelp: { fontSize: 14, lineHeight: 22, marginTop: 2 },
  secondary: { minHeight: 48, minWidth: 0, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 1 }, linkText: { color: AppTheme.primary, fontSize: 14, lineHeight: 22, fontWeight: '800' }, stageNavigation: { flexDirection: 'row', alignItems: 'center', gap: 10 }, nextStage: { flex: 1 },
  panel: { padding: 15, backgroundColor: AppTheme.panel, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 14, gap: 10 }, panelTitle: { color: AppTheme.text, fontSize: 19, fontWeight: '800' },
  assignedCard: { backgroundColor: AppTheme.surface, borderRadius: 10, padding: 12 },
  input: { backgroundColor: AppTheme.surface, color: AppTheme.text, fontSize: 16, lineHeight: 24, minHeight: 100, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: AppTheme.border }, error: { color: AppTheme.error, fontSize: 12, lineHeight: 20 },
});
