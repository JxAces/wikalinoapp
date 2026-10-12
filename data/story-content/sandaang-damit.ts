import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";
import { sandaangDamitAssessment } from "./validated-assessments";

const activities = createQuestionActivities("sandaang-damit-validated-v1", sandaangDamitAssessment);

export const sandaangDamit: Story = {
  id: "m1-story-1",
  markahan: 1,
  order: 1,
  title: "Sandaang Damit",
  subtitle: "Mga Pangarap na Iginuhit",
  author: "Fanny Garcia",
  summary: "Isang batang hinahamak dahil sa kahirapan ang gumamit ng kuwento at sining upang ipagtanggol ang sarili at bigyang-anyo ang kaniyang mga pangarap.",
  coverImage: require("../../assets/images/stories/ang-lumang-lampara.png"),
  estimatedMinutes: 12,
  readingXp: 40,
  completionXp: 80,
  scenes: [
    {
      id: "sandaang-damit-1",
      title: "Ang Batang Mapag-isa",
      paragraphs: [
        "Noong maliit pa ako ay may nabasa akong naibigan kong kuwentong pambata. Ganito iyon:",
        "May isang batang babaeng mahirap na nag-aaral. Sa paaralan ay kapansin-pansin ang kaniyang pagiging walang imik. Madalas siyang nag-iisa sa isang sulok, laging nakayuko at mailap ang mga mata. Sasagot lamang siya kapag tinawag ng guro at halos pabulong pa kung magsalita.",
        "Naging mahiyain siya sapagkat maaga niyang natuklasang kaiba ang kaniyang kalagayan sa mga kaklase. Mayayaman sila at magaganda at iba-iba ang kanilang damit na pamasok. Madalas nila siyang tuksuhin dahil ang kaniyang damit, kahit malinis, ay kupasin, luma, at punô ng sulsi.",
      ],
    },
    {
      id: "sandaang-damit-2",
      title: "Ang Payak na Baon",
      paragraphs: [
        "Kapag oras na ng kainan, halos ayaw niyang ilabas ang kaniyang baon. Itinatago niya ito sa kandungan, pinipiraso nang pakonti-konti at mabilis na isinusubo upang hindi malaman ng mga kaklase kung ano ang kaniyang pagkain.",
        "Sa sulok ng kaniyang mata ay nasusulyapan niya ang mga pagkaing nakalatag sa ibabaw ng mga pupitre: mansanas, sandwich, at mga kendi na may iba-ibang hugis at makukulay na pambalot.",
        "Hindi nagwawakas sa damit ang panunukso. Tatangkain nilang silipin ang kaniyang pagkain at magtatawanan kapag nakitang isa lamang itong pirasong tinapay na karaniwang walang palaman. Kaya lumayo siya sa kanila. Naging walang kibo at mapag-isa.",
      ],
    },
    {
      id: "sandaang-damit-3",
      title: "Pangako ng Ina",
      paragraphs: [
        "Hindi lingid sa kaniyang ina ang nangyayari. Hindi lamang minsan siyang umuwing umiiyak at nagsumbong tungkol sa panunukso ng mga kaklase.",
        "Mapapakagat-labi ang kaniyang ina at matagal na hindi makakakibo. Hahaplusin nito ang kaniyang buhok at sasabihin, “Hayaan mo sila, anak. Huwag mo silang pansinin. Kapag nakakuha ng maraming pera ang iyong ama, makapagbabaon ka rin ng masasarap na pagkain at maibibili rin kita ng maraming damit.”",
        "Lumipas ang maraming araw ngunit hindi pa rin nakapag-uwi ng maraming pera ang ama. Gayon pa rin ang kanilang buhay. Unti-unting naunawaan ng bata ang kanilang kalagayan at natutuhan niyang sarilinin ang pagdaramdam. Hindi na siya umuuwing umiiyak o nagsusumbong sa kaniyang ina.",
        "Dahil sa kaniyang katahimikan, inakala ng mga kaklase na siya ay talu-talunan. Lalo pang sumidhi ang kanilang pambubuska: lumang damit, hindi masarap na pagkain, mahirap. Paulit-ulit nila itong isinalaksak sa kaniyang isip.",
      ],
    },
    {
      id: "sandaang-damit-4",
      title: "Sandaang Damit",
      paragraphs: [
        "Hanggang isang araw ay natuto siyang lumaban. Sa pagtataka ng lahat, biglang nagkatinig ang batang laging tahimik at kupasin ang damit.",
        "“Alam ninyo,” sabi niya sa malakas at nagmamalaking tinig, “ako ay may sandaang damit sa bahay.” Nagkatinginan ang kaniyang mga kaklase. Hindi sila makapaniwala. “Kung totoo iyan, bakit lagi na lamang luma ang suot mo?”",
        "“Dahil iniingatan ko ang aking sandaang damit. Ayokong maluma agad,” mabilis niyang tugon.",
        "“Sinungaling ka! Ipakita mo muna sa amin para maniwala kami,” sabay-sabay nilang sabi. Ipinaliwanag niyang hindi niya madadala ang mga iyon dahil baka magalit ang kaniyang ina, ngunit maaari niyang ilarawan ang tabas, tela, kulay, laso, at bulaklak ng bawat isa.",
      ],
    },
    {
      id: "sandaang-damit-5",
      title: "Makukulay na Kuwento",
      paragraphs: [
        "Nagsimula siyang maglarawan ng mga damit para sa iba-ibang okasyon: pambahay, pantulog, pampaaralan, pansimbahan, at marami pang iba.",
        "Mahaba ang kaniyang pagkukuwento sapagkat inilalarawan niya ang bawat damit hanggang sa kaliit-liitang detalye. Ang damit para sa isang pagtitipon ay yari sa makintab na telang rosas, may mumunting bulaklak, makikislap na rosas at puting abaloryo, maluluwang na manggas, malalaking laso sa magkabilang balikat, at laylayan hanggang sakong.",
        "Mayroon din siyang dilaw na pantulog na may puntas sa kuwelyo, manggas, at laylayan, at puting damit pansimba na may malapad na sinturon at malalaking bulsa.",
      ],
    },
    {
      id: "sandaang-damit-6",
      title: "Mga Bagong Kaibigan",
      paragraphs: [
        "Mula noon ay naging mga kaibigan niya ang mga kaklase. Siya ang naging tagapagsalita at sila naman ang kaniyang mga tagapakinig. Natutuwa silang lahat sa mga kuwento tungkol sa sandaang damit.",
        "Nawala ang kaniyang pagkamahiyain at naging masayahin siya. Patuloy pa rin ang kaniyang pamamayat, kahit binibigyan na siya ng mga kaklase ng kapirasong mansanas o sandwich at isa o dalawang kendi.",
        "Ngunit isang araw ay hindi pumasok ang batang may sandaang damit. Hindi rin siya pumasok kinabukasan at sa mga sumunod pang araw. Pagkaraan ng isang linggo, nabahala ang kaniyang mga kaklase at guro.",
      ],
    },
    {
      id: "sandaang-damit-7",
      title: "Ang Katotohanan sa Dingding",
      paragraphs: [
        "Nagpasiya silang dalawin ang batang matagal nang lumiban. Ang natagpuan nilang bahay ay sira-sira at nakagiray sa kalumaan. Sumungaw ang isang payat na babae—ang ina ng bata—at pinatuloy sila sa tahanang salat sa marangyang kasangkapan.",
        "Sa isang sulok ay may lumang teheras. Doon nakaratay ang batang may sakit. Ngunit ang unang nakatawag sa kanilang pansin ay ang mga papel na maayos na nakahanay at nakadikit sa dingding na kinasasandigan ng teheras.",
        "Nakita nilang ang mga iyon ay guhit ng bawat isa sa kaniyang sandaang damit. Magaganda at makukulay. Naroon ang rosas na damit para sa pagtitipon, ang dilaw na pantulog, ang puting pansimba, at ang mga damit pampaaralan na kailanman ay hindi nila nakita.",
        "Sandaang damit na pawang iginuhit lamang.",
      ],
    },
  ],
  activities,
  collectible: {
    id: "collectible-sandaang-damit",
    title: "Empatiya",
    category: "Aral ng Kuwento",
    description: "Ang halaga ng isang tao ay hindi nasusukat sa kaniyang kasuotan, pagkain, o yaman.",
    icon: "heart-outline",
  },
};
