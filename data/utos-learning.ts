import type { CabinetActivity } from './cabinet-activities';

const choices = (labels: string[]) => labels.map((label, index) => ({ value: String.fromCharCode(65 + index), label: `${String.fromCharCode(65 + index)}. ${label}` }));

export const utosStoryCards = [
  'Hindi sang-ayon si Jojo sa pananaw ni Mrs. Moral Character tungkol sa ugat ng problema ng tao.',
  'Napag-uusapan ng mga guro ang kalagayan ni Jojo at ang kaniyang hindi pagsunod sa kanilang mga inaasahan.',
  'Napag-uusapan din ang kalagayan ni Minyong bilang isang cultural minority.',
  'Nakikita ni Jojo ang hindi pantay na pagtrato at ang pamantayang ipinapataw sa mga mag-aaral.',
  'Napagtanto ni Jojo na kailangan niyang magsalita upang maipahayag ang kaniyang pagtutol.',
  'Isinulat niya ang kaniyang reklamo sa pader ng comfort room.',
];

export const utosConflictRounds = [
  {
    title: 'Jojo', theme: 'Pananaw at pagtutol', fieldIds: ['round-1-character', 'round-1-reason'],
    situation: 'Hindi sang-ayon si Jojo sa pananaw ng kaniyang guro tungkol sa literacy, communication at moralidad. Para sa kaniya, hindi maaaring doon lamang hanapin ang ugat ng problema.',
    question: 'Sino ang higit na nasa gitna ng tunggalian?',
  },
  {
    title: 'Minyong', theme: 'Pag-unawa sa kalagayan', fieldIds: ['round-2'],
    situation: 'Si Minyong ay mula sa isang cultural minority at dinala sa Maynila. Sa kabila nito, inaasahan siyang makasunod sa pamantayang ginagamit ng paaralan.',
    question: 'Ano ang ipinakikitang suliranin?',
  },
  {
    title: 'Boss Level', theme: 'Timbangin ang pamantayan', fieldIds: ['round-3'],
    situation: 'May mga tauhang pinapasa dahil sa kanilang positibong katangian o kalagayan, samantalang sina Jojo at Minyong ay hinuhusgahan batay sa kanilang hindi pag-angkop sa pamantayan.',
    question: 'Ano ang ipinahihiwatig nito tungkol sa “pamantayan” ng paaralan?',
  },
] as const;

// Activity wording from the supplied activities PDF, pages 7–10.
// The first activity is untitled there; its menu label describes the balance-scale task.
// This initial form layout records responses for teacher review; visual mechanics come later.
export const utosActivities: CabinetActivity[] = [
  {
    id: 'utos-conflict', storyId: 'm1-story-3', title: 'Timbangan ng Tunggalian', mode: 'individual',
    description: 'Sa bawat round, suriin ang sitwasyon mula sa kuwento at piliin ang angkop na sagot at dahilan.',
    fields: [
      { id: 'round-1-character', label: 'Round 1: Hindi sang-ayon si Jojo sa pananaw ng kaniyang guro tungkol sa literacy, communication at moralidad. Para sa kaniya, hindi maaaring doon lamang hanapin ang ugat ng problema. Sino ang higit na nasa gitna ng tunggalian?', options: choices(['Jojo', 'Minyong', 'Osias', 'Armando']) },
      { id: 'round-1-reason', label: 'Bakit? Pumili ng dahilan.', options: choices(['Dahil ayaw niyang pumasok sa paaralan.', 'Dahil hindi niya basta tinatanggap ang pamantayang ipinapataw sa kaniya.', 'Dahil gusto niyang maging katulad ng kaniyang mga guro.', 'Dahil gusto niyang makakuha ng mataas na grado.']) },
      { id: 'round-2', label: 'Round 2: Si Minyong ay mula sa isang cultural minority at dinala sa Maynila. Sa kabila nito, inaasahan siyang makasunod sa pamantayang ginagamit ng paaralan. Ano ang ipinakikitang suliranin?', options: choices(['Kakulangan sa kaibigan', 'Hindi pantay na pamantayan sa mga mag-aaral', 'Kawalan ng interes sa pag-aaral', 'Problema sa pakikipagkaibigan']) },
      { id: 'round-3', label: 'Round 3 — Boss Level: May mga tauhang pinapasa dahil sa kanilang positibong katangian o kalagayan, samantalang sina Jojo at Minyong ay hinuhusgahan batay sa kanilang hindi pag-angkop sa pamantayan. Ano ang ipinahihiwatig nito tungkol sa “pamantayan” ng paaralan?', options: choices(['Pare-pareho at patas ang pamantayan sa lahat.', 'Walang epekto ang pamantayan sa buhay ng mag-aaral.', 'Maaaring maging kasangkapan ang pamantayan sa hindi pantay na pagtingin sa tao.', 'Ang lahat ng mag-aaral ay kailangang magkaroon ng parehong personalidad.']) },
    ],
  },
  {
    id: 'utos-meanings', storyId: 'm1-story-3', title: 'Burahin ang Utos!', mode: 'individual',
    description: 'Suriin ang tatlong kahulugan ng pamagat na “Utos ng Hari”: literal, mas malalim, at kabuuang interpretasyon.',
    fields: [
      { id: 'literal', label: 'Lock 1 — Literal: Ano ang maaaring unang kahulugan ng “utos”?', options: choices(['Isang mungkahi', 'Isang bagay na ipinagagawa o ipinapasunod', 'Isang biro', 'Isang lihim']) },
      { id: 'power', label: 'Lock 2 — Mas Malalim: Sa kuwento, ano ang maaaring kinakatawan ng “Hari”?', options: choices(['Isang literal na hari sa palasyo', 'Isang kaibigan ni Jojo', 'Mga taong may kapangyarihang magtakda ng pamantayan', 'Isang tauhang hindi nakikita']) },
      { id: 'interpretation', label: 'Final Lock — Interpretasyon: Bakit “Utos ng Hari” ang pamagat?', options: choices(['Dahil tungkol ito sa isang hari na nagbibigay ng kautusan.', 'Dahil ipinakikita nito ang kapangyarihan ng mga nasa posisyon na magtakda kung ano ang “tama” at “katanggap-tanggap.”', 'Dahil nais ni Jojo na maging hari.', 'Dahil may palasyo sa kuwento.']) },
    ],
  },
  {
    id: 'utos-sequence', storyId: 'm1-story-3', title: 'Ayusin Mo ang Gulo!', mode: 'individual',
    description: 'Ayusin ang mahahalagang pangyayari. Pumili ng isang story card sa bawat puwesto, mula una hanggang ikaanim. Gamitin ang bawat card nang isang beses.',
    fields: Array.from({ length: 6 }, (_, index) => ({ id: `position-${index + 1}`, label: `${['Unang', 'Ikalawang', 'Ikatlong', 'Ikaapat na', 'Ikalimang', 'Ikaanim na'][index]} pangyayari`, options: choices(utosStoryCards) })),
  },
  {
    id: 'utos-stand-up', storyId: 'm1-story-3', title: 'Drop Out o Stand Up?', mode: 'individual',
    description: '“Hindi baleng dropout, basta tao lang ako.” Suriin ang huling pahayag ni Jojo at iugnay ito sa sariling paninindigan.',
    fields: [
      { id: 'meaning', label: 'Ano ang pinakamalalim na ipinahihiwatig ng pahayag?', options: choices(['Ayaw na ni Jojo mag-aral.', 'Mas pinahahalagahan ni Jojo ang sariling pagkatao at paninindigan kaysa sa bulag na pagsunod sa pamantayang hindi niya pinaniniwalaan.', 'Gusto ni Jojo na iwan ang kaniyang mga kaibigan.', 'Wala nang pakialam si Jojo sa kaniyang kinabukasan.']) },
      { id: 'reflection', label: 'Kung ikaw si Jojo, ano ang isang “utos” na hindi mo susundin kung alam mong hindi ito makatarungan?' },
    ],
  },
];
