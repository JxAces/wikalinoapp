import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";
import { utosNgHariScenes } from "./utos-ng-hari-scenes";

// App-authored reading questions based on the supplied story, not PDF quotations.
const activities = createQuestionActivities("utos-ng-hari", {
  pamilyar: [
    {
      question: "Sino ang nagsasalaysay ng kaniyang karanasan sa paaralan?",
      choices: ["Minyong", "Jojo", "Osias", "Armando"], answer: 1,
      explanation: "Si Jojo ang mag-aaral na nagsasalaysay gamit ang unang panauhan.",
    },
    {
      question: "Anong asignatura ang itinuturo ni Mrs. Moral Character?",
      choices: ["Physics", "English", "Social Science", "Mathematics"], answer: 2,
      explanation: "Sa simula, ipinakilala ni Jojo ang kaniyang adviser bilang guro sa Social Science.",
    },
    {
      question: "Saan pinapunta ng kaniyang adviser si Jojo pagkatapos ng tanghalian?",
      choices: ["Sa kaniyang cubicle", "Sa aklatan", "Sa chapel", "Sa laboratoryo"], answer: 0,
      explanation: "Ang paanyayang pumunta sa cubicle pagkatapos ng tanghalian ang nagbukas sa kuwento.",
    },
  ],
  suri: [
    {
      question: "Ano ang iminungkahi ni Jojo na unang suriin sa problema ng bansa?",
      choices: ["Pananamit ng mga guro", "Dami ng diploma", "Ayos ng buhok", "Kalagayang pang-ekonomiya"], answer: 3,
      explanation: "Iminungkahi niyang magsimula sa economic condition ng bansa at sa kalagayan ng mga mamamayan.",
    },
    {
      question: "Anong salungatan ang nakikita ni Jojo sa pangangaral ng adviser tungkol sa katapatan?",
      choices: ["Hindi ito nagtuturo ng Social Science.", "Nangangaral ito laban sa pandaraya ngunit ikinukuwento ang pakikilahok nito sa katiwalian sa referendum.", "Ayaw nitong magkaroon ng pagsusulit.", "Hindi ito gumagamit ng ballpen."], answer: 1,
      explanation: "Inihahambing ng salaysay ang pangangaral tungkol sa katapatan at ang iniulat na kilos ng guro bilang watcher.",
    },
    {
      question: "Bakit mahalaga sa kuwento ang karanasan ni Minyong?",
      choices: ["Siya ang namamahala sa paaralan.", "Siya ang nagbigay ng diploma kay Jojo.", "Inilalantad nito ang paghusga sa mag-aaral na mula sa ibang kulturang hindi inuunawa ang kaniyang kalagayan.", "Ipinapakita nitong pare-pareho ang karanasan ng lahat."], answer: 2,
      explanation: "Kinuha si Minyong mula sa kaniyang pamayanan, ngunit hinatulan siyang hindi angkop sa pamantayan ng paaralan.",
    },
    {
      question: "Ano ang ipinakikita ng paghahambing kay Minyong at kina Osias at Armando?",
      choices: ["May pagtatangi sa paglalapat ng pamantayan.", "Walang guro ang nagbibigay ng marka.", "Lahat ay awtomatikong pumapasa.", "Pareho silang may karamdaman."], answer: 0,
      explanation: "Mahigpit ang hatol kay Minyong ngunit may pabor sa iba batay sa pakikisama, anyo, at katayuan ng pamilya.",
    },
    {
      question: "Bakit tumatango at humihingi ng paumanhin si Jojo kahit may pagtutol siya?",
      choices: ["Nakalimutan niya ang lahat ng pangyayari.", "Nais niyang maging adviser.", "Sumasang-ayon siya sa bawat sinabi.", "Sinisikap niyang matapos ang sermon at umiwas sa pagtatalo sa gurong may kapangyarihan sa kaniya."], answer: 3,
      explanation: "Paulit-ulit niyang pinapaalalahanan ang sarili na huwag kumibo at ngumiti na lamang.",
    },
    {
      question: "Ano ang layunin ng pagbanggit ni Jojo kina Einstein, Beethoven, at iba pang kilalang tao?",
      choices: ["Patunay na kaklase niya sila.", "Pagkuwestiyon sa paghusga sa kakayahan batay lamang sa anyo at pormal na kwalipikasyon.", "Paghiling na alisin ang lahat ng aralin.", "Paglalahad ng opisyal na patakaran ng paaralan."], answer: 1,
      explanation: "Iniisip niyang maaaring tanggihan maging ang mahuhusay na tao dahil sa pananamit, buhok, o kawalan ng diploma.",
    },
  ],
  dalubhasa: [
    {
      question: "Sa konteksto ng kuwento, ano ang maaaring katawanin ng “hari” sa pamagat?",
      choices: ["Isang literal na monarkang dumalaw sa paaralan", "Ang ama ni Jojo", "Mga awtoridad na umaasang masunod ang kanilang hatol nang walang pagtutol", "Ang nagwagi sa paligsahan"], answer: 2,
      explanation: "Tinawag na pangkat ng mga Hari ang mga gurong humahatol sa mga mag-aaral.",
    },
    {
      question: "Ano ang ipinahihiwatig ng “Hindi baleng dropout, basta tao lang ako”?",
      choices: ["Nais ni Jojo na mapanatili ang kaniyang dignidad at tinig sa harap ng mapaniil na pagtrato.", "Wala nang halaga ang anumang pag-aaral.", "Nais niyang pamunuan ang paaralan.", "Tanggap niya ang lahat ng hatol nang walang tanong."], answer: 0,
      explanation: "Kasabay ng pahayag ang pasiyang magsalita at huwag maging bato; nakatuon ito sa kaniyang pagkatao.",
    },
    {
      question: "Aling pagbasa ang isinasaalang-alang na si Jojo mismo ang tagapagsalaysay?",
      choices: ["Lahat ng kaniyang hinala ay napatunayang opisyal na ulat.", "Walang damdamin ang pagsasalaysay.", "Hindi siya kasali sa pangyayari.", "Mahalagang suriin ang kaniyang mga karanasan at galit, at ihiwalay ang napagmasdan sa hinala o pangungutya."], answer: 3,
      explanation: "Unang panauhan ang kuwento; may personal na pagninilay, inisip na usapan, at mapanuyang paghahambing.",
    },
    {
      question: "Aling tugon ang higit na makatarungan sa sitwasyon ni Minyong?",
      choices: ["Husgahan siya bago pakinggan.", "Unawain ang kaniyang kalagayan, pakinggan siya, at magbigay ng angkop na suporta at patas na pagsusuri.", "Ipasa lamang ang may mayamang magulang.", "Gawing katatawanan ang kaniyang pinagmulan."], answer: 1,
      explanation: "Ang hindi pakikinig at pagtatangi sa kuwento ay nagpapakita kung bakit kailangan ang paggalang at patas na pagtrato.",
    },
    {
      question: "Ano ang bisa ng panunuya at mga bansag sa mga guro sa salaysay?",
      choices: ["Ginagawa nitong opisyal ang lahat ng tsismis.", "Inaalis nito ang tunggalian.", "Pinatitingkad nito ang galit ni Jojo at ang agwat ng ipinangangaral at ginagawa ng awtoridad.", "Pinatutunayang literal na hari ang bawat guro."], answer: 2,
      explanation: "Ginagamit ang mapanuyang tinig upang ilantad ang nakikitang pagkukunwari at hindi pantay na pamantayan.",
    },
    {
      question: "Alin ang pinakamalapit sa hamon ng kuwento sa mambabasa?",
      choices: ["Suriin kung ang paggamit ng kapangyarihan at mga pamantayan ay gumagalang sa pagkatao at karapatang magsalita.", "Sundin ang bawat utos nang hindi nag-iisip.", "Ibatay ang talino sa ayos ng buhok.", "Husgahan ang lahat ng guro bilang magkakatulad."], answer: 0,
      explanation: "Ang tunggalian ay nag-uudyok na suriin ang awtoridad, pagtatangi, at dignidad sa loob ng paaralan.",
    },
  ],
}, { pamilyar: 3, suri: 3, dalubhasa: 4 });

export const utosNgHari: Story = {
  id: "m1-story-3",
  markahan: 1,
  order: 3,
  title: "Utos ng Hari",
  subtitle: "Kapangyarihan, Pamantayan, at Pagkatao",
  author: "Jun Cruz Reyes",
  summary: "Isinasalaysay ni Jojo ang kaniyang pagtutol sa hindi pantay na pamantayan ng paaralan at ang pagnanais na mapakinggan at igalang bilang tao.",
  coverImage: require("../../assets/images/stories/ang-huling-upuan.png"),
  estimatedMinutes: 25,
  readingXp: 40,
  completionXp: 80,
  scenes: utosNgHariScenes,
  activities,
  collectible: {
    id: "collectible-utos-ng-hari",
    title: "Tinig at Dignidad",
    category: "Aral ng Kuwento",
    description: "Mahalagang suriin ang kapangyarihan at igalang ang pagkatao at tinig ng bawat mag-aaral.",
    icon: "bullhorn-outline",
  },
};
