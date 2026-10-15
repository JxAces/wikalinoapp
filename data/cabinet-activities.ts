import { ugatClues, ugatIdeaCards, ugatMapZones, ugatZones } from './ugat-learning';
import { utosActivities } from './utos-learning';

export type CabinetField = {
  id: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string; icon?: "tree-outline" | "scale-balance" | "heart-outline" }[];
};

export type CabinetActivity = {
  id: string;
  storyId: string;
  title: string;
  description: string;
  mode: "group" | "individual";
  fields: CabinetField[];
  example?: { answer: string; evidence: string };
  archived?: boolean;
};

const evidenceFields: CabinetField[] = [
  { id: "evidence-1", label: "Unang patunay mula sa teksto", placeholder: "Isang pangyayari, kilos, o pahayag na sumusuporta sa iyong pinili…" },
  { id: "evidence-2", label: "Ikalawang patunay mula sa teksto", placeholder: "Isa pang detalyeng sumusuporta sa iyong interpretasyon…" },
];

/** Activities from the supplied classroom PDF, with duplicated sections consolidated. */
export const cabinetActivities: CabinetActivity[] = [
  ...utosActivities,
  {
    id: "damit-detective", storyId: "m1-story-1", title: "HALUNGKAT", mode: "group",
    description: "Tukuyin ang limang elemento ng kuwento. Sa bawat bahagi, magbigay ng sagot at patunay mula sa Sandaang Damit.",
    example: { answer: "Ang matandang lalaki", evidence: "Siya ay nakaranas ng pagkabigo sa buhay" },
    fields: ["Pangunahing Tauhan", "Iba pang Tauhan", "Tagpuan", "Pangunahing Suliranin", "Mahalagang Pangyayari"].flatMap((label, index) => [
      { id: `element-${index}`, label: `${label} · Sagot`, placeholder: "Isulat ang sagot ng pangkat…" },
      { id: `proof-${index}`, label: `${label} · Patunay na sagot mula sa kuwento`, placeholder: index < 2 ? "Ipaliwanag ang kanilang papel gamit ang isang pangyayari." : "Anong detalye sa kuwento ang sumusuporta rito?" },
    ]),
  },
  {
    id: "damit-transformation", storyId: "m1-story-1", title: "HABI", mode: "group",
    description: "Panuto: Buuin ang mga pangyayari at mahahalagang detalye ng kuwento batay sa mga nakasaad sa bawat damit.",
    fields: [
      { id: "before", label: "Bago · Ano ang katangian niya?" },
      { id: "problem", label: "Suliranin · Ano ang kaniyang nararanasan?" },
      { id: "change", label: "Pagbabago · Ano ang ginawa niya upang harapin ito?" },
      { id: "ending", label: "Wakas · Ano ang natuklasan ng mga kaklase tungkol sa kaniya?" },
    ],
  },
  {
    id: "damit-interpretation", storyId: "m1-story-1", title: "HINUHA", mode: "group",
    description: "Piliin ang interpretasyong pinakamalapit sa kahulugan ng akda. Suportahan ito ng isang patunay mula sa teksto.",
    fields: [
      { id: "interpretation", label: "Interpretasyon ng pangkat", options: [
        { value: "literal", label: "A. Literal na sandaang damit" },
        { value: "dreams", label: "B. Imahinasyon at mga pangarap ng batang babae" },
        { value: "acceptance", label: "C. Paraan upang magkaroon siya ng lakas ng loob at matanggap ng iba" },
      ] },
      { ...evidenceFields[0], label: "Patunay mula sa teksto" },
    ],
  },
  {
    id: 'ugat-explore', storyId: 'm1-story-2', title: 'PAGMAMASID', mode: 'individual',
    description: 'Piliin ang bawat paksa upang makita ang mahahalagang detalye sa kuwento.',
    fields: ugatClues.map(clue => ({ id: `viewed-${clue.id}`, label: clue.title, options: [{ value: 'viewed', label: 'Natingnan' }] })),
  },
  {
    id: "ugat-check", storyId: "m1-story-2", title: "LikhaKuro", mode: "group",
    description: "Piliin ang pinakamalapit na interpretasyon ng salitang “ugat” at magbigay ng dalawang patunay mula sa kuwento.",
    fields: [
      { id: "interpretation", label: "Kahulugan ng “ugat”", options: [
        { value: "literal", label: "A. Literal na ugat ng halaman" },
        { value: "social", label: "B. Ang matagal nang pinagmumulan ng katiwalian at kabulukan sa lipunan" },
        { value: "personal", label: "C. Ang malalim na suliraning maaaring nasa lipunan at maging sa sarili ng tao" },
      ] },
      ...evidenceFields,
      { id: "reflection", label: "Bakit sa huli ay napagtanto ni Lolo Tacio na ang “ugat” ay maaaring nasa sarili rin niya?" },
    ],
  },
  {
    id: 'ugat-tree-map', storyId: 'm1-story-2', title: 'Banyuhay', mode: 'group',
    description: 'Pumili ng isang ideya at tukuyin kung ito ay suliranin, pangyayari, o aral. Pagkatapos, magbigay ng patunay mula sa kuwento.',
    fields: [
      { id: 'selected-idea', label: 'Ang napiling ideya', options: ugatIdeaCards.map(card => ({ value: card.id, label: card.text })) },
      ...ugatIdeaCards.map(card => ({ id: `card-${card.id}`, label: card.text, options: ugatMapZones.map(zone => ({ value: zone.id, label: zone.title })) })),
      // Retain earlier keys so autosaving the shorter activity does not erase past work.
      ...ugatZones.map(zone => ({ id: `note-${zone.id}`, label: zone.prompt })),
      { id: 'synthesis-message', label: 'Ano ang mensahe ng kuwento?', placeholder: 'Ipinakikita ng kuwento na…' },
      { id: 'synthesis-evidence', label: 'Anong pangyayari sa kuwento ang nagpapakita nito?', placeholder: 'Makikita ito nang…' },
      { id: 'synthesis-insight', label: 'Ano ang natutuhan ninyo mula rito?', placeholder: 'Natutuhan namin na…' },
    ],
  },
  {
    id: "ugat-board", storyId: "m1-story-2", title: "Level Suri · Lupon ng Pagsusuri", mode: "group", archived: true,
    description: "Suriin ang nagbabagong pananaw ng mga tauhan at ang literal, panlipunan, at pansariling kahulugan ng “ugat”. Ihanda ang maikling pagsusuri ng pangkat.",
    fields: [{ id: "analysis", label: "Bakit napagtanto ni Lolo Tacio na ang tunay na “ugat” ng problema ay nasa kaniyang sarili rin?" }],
  },
  {
    id: "ugat-symbolism", storyId: "m1-story-2", title: "Symbolism Flash Card", mode: "individual", archived: true,
    description: "Pumili ng simbolo para sa sarili mong pagpapakahulugan sa “ugat”. Sumulat ng 1–2 pangungusap na paliwanag.",
    fields: [
      { id: "symbol", label: "Ang iyong simbolo", options: [
        { value: "tree", label: "A. Puno", icon: "tree-outline" },
        { value: "scale", label: "B. Timbangan", icon: "scale-balance" },
        { value: "heart", label: "C. Puso", icon: "heart-outline" },
      ] },
      { id: "explanation", label: "Paliwanag · 1–2 pangungusap", placeholder: "Pinili ko ang simbolong ito dahil…" },
    ],
  },
];

export function getCabinetActivities(storyId: string) {
  return cabinetActivities.filter(activity => activity.storyId === storyId && !activity.archived);
}

export function getCabinetActivity(storyId: string, activityId: string) {
  return cabinetActivities.find(activity => activity.storyId === storyId && activity.id === activityId);
}

/** Resolve one effective choice without rewriting saved legacy assignments. */
export function getUgatMapSelection(responses: Record<string, string> | null | undefined): {
  card: typeof ugatIdeaCards[number];
  zone: typeof ugatMapZones[number];
} | null {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return null;
  if (Object.prototype.hasOwnProperty.call(responses, 'selected-idea')) {
    const card = ugatIdeaCards.find(item => item.id === responses['selected-idea']);
    const zone = card && ugatMapZones.find(item => item.id === responses[`card-${card.id}`]);
    return card && zone ? { card, zone } : null;
  }
  // Old versions stored several assignments. Their first supported idea becomes
  // the current selection; the remaining saved answers stay available in storage.
  for (const card of ugatIdeaCards) {
    const zone = ugatMapZones.find(item => item.id === responses[`card-${card.id}`]);
    if (zone) return { card, zone };
  }
  return null;
}

export function isCabinetResponseComplete(activity: CabinetActivity, responses: Record<string, string> | null | undefined) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return false;
  if (activity.id === 'ugat-tree-map') {
    const selection = getUgatMapSelection(responses);
    const evidence = selection && responses[`note-${selection.zone.id}`];
    return typeof evidence === 'string' && evidence.trim().length > 0;
  }
  if (activity.id === 'utos-conflict' &&
    (responses['jumble-jojo'] !== 'JOJO' || responses['jumble-minyong'] !== 'MINYONG')) return false;
  if (activity.id === 'utos-meanings' &&
    (responses.literal !== 'B' || responses.power !== 'A' || responses.interpretation !== 'A')) return false;
  if (activity.id === 'utos-sequence') {
    const order = Array.from({ length: 6 }, (_, index) => responses[`position-${index + 1}`]);
    if (new Set(order).size !== 6 || !order.every((value, index) => value === String.fromCharCode(65 + index))) return false;
  }
  if (activity.id === 'utos-stand-up' &&
    (responses.meaning !== 'A' || !Array.from({ length: 6 }, (_, index) => responses[`minyong-face-${index}`] === String(index)).every(Boolean))) return false;
  return activity.fields.every(field => {
    const value = responses[field.id];
    return typeof value === "string" && value.trim().length > 0 && (!field.options || field.options.some(option => option.value === value));
  });
}

type CabinetProgress = Record<string, {
  storyId: string;
  responses?: Record<string, string>;
  completedAt: string | null;
} | undefined>;

/** A saved draft or an outdated completion cannot unlock the next crown section. */
export function canOpenCabinetActivity(activity: CabinetActivity, saved: CabinetProgress) {
  if (activity.storyId !== 'm1-story-3') return true;
  const activities = getCabinetActivities(activity.storyId);
  const index = activities.findIndex(item => item.id === activity.id);
  return index >= 0 && activities.slice(0, index).every(previous => {
    const response = saved[previous.id];
    return response?.storyId === activity.storyId && Boolean(response.completedAt) &&
      isCabinetResponseComplete(previous, response.responses);
  });
}
