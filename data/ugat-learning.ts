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
  // Keep saved category IDs stable while showing their meaning directly to pupils.
  { id: 'root', title: 'Suliranin', helper: 'Ang pangunahing problema sa kuwento.', prompt: 'Ano ang problemang kinaharap ni Lolo Tacio?', placeholder: 'Ang pangunahing problema ay…', icon: 'help-circle-outline' },
  { id: 'branch', title: 'Pangyayari', helper: 'Mga ginawa o naranasan ng tauhan.', prompt: 'Ano ang ginawa o naranasan ni Lolo Tacio?', placeholder: 'Si Lolo Tacio ay…', icon: 'format-list-numbered' },
  { id: 'leaf', title: 'Patunay', helper: 'Detalye sa kuwento na sumusuporta sa sagot.', prompt: 'Aling detalye sa kuwento ang sumusuporta sa inyong sagot?', placeholder: 'Makikita sa kuwento na…', icon: 'book-open-page-variant-outline' },
  { id: 'fruit', title: 'Aral', helper: 'Mahalagang natutuhan mula sa kuwento.', prompt: 'Ano ang aral na makukuha sa kuwento?', placeholder: 'Natutuhan namin na…', icon: 'lightbulb-outline' },
] as const;
export type UgatZoneId = typeof ugatZones[number]['id'];

/** Current Banyuhay categories; keep the legacy Patunay zone above for old saves. */
export const ugatMapZones = ugatZones.filter(zone => zone.id !== 'leaf');

/** Movable ideas, not an automatic answer key. */
export const ugatIdeaCards = [
  { id: 'corruption', text: 'Nananatili ang katiwalian at pansariling interes sa lipunan at maging sa tao.' },
  { id: 'edsa', text: 'Lumahok si Anastacio sa EDSA dahil umaasa siya sa pagbabago.' },
  { id: 'departure', text: 'Pumayag siyang sumama sa Amerika upang makalayo sa kaniyang pagkadismaya.' },
  { id: 'gift', text: 'Naisip niyang magbigay ng regalo kay De Castro upang mapabilis ang dokumento.' },
  { id: 'realization', text: 'Nakilala ni Anastacio na nasa sarili rin niya ang ugaling kaniyang kinamumuhian.' },
  { id: 'change', text: 'Nagsisimula ang pagbabago sa pagsusuri at pagwawasto ng sariling kilos.' },
];
