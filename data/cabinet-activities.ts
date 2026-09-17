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
};

const evidenceFields: CabinetField[] = [
  { id: "evidence-1", label: "Unang patunay mula sa teksto", placeholder: "Isang pangyayari, kilos, o pahayag na sumusuporta sa iyong pinili…" },
  { id: "evidence-2", label: "Ikalawang patunay mula sa teksto", placeholder: "Isa pang detalyeng sumusuporta sa iyong interpretasyon…" },
];

/** Activities from the supplied classroom PDF, with duplicated sections consolidated. */
export const cabinetActivities: CabinetActivity[] = [
  {
    id: "damit-detective", storyId: "m1-story-1", title: "Kuwentong Detective", mode: "group",
    description: "Tukuyin ang limang elemento ng kuwento. Sa bawat bahagi, magbigay ng sagot at patunay mula sa Sandaang Damit.",
    example: { answer: "Ang batang babae.", evidence: "Mahiyain siya at madalas na nag-iisa dahil sa panunukso ng mga kaklase." },
    fields: ["Pangunahing Tauhan", "Iba pang Tauhan", "Tagpuan", "Pangunahing Suliranin", "Mahalagang Pangyayari"].flatMap((label, index) => [
      { id: `element-${index}`, label: `${label} · Sagot`, placeholder: "Isulat ang sagot ng pangkat…" },
      { id: `proof-${index}`, label: `${label} · Patunay`, placeholder: "Anong detalye sa kuwento ang sumusuporta rito?" },
    ]),
  },
  {
    id: "damit-transformation", storyId: "m1-story-1", title: "Suri-Lalim", mode: "group",
    description: "Buuin ang Character Transformation Map batay sa mga pangyayari at detalye ng kuwento.",
    fields: [
      { id: "before", label: "Bago · Ano ang katangian niya?" },
      { id: "problem", label: "Suliranin · Ano ang kaniyang nararanasan?" },
      { id: "change", label: "Pagbabago · Ano ang ginawa niya upang harapin ito?" },
      { id: "ending", label: "Wakas · Ano ang natuklasan ng mga kaklase tungkol sa kaniya?" },
      { id: "round-character", label: "Bakit maituturing na tauhang bilog ang pangunahing tauhan?" },
    ],
  },
  {
    id: "damit-interpretation", storyId: "m1-story-1", title: "Ano Talaga ang Sandaang Damit?", mode: "group",
    description: "Piliin ang interpretasyong pinakamalapit sa kahulugan ng akda. Suportahan ito ng dalawang patunay mula sa teksto.",
    fields: [
      { id: "interpretation", label: "Interpretasyon ng pangkat", options: [
        { value: "literal", label: "A. Literal na sandaang damit" },
        { value: "dreams", label: "B. Imahinasyon at mga pangarap ng batang babae" },
        { value: "acceptance", label: "C. Paraan upang magkaroon siya ng lakas ng loob at matanggap ng iba" },
      ] },
      ...evidenceFields,
    ],
  },
  {
    id: "ugat-check", storyId: "m1-story-2", title: "Ugat Check: Nasaan ang Sakit?", mode: "group",
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
    id: "ugat-board", storyId: "m1-story-2", title: "Level Suri · Lupon ng Pagsusuri", mode: "group",
    description: "Suriin ang nagbabagong pananaw ng mga tauhan at ang literal, panlipunan, at pansariling kahulugan ng “ugat”. Ihanda ang maikling pagsusuri ng pangkat.",
    fields: [{ id: "analysis", label: "Bakit napagtanto ni Lolo Tacio na ang tunay na “ugat” ng problema ay nasa kaniyang sarili rin?" }],
  },
  {
    id: "ugat-symbolism", storyId: "m1-story-2", title: "Symbolism Flash Card", mode: "individual",
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
  return cabinetActivities.filter(activity => activity.storyId === storyId);
}

export function getCabinetActivity(storyId: string, activityId: string) {
  return cabinetActivities.find(activity => activity.storyId === storyId && activity.id === activityId);
}

export function isCabinetResponseComplete(activity: CabinetActivity, responses: Record<string, string>) {
  return activity.fields.every(field => {
    const value = responses[field.id];
    return typeof value === "string" && value.trim().length > 0 && (!field.options || field.options.some(option => option.value === value));
  });
}
