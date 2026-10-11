import { ugatClues, ugatIdeaCards, ugatZones } from './ugat-learning';
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
    description: 'Pumili ng dahon para makita ang mahahalagang pangyayari sa kuwento',
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
    description: 'I-ugnay ang mga kaisipan sa bawat bahagi ng puno (ugat, sanga, dahon, at bunga). Ipaliwanag ang koneksyon ng bawat isa at magbigay ng pangkalahatang paglalahat.',
    fields: [
      ...ugatIdeaCards.map(card => ({ id: `card-${card.id}`, label: card.text, options: ugatZones.map(zone => ({ value: zone.id, label: zone.title })) })),
      ...ugatZones.map(zone => ({ id: `note-${zone.id}`, label: zone.prompt })),
      { id: 'synthesis-message', label: 'Ipinakikita ng akdang Ugat na…' },
      { id: 'synthesis-evidence', label: 'Makikita ito sa…' },
      { id: 'synthesis-insight', label: 'Dahil dito, ipinahihiwatig ng akda na…' },
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

export function isCabinetResponseComplete(activity: CabinetActivity, responses: Record<string, string>) {
  if (activity.id === 'utos-sequence' && new Set(activity.fields.map(field => responses[field.id])).size !== 6) return false;
  if (activity.id === 'ugat-tree-map' && !ugatZones.every(zone => ugatIdeaCards.some(card => responses[`card-${card.id}`] === zone.id))) return false;
  return activity.fields.every(field => {
    const value = responses[field.id];
    return typeof value === "string" && value.trim().length > 0 && (!field.options || field.options.some(option => option.value === value));
  });
}
