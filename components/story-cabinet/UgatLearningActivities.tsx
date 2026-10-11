import { AppTheme } from "@/constants/colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createElement, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { ugatClues, ugatIdeaCards, ugatZones, type UgatZoneId } from '@/data/ugat-learning';
import { getCabinetActivity, isCabinetResponseComplete } from '@/data/cabinet-activities';

type Props = {
  responses: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onComplete: () => void;
  completed: boolean;
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

type DragProps = { id: string; children: React.ReactNode; onStart: () => void; onDropAt: (id: string, x: number, y: number) => void };
function DragCard({ id, children, onStart, onDropAt }: DragProps) {
  const [position] = useState(() => new Animated.ValueXY());
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderGrant: onStart,
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => { position.setValue({ x: 0, y: 0 }); onDropAt(id, gesture.moveX, gesture.moveY); },
    onPanResponderTerminate: () => position.setValue({ x: 0, y: 0 }),
  }), [id, onDropAt, onStart, position]);
  if (Platform.OS === 'web') return createElement('div', {
    draggable: true, style: { cursor: 'grab' },
    onDragStart: (event: React.DragEvent<HTMLDivElement>) => { event.dataTransfer.setData('text/plain', id); event.dataTransfer.effectAllowed = 'move'; onStart(); },
  }, children);
  return <Animated.View {...responder.panHandlers} style={{ transform: position.getTranslateTransform(), zIndex: 10 }}>{children}</Animated.View>;
}

export function UgatTreeMapActivity({ responses, onChange, onComplete, completed }: Props) {
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<UgatZoneId>('root');
  const [notice, setNotice] = useState('');
  const [attempted, setAttempted] = useState(false);
  const targets = useRef<Partial<Record<UgatZoneId, View | null>>>({});
  const currentCard = ugatIdeaCards[cardIndex];
  const currentZone = ugatZones.find(zone => zone.id === activeZone)!;
  const definition = getCabinetActivity('m1-story-2', 'ugat-tree-map')!;
  const ready = isCabinetResponseComplete(definition, responses);
  const assigned = ugatIdeaCards.filter(card => ugatZones.some(zone => zone.id === responses[`card-${card.id}`])).length;
  function place(id: string, zone: UgatZoneId) {
    if (!ugatIdeaCards.some(card => card.id === id)) return;
    onChange(`card-${id}`, zone);
    setActiveZone(zone); setSelectedCard(null);
    setNotice(`Nailagay ang ideya sa ${ugatZones.find(item => item.id === zone)?.title}. Maaari mo itong ilipat muli.`);
  }
  function dropAt(id: string, x: number, y: number) {
    for (const zone of ugatZones) targets.current[zone.id]?.measureInWindow((left, top, width, height) => {
      if (x >= left && x <= left + width && y >= top && y <= top + height) place(id, zone.id);
    });
  }
  function zoneButton(id: UgatZoneId) {
    const zone = ugatZones.find(item => item.id === id)!;
    const count = ugatIdeaCards.filter(card => responses[`card-${card.id}`] === id).length;
    const button = <View ref={node => { targets.current[id] = node; }} collapsable={false}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${selectedCard ? 'Ilagay ang napiling ideya sa' : 'Buksan ang'} ${zone.title}, ${count} ideya`} onPress={() => selectedCard ? place(selectedCard, id) : setActiveZone(id)} style={({ pressed }) => [s.zone, activeZone === id && s.selected, pressed && s.pressed]}>
        <MaterialCommunityIcons name={zone.icon} size={23} color={AppTheme.primary} /><Text style={s.leafLabel}>{zone.title}</Text><Text style={s.zoneCount}>{count} ideya</Text>
      </Pressable>
    </View>;
    return <View style={s.zoneSlot} key={id}>{Platform.OS === 'web' ? createElement('div', {
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; },
      onDrop: (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); place(event.dataTransfer.getData('text/plain'), id); },
    }, button) : button}</View>;
  }
  return <View style={s.section}>
    <Text style={s.helper}>I-drag ang ideya papunta sa bahagi ng puno. Maaari ring pindutin ang ideya, saka ang patutunguhan.</Text>
    <View style={s.pager}>
      <Pressable testID="ugat-idea-previous" accessibilityRole="button" accessibilityLabel="Nakaraang ideya" accessibilityState={{ disabled: cardIndex === 0 }} disabled={cardIndex === 0} onPress={() => { setCardIndex(i => i - 1); setSelectedCard(null); }} style={[s.ideaArrow, cardIndex === 0 && s.disabled]}><MaterialCommunityIcons name="arrow-left" size={28} color={AppTheme.primary} /></Pressable>
      <Text style={s.helper}>IDEYA {cardIndex + 1} / {ugatIdeaCards.length}</Text>
      <Pressable testID="ugat-idea-next" accessibilityRole="button" accessibilityLabel="Susunod na ideya" accessibilityState={{ disabled: cardIndex === ugatIdeaCards.length - 1 }} disabled={cardIndex === ugatIdeaCards.length - 1} onPress={() => { setCardIndex(i => i + 1); setSelectedCard(null); }} style={[s.ideaArrow, cardIndex === ugatIdeaCards.length - 1 && s.disabled]}><MaterialCommunityIcons name="arrow-right" size={28} color={AppTheme.primary} /></Pressable>
    </View>
    <DragCard id={currentCard.id} onStart={() => setSelectedCard(currentCard.id)} onDropAt={dropAt}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Piliin ang ideya: ${currentCard.text}`} accessibilityState={{ selected: selectedCard === currentCard.id }} onPress={() => setSelectedCard(selectedCard === currentCard.id ? null : currentCard.id)} style={[s.idea, selectedCard === currentCard.id && s.ideaSelected]}>
        <Text style={s.paperText}>{currentCard.text}</Text><Text style={s.paperSmall}>{ugatZones.find(zone => zone.id === responses[`card-${currentCard.id}`])?.title ?? 'Hindi pa nailalagay'} · {selectedCard === currentCard.id ? 'Piliin ang bahagi ng puno ↓' : 'Pindutin o i-drag'}</Text>
      </Pressable>
    </DragCard>
    <Text accessibilityLiveRegion="polite" style={s.helper}>{assigned}/{ugatIdeaCards.length} ideya ang nailagay</Text>
    {selectedCard && <Pressable accessibilityRole="button" onPress={() => setSelectedCard(null)} style={s.cancel}><Text style={s.light}>Kanselahin ang pagpili</Text></Pressable>}
    <View style={s.mapTree}>
      <TreeArt roots />
      <View style={s.zoneRow}>{zoneButton('leaf')}{zoneButton('fruit')}</View>
      <View style={s.branchZone}>{zoneButton('branch')}</View>
      <View style={s.rootZone}>{zoneButton('root')}</View>
    </View>
    <Text accessibilityLiveRegion="polite" style={s.helper}>{notice || 'Piliin ang bahagi ng puno upang ipaliwanag ang mga ideyang inilagay.'}</Text>
    <View style={s.panel}>
      <Text accessibilityRole="header" style={s.panelTitle}>{currentZone.title}</Text><Text style={s.helper}>{currentZone.prompt}</Text>
      {ugatIdeaCards.filter(card => responses[`card-${card.id}`] === activeZone).map(card => <View key={card.id} style={s.assignedCard}><Text style={[s.light, { flex: 1 }]}>{card.text}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Alisin ang ideya: ${card.text}`} onPress={() => { onChange(`card-${card.id}`, ''); setNotice('Ibinalik ang ideya sa mga hindi pa nailalagay.'); }} style={s.close}><MaterialCommunityIcons name="close" color={AppTheme.primary} size={20} /></Pressable></View>)}
      {!ugatIdeaCards.some(card => responses[`card-${card.id}`] === activeZone) && <Text style={s.helper}>Wala pang ideya rito.</Text>}
      <TextInput accessibilityLabel={`Paliwanag sa ${currentZone.title}`} multiline textAlignVertical="top" value={responses[`note-${activeZone}`] ?? ''} onChangeText={text => onChange(`note-${activeZone}`, text)} placeholder="Ipaliwanag ang ugnayan ng mga ideya sa bahaging ito…" placeholderTextColor={AppTheme.muted} style={s.input} />
      {attempted && !responses[`note-${activeZone}`]?.trim() && <Text style={s.error}>Isulat ang paliwanag sa bahaging ito.</Text>}
    </View>
    <Text accessibilityRole="header" style={s.panelTitle}>Buuin ang sintesis</Text>
    {definition.fields.filter(field => field.id.startsWith('synthesis-')).map(field => <View key={field.id} style={s.field}><Text style={s.light}>{field.label}</Text><TextInput accessibilityLabel={field.label} multiline textAlignVertical="top" value={responses[field.id] ?? ''} onChangeText={text => onChange(field.id, text)} placeholder="Isulat ang sagot ng pangkat…" placeholderTextColor={AppTheme.muted} style={s.input} />{attempted && !responses[field.id]?.trim() && <Text style={s.error}>Kailangan ang sagot dito.</Text>}</View>)}
    <View style={s.panel}><Text style={s.light}>Pagsusuri bago tapusin</Text>{ugatZones.map(zone => <Text key={zone.id} style={s.helper}>{ugatIdeaCards.some(card => responses[`card-${card.id}`] === zone.id) && responses[`note-${zone.id}`]?.trim() ? '✓' : '○'} {zone.title} · ideya at paliwanag</Text>)}</View>
    {attempted && !ready && <Text accessibilityRole="alert" style={s.error}>Ilagay ang anim na ideya, maglaan ng kahit isang ideya at paliwanag sa bawat bahagi, at punan ang tatlong bahagi ng sintesis.</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="Ipasa" accessibilityState={{ disabled: completed }} disabled={completed} onPress={() => { setAttempted(true); if (ready) onComplete(); }} style={[s.primary, completed && s.disabled]}><Text style={s.primaryText}>Ipasa</Text></Pressable>
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
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ideaArrow: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border }, idea: { backgroundColor: AppTheme.surfaceSoft, borderRadius: 14, padding: 16, borderWidth: 3, borderColor: AppTheme.border, minHeight: 132 }, ideaSelected: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected },
  mapTree: { borderRadius: 20, overflow: 'hidden', backgroundColor: AppTheme.surfaceSoft, padding: 12, gap: 13 }, zoneRow: { flexDirection: 'row', gap: 12 }, zoneSlot: { flex: 1, minWidth: 0 },
  zone: { minHeight: 87, backgroundColor: AppTheme.surfaceSoft, borderColor: AppTheme.border, borderWidth: 2, borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 3 },
  zoneCount: { color: AppTheme.muted, fontSize: 11 }, branchZone: { width: '47%', marginVertical: 5 }, rootZone: { width: '57%', alignSelf: 'center', marginTop: 8 },
  panel: { padding: 15, backgroundColor: AppTheme.panel, borderWidth: 1, borderColor: AppTheme.border, borderRadius: 14, gap: 10 }, panelTitle: { color: AppTheme.text, fontSize: 19, fontWeight: '800' },
  assignedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppTheme.surface, borderRadius: 10, paddingLeft: 10 },
  input: { backgroundColor: AppTheme.surface, color: AppTheme.text, fontSize: 16, lineHeight: 24, minHeight: 100, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: AppTheme.border }, field: { gap: 8 }, error: { color: AppTheme.error, fontSize: 12, lineHeight: 20 }, cancel: { padding: 10, alignSelf: 'flex-start' },
});
