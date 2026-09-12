import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";

const activities = createQuestionActivities("sandaang-damit", {
  pamilyar: [
    {
      question: "Ano ang karaniwang baon ng batang babae na patago niyang kinakain sa kaniyang kandungan?",
      choices: [
        "Mansanas at sandwich",
        "Kending may iba-ibang hugis",
        "Isang pirasong tinapay na karaniwang walang palaman",
        "Kanin at simpleng ulam",
      ],
      answer: 2,
      hint: "Alalahanin kung bakit ayaw niyang makita ng mga kaklase ang kaniyang baon.",
      explanation: "Isang pirasong tinapay na karaniwang walang palaman ang kaniyang baon.",
    },
    {
      question: "Sino ang pumanatag sa kalooban ng bata at nangakong ibibili siya ng maraming damit kapag nagkapera ang kaniyang ama?",
      choices: ["Ang kaniyang guro", "Ang kaniyang ina", "Ang kaniyang matalik na kaibigan", "Ang kaniyang lola"],
      answer: 1,
      explanation: "Ang kaniyang ina ang humaplos sa kaniyang buhok at umalo sa kaniya.",
    },
    {
      question: "Ano ang natuklasan ng guro at mga kaklase nang dalawin nila ang maysakit na bata?",
      choices: [
        "Nakatago sa aparador ang sandaang damit.",
        "Ipinamigay ng pamilya ang sandaang damit.",
        "Ang sandaang damit ay mga larawang iginuhit sa papel at idinikit sa dingding.",
        "Wala siyang damit o anumang iginuhit.",
      ],
      answer: 2,
      explanation: "Ang lahat ng damit na ikinuwento niya ay makukulay na guhit sa papel.",
    },
  ],
  suri: [
    {
      question: "Bakit naging mahiyain, walang imik, at mailap ang mga mata ng batang babae sa simula?",
      choices: [
        "Ipinagbawal ng kaniyang mga magulang ang makipag-usap.",
        "Maaga niyang natuklasang kaiba at mahirap ang kaniyang kalagayan kumpara sa mga kaklase.",
        "May malubha na siyang karamdaman mula pagkabata.",
        "Ayaw niyang malaman ng guro na wala siyang takdang-aralin.",
      ],
      answer: 1,
      explanation: "Ipinadama ng mayayamang kaklase ang agwat ng kanilang kalagayan kaya siya nahiya at lumayo.",
    },
    {
      question: "Ano ang ipinahihiwatig ng pagtatago at paunti-unting pagsubo ng bata sa kaniyang baong tinapay?",
      choices: [
        "Ayaw niyang mamigay ng pagkain.",
        "Nagmamadali siyang matapos upang maglaro.",
        "Nahihiya siyang makita ng iba ang kaniyang payak na baon at mahirap na kalagayan.",
        "Sinusunod niya ang utos ng kaniyang ina na dahan-dahang ngumuya.",
      ],
      answer: 2,
      explanation: "Itinatago niya ang tinapay dahil natatakot siyang pagtawanan na naman ng mga kaklase.",
    },
    {
      question: "Bakit sinabi ng bata na mayroon siyang sandaang damit sa bahay?",
      choices: [
        "Upang pagtakpan ang plano niyang magnakaw",
        "Upang ipagtanggol ang sarili sa pang-aapi at makuha ang pagtanggap ng kapuwa",
        "Upang ipagyabang na mas mayaman ang kaniyang pamilya",
        "Dahil inutusan siya ng kaniyang ina",
      ],
      answer: 1,
      explanation: "Ginamit niya ang kuwento at imahinasyon upang magkaroon ng boses laban sa paulit-ulit na panunukso.",
    },
    {
      question: "Paano binago ng kuwento ng sandaang damit ang trato ng mga kaklase sa bata?",
      choices: [
        "Lalong tumindi ang panunukso sa kaniya.",
        "Nagalit sila dahil ayaw niyang dalhin ang mga damit.",
        "Naging mga kaibigan at tagapakinig niya sila at nagbahagi rin sila ng pagkain.",
        "Isinumbong nila siya sa guro upang parusahan.",
      ],
      answer: 2,
      explanation: "Naging interesado ang mga kaklase sa kaniyang makukulay na paglalarawan at unti-unti siyang tinanggap.",
    },
    {
      question: "Ano ang isinasagisag ng sandaang damit na iginuhit sa mga papel?",
      choices: [
        "Ang galit at paghihiganti niya sa mga kaklase",
        "Ang kaniyang mga pangarap at makulay na imahinasyon sa kabila ng kahirapan",
        "Ang kawalan niya ng interes sa pag-aaral",
        "Ang tiyak niyang planong maging modista",
      ],
      answer: 1,
      explanation: "Sa mga guhit nabigyan ng anyo ang mga bagay na hindi niya kayang bilhin ngunit kaya niyang likhain sa isip.",
    },
    {
      question: "Bakit maituturing na tauhang bilog ang pangunahing tauhan?",
      choices: [
        "Nanatili siyang tahimik at talu-talunan hanggang wakas.",
        "Siya ang kontrabida sa buhay ng kaniyang mga kaklase.",
        "Nagbago siya mula sa pagiging tahimik tungo sa pagkakaroon ng lakas na magsalita.",
        "Hindi nagbago ang kaniyang kasuotan at panlabas na anyo.",
      ],
      answer: 2,
      explanation: "Nagkaroon siya ng tiwala at kakayahang ipahayag ang sarili, kaya malinaw ang kaniyang pag-unlad bilang tauhan.",
    },
  ],
  dalubhasa: [
    {
      question: "Anong pangunahing suliraning panlipunan sa paaralan ang itinatampok sa karanasan ng bata?",
      choices: [
        "Pambubully at diskriminasyon batay sa antas ng pamumuhay",
        "Kakulangan ng mga pasilidad at silid-aralan",
        "Maling sistema ng pagtuturo sa Sining",
        "Pagkaipit ng mga mag-aaral sa makabagong teknolohiya",
      ],
      answer: 0,
      explanation: "Hinuhusgahan at inaapi ang bata dahil sa kaniyang lumang damit, payak na baon, at kahirapan.",
    },
    {
      question: "Paano ipinakita ng bata ang katatagan ng loob sa kabila ng kahirapan at panunukso?",
      choices: [
        "Umalis siya sa paaralan at hindi na bumalik.",
        "Araw-araw siyang umuwing umiiyak upang kaawaan.",
        "Nakipag-away siya at gumanti nang pisikal.",
        "Ginamit niya ang imahinasyon at sining upang magkaroon ng boses at maipahayag ang sarili.",
      ],
      answer: 3,
      explanation: "Ang pagkukuwento at pagguhit ang malikhaing paraan niya upang harapin ang sakit at muling buuin ang tiwala sa sarili.",
    },
    {
      question: "Ano ang pinakamahalagang aral nang makita ng mga kaklase at guro ang tahanan ng maysakit na bata?",
      choices: [
        "Mas mabuting bumili ng totoong damit kaysa gumuhit.",
        "Ang tunay na halaga ng tao ay wala sa mamahaling kasuotan kundi sa kaniyang pagkatao at mga pangarap.",
        "Hindi dapat patuluyin sa bahay ang mga nagsisinungaling.",
        "Kailangang bayaran ang bata para sa kaniyang mga guhit.",
      ],
      answer: 1,
      explanation: "Ipinakita ng mga guhit ang yaman ng kaniyang isip at damdamin sa kabila ng salat na pamumuhay.",
    },
    {
      question: "Kung isa ka sa mga kaklase at nalaman mo ang katotohanan, ano ang pinaka-etikal na hakbang?",
      choices: [
        "Balewalain ang sitwasyon dahil hindi mo siya kaano-ano.",
        "Ibalita sa paaralan ang kaniyang pagsisinungaling.",
        "Humingi ng tawad, maging tunay na kaibigan, at tumulong nang walang pagmamataas.",
        "Humingi ng paumanhin ngunit iwasan na siya.",
      ],
      answer: 2,
      explanation: "Ang pag-ako sa pagkakamali, empatiya, at paggalang ang makataong tugon sa naging pang-aapi.",
    },
    {
      question: "Paano nauugnay ang karanasan ng ina sa mga hamon ng mga magulang na kapos sa buhay?",
      choices: [
        "Ipinakikita ang sakit at kawalan ng kakayahang magbigay ng marangyang buhay sa anak sa kabila ng pagsisikap.",
        "Ipinakikita na wala silang pakialam sa nangyayari sa paaralan.",
        "Ipinakikita na gusto nilang magsinungaling ang mga anak.",
        "Ipinakikita na madaling malutas ang kahirapan sa pag-iyak.",
      ],
      answer: 0,
      explanation: "Nais ng ina na maibsan ang sakit ng anak ngunit limitado ang maibibigay niya dahil sa kanilang kalagayan.",
    },
    {
      question: "Paano makatutulong ang paaralan upang maiwasan ang diskriminasyon sa mahihirap?",
      choices: [
        "Paghiwalayin ang klase ng mayayaman at mahihirap.",
        "Ipagbawal ang masasarap na baon.",
        "Alisin ang pamantayan sa malinis na pananamit.",
        "Itaguyod ang pagkakapantay-pantay, empatiya, at pagpapahalaga sa kakayahan sa halip na ari-arian.",
      ],
      answer: 3,
      explanation: "Ang kulturang may empatiya at pantay na paggalang ang pumipigil sa pang-aapi batay sa estado sa buhay.",
    },
  ],
});

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
