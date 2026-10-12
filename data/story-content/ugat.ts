import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";
import { ugatAssessment } from "./validated-assessments";

const activities = createQuestionActivities("ugat-validated-v1", ugatAssessment)
  // Ugat supplies its own quiz games while retaining the approved 3/3/4 levels.
  .map(activity => ({ ...activity, type: "multiple_choice" as const }));

export const ugat: Story = {
  id: "m1-story-2",
  markahan: 1,
  order: 2,
  title: "Ugat",
  subtitle: "Ang Pagbabagong Nagsisimula sa Sarili",
  author: "Genoveva Edroza-Matute",
  summary: "Isang matandang minsang naniwala sa pagbabagong hatid ng EDSA ang napilitang harapin ang katiwaliang kumapit hindi lamang sa lipunan kundi maging sa kaniyang sarili.",
  coverImage: require("../../assets/images/stories/sa-ilalim-ng-punong-kahoy.png"),
  estimatedMinutes: 11,
  readingXp: 40,
  completionXp: 80,
  scenes: [
    {
      id: "ugat-1",
      title: "Malalalim na Ugat",
      paragraphs: [
        "Sawang-sawa na siya. Talagang abot-langit na ang pagkasawa niya. Mula pa sa pagkabata ay nasaksihan na niya ang katakut-takot na pagpapalit ng mga pinuno, pamamahala, at mga proyektong diumano ay para sa ikauunlad ng nakararaming maralita na kaniyang kinabibilangan—hanggang ngayong pitumpung taong gulang na siya.",
        "Iyon at iyon pa rin: walang tunay na pagbabago. Mayroon sa panlabas, sa mga pahayag, pananaliksik, at pag-aaral, ngunit kayurin nang bahagya at naroon pa rin ang dati't dating pagsasamantala, katiwalian, at kabulukang nangag-ugat na. Malalalim na at nagkabuhol-buhol na ugat.",
        "Natapos na ang tila pangarap na kaluwalhatian ng Mapayapang Himagsikan sa EDSA. Isa siya sa mga sumugod doon. Handa siyang mamatay noon, makita lamang ang pagbagsak ng diktador at mga galamay nito, at maiwan sa mga anak at apo ang naiibang kinabukasang matagal niyang hinintay.",
      ],
    },
    {
      id: "ugat-2",
      title: "Ang Bagong Araw",
      paragraphs: [
        "“Suwerte ninyo,” sabi niya noon sa mga anak at apo. “Bagong araw na ang sisikat sa inyo. Ako? Sa hinaba-haba ng buhay ko, nagpalit-palit lamang ang mga nang-api sa bayang ito—iba't ibang dayuhan at, lalong masakit, mga sariling kababayang masahol pa sa mga dayuhan sa pagkagahaman.”",
        "“Si Tatay naman,” sabi ni Kardo, ang kaniyang panganay. “Kayo ang pinakamalakas sumigaw noon ng ‘Cory! Cory! Cory!’ Tapos sasabihin ninyong mamamatay na kayo!” at siya ay nagtawa.",
        "“Ang corny ni Lolo,” sabi ni Ricky, apo niya kay Kardo. “Sabi ng titser ko, Pilipinas daw ang susunod na magiging greatest. Ayaw mo bang makita ang greatest, Lolo?” May humalang sa kaniyang lalamunan.",
        "Sinabi ni Lina, ina ni Ricky, na writer noon ang kaniyang lolo kaya gayon ito magsalita. Sumabat si Ricky na gusto rin niyang maging writer, ngunit sinabi ng kaklase niyang walang pera roon. Napatda ang matanda, saka kinalong at niyakap nang mahigpit ang apo.",
      ],
    },
    {
      id: "ugat-3",
      title: "Paglayo",
      paragraphs: [
        "Ngayon ay ayaw na niyang tunghayan ang mga pahayagan o makinig sa balita sa radyo at telebisyon. Iyon at iyon din—masahol pa nga yata. Lalong tumitibay at lumalalim ang mga ugat.",
        "“Akala ko pa naman noon, sa EDSA…” Hindi na niya kayang tapusin. Sinabi ni Kardo na matagal silang nalugmok sa kawalang-hiyaan kaya marahil ay matagal din bago sila mahango. Ayaw na niya itong marinig at sa halip ay tinanong kung nasagot na ang sulat ni Bert, ang anak niyang nasa Amerika.",
        "Nagulat sina Kardo at Lina. Dati ay mariin niyang sinasabing hinding-hindi siya aalis sa Pilipinas kahit siya pa ang kahuli-hulihang taong maiiwan. Ngayon ay hindi siya makakibo.",
        "Sa kaniyang katahimikan ay nagsalimbayan ang mga isip: akala niyang magbabago ang lahat ngunit hindi pala. Sa sulat ni Bert ay inaninaw niya ang isang pag-asa: “Baka roon, kung malayong-malayo na ako sa lahat ng ito, matagpuan ko rin ang kapayapaan.”",
      ],
    },
    {
      id: "ugat-4",
      title: "Stateside",
      paragraphs: [
        "Masayang nag-usap sina Kardo at Lina. Sigurado na raw ang pagsama ng kanilang tatay, at matutuwa ang asawa ni Bert dahil may mag-aalaga sa mga anak nito. Matalas ang pandinig ni Ricky at nagsisisigaw siya sa tuwa: “Stateside na kami! Pati si old!”",
        "Madalas niyang tuksuhin ang pinsang si Tasing, anak ni Tiyo Tonio. “Hanggang dito ka na lang ba sa Pilipinas? Kami, mag-i-stateside na!” Palaging sagot ni Tasing, “E, ano? Ano sa akin?” Ngunit isang araw ay umiyak si Tasing nang sabihing pati ang kanilang lolo ay aalis.",
        "Lumapit si Tasing sa matanda upang tiyaking totoo ang balita. Nang tumango ito, lalo siyang umiyak. “Lolo, huwag mo akong iwan! Huwag mo akong iwan!” Matagal na tinitigan ng matanda ang apong isinunod sa kaniyang pangalan—Anastacio, Tasing ngayon at Tasio paglaki.",
      ],
    },
    {
      id: "ugat-5",
      title: "Ang Sagot ni Tasing",
      paragraphs: [
        "“Bakit, Tasing? Ayaw mo akong umalis?” tanong niya. “Kasi mahal kita, Lolo. Mahal kita,” sagot ng bata. Inalok niyang isama ang apo ngunit hindi ito agad sumagot.",
        "Iniisip ni Tasing ang kaniyang ina, ama, mga kapatid, mga kalaro, at maging ang asong si Kulot. Napangiti ang matanda sapagkat kilala niya ang lahat ng binanggit ng apo.",
        "Paano niya maipaliliwanag kay Tasing ang malaki niyang pagkabigo sa buhay? Ang matindi niyang pagkasuklam sa kabulukang humalili sa busilak na pag-asang iniluwal sa EDSA? Nagtim na lamang ang kaniyang mga bagang.",
        "Totoong huli na upang magbago pa ang kaniyang isip. Lalayo siya sa katiwaliang ngumangatngat sa laman ng kaniyang bayan. Sa malayong pook ay pipilitin niyang limutin ang kabiguan ng kaniyang mga pangarap. Isang buwan na lamang at lilipad na sila nina Kardo, Lina, at Ricky. Hindi kasama si Tasing.",
      ],
    },
    {
      id: "ugat-6",
      title: "Isang Kasulatan",
      paragraphs: [
        "Isang kasulatan na lamang ang kulang niya sa pag-alis. Nag-iisip siya kung sinong makapangyarihang tao ang malalapitan. Naalala niya si De Castro, ang nakasama niya sa EDSA at isa nang big shot. Ipasasabi niya kay Kardo na bigyan ito ng gift certificate na nagkakahalaga ng ilang libong piso para sa kasulatang kailangan niya.",
        "Samantala, nagsisigawan sina Ricky at Tasing tungkol sa kanilang takdang-aralin. Sinabi ni Ricky na baka wala nang ganoong homework sa Amerika. Tinanong ng matanda kung ano iyon.",
        "May tanong kung sino sa Amerikano, Hapon, o Pilipino ang nais nilang mapangasawa ng isang kapatid na dalaga. “Siyempre, Amerikano!” sagot ni Ricky. Marahang bumaling ang matanda kay Tasing. “Ako, Lolo? Pilipino!” sagot nito. Pinagtawanan iyon ni Ricky.",
      ],
    },
    {
      id: "ugat-7",
      title: "Pilipino",
      paragraphs: [
        "May isa pang tanong: kung makapipili ng pagkamamamayan, alin sa Amerikano, Hapon, o Pilipino ang pipiliin? Muling sinabi ni Ricky na American citizen ang gusto niya. “Ako, Lolo, Pilipino!” Mataginting ang tinig ni Tasing.",
        "Hindi na hinayaang ituloy ng matanda ang iba pang tanong. Pinaalis niya ang mga bata upang makapagpahinga. Pagod ang kaniyang tinig. Napag-isa siya sa gumagapang na karimlan ng gabi.",
        "Nang magbalik ang kaniyang diwa, nasa sopa pa rin siya. Nagsalimbayan sa kaniyang isip ang mga sagot nina Ricky at Tasing at ang handa niyang ipagawa kay Kardo: isang mamahaling gift certificate para sa big shot na tutulong sa kaniyang kasulatan.",
      ],
    },
    {
      id: "ugat-8",
      title: "Lunas sa Sarili",
      paragraphs: [
        "Biglang umigting ang buo niyang katawan. “Diyos ko! Nasa dugo ko rin pala! Gumapang na rin pala ang ugat sa akin—lahat na pala kami, pati ako! At si Ricky, ang apo kong si Ricky!”",
        "Pusikit pa ang dilim sa paligid. Isang makitid na silahis lamang ng liwanag ang sumisilip sa munting durungawan. Sa silahis na iyon ay tila niya naaaninag ang masiglang kilos at nauulinig ang mataginting na tinig ni Tasing sa pagsagot sa mga tanong.",
        "Marahang-marahan, tulad ng haplos ng isang ina, dumantay ang madaling-araw sa kaniyang pinilakang ulo.",
        "Buo na ang kaniyang pasiya: magpakalayo-layo man ay hindi niya maaaring takasan ang sarili. Taglay niya ang ugat; taglay ng kaniyang dugo ang lason ng sakit. Kailangang ihanap niya ito ng lunas—sa sarili muna—at marahil, sa tulong ni Tasing.",
      ],
    },
  ],
  activities,
  collectible: {
    id: "collectible-ugat",
    title: "Pananagutan",
    category: "Aral ng Kuwento",
    description: "Nagsisimula ang pagbabago sa matapat na pagsusuri at pagwawasto ng sariling kilos.",
    icon: "sprout-outline",
  },
};
