import { ImageSourcePropType } from "react-native";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export type ChoiceActivityType =
  | "multiple_choice"
  | "evidence_hunt"
  | "vocabulary"
  | "theme_detective";

export type ChoiceActivity = {
  id: string;
  type: ChoiceActivityType;

  title: string;
  instruction: string;
  question: string;

  choices: string[];
  answer: string;

  hint: string;
  explanation: string;

  xp: number;

  isFinal?: boolean;
};

export type PlotSequenceActivity = {
  id: string;
  type: "plot_sequence";

  title: string;
  instruction: string;
  question: string;

  items: string[];
  answer: string[];

  hint: string;
  explanation: string;

  xp: number;

  isFinal?: boolean;
};

export type StoryActivity =
  | ChoiceActivity
  | PlotSequenceActivity;

export type StoryPrediction = {
  question: string;
  choices: string[];
  reveal: string;
};

export type StoryScene = {
  id: string;
  title: string;
  paragraphs: string[];

  prediction?: StoryPrediction;
};

export type StoryCollectible = {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
};

export type Story = {
  id: string;

  markahan: number;
  order: number;

  title: string;
  subtitle: string;
  author: string;
  summary: string;

  coverImage: ImageSourcePropType;

  estimatedMinutes: number;

  readingXp: number;
  completionXp: number;

  scenes: StoryScene[];

  activities: StoryActivity[];

  collectible: StoryCollectible;
};

export type StoryUnit = {
  id: string;

  markahan: number;

  title: string;
  subtitle: string;

  stories: Story[];
};

/*
 * =========================================================
 * STORY 1
 * ANG LUMANG LAMPARA
 * =========================================================
 */

const storyOne: Story = {
  id: "m1-story-1",

  markahan: 1,
  order: 1,

  title: "Ang Lumang Lampara",

  subtitle: "Liwanag sa Gitna ng Dilim",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Isang lumang lampara ang magtuturo kay Lira kung paano maaaring magkaroon ng malaking kahulugan ang isang simpleng bagay.",

  coverImage: require("../assets/images/stories/ang-lumang-lampara.png"),

  estimatedMinutes: 6,

  readingXp: 20,
  completionXp: 40,

  scenes: [
    {
      id: "lamp-scene-1",

      title: "Ang Natagpuan",

      paragraphs: [
        "Isang maulang hapon, tumulong si Lira sa paglilinis ng lumang silid ng kaniyang lolo.",

        "Sa ilalim ng isang kahong puno ng lumang kuwaderno, nakita niya ang isang maliit na lamparang halos natatakpan na ng alikabok.",

        "Hindi niya mawari kung bakit maingat itong binalot ng kaniyang lolo sa isang lumang panyo.",
      ],

      prediction: {
        question:
          "Ano sa tingin mo ang unang gagawin ni Lira sa lampara?",

        choices: [
          "Itatapon niya ito",
          "Tatanungin niya ang kaniyang lolo",
          "Ibebenta niya ito",
          "Itatago niya agad",
        ],

        reveal:
          "Sa halip na itapon ito, dinala ni Lira ang lampara sa kaniyang lolo at nagtanong tungkol dito.",
      },
    },

    {
      id: "lamp-scene-2",

      title: "Ang Kuwento ni Lolo",

      paragraphs: [
        "Ngumiti ang kaniyang lolo nang makita ang lampara.",

        "Ipinaliwanag niyang noong wala pang kuryente sa kanilang lugar, ginagamit niya iyon tuwing gabi upang gabayan ang mga kapitbahay na kailangang tumawid sa madilim na daan.",

        "Para kay Lira, isa lamang itong lumang bagay. Para sa kaniyang lolo, isa itong paalala ng pagtutulungan.",
      ],
    },

    {
      id: "lamp-scene-3",

      title: "Ang Dilim",

      paragraphs: [
        "Makalipas ang ilang araw, isang malakas na ulan ang nagdulot ng pagkawala ng kuryente sa buong barangay.",

        "Habang nakatanaw si Lira sa bintana, napansin niyang may batang tila hindi makita ang daan pauwi.",

        "Naalala niya ang sinabi ng kaniyang lolo.",
      ],

      prediction: {
        question:
          "Ano kaya ang pinakamahalagang desisyon ni Lira sa bahaging ito?",

        choices: [
          "Manatili lamang sa loob",
          "Gamitin ang lampara upang tumulong",
          "Matulog habang brownout",
          "Itago muli ang lampara",
        ],

        reveal:
          "Kinuha ni Lira ang lumang lampara at ginamit ito upang tulungan ang batang makabalik sa kaniyang pamilya.",
      },
    },

    {
      id: "lamp-scene-4",

      title: "Bagong Kahulugan",

      paragraphs: [
        "Habang hawak ang lampara, napagtanto ni Lira na hindi pala ang edad o halaga ng isang bagay ang nagbibigay rito ng kabuluhan.",

        "Ang tunay na halaga nito ay nagmumula sa paraan kung paano ito ginagamit para sa ibang tao.",

        "Mula noon, itinabi niya ang lampara hindi bilang lumang gamit, kundi bilang paalala na kahit maliit na liwanag ay may kakayahang gumabay.",
      ],
    },
  ],

  activities: [
    {
      id: "lamp-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Pahiwatig",

      instruction:
        "Piliin ang pangungusap na pinakamahusay na nagpapakita ng pagbabago ng pananaw ni Lira.",

      question:
        "Alin ang pinakamalakas na ebidensiya mula sa kwento?",

      choices: [
        "Isang maulang hapon, tumulong si Lira sa paglilinis.",

        "Hindi niya mawari kung bakit maingat na binalot ang lampara.",

        "Napagtanto ni Lira na hindi ang edad o halaga ng isang bagay ang nagbibigay rito ng kabuluhan.",

        "Nawala ang kuryente sa buong barangay.",
      ],

      answer:
        "Napagtanto ni Lira na hindi ang edad o halaga ng isang bagay ang nagbibigay rito ng kabuluhan.",

      hint:
        "Hanapin ang bahaging nagpapakita na nagbago ang iniisip ni Lira tungkol sa lampara.",

      explanation:
        "Ipinapakita ng pangungusap na ito ang pagbabago mula sa pagtingin sa lampara bilang lumang bagay tungo sa pagkilala sa mas malalim nitong kahulugan.",

      xp: 25,
    },

    {
      id: "lamp-plot",

      type: "plot_sequence",

      title: "Ayusin ang Banghay",

      instruction:
        "Piliin ang mga pangyayari ayon sa tamang pagkakasunod-sunod.",

      question:
        "Ano ang wastong pagkakasunod ng mahahalagang pangyayari?",

      items: [
        "Ginamit ni Lira ang lampara upang tulungan ang isang bata.",

        "Natagpuan ni Lira ang lumang lampara.",

        "Ipinaliwanag ng lolo ang kasaysayan ng lampara.",

        "Napagtanto ni Lira ang tunay na halaga ng lampara.",
      ],

      answer: [
        "Natagpuan ni Lira ang lumang lampara.",

        "Ipinaliwanag ng lolo ang kasaysayan ng lampara.",

        "Ginamit ni Lira ang lampara upang tulungan ang isang bata.",

        "Napagtanto ni Lira ang tunay na halaga ng lampara.",
      ],

      hint:
        "Balikan kung ano ang unang natuklasan ni Lira bago niya nalaman ang kahulugan ng lampara.",

      explanation:
        "Ang maayos na pagkakasunod-sunod ng mga pangyayari ang bumubuo sa pag-unlad ng banghay.",

      xp: 30,
    },

    {
      id: "lamp-vocabulary",

      type: "vocabulary",

      title: "Salitang Lihim",

      instruction:
        "Gamitin ang konteksto ng pangungusap upang tukuyin ang kahulugan.",

      question:
        'Sa pangungusap na "Hindi niya mawari kung bakit...", ano ang pinakamalapit na kahulugan ng "mawari"?',

      choices: [
        "Maunawaan",
        "Maitago",
        "Maitapon",
        "Makalimutan",
      ],

      answer: "Maunawaan",

      hint:
        "Isipin kung ano ang hindi maintindihan ni Lira tungkol sa lampara.",

      explanation:
        'Ang "mawari" ay nangangahulugang maunawaan o malaman.',

      xp: 20,
    },

    {
      id: "lamp-theme",

      type: "theme_detective",

      title: "Tema Detective",

      instruction:
        "Suriin ang kabuuang kwento at piliin ang pinakamalakas na tema.",

      question:
        "Ano ang pangunahing temang ipinahihiwatig ng kwento?",

      choices: [
        "Ang mga lumang bagay ay dapat itapon",

        "Ang tunay na halaga ay makikita sa paraan ng pagtulong sa iba",

        "Mas mahalaga ang bagong kagamitan",

        "Dapat iwasan ang paglabas kapag umuulan",
      ],

      answer:
        "Ang tunay na halaga ay makikita sa paraan ng pagtulong sa iba",

      hint:
        "Isipin kung ano ang natutuhan ni Lira matapos niyang gamitin ang lampara.",

      explanation:
        "Ang lampara ay naging simbolo ng pagtulong at paggabay. Ang kahulugan nito ay nagmula sa paggamit nito para sa kapwa.",

      xp: 35,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-banghay",

    title: "Banghay",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang banghay ay ang organisadong pagkakasunod-sunod ng mahahalagang pangyayari sa isang kwento.",

    icon: "timeline-text-outline",
  },
};

/*
 * =========================================================
 * STORY 2
 * ANG HULING UPUAN
 * =========================================================
 */

const storyTwo: Story = {
  id: "m1-story-2",

  markahan: 1,
  order: 2,

  title: "Ang Huling Upuan",

  subtitle: "Tungkol sa Paggalang at Pakikinig",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Isang bagong mag-aaral ang magbabago sa pananaw ni Mika tungkol sa pakikipagkaibigan at pag-unawa sa ibang tao.",

  coverImage: require("../assets/images/stories/ang-huling-upuan.png"),

  estimatedMinutes: 6,

  readingXp: 20,
  completionXp: 40,

  scenes: [
    {
      id: "seat-scene-1",

      title: "Ang Bagong Kaklase",

      paragraphs: [
        "Pagpasok ni Mika sa silid-aralan, napansin niya ang isang bagong mag-aaral na nakaupo sa pinakahuling upuan.",

        "Tahimik si Jomar at bihira siyang makipag-usap sa iba.",

        "Ipinapalagay ng ilan sa klase na ayaw lamang niyang makipagkaibigan.",
      ],

      prediction: {
        question:
          "Ano ang pinakamainam na gawin ni Mika bago humusga kay Jomar?",

        choices: [
          "Iwasan siya",
          "Kausapin at kilalanin muna siya",
          "Gayahan ang sinasabi ng iba",
          "Hayaan siyang laging mag-isa",
        ],

        reveal:
          "Nagpasya si Mika na kausapin muna si Jomar sa halip na umasa sa palagay ng ibang kaklase.",
      },
    },

    {
      id: "seat-scene-2",

      title: "Ang Proyekto",

      paragraphs: [
        "Nang ipares sila para sa isang proyekto, napansin ni Mika na mahusay gumuhit si Jomar.",

        "Sa kanilang pag-uusap, nalaman niyang nahihiya lamang si Jomar dahil bago siya sa paaralan.",

        "Unti-unting nawala ang dating pag-aakala ni Mika.",
      ],
    },

    {
      id: "seat-scene-3",

      title: "Ang Pagbabago",

      paragraphs: [
        "Sa araw ng presentasyon, iminungkahi ni Mika na si Jomar ang magpaliwanag ng kanilang ilustrasyon.",

        "Nag-alinlangan muna si Jomar ngunit kalaunan ay pumayag.",

        "Nagulat ang klase sa husay ng kaniyang paliwanag at pagguhit.",
      ],

      prediction: {
        question:
          "Ano kaya ang magiging reaksyon ng klase matapos marinig si Jomar?",

        choices: [
          "Patuloy nila siyang hindi papansinin",
          "Makikita nila ang kaniyang kakayahan",
          "Tatawanan nila siya",
          "Aalis sila sa silid",
        ],

        reveal:
          "Humanga ang klase sa husay ni Jomar at nagsimulang mas makipag-usap sa kaniya.",
      },
    },

    {
      id: "seat-scene-4",

      title: "Hindi Na Huling Upuan",

      paragraphs: [
        "Kinabukasan, hindi na nag-iisa si Jomar sa huling upuan.",

        "Naupo sa tabi niya si Mika at ilang kaklase.",

        "Natutuhan nilang hindi sapat ang unang tingin upang tunay na makilala ang isang tao.",
      ],
    },
  ],

  activities: [
    {
      id: "seat-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Ebidensiya",

      instruction:
        "Piliin ang pangyayaring nagpapakita na nagbago ang pananaw ni Mika.",

      question:
        "Alin ang pinakamalinaw na ebidensiya?",

      choices: [
        "Napansin niya ang huling upuan.",

        "Ipinapalagay ng ilan na ayaw makipagkaibigan ni Jomar.",

        "Iminungkahi ni Mika na si Jomar ang magpaliwanag ng kanilang ilustrasyon.",

        "Pumasok sila sa silid-aralan.",
      ],

      answer:
        "Iminungkahi ni Mika na si Jomar ang magpaliwanag ng kanilang ilustrasyon.",

      hint:
        "Hanapin ang kilos ni Mika na nagpapakitang may tiwala na siya kay Jomar.",

      explanation:
        "Ang pagbibigay ni Mika ng pagkakataon kay Jomar ang nagpapakitang nabago na ang dati niyang pagtingin.",

      xp: 25,
    },

    {
      id: "seat-plot",

      type: "plot_sequence",

      title: "Buuin ang Eksena",

      instruction:
        "Ayusin ang mahahalagang pangyayari.",

      question:
        "Ano ang tamang pagkakasunod-sunod?",

      items: [
        "Naging magkagrupo sina Mika at Jomar.",

        "Naupo kasama ni Jomar ang ibang kaklase.",

        "Napansin ni Mika si Jomar sa huling upuan.",

        "Nagpresenta si Jomar sa klase.",
      ],

      answer: [
        "Napansin ni Mika si Jomar sa huling upuan.",

        "Naging magkagrupo sina Mika at Jomar.",

        "Nagpresenta si Jomar sa klase.",

        "Naupo kasama ni Jomar ang ibang kaklase.",
      ],

      hint:
        "Magsimula sa unang pagkakataon na napansin ni Mika ang bagong kaklase.",

      explanation:
        "Makikita sa pagkakasunod na ito kung paano unti-unting nagbago ang relasyon ng mga tauhan.",

      xp: 30,
    },

    {
      id: "seat-vocabulary",

      type: "vocabulary",

      title: "Talasalitaan",

      instruction:
        "Piliin ang pinakamalapit na kahulugan ayon sa konteksto.",

      question:
        'Ano ang ibig sabihin ng "nag-alinlangan" sa pangungusap na "Nag-alinlangan muna si Jomar ngunit kalaunan ay pumayag"?',

      choices: [
        "Nagdalawang-isip",
        "Natuwa agad",
        "Nagalit",
        "Tumakbo",
      ],

      answer: "Nagdalawang-isip",

      hint:
        "Hindi kaagad pumayag si Jomar.",

      explanation:
        'Ang "nag-alinlangan" ay nangangahulugang nagdalawang-isip o hindi agad nakapagpasya.',

      xp: 20,
    },

    {
      id: "seat-theme",

      type: "theme_detective",

      title: "Pangwakas na Hamon",

      instruction:
        "Suriin ang mensaheng ipinapakita ng buong kwento.",

      question:
        "Ano ang pinakamahalagang aral ng kwento?",

      choices: [
        "Ang tahimik na tao ay laging malungkot",

        "Dapat humusga batay sa unang tingin",

        "Mas mabuting kilalanin muna ang isang tao bago humusga",

        "Mas mabuting gumawa nang mag-isa",
      ],

      answer:
        "Mas mabuting kilalanin muna ang isang tao bago humusga",

      hint:
        "Isipin kung ano ang unang inakala tungkol kay Jomar at kung ano ang nalaman nila sa huli.",

      explanation:
        "Ipinapakita ng kwento na maaaring mali ang unang impresyon at mahalagang unawain muna ang karanasan ng ibang tao.",

      xp: 35,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-tauhan",

    title: "Tauhan",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang tauhan ay ang mga gumaganap at kumikilos sa loob ng kwento. Ang kanilang kilos at pagbabago ay mahalaga sa pag-unlad ng salaysay.",

    icon: "account-group-outline",
  },
};

/*
 * =========================================================
 * STORY 3
 * SA ILALIM NG PUNONG KAHOY
 * =========================================================
 */

const storyThree: Story = {
  id: "m1-story-3",

  markahan: 1,
  order: 3,

  title: "Sa Ilalim ng Punong Kahoy",

  subtitle: "Pagtapat at Tiwala",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Sa ilalim ng isang matandang puno, matutuklasan ni Mara na ang isang lugar ay maaaring maglaman ng mga alaala, pangako, at katotohanan.",

  coverImage: require("../assets/images/stories/sa-ilalim-ng-punong-kahoy.png"),

  estimatedMinutes: 7,

  readingXp: 25,
  completionXp: 45,

  scenes: [
    {
      id: "tree-scene-1",

      title: "Ang Matandang Puno",

      paragraphs: [
        "Sa likod ng lumang bahay ng kanilang pamilya ay nakatayo ang isang malawak na punong acacia.",

        "Tuwing hapon, doon madalas umupo si Mara upang magbasa at makipagkuwentuhan sa kaniyang pinsang si Aya.",

        "Isang araw, napansin niyang tahimik si Aya at tila may mabigat na iniisip.",
      ],

      prediction: {
        question:
          "Ano ang pinakamainam na gawin ni Mara kapag napansing may problema si Aya?",

        choices: [
          "Piliting magsalita agad si Aya",
          "Makinig kapag handa nang magsalita si Aya",
          "Ikuwento agad sa ibang tao",
          "Umalis at huwag pansinin",
        ],

        reveal:
          "Hindi pinilit ni Mara si Aya. Umupo lamang siya sa tabi nito at sinabing handa siyang makinig anumang oras.",
      },
    },

    {
      id: "tree-scene-2",

      title: "Ang Lihim",

      paragraphs: [
        "Makalipas ang ilang sandali, nagsimulang magsalita si Aya.",

        "Inamin niyang siya ang nakabasag ng isang mahalagang paso sa kanilang bahay ngunit natatakot siyang sabihin ang totoo.",

        "Hiniling niya kay Mara na huwag sabihin kahit kanino.",
      ],
    },

    {
      id: "tree-scene-3",

      title: "Ang Payo",

      paragraphs: [
        "Hindi agad sumagot si Mara.",

        "Alam niyang mahalaga ang tiwala, ngunit alam din niyang maaaring mas lumaki ang problema kung patuloy na itatago ni Aya ang katotohanan.",

        "Hinimok niya itong magsabi ng totoo sa kaniyang mga magulang at nangakong sasamahan siya.",
      ],

      prediction: {
        question:
          "Ano sa tingin mo ang magiging bunga ng pagiging tapat ni Aya?",

        choices: [
          "Lalong lalaki ang problema",
          "Magkakaroon siya ng pagkakataong itama ang pagkakamali",
          "Mawawala lahat ng kaibigan niya",
          "Walang mangyayari",
        ],

        reveal:
          "Nagalit man nang kaunti ang mga magulang ni Aya, pinahalagahan nila ang kaniyang katapatan at tinulungan siyang ayusin ang pagkakamali.",
      },
    },

    {
      id: "tree-scene-4",

      title: "Sa Ilalim ng Puno",

      paragraphs: [
        "Kinabukasan, muli silang naupo sa ilalim ng acacia.",

        "Nagpasalamat si Aya kay Mara dahil hindi siya nito hinusgahan at sa halip ay tinulungan siyang gumawa ng tama.",

        "Natutuhan nilang ang tunay na tiwala ay hindi lamang pagtatago ng lihim kundi pagtulong sa isang kaibigan na harapin ang katotohanan.",
      ],
    },
  ],

  activities: [
    {
      id: "tree-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Ebidensiya",

      instruction:
        "Piliin ang pangyayaring pinakamahusay na nagpapakita ng pagiging mabuting kaibigan ni Mara.",

      question:
        "Alin ang pinakamalakas na ebidensiya?",

      choices: [
        "Umupo si Mara sa ilalim ng puno.",

        "Hinimok ni Mara si Aya na magsabi ng totoo at nangakong sasamahan siya.",

        "May nabasag na paso.",

        "Tahimik si Aya noong una.",
      ],

      answer:
        "Hinimok ni Mara si Aya na magsabi ng totoo at nangakong sasamahan siya.",

      hint:
        "Hanapin ang kilos na nagpapakitang hindi lamang nakinig si Mara kundi tumulong din siyang gumawa ng tama.",

      explanation:
        "Makikita rito ang malasakit ni Mara dahil tinulungan niya si Aya na harapin ang problema nang hindi siya pinapabayaan.",

      xp: 25,
    },

    {
      id: "tree-plot",

      type: "plot_sequence",

      title: "Ayusin ang Banghay",

      instruction:
        "Ayusin ang mahahalagang pangyayari sa tamang pagkakasunod.",

      question:
        "Ano ang wastong pagkakasunod-sunod?",

      items: [
        "Inamin ni Aya ang kaniyang pagkakamali sa mga magulang.",

        "Napansin ni Mara na may problema si Aya.",

        "Sinabi ni Aya kay Mara ang tungkol sa nabasag na paso.",

        "Pinayuhan ni Mara si Aya na sabihin ang katotohanan.",
      ],

      answer: [
        "Napansin ni Mara na may problema si Aya.",

        "Sinabi ni Aya kay Mara ang tungkol sa nabasag na paso.",

        "Pinayuhan ni Mara si Aya na sabihin ang katotohanan.",

        "Inamin ni Aya ang kaniyang pagkakamali sa mga magulang.",
      ],

      hint:
        "Magsimula sa unang palatandaan na may problema si Aya.",

      explanation:
        "Ipinapakita ng pagkakasunod-sunod kung paano umunlad ang suliranin mula sa pagtatago tungo sa pag-amin at pag-aayos.",

      xp: 30,
    },

    {
      id: "tree-vocabulary",

      type: "vocabulary",

      title: "Salitang Lihim",

      instruction:
        "Piliin ang pinakamalapit na kahulugan batay sa konteksto.",

      question:
        'Ano ang kahulugan ng "hinimok" sa pangungusap na "Hinimok niya itong magsabi ng totoo"?',

      choices: [
        "Hinikayat",
        "Pinagalitan",
        "Iniwasan",
        "Pinatahimik",
      ],

      answer: "Hinikayat",

      hint:
        "Isipin kung ano ang ginawa ni Mara upang tulungang gumawa ng tama si Aya.",

      explanation:
        'Ang "hinimok" ay nangangahulugang hinikayat o pinasiglang gumawa ng isang bagay.',

      xp: 20,
    },

    {
      id: "tree-theme",

      type: "theme_detective",

      title: "Tema Detective",

      instruction:
        "Suriin ang kabuuang mensahe ng kwento.",

      question:
        "Ano ang pinakamalakas na tema?",

      choices: [
        "Ang tunay na tiwala ay kasama ang pagtulong sa kaibigan na gawin ang tama",

        "Lahat ng lihim ay dapat itago",

        "Mas mabuting huwag umamin sa pagkakamali",

        "Ang pagkakaibigan ay walang kinalaman sa katapatan",
      ],

      answer:
        "Ang tunay na tiwala ay kasama ang pagtulong sa kaibigan na gawin ang tama",

      hint:
        "Isipin kung paano tinulungan ni Mara si Aya sa halip na basta itago ang problema.",

      explanation:
        "Ipinapakita ng kwento na ang tunay na pagkakaibigan ay may kasamang katapatan, pakikinig, at paggabay.",

      xp: 35,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-tagpuan",

    title: "Tagpuan",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang tagpuan ay tumutukoy sa lugar at panahon kung saan nagaganap ang mga pangyayari sa isang kwento.",

    icon: "map-marker-outline",
  },
};

/*
 * =========================================================
 * STORY 4
 * ANG NAWAWALANG KUWADERNO
 * =========================================================
 */

const storyFour: Story = {
  id: "m1-story-4",

  markahan: 1,
  order: 4,

  title: "Ang Nawawalang Kuwaderno",

  subtitle: "Katapatan at Responsibilidad",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Ang pagkawala ng isang kuwaderno ay maglalagay kay Nico sa sitwasyong susubok sa kaniyang katapatan at responsibilidad.",

  coverImage: require("../assets/images/stories/ang-nawawalang-kuwaderno.png"),

  estimatedMinutes: 7,

  readingXp: 25,
  completionXp: 45,

  scenes: [
    {
      id: "notebook-scene-1",

      title: "Ang Mahalagang Kuwaderno",

      paragraphs: [
        "Ilang araw bago ang pagsusulit, abala ang klase sa pagrerepaso.",

        "May isang kuwaderno si Lea na naglalaman ng lahat ng kaniyang tala, buod, at mga sagot sa mga gawaing ginawa nila buong markahan.",

        "Pagkatapos ng klase, napansin niyang wala na ito sa kaniyang bag.",
      ],

      prediction: {
        question:
          "Ano ang pinakamainam na unang gawin ni Lea?",

        choices: [
          "Agad pagbintangan ang isang kaklase",
          "Balikan ang mga lugar na pinuntahan niya at magtanong nang maayos",
          "Umuwi na lamang",
          "Magalit sa buong klase",
        ],

        reveal:
          "Pinili ni Lea na balikan muna ang silid at magtanong nang maayos sa mga kaklase bago magbigay ng anumang paratang.",
      },
    },

    {
      id: "notebook-scene-2",

      title: "Ang Nakakita",

      paragraphs: [
        "Samantala, nakita ni Nico ang kuwaderno sa ilalim ng isang mesa.",

        "Napansin niyang kumpleto at maayos ang mga tala rito.",

        "Naisip niyang maaari niya itong gamitin sa pagrerepaso bago ibalik.",
      ],
    },

    {
      id: "notebook-scene-3",

      title: "Ang Desisyon",

      paragraphs: [
        "Habang binabasa ang unang pahina, nakita niya ang pangalan ni Lea.",

        "Naalala niyang ilang beses nang nagtatanong si Lea kung may nakakita sa nawawala niyang kuwaderno.",

        "Alam ni Nico na dapat niya itong ibalik agad.",
      ],

      prediction: {
        question:
          "Ano ang pinakamainam na gawin ni Nico?",

        choices: [
          "Kopyahin muna lahat ng notes",
          "Itago hanggang matapos ang pagsusulit",
          "Ibalik agad ang kuwaderno kay Lea",
          "Iwan muli sa sahig",
        ],

        reveal:
          "Dinala ni Nico ang kuwaderno kay Lea at inaming nakita niya ito sa ilalim ng mesa.",
      },
    },

    {
      id: "notebook-scene-4",

      title: "Higit sa Isang Kuwaderno",

      paragraphs: [
        "Labis ang pasasalamat ni Lea.",

        "Nahiya si Nico nang maalala niyang pinag-isipan pa niyang gamitin muna ang kuwaderno nang walang pahintulot.",

        "Natutuhan niyang ang pagiging responsable ay hindi lamang pag-iwas sa masamang gawain kundi paggawa agad ng tama kapag alam mo na kung ano ito.",
      ],
    },
  ],

  activities: [
    {
      id: "notebook-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Pahiwatig",

      instruction:
        "Piliin ang pangungusap na nagpapakita ng panloob na tunggalian ni Nico.",

      question:
        "Alin ang pinakamalinaw na ebidensiya?",

      choices: [
        "Nakita ni Nico ang kuwaderno sa ilalim ng mesa.",

        "Naisip niyang maaari niya itong gamitin sa pagrerepaso bago ibalik.",

        "Nakasulat ang pangalan ni Lea sa unang pahina.",

        "Nagpasalamat si Lea.",
      ],

      answer:
        "Naisip niyang maaari niya itong gamitin sa pagrerepaso bago ibalik.",

      hint:
        "Hanapin ang bahagi kung saan kailangang pumili ni Nico sa pagitan ng sariling pakinabang at paggawa ng tama.",

      explanation:
        "Ipinapakita nito ang panloob na tunggalian ni Nico dahil natutukso siyang gamitin ang bagay na hindi kaniya.",

      xp: 25,
    },

    {
      id: "notebook-plot",

      type: "plot_sequence",

      title: "Buuin ang Pangyayari",

      instruction:
        "Ayusin ang mga pangyayari sa tamang pagkakasunod.",

      question:
        "Ano ang wastong ayos?",

      items: [
        "Ibinalik ni Nico ang kuwaderno.",

        "Nawala ang kuwaderno ni Lea.",

        "Nakita ni Nico ang kuwaderno.",

        "Naisip ni Nico na gamitin muna ang mga tala.",
      ],

      answer: [
        "Nawala ang kuwaderno ni Lea.",

        "Nakita ni Nico ang kuwaderno.",

        "Naisip ni Nico na gamitin muna ang mga tala.",

        "Ibinalik ni Nico ang kuwaderno.",
      ],

      hint:
        "Magsimula sa suliraning kinaharap ni Lea.",

      explanation:
        "Ang pagkakasunod-sunod na ito ang nagpapakita kung paano nagsimula, umunlad, at nalutas ang suliranin.",

      xp: 30,
    },

    {
      id: "notebook-vocabulary",

      type: "vocabulary",

      title: "Salitang Lihim",

      instruction:
        "Piliin ang kahulugan ng salita ayon sa konteksto.",

      question:
        'Ano ang kahulugan ng "paratang"?',

      choices: [
        "Pagbibintang",
        "Pasasalamat",
        "Pag-aaral",
        "Pagtulong",
      ],

      answer: "Pagbibintang",

      hint:
        "Isipin ang isang pahayag na nagsasabing may ginawang mali ang isang tao.",

      explanation:
        'Ang "paratang" ay pagbibintang o pagsasabing may ginawang mali ang isang tao.',

      xp: 20,
    },

    {
      id: "notebook-theme",

      type: "theme_detective",

      title: "Pangwakas na Hamon",

      instruction:
        "Suriin ang mensaheng nangingibabaw sa kwento.",

      question:
        "Ano ang pinakamalakas na tema?",

      choices: [
        "Ang katapatan ay pagpili ng tama kahit may pagkakataong makinabang",

        "Mas mabuting gamitin ang bagay ng iba kung kailangan",

        "Walang problema sa pagtatago ng nawawalang gamit",

        "Mas mahalaga ang mataas na marka kaysa katapatan",
      ],

      answer:
        "Ang katapatan ay pagpili ng tama kahit may pagkakataong makinabang",

      hint:
        "Isipin ang desisyon ni Nico tungkol sa kuwaderno.",

      explanation:
        "Ipinapakita ng kwento na ang tunay na katapatan ay nasusukat sa ating mga desisyon kahit walang ibang nakakakita.",

      xp: 35,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-tunggalian",

    title: "Tunggalian",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang tunggalian ay ang suliranin o labanan na kinakaharap ng tauhan, kabilang ang pakikipaglaban niya sa sarili niyang isip at damdamin.",

    icon: "sword-cross",
  },
};

/*
 * =========================================================
 * STORY 5
 * ANG MUNTING BANGKA
 * =========================================================
 */

const storyFive: Story = {
  id: "m1-story-5",

  markahan: 1,
  order: 5,

  title: "Ang Munting Bangka",

  subtitle: "Pagtitiwala sa Sarili sa Gitna ng Hamon",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Sa isang munting bangka, kailangang matutuhan ni Sam na ang tapang ay hindi kawalan ng takot kundi kakayahang kumilos sa kabila nito.",

  coverImage: require("../assets/images/stories/ang-munting-bangka.png"),

  estimatedMinutes: 8,

  readingXp: 30,
  completionXp: 50,

  scenes: [
    {
      id: "boat-scene-1",

      title: "Sa Pampang",

      paragraphs: [
        "Lumaki si Sam malapit sa dagat ngunit bihira siyang sumakay sa bangka nang mag-isa.",

        "Sanay siyang kasama ang kaniyang ama tuwing pumupunta sila sa kabilang bahagi ng baybayin.",

        "Isang umaga, hiniling ng ama niyang ihatid ni Sam ang isang maliit na kahon ng gamot sa kanilang tiyahing nakatira sa kabilang pampang.",
      ],

      prediction: {
        question:
          "Ano kaya ang pangunahing mararamdaman ni Sam?",

        choices: [
          "Takot at pag-aalinlangan",
          "Galit lamang",
          "Walang anumang emosyon",
          "Matinding kasiyahan lamang",
        ],

        reveal:
          "Kinabahan si Sam dahil iyon ang unang pagkakataong kailangan niyang maglayag nang walang kasama.",
      },
    },

    {
      id: "boat-scene-2",

      title: "Ang Unang Alon",

      paragraphs: [
        "Tahimik ang dagat nang magsimula si Sam.",

        "Ngunit nang makalayo na siya sa pampang, dumaan ang ilang malalakas na alon.",

        "Mahigpit niyang hinawakan ang sagwan at naalala ang mga itinuro ng kaniyang ama.",
      ],
    },

    {
      id: "boat-scene-3",

      title: "Huminga at Magpatuloy",

      paragraphs: [
        "Saglit siyang natigilan nang yumanig ang bangka.",

        "Gusto niyang bumalik, ngunit nakita niyang mas malapit na ang kabilang pampang.",

        "Huminga siya nang malalim, inayos ang direksyon, at nagpatuloy.",
      ],

      prediction: {
        question:
          "Ano ang ipinapakita ng desisyon ni Sam na magpatuloy?",

        choices: [
          "Hindi siya kailanman natakot",
          "Nagkaroon siya ng tapang sa kabila ng takot",
          "Hindi niya alam ang ginagawa niya",
          "Ayaw niyang sundin ang kaniyang ama",
        ],

        reveal:
          "Hindi nawala ang kaba ni Sam, ngunit nagamit niya ang kaniyang natutuhan upang makontrol ang bangka at makarating nang ligtas.",
      },
    },

    {
      id: "boat-scene-4",

      title: "Ang Pagdating",

      paragraphs: [
        "Nang marating niya ang kabilang pampang, sinalubong siya ng kaniyang tiyahin.",

        "Hindi malaking tagumpay ang tingin ng iba sa simpleng paglalayag na iyon.",

        "Ngunit para kay Sam, iyon ang araw na napatunayan niyang kaya niyang harapin ang takot sa pamamagitan ng paghahanda at pagtitiwala sa sarili.",
      ],
    },
  ],

  activities: [
    {
      id: "boat-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Ebidensiya",

      instruction:
        "Piliin ang pangungusap na pinakamahusay na nagpapakita ng tapang ni Sam.",

      question:
        "Alin ang pinakamalakas na ebidensiya?",

      choices: [
        "Lumaki si Sam malapit sa dagat.",

        "Gusto niyang bumalik, ngunit huminga siya nang malalim at nagpatuloy.",

        "May maliit na kahon ng gamot.",

        "Sinalubong siya ng kaniyang tiyahin.",
      ],

      answer:
        "Gusto niyang bumalik, ngunit huminga siya nang malalim at nagpatuloy.",

      hint:
        "Ang tapang ay hindi nangangahulugang walang takot.",

      explanation:
        "Makikita rito na nakaramdam si Sam ng takot ngunit pinili pa rin niyang kumilos nang maingat at magpatuloy.",

      xp: 25,
    },

    {
      id: "boat-plot",

      type: "plot_sequence",

      title: "Ayusin ang Paglalakbay",

      instruction:
        "Ayusin ang mahahalagang pangyayari.",

      question:
        "Ano ang tamang pagkakasunod-sunod?",

      items: [
        "Nakarating si Sam sa kabilang pampang.",

        "Hiniling ng ama ni Sam na ihatid ang gamot.",

        "Dumaan ang malalakas na alon.",

        "Nagpasya si Sam na magpatuloy.",
      ],

      answer: [
        "Hiniling ng ama ni Sam na ihatid ang gamot.",

        "Dumaan ang malalakas na alon.",

        "Nagpasya si Sam na magpatuloy.",

        "Nakarating si Sam sa kabilang pampang.",
      ],

      hint:
        "Magsimula sa dahilan kung bakit kailangang sumakay ni Sam sa bangka.",

      explanation:
        "Ang banghay ay umunlad mula sa misyong ibinigay kay Sam, sa pagsubok, sa kaniyang desisyon, at sa matagumpay na pagdating.",

      xp: 30,
    },

    {
      id: "boat-vocabulary",

      type: "vocabulary",

      title: "Talasalitaan",

      instruction:
        "Piliin ang pinakamalapit na kahulugan.",

      question:
        'Ano ang kahulugan ng "pampang"?',

      choices: [
        "Gilid ng dagat o ilog",
        "Gitna ng bundok",
        "Loob ng bahay",
        "Uri ng bangka",
      ],

      answer: "Gilid ng dagat o ilog",

      hint:
        "Doon nagsimula at nagtapos ang paglalayag ni Sam.",

      explanation:
        'Ang "pampang" ay bahagi ng lupa sa gilid ng dagat, ilog, o iba pang anyong-tubig.',

      xp: 20,
    },

    {
      id: "boat-theme",

      type: "theme_detective",

      title: "Pangwakas na Hamon",

      instruction:
        "Suriin ang pinakamahalagang mensahe ng kwento.",

      question:
        "Ano ang pangunahing tema?",

      choices: [
        "Ang tapang ay pagkilos nang maayos kahit may takot",

        "Ang matapang na tao ay hindi kailanman natatakot",

        "Mas mabuting umiwas sa lahat ng hamon",

        "Hindi mahalaga ang paghahanda",
      ],

      answer:
        "Ang tapang ay pagkilos nang maayos kahit may takot",

      hint:
        "Isipin kung ano ang naramdaman ni Sam at kung ano pa rin ang pinili niyang gawin.",

      explanation:
        "Ang tapang ay hindi pagkawala ng takot. Ito ay kakayahang kumilos nang responsable sa kabila ng takot.",

      xp: 40,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-kasukdulan",

    title: "Kasukdulan",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang kasukdulan ay ang pinakamataas at pinakamasidhing bahagi ng tunggalian sa kwento bago ito humantong sa paglutas.",

    icon: "chart-timeline-variant-shimmer",
  },
};

/*
 * =========================================================
 * STORY 6
 * ANG LIHIM NA HARDIN
 * =========================================================
 */

const storySix: Story = {
  id: "m1-story-6",

  markahan: 1,
  order: 6,

  title: "Ang Lihim na Hardin",

  subtitle: "Pangarap, Tiyaga, at Pagpupursige",

  author: "Orihinal na Wikalino Demo",

  summary:
    "Isang nakatagong hardin ang magtuturo kay Amara na ang mga bagay na mahalaga ay nangangailangan ng tiyaga, pangangalaga, at panahon.",

  coverImage: require("../assets/images/stories/ang-lihim-na-hardin.png"),

  estimatedMinutes: 8,

  readingXp: 30,
  completionXp: 55,

  scenes: [
    {
      id: "garden-scene-1",

      title: "Ang Lumang Tarangkahan",

      paragraphs: [
        "Sa likod ng bahay ng kaniyang lola, may isang lumang tarangkahang halos natatakpan na ng baging.",

        "Matagal nang pinagtataka ni Amara kung ano ang nasa likod nito.",

        "Isang hapon, natagpuan niya ang maliit na susi sa loob ng isang lumang kahon.",
      ],

      prediction: {
        question:
          "Ano sa tingin mo ang makikita ni Amara sa likod ng tarangkahan?",

        choices: [
          "Isang lumang hardin",
          "Isang bagong gusali",
          "Isang tindahan",
          "Isang silid-aralan",
        ],

        reveal:
          "Sa likod ng tarangkahan ay isang malawak ngunit napabayaang hardin na halos matabunan na ng damo.",
      },
    },

    {
      id: "garden-scene-2",

      title: "Ang Nakalimutang Hardin",

      paragraphs: [
        "May mga tuyong halaman, sirang paso, at mga daang halos hindi na makita.",

        "Sinabi ng kaniyang lola na dati itong paboritong lugar ng kaniyang lolo, ngunit hindi na ito naalagaan matapos itong pumanaw.",

        "Naisip ni Amara na maaaring buhayin muli ang lugar.",
      ],
    },

    {
      id: "garden-scene-3",

      title: "Hindi Isang Araw Lang",

      paragraphs: [
        "Nagsimula siyang maglinis at magtanim tuwing hapon.",

        "Pagkalipas ng ilang araw, parang wala pa ring malaking pagbabago.",

        "Napagod siya at naisip na baka masyadong mahirap ang kaniyang plano.",
      ],

      prediction: {
        question:
          "Ano ang pinakamainam na gawin ni Amara?",

        choices: [
          "Itigil agad dahil wala pang mabilis na resulta",
          "Magpatuloy nang paunti-unti",
          "Sirain ang natitirang halaman",
          "Isara muli ang tarangkahan",
        ],

        reveal:
          "Nagpasya si Amara na huwag madaliin ang hardin. Araw-araw ay may maliit siyang ginagawa hanggang unti-unting bumalik ang kulay at buhay nito.",
      },
    },

    {
      id: "garden-scene-4",

      title: "Ang Muling Pagbukas",

      paragraphs: [
        "Makalipas ang ilang linggo, namulaklak ang ilang halamang inakala niyang patay na.",

        "Nilinis nila ang lumang bangko at gumawa ng maliit na daan sa pagitan ng mga halaman.",

        "Nang makita ng kaniyang lola ang hardin, ngumiti ito at sinabing may mga pangarap na hindi namumulaklak kaagad ngunit sulit hintayin at alagaan.",
      ],
    },
  ],

  activities: [
    {
      id: "garden-evidence",

      type: "evidence_hunt",

      title: "Hanapin ang Pahiwatig",

      instruction:
        "Piliin ang pangungusap na nagpapakita ng pagpupursige ni Amara.",

      question:
        "Alin ang pinakamalakas na ebidensiya?",

      choices: [
        "Natagpuan niya ang maliit na susi.",

        "Araw-araw ay may maliit siyang ginagawa hanggang unti-unting bumalik ang kulay at buhay ng hardin.",

        "May lumang bangko sa hardin.",

        "May mga tuyong halaman.",
      ],

      answer:
        "Araw-araw ay may maliit siyang ginagawa hanggang unti-unting bumalik ang kulay at buhay ng hardin.",

      hint:
        "Hanapin ang pangyayaring nagpapakita na hindi siya tumigil kahit mabagal ang pagbabago.",

      explanation:
        "Ipinapakita nito ang tiyaga ni Amara dahil patuloy siyang gumawa ng maliliit na hakbang kahit hindi agad nakikita ang resulta.",

      xp: 25,
    },

    {
      id: "garden-plot",

      type: "plot_sequence",

      title: "Ayusin ang Landas",

      instruction:
        "Ayusin ang pangunahing mga pangyayari sa kwento.",

      question:
        "Ano ang wastong pagkakasunod?",

      items: [
        "Muling namulaklak ang hardin.",

        "Natagpuan ni Amara ang susi.",

        "Nakita niya ang napabayaang hardin.",

        "Naglinis at nagtanim siya araw-araw.",
      ],

      answer: [
        "Natagpuan ni Amara ang susi.",

        "Nakita niya ang napabayaang hardin.",

        "Naglinis at nagtanim siya araw-araw.",

        "Muling namulaklak ang hardin.",
      ],

      hint:
        "Magsimula sa pangyayaring nagbigay kay Amara ng pagkakataong makita ang hardin.",

      explanation:
        "Ang pagkakasunod-sunod ay nagpapakita ng pag-unlad mula sa pagtuklas hanggang sa pagbabago ng hardin.",

      xp: 30,
    },

    {
      id: "garden-vocabulary",

      type: "vocabulary",

      title: "Salitang Lihim",

      instruction:
        "Piliin ang pinakamalapit na kahulugan.",

      question:
        'Ano ang ibig sabihin ng "napabayaang" hardin?',

      choices: [
        "Hindi naalagaan",
        "Bagong ginawa",
        "Napakaliit",
        "Maayos na maayos",
      ],

      answer: "Hindi naalagaan",

      hint:
        "Isipin ang tuyong halaman, sirang paso, at makapal na damo.",

      explanation:
        'Ang "napabayaan" ay nangangahulugang hindi naalagaan o hindi nabigyan ng sapat na pansin.',

      xp: 20,
    },

    {
      id: "garden-theme",

      type: "theme_detective",

      title: "Final Mission",

      instruction:
        "Suriin ang pinakamalalim na mensahe ng kwento.",

      question:
        "Ano ang pangunahing tema ng Ang Lihim na Hardin?",

      choices: [
        "Ang mahahalagang pagbabago ay nangangailangan ng tiyaga at panahon",

        "Lahat ng resulta ay dapat makuha agad",

        "Mas mabuting sumuko kapag mahirap ang gawain",

        "Hindi na maaaring maayos ang mga napabayaang bagay",
      ],

      answer:
        "Ang mahahalagang pagbabago ay nangangailangan ng tiyaga at panahon",

      hint:
        "Isipin kung gaano katagal bago muling namulaklak ang hardin.",

      explanation:
        "Ang hardin ay nagsisilbing simbolo ng mga pangarap at pagbabago na nangangailangan ng tiyaga, pangangalaga, at panahon.",

      xp: 45,

      isFinal: true,
    },
  ],

  collectible: {
    id: "collectible-tema",

    title: "Tema",

    category: "Elemento ng Maikling Kwento",

    description:
      "Ang tema ay ang pangunahing kaisipan o mensaheng nangingibabaw sa kabuuan ng isang akda.",

    icon: "lightbulb-on-outline",
  },
};

/*
 * =========================================================
 * MARKAHAN UNITS
 * =========================================================
 */

export const storyUnits: StoryUnit[] = [
  {
    id: "story-unit-1",

    markahan: 1,

    title: "Unang Markahan",

    subtitle:
      "Pagkilala at Pag-unawa sa Maikling Kwento",

    stories: [
      storyOne,
      storyTwo,
      storyThree,
      storyFour,
      storyFive,
      storySix,
    ],
  },

  {
    id: "story-unit-2",

    markahan: 2,

    title: "Ikalawang Markahan",

    subtitle:
      "Mas Malalim na Pagsusuri",

    stories: [],
  },

  {
    id: "story-unit-3",

    markahan: 3,

    title: "Ikatlong Markahan",

    subtitle:
      "Pag-unawa sa Tema at Pananaw",

    stories: [],
  },

  {
    id: "story-unit-4",

    markahan: 4,

    title: "Ikaapat na Markahan",

    subtitle:
      "Paglalapat at Masusing Pagsusuri",

    stories: [],
  },
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

export function getStoryUnitByNumber(
  markahan: number,
) {
  return storyUnits.find(
    (unit) =>
      unit.markahan === markahan,
  );
}

export function getStoriesByMarkahan(
  markahan: number,
) {
  return (
    getStoryUnitByNumber(markahan)
      ?.stories ?? []
  );
}

export function getAllStories() {
  return storyUnits.flatMap(
    (unit) => unit.stories,
  );
}

export function getStoryById(
  storyId: string,
) {
  return getAllStories().find(
    (story) =>
      story.id === storyId,
  );
}

export function getNextStory(
  storyId: string,
) {
  const stories =
    getAllStories();

  const index =
    stories.findIndex(
      (story) =>
        story.id === storyId,
    );

  if (
    index === -1 ||
    index ===
      stories.length - 1
  ) {
    return undefined;
  }

  return stories[index + 1];
}

export function getPreviousStory(
  storyId: string,
) {
  const stories =
    getAllStories();

  const index =
    stories.findIndex(
      (story) =>
        story.id === storyId,
    );

  if (index <= 0) {
    return undefined;
  }

  return stories[index - 1];
}

export function getAllCollectibles() {
  return getAllStories().map(
    (story) => ({
      ...story.collectible,

      storyId:
        story.id,

      storyTitle:
        story.title,
    }),
  );
}

export function getTotalStoryCount() {
  return getAllStories().length;
}

export function getTotalStoryCountByMarkahan(
  markahan: number,
) {
  return getStoriesByMarkahan(
    markahan,
  ).length;
}

export function getActivityById(
  storyId: string,
  activityId: string,
) {
  const story =
    getStoryById(storyId);

  if (!story) {
    return undefined;
  }

  return story.activities.find(
    (activity) =>
      activity.id ===
      activityId,
  );
}

export function getActivityByIndex(
  storyId: string,
  activityIndex: number,
) {
  const story =
    getStoryById(storyId);

  if (!story) {
    return undefined;
  }

  return story.activities[
    activityIndex
  ];
}