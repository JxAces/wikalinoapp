/** Paraphrased classroom-PDF clues, checked against the app's Ugat story. */
export const ugatClues = [
  { id: 'events', title: 'Pangyayari', paragraphs: [
    'Nasaksihan ni Anastacio ang paulit-ulit na pagbabago ng mga pinuno at pamahalaan, ngunit nananatili ang katiwalian at pang-aabuso.',
    'Lumahok siya sa Mapayapang Himagsikan sa EDSA, umaasang magkakaroon ng mas magandang kinabukasan ang bansa at ang kaniyang mga anak at apo.',
    'Inalok ni Bert na dalhin sa Amerika ang pamilya. Nais sumama ni Anastacio ngunit kailangan muna niya ng isang mahalagang dokumento.',
    'Naisip niyang bigyan ng regalo si De Castro upang mapadali ang proseso. Napagtanto niyang maaari rin niyang gawin ang maling gawaing matagal niyang kinamumuhian.',
  ] },
  { id: 'characters', title: 'Tauhan', paragraphs: [
    'Anastacio / Lolo Tacio — matandang umasa sa pagbabago ngunit nakaranas ng matinding pagkadismaya sa lipunan.',
    'Ricky — apo ni Anastacio na humahanga sa buhay sa Amerika at nais maging Amerikano.',
    'Tasing — apong ayaw iwan ang kaniyang lolo at pinipiling manatiling Pilipino.',
    'Kardo at Lina — mga kapamilyang kasama sa planong pagpunta sa Amerika.',
    'Bert — anak ni Anastacio na nasa Amerika at nag-alok na dalhin doon ang pamilya.',
    'De Castro — dating kasama ni Anastacio sa EDSA na naisip niyang lapitan para sa dokumento.',
  ] },
  { id: 'problem', title: 'Suliranin', paragraphs: [
    'Panlabas: Patuloy ang katiwalian, kasinungalingan, at pansariling interes kahit nagkaroon ng mga pagbabagong pampolitika.',
    'Panloob: Hinaharap ni Anastacio ang pagkadismaya at ang katotohanang maaari rin siyang makibahagi sa problemang kaniyang kinamumuhian.',
  ] },
  { id: 'decision', title: 'Desisyon', paragraphs: [
    'Sa simula, pumayag siyang sumama sa Amerika upang makalayo sa mga suliranin sa bansa.',
    'Sa huli, kinilala niyang dapat niyang suriin ang sariling bahagi sa suliranin. Kailangang magsimula ang pagbabago sa sarili, hindi lamang sa paglayo o pagsisi sa iba.',
  ] },
];

export const ugatZones = [
  { id: 'root', title: 'Ugat', prompt: 'Ano ang pangunahing suliranin o pinagmumulan ng problema?', icon: 'sprout' },
  { id: 'branch', title: 'Sanga', prompt: 'Anong mga pangyayari, kilos, o desisyon ang kaugnay ng suliranin?', icon: 'source-branch' },
  { id: 'leaf', title: 'Dahon', prompt: 'Anong detalye o patunay mula sa teksto ang sumusuporta sa pagsusuri?', icon: 'leaf' },
  { id: 'fruit', title: 'Bunga', prompt: 'Anong mensahe o aral ang mabubuo mula sa mga ito?', icon: 'fruit-cherries' },
] as const;
export type UgatZoneId = typeof ugatZones[number]['id'];

/** Movable ideas, not an automatic answer key. */
export const ugatIdeaCards = [
  { id: 'corruption', text: 'Nananatili ang katiwalian at pansariling interes sa lipunan at maging sa tao.' },
  { id: 'edsa', text: 'Lumahok si Anastacio sa EDSA dahil umaasa siya sa pagbabago.' },
  { id: 'departure', text: 'Pumayag siyang sumama sa Amerika upang makalayo sa kaniyang pagkadismaya.' },
  { id: 'gift', text: 'Naisip niyang magbigay ng regalo kay De Castro upang mapabilis ang dokumento.' },
  { id: 'realization', text: 'Nakilala ni Anastacio na nasa sarili rin niya ang ugaling kaniyang kinamumuhian.' },
  { id: 'change', text: 'Nagsisimula ang pagbabago sa pagsusuri at pagwawasto ng sariling kilos.' },
];
