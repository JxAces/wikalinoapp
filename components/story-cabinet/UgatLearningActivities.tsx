import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { ugatClues, ugatIdeaCards, ugatZones, type UgatZoneId } from '@/data/ugat-learning';
import { getCabinetActivity, isCabinetResponseComplete } from '@/data/cabinet-activities';

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
      {roots && <G stroke="#B48555" fill="none" strokeLinecap="round"><Path d="M190 281 Q176 324 81 340 M205 281 Q223 326 326 340 M196 286 L172 355 M207 302 L236 357" strokeWidth="10" /><Path d="M132 331 L106 356 M272 333 L298 354" strokeWidth="4" /></G>}
    </Svg>
  </View>;
}

export function UgatExploreActivity({ responses, onChange, onComplete, completed }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const viewed = ugatClues.filter(clue => responses[`viewed-${clue.id}`] === 'viewed').length;
  const clue = active === null ? null : ugatClues[active];
  return <View style={s.section}>
    <Text accessibilityLiveRegion="polite" style={s.helper}>{viewed}/4 pahiwatig na natingnan</Text>
    <View style={s.exploreTree}>
      <TreeArt />
      <View style={s.leaves}>
        {ugatClues.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}${responses[`viewed-${item.id}`] === 'viewed' ? ', natingnan' : ''}`} onPress={() => {
          setActive(index);
          if (responses[`viewed-${item.id}`] !== 'viewed') onChange(`viewed-${item.id}`, 'viewed');
        }} style={({ pressed }) => [s.leaf, responses[`viewed-${item.id}`] === 'viewed' && s.selected, pressed && s.pressed]}>
          <MaterialCommunityIcons name={responses[`viewed-${item.id}`] === 'viewed' ? 'check-circle-outline' : 'leaf'} color={AppTheme.primary} size={24} />
          <Text style={s.leafLabel}>{item.title}</Text>
        </Pressable>)}
      </View>
      <View style={s.mystery}><Text style={s.questionMarks}>?   ?   ?</Text><Text style={s.helper}>UGAT NG KUWENTO</Text></View>
    </View>
    <Text style={s.helper}>Nakatago pa ang mga ugat. Tuklasin muna ang mga pangyayari sa ibabaw.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Ipasa" accessibilityState={{ disabled: viewed < 4 || completed }} disabled={viewed < 4 || completed} onPress={onComplete} style={[s.primary, (viewed < 4 || completed) && s.disabled]}><Text style={s.primaryText}>Ipasa</Text></Pressable>
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

type MapStage = 0 | 1 | 2;
type NavigationKey = { key: string; preventDefault: () => void };
const mapStages = ['Piliin', 'Ipaliwanag', 'Buuin ang sagot'] as const;

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
  const [stage, setStage] = useState<MapStage>(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [activeZone, setActiveZone] = useState<UgatZoneId>('root');
  const [notice, setNotice] = useState('');
  const [attempted, setAttempted] = useState(false);
  const stageRefs = useRef<(View | null)[]>([]);
  const choiceRefs = useRef<Partial<Record<UgatZoneId, View | null>>>({});
  const noteTabRefs = useRef<Partial<Record<UgatZoneId, View | null>>>({});
  const summaryRefs = useRef<Record<string, TextInput | null>>({});
  const currentCard = ugatIdeaCards[cardIndex];
  const zoneIndex = ugatZones.findIndex(zone => zone.id === activeZone);
  const currentZone = ugatZones[zoneIndex];
  const definition = getCabinetActivity('m1-story-2', 'ugat-tree-map')!;
  const summaryFields = definition.fields.filter(field => field.id.startsWith('synthesis-'));
  const ready = isCabinetResponseComplete(definition, responses);
  const assigned = ugatIdeaCards.filter(card => ugatZones.some(zone => zone.id === responses[`card-${card.id}`])).length;
  const explained = ugatZones.filter(zone => responses[`note-${zone.id}`]?.trim()).length;
  const summarized = summaryFields.filter(field => responses[field.id]?.trim()).length;
  const chosenZone = ugatZones.find(zone => zone.id === responses[`card-${currentCard.id}`]);
  const assignedIdeas = ugatIdeaCards.filter(card => responses[`card-${card.id}`] === activeZone);
  const missing: { id: string; label: string; stage: MapStage; card?: number; zone?: UgatZoneId }[] = [
    ...ugatIdeaCards.flatMap((card, index) => ugatZones.some(zone => zone.id === responses[`card-${card.id}`]) ? [] : [{ id: `card-${card.id}`, label: `Ideya ${index + 1}: pumili ng kategorya.`, stage: 0 as MapStage, card: index }]),
    ...ugatZones.flatMap(zone => [
      ...(!ugatIdeaCards.some(card => responses[`card-${card.id}`] === zone.id) ? [{ id: `category-${zone.id}`, label: `${zone.title}: maglagay ng kahit isang ideya.`, stage: 0 as MapStage }] : []),
      ...(!responses[`note-${zone.id}`]?.trim() ? [{ id: `note-${zone.id}`, label: `${zone.title}: isulat ang paliwanag.`, stage: 1 as MapStage, zone: zone.id }] : []),
    ]),
    ...summaryFields.filter(field => !responses[field.id]?.trim()).map(field => ({ id: field.id, label: field.label, stage: 2 as MapStage })),
  ];

  function changeStage(next: MapStage) {
    if (stage === next) return;
    setStage(next);
    setNotice('');
    onViewChange?.();
  }
  function place(zone: UgatZoneId) {
    if (responses[`card-${currentCard.id}`] === zone) return;
    onChange(`card-${currentCard.id}`, zone);
    setNotice(`Ideya ${cardIndex + 1}: napili ang ${ugatZones.find(item => item.id === zone)?.title}. Maaari mong baguhin ang pagpili.`);
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
      <Text accessibilityRole="header" style={s.panelTitle}>1. Piliin</Text>
      <Text style={s.light}>Basahin ang ideya. Pumili ng kategoryang babagay dito.</Text>
      <View style={s.pager}>
        <Pressable testID="ugat-idea-previous" accessibilityRole="button" accessibilityLabel="Nakaraang ideya" accessibilityState={{ disabled: cardIndex === 0 }} disabled={cardIndex === 0} onPress={() => moveIdea(cardIndex - 1)} style={[s.ideaArrow, cardIndex === 0 && s.disabled]}><MaterialCommunityIcons name="arrow-left" size={25} color={AppTheme.primary} /></Pressable>
        <Text accessibilityLiveRegion="polite" style={s.progressLabel}>IDEYA {cardIndex + 1} / {ugatIdeaCards.length}</Text>
        <Pressable testID="ugat-idea-next" accessibilityRole="button" accessibilityLabel="Susunod na ideya" accessibilityState={{ disabled: cardIndex === ugatIdeaCards.length - 1 }} disabled={cardIndex === ugatIdeaCards.length - 1} onPress={() => moveIdea(cardIndex + 1)} style={[s.ideaArrow, cardIndex === ugatIdeaCards.length - 1 && s.disabled]}><MaterialCommunityIcons name="arrow-right" size={25} color={AppTheme.primary} /></Pressable>
      </View>
      <View testID="ugat-map-current-idea" style={s.idea}><Text style={s.paperText}>{currentCard.text}</Text><Text style={s.paperSmall}>{chosenZone ? `Napili: ${chosenZone.title}` : 'Wala pang napipiling kategorya.'}</Text></View>
      <View accessibilityRole="radiogroup" accessibilityLabel={`Kategorya para sa Ideya ${cardIndex + 1}`} style={s.categoryChoices}>
        {ugatZones.map((zone, index) => <Pressable key={zone.id} testID={`ugat-map-category-${zone.id}`} ref={node => { choiceRefs.current[zone.id] = node; }} accessibilityRole="radio" accessibilityLabel={`${zone.title}. ${zone.helper}`} accessibilityState={{ checked: chosenZone?.id === zone.id }} aria-checked={chosenZone?.id === zone.id} onPress={() => place(zone.id)} {...(Platform.OS === 'web' ? { tabIndex: chosenZone ? chosenZone.id === zone.id ? 0 : -1 : index === 0 ? 0 : -1, onKeyDown: (event: NavigationKey) => {
          const next = keyboardIndex(event, index, ugatZones.length);
          if (next !== null) { place(ugatZones[next].id); choiceRefs.current[ugatZones[next].id]?.focus(); }
        } } : {})} style={({ pressed }) => [s.categoryChoice, chosenZone?.id === zone.id && s.selected, pressed && s.pressed]}>
          <MaterialCommunityIcons name={chosenZone?.id === zone.id ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={AppTheme.primary} />
          <View style={s.choiceCopy}><Text style={s.choiceTitle}>{zone.title}</Text><Text style={[s.helper, s.categoryHelp]}>{zone.helper}</Text></View>
        </Pressable>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={s.helper}>{notice || `${assigned}/${ugatIdeaCards.length} ideya ang may kategorya. Maaari mong baguhin ang pagpili.`}</Text>
    </View>}

    {stage === 1 && <View testID="ugat-map-stage-panel-2" style={s.stageContent}>
      <Text accessibilityRole="header" style={s.panelTitle}>2. Ipaliwanag</Text>
      <Text style={s.light}>Basahin ang mga ideyang inilagay ninyo. Sagutin ang tanong sa bawat kategorya.</Text>
      <View accessibilityRole="tablist" accessibilityLabel="Mga kategoryang ipaliliwanag" style={s.noteTabs}>
        {ugatZones.map((zone, index) => <Pressable key={zone.id} testID={`ugat-map-note-tab-${zone.id}`} ref={node => { noteTabRefs.current[zone.id] = node; }} accessibilityRole="tab" accessibilityLabel={`${index + 1}. ${zone.title}`} accessibilityState={{ selected: activeZone === zone.id }} aria-selected={activeZone === zone.id} onPress={() => setActiveZone(zone.id)} {...(Platform.OS === 'web' ? { tabIndex: activeZone === zone.id ? 0 : -1, onKeyDown: (event: NavigationKey) => {
          const next = keyboardIndex(event, index, ugatZones.length);
          if (next !== null) { setActiveZone(ugatZones[next].id); noteTabRefs.current[ugatZones[next].id]?.focus(); }
        } } : {})} style={({ pressed }) => [s.noteTab, activeZone === zone.id && s.selected, pressed && s.pressed]}><Text style={s.stageLabel}>{index + 1}. {zone.title}</Text></Pressable>)}
      </View>
      <View style={s.panel}>
        <Text accessibilityRole="header" style={s.panelTitle}>{zoneIndex + 1}. {currentZone.title}</Text>
        <Text style={s.light}>{currentZone.prompt}</Text>
        <Text style={s.progressLabel}>MGA IDEYANG INILAGAY NINYO</Text>
        {assignedIdeas.map(card => <View key={card.id} style={s.assignedCard}><Text style={s.paperText}>{card.text}</Text></View>)}
        {!assignedIdeas.length && <Text style={s.helper}>Wala pang ideya sa {currentZone.title}. Bumalik sa Piliin upang maglagay ng ideya.</Text>}
        <Pressable accessibilityRole="button" onPress={() => changeStage(0)} style={s.textButton}><Text style={s.linkText}>Baguhin ang paglalagay ng mga ideya</Text></Pressable>
        <TextInput key={activeZone} testID={`ugat-map-note-${activeZone}`} accessibilityLabel={`Paliwanag sa ${currentZone.title}. ${currentZone.prompt}`} multiline textAlignVertical="top" value={responses[`note-${activeZone}`] ?? ''} onChangeText={text => onChange(`note-${activeZone}`, text)} placeholder={currentZone.placeholder} placeholderTextColor={AppTheme.muted} style={s.input} />
        {attempted && !responses[`note-${activeZone}`]?.trim() && <Text style={s.error}>Isulat ang paliwanag sa {currentZone.title}.</Text>}
      </View>
      <View style={s.pager}>
        <Pressable testID="ugat-map-note-previous" accessibilityRole="button" accessibilityLabel="Nakaraang kategorya" accessibilityState={{ disabled: zoneIndex === 0 }} disabled={zoneIndex === 0} onPress={() => setActiveZone(ugatZones[zoneIndex - 1].id)} style={[s.secondary, zoneIndex === 0 && s.disabled]}><MaterialCommunityIcons name="arrow-left" size={20} color={AppTheme.primary} /><Text style={s.linkText}>Nauna</Text></Pressable>
        <Text style={s.helper}>{zoneIndex + 1} / {ugatZones.length}</Text>
        <Pressable testID="ugat-map-note-next" accessibilityRole="button" accessibilityLabel="Susunod na kategorya" accessibilityState={{ disabled: zoneIndex === ugatZones.length - 1 }} disabled={zoneIndex === ugatZones.length - 1} onPress={() => setActiveZone(ugatZones[zoneIndex + 1].id)} style={[s.secondary, zoneIndex === ugatZones.length - 1 && s.disabled]}><Text style={s.linkText}>Susunod</Text><MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.primary} /></Pressable>
      </View>
      <Text style={s.helper}>{explained}/{ugatZones.length} paliwanag ang naisulat.</Text>
    </View>}

    {stage === 2 && <View testID="ugat-map-stage-panel-3" style={s.stageContent}>
      <Text accessibilityRole="header" style={s.panelTitle}>3. Buuin ang sagot</Text>
      <Text style={s.light}>Gamitin ang inyong mga ideya at paliwanag upang sagutin ang tatlong tanong.</Text>
      {summaryFields.map((field, index) => <View key={field.id} style={s.field}><Text style={s.choiceTitle}>{index + 1}. {field.label}</Text><TextInput ref={node => { summaryRefs.current[field.id] = node; }} testID={`ugat-map-${field.id}`} accessibilityLabel={field.label} multiline textAlignVertical="top" value={responses[field.id] ?? ''} onChangeText={text => onChange(field.id, text)} placeholder={field.placeholder} placeholderTextColor={AppTheme.muted} style={s.input} />{attempted && !responses[field.id]?.trim() && <Text style={s.error}>Sagutin ang tanong na ito.</Text>}</View>)}
      <View testID="ugat-map-review" style={s.panel}>
        <Text accessibilityRole="header" style={s.panelTitle}>Bago ipasa</Text>
        <Text style={s.helper}>{assigned}/{ugatIdeaCards.length} ideya · {explained}/{ugatZones.length} paliwanag · {summarized}/{summaryFields.length} sagot</Text>
        {missing.length ? <>
          <Text style={s.light}>Kailangan pang sagutan:</Text>
          {missing.map(item => <Pressable key={item.id} testID={`ugat-map-missing-${item.id}`} accessibilityRole="button" onPress={() => { if (item.card !== undefined) setCardIndex(item.card); if (item.zone) setActiveZone(item.zone); changeStage(item.stage); if (item.stage === 2) summaryRefs.current[item.id]?.focus(); }} style={s.missingItem}><MaterialCommunityIcons name="circle-outline" size={18} color={AppTheme.primary} /><Text style={[s.light, s.choiceCopy]}>{item.label}</Text><MaterialCommunityIcons name="chevron-right" size={20} color={AppTheme.primary} /></Pressable>)}
        </> : <Text style={s.light}>✓ Kumpleto ang mga sagot. Maaari nang ipakita sa guro.</Text>}
      </View>
      {attempted && !ready && <Text accessibilityRole="alert" style={s.error}>May kulang pa. Tingnan ang listahan sa “Bago ipasa”.</Text>}
      <Pressable testID="ugat-map-submit" accessibilityRole="button" accessibilityLabel="Ipasa" accessibilityState={{ disabled: completed }} disabled={completed} onPress={() => { setAttempted(true); if (ready) onComplete(); }} style={[s.primary, completed && s.disabled]}><Text style={s.primaryText}>{completed ? 'Naipasa na' : 'Ipasa'}</Text></Pressable>
    </View>}

    <View style={s.stageNavigation}>
      {stage > 0 && <Pressable testID="ugat-map-previous-stage" accessibilityRole="button" accessibilityLabel={`Bumalik sa hakbang ${stage}: ${mapStages[stage - 1]}`} onPress={() => changeStage((stage - 1) as MapStage)} style={s.secondary}><MaterialCommunityIcons name="arrow-left" size={20} color={AppTheme.primary} /><Text style={s.linkText}>Bumalik</Text></Pressable>}
      {stage < 2 && <Pressable testID="ugat-map-next-stage" accessibilityRole="button" accessibilityLabel={`Susunod: ${mapStages[stage + 1]}`} onPress={() => changeStage((stage + 1) as MapStage)} style={[s.secondary, s.nextStage]}><Text style={[s.linkText, s.choiceCopy]}>Susunod: {mapStages[stage + 1]}</Text><MaterialCommunityIcons name="arrow-right" size={20} color={AppTheme.primary} /></Pressable>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  section: { marginTop: 18, gap: 12 }, helper: { color: AppTheme.muted, fontSize: 12, lineHeight: 20 }, light: { color: AppTheme.text, fontSize: 14, lineHeight: 22 },
  exploreTree: { minHeight: 355, borderRadius: 22, overflow: 'hidden', backgroundColor: AppTheme.surfaceSoft, justifyContent: 'space-between' },
  leaves: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20 },
  leaf: { width: '46%', flexGrow: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderTopLeftRadius: 28, borderBottomRightRadius: 28, borderWidth: 2, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft },
  selected: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected }, leafLabel: { color: AppTheme.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  mystery: { alignItems: 'center', padding: 17, marginTop: 67 }, questionMarks: { color: AppTheme.text, fontSize: 24, fontWeight: '800', letterSpacing: 5 },
  primary: { minHeight: 48, backgroundColor: AppTheme.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 13 }, primaryText: { color: AppTheme.buttonText, fontWeight: '800', fontSize: 14 }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.8 },
  scrim: { flex: 1, backgroundColor: AppTheme.overlay, padding: 20, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 620, maxHeight: '90%', backgroundColor: AppTheme.surface, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: AppTheme.border, flexShrink: 1 },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, paperTitle: { color: AppTheme.text, fontSize: 24, fontWeight: '900', flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, paperBody: { paddingVertical: 14, gap: 14 }, paperText: { fontSize: 15, lineHeight: 25, color: AppTheme.text }, paperSmall: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, marginTop: 8 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, ideaArrow: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border }, idea: { backgroundColor: AppTheme.surfaceSoft, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: AppTheme.border },
  stageTabs: { flexDirection: 'row', gap: 7 }, stageTab: { flex: 1, minWidth: 0, minHeight: 80, paddingVertical: 10, paddingHorizontal: 5, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, alignItems: 'center', justifyContent: 'center', gap: 5 },
  stepNumber: { color: AppTheme.primary, fontSize: 18, fontWeight: '900' }, stageLabel: { color: AppTheme.text, fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center' }, stageContent: { gap: 14 }, progressLabel: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, fontWeight: '800' },
  categoryChoices: { gap: 10 }, categoryChoice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 13, backgroundColor: AppTheme.surfaceSoft }, choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { color: AppTheme.text, fontSize: 16, lineHeight: 24, fontWeight: '800' }, categoryHelp: { fontSize: 14, lineHeight: 22, marginTop: 2 },
  noteTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, noteTab: { minWidth: 0, width: '47%', flexGrow: 1, minHeight: 48, padding: 10, borderWidth: 2, borderColor: AppTheme.border, borderRadius: 11, backgroundColor: AppTheme.surfaceSoft, justifyContent: 'center' },
  secondary: { minHeight: 48, minWidth: 0, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 1 }, linkText: { color: AppTheme.primary, fontSize: 14, lineHeight: 22, fontWeight: '800' }, textButton: { alignSelf: 'flex-start', paddingVertical: 8, minHeight: 44, justifyContent: 'center' }, stageNavigation: { flexDirection: 'row', alignItems: 'center', gap: 10 }, nextStage: { flex: 1 }, missingItem: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  panel: { padding: 15, backgroundColor: AppTheme.panel, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 14, gap: 10 }, panelTitle: { color: AppTheme.text, fontSize: 19, fontWeight: '800' },
  assignedCard: { backgroundColor: AppTheme.surface, borderRadius: 10, padding: 12 },
  input: { backgroundColor: AppTheme.surface, color: AppTheme.text, fontSize: 16, lineHeight: 24, minHeight: 100, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: AppTheme.border }, field: { gap: 8 }, error: { color: AppTheme.error, fontSize: 12, lineHeight: 20 },
});
