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
    title: 'Saliksik - Pananaw (Jojo)', theme: 'Pananaw at pagtutol', fieldIds: ['round-1-character', 'round-1-reason', 'jumble-jojo'],
    situation: 'Hindi sang-ayon si Jojo sa pananaw ng kaniyang guro tungkol sa literacy, communication at moralidad. Para sa kaniya, hindi maaaring doon lamang hanapin ang ugat ng problema.',
    question: 'Sino ang higit na nasa gitna ng tunggalian?',
  },
  {
    title: 'Suri-Pagkatao (Minyong)', theme: 'Pag-unawa sa kalagayan', fieldIds: ['round-2', 'jumble-minyong'],
    situation: 'Si Minyong ay mula sa isang cultural minority at dinala sa Maynila. Sa kabila nito, inaasahan siyang makasunod sa pamantayang ginagamit ng paaralan.',
    question: 'Ano ang ipinakikitang suliranin?',
  },
  {
    title: 'Boss Level', theme: 'Timbangin ang pamantayan', fieldIds: ['round-3'],
    situation: 'May mga tauhang pinapasa dahil sa kanilang positibong katangian o kalagayan, samantalang sina Jojo at Minyong ay hinuhusgahan batay sa kanilang hindi pag-angkop sa pamantayan.',
    question: 'Ano ang ipinahihiwatig nito tungkol sa “pamantayan” ng paaralan?',
  },
] as const;

export const utosConflictJumbles = [
  { fieldId: 'jumble-jojo', answer: 'JOJO', letters: ['O', 'J', 'J', 'O'] },
  { fieldId: 'jumble-minyong', answer: 'MINYONG', letters: ['G', 'N', 'Y', 'O', 'I', 'M', 'N'] },
] as const;

export const utosMeaningAnswers = { literal: 'B', power: 'A', interpretation: 'A' } as const;
export const utosFaceFieldIds = Array.from({ length: 6 }, (_, index) => `minyong-face-${index}`);

// Revised wording and activities from APP CHANGES PART 1, pages 26–32.
export const utosActivities: CabinetActivity[] = [
  {
    id: 'utos-conflict', storyId: 'm1-story-3', title: 'Suri-Tunggali', mode: 'individual',
    description: 'Sa bawat yugto, suriin ang sitwasyon mula sa kuwento at piliin ang angkop na sagot at dahilan.',
    fields: [
      { id: 'round-1-character', label: 'Yugto 1: Hindi sang-ayon si Jojo sa pananaw ng kaniyang guro tungkol sa literacy, communication at moralidad. Para sa kaniya, hindi maaaring doon lamang hanapin ang ugat ng problema. Sino ang higit na nasa gitna ng tunggalian?', options: choices(['Jojo', 'Minyong', 'Osias', 'Armando']) },
      { id: 'round-1-reason', label: 'Bakit? Pumili ng dahilan.', options: choices(['Dahil ayaw niyang pumasok sa paaralan.', 'Dahil hindi niya basta tinatanggap ang pamantayang ipinapataw sa kaniya.', 'Dahil gusto niyang maging katulad ng kaniyang mga guro.', 'Dahil gusto niyang makakuha ng mataas na grado.']) },
      { id: 'round-2', label: 'Yugto 2: Si Minyong ay mula sa isang cultural minority at dinala sa Maynila. Sa kabila nito, inaasahan siyang makasunod sa pamantayang ginagamit ng paaralan. Ano ang ipinakikitang suliranin?', options: choices(['Kakulangan sa kaibigan', 'Hindi pantay na pamantayan sa mga mag-aaral', 'Kawalan ng interes sa pag-aaral', 'Problema sa pakikipagkaibigan']) },
      { id: 'round-3', label: 'Yugto 3 — Boss Level: May mga tauhang pinapasa dahil sa kanilang positibong katangian o kalagayan, samantalang sina Jojo at Minyong ay hinuhusgahan batay sa kanilang hindi pag-angkop sa pamantayan. Ano ang ipinahihiwatig nito tungkol sa “pamantayan” ng paaralan?', options: choices(['Pare-pareho at patas ang pamantayan sa lahat.', 'Walang epekto ang pamantayan sa buhay ng mag-aaral.', 'Maaaring maging kasangkapan ang pamantayan sa hindi pantay na pagtingin sa tao.', 'Ang lahat ng mag-aaral ay kailangang magkaroon ng parehong personalidad.']) },
      ...utosConflictJumbles.map(jumble => ({ id: jumble.fieldId, label: `Buuin ang pangalan: ${jumble.answer}`, options: [{ value: jumble.answer, label: jumble.answer }] })),
    ],
  },
  {
    id: 'utos-meanings', storyId: 'm1-story-3', title: 'SaliksiKahulugan', mode: 'individual',
    description: 'Suriin ang tatlong kahulugan ng pamagat na “Utos ng Hari”: literal, mas malalim, at kabuuang interpretasyon.',
    fields: [
      { id: 'literal', label: 'Ano ang kahulugan ng salitang “utos”?', options: choices(['Kalayaan sa sariling pagpapasiya.', 'Dapat isagawa o sundin ng isang tao.', 'Isang kahilingan o mungkahi sa kapwa.', 'Karapatan ng tao na maipahayag ang kanyang damdamin']) },
      { id: 'power', label: 'Ano ang kinakatawan ng Hari sa kuwento?', options: choices(['Ang kapangyarihan ng mga nasa itaas.', 'Ang kaalaman at karunungan ng isang guro.', 'Ang pagmamahal ng isang guro sa mag-aaral', 'Ang katapatan at paglilingkod sa mamamayan.']) },
      { id: 'interpretation', label: 'Ano ang ipinapahiwatig ng kuwento na pinamagatang “Utos ng Hari”?', options: choices(['Pagsunod sa kagustuhan ng nakatataas.', 'Paggalang sa opinyon ng kapwa.', 'Pagtupad sa sariling pangarap.', 'Pagpapahalaga sa pagkakaibigan.']) },
    ],
  },
  {
    id: 'utos-sequence', storyId: 'm1-story-3', title: 'Ayos-Banghay', mode: 'individual',
    description: 'Panuto: Basahin at unawaing mabuti ang mga pangyayari. Isaayos ang mga ito ayon sa tamang pagkakasunod-sunod ng kuwento (mula Simula hanggang Wakas) sa pamamagitan ng pagpili ng tamang sagot sa bawat bilang.',
    fields: Array.from({ length: 6 }, (_, index) => ({ id: `position-${index + 1}`, label: `${['Unang', 'Ikalawang', 'Ikatlong', 'Ikaapat na', 'Ikalimang', 'Ikaanim na'][index]} pangyayari`, options: choices(utosStoryCards) })),
  },
  {
    id: 'utos-stand-up', storyId: 'm1-story-3', title: 'Hinuha-Pahiwatig', mode: 'individual',
    description: '“Hindi baleng dropout, basta tao lang ako.” Suriin ang huling pahayag ni Jojo at iugnay ito sa sariling paninindigan.',
    fields: [
      { id: 'meaning', label: 'Ano ang pinakamalalim na ipinahihiwatig ng paninindigan at mga kilos ni Jojo laban sa sistema ng paaralan?', options: choices(['Mas pinahahalagahan ni Jojo ang sariling dignidad at kritikal na pag-iisip kaysa sa bulag na pagsunod sa hindi makatarungang awtoridad.', 'Nais lamang niyang maghimagsik upang mapansin ng kaniyang mga guro at kamag-aral.', "Nawalan na siya ng interes sa pag-aaral kaya't minabuti niyang tanggapin na lamang ang bagsak na marka.", 'Ipinapakita lamang niya ang kaniyang kawalan ng paggalang sa mga pampublikong tuntunin at utos ng paaralan.']) },
      { id: 'reflection', label: 'Kung ikaw ang nasa kalagayan ni Jojo, anong partikular na “utos” o tuntunin sa lipunan/paaralan ang hindi mo susundin kung ito ay lumalabag sa iyong moralidad? Ipaliwanag ang iyong dahilan batay sa mga aral ng kuwento.' },
      ...utosFaceFieldIds.map((id, index) => ({ id, label: `Mukha ni Minyong · piraso ${index + 1}`, options: [{ value: String(index), label: `Puwesto ${index + 1}` }] })),
    ],
  },
];
