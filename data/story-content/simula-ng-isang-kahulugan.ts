import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";

const activities = createQuestionActivities("simula-kahulugan", {
  pamilyar: [
    {
      question: "Anong propesyon ang pinasok ni Mimi matapos niyang mag-aral sa Normal?",
      choices: ["Doktora", "Diplomat", "Guro", "Manunulat"],
      answer: 2,
      explanation: "Nagtapos si Mimi sa kursong Normal at nagsimulang magturo.",
    },
    {
      question: "Anong baitang ang ibinigay kay Mimi sa unang taon ng kaniyang pagtuturo?",
      choices: ["Unang Baitang", "Ikalawang Baitang", "Ikatlong Baitang", "Ikaanim na Baitang"],
      answer: 0,
      explanation: "Mga mag-aaral sa Unang Baitang ang unang klaseng ipinagkatiwala kay Mimi.",
    },
    {
      question: "Bakit salit-salitang lumiliban sa klase sina Arnulfo at Jose?",
      choices: [
        "Madalas silang magkasakit.",
        "Ayaw nilang mag-aral.",
        "Iisa lamang ang maayos nilang damit na pamasok kaya pinaghahatian nila ito.",
        "Tinutulungan nila ang kanilang guro sa ibang silid.",
      ],
      answer: 2,
      explanation: "Napansin ni Mimi na pareho ang kanilang apelyido, tirahan, at suot; kapag pumasok ang isa ay lumiliban ang kapatid.",
    },
  ],
  suri: [
    {
      question: "Bakit pinili ng ina ni Mimi na pag-aralin siya sa Normal kasama sina Etang at Pilar?",
      choices: [
        "Nais niyang yumaman agad si Mimi.",
        "Nais niyang matuto si Mimi ng disiplina at mabuting maimpluwensiyahan ng masisipag niyang pinsan.",
        "Iyon lamang ang paaralang malapit sa kanilang bahay.",
        "Nais niyang maging punong-guro agad si Mimi.",
      ],
      answer: 1,
      explanation: "Inaasahan ng kaniyang ina na ang hirap ng pagsasanay at halimbawa nina Etang at Pilar ay magbibigay kay Mimi ng disiplina.",
    },
    {
      question: "Ano ang unang pananaw ni Mimi sa pagtuturo?",
      choices: [
        "Isa itong madaling trabahong malaki ang sahod.",
        "Isa itong pansamantalang libangan lamang.",
        "Isa itong napakahirap na gawaing wala siyang hilig at maaaring iwan niya agad.",
        "Ito ang pangarap niya mula pagkabata.",
      ],
      answer: 2,
      explanation: "Lagi siyang dumaraing sa lesson plan, disiplina, maliit na sahod, at hirap ng pagtuturo sa maliliit na bata.",
    },
    {
      question: "Ano ang mahalagang papel ni Miss Legaspi sa pagbabago ni Mimi?",
      choices: [
        "Pinayuhan niya si Mimi na magbitiw agad.",
        "Ipinakita niyang maaaring mahalin ang pagtuturo sa paglipas ng panahon at tinulungan siyang makita ang sariling pag-unlad.",
        "Siya ang nagbigay kay Mimi ng bagong mga damit.",
        "Inilipat niya si Arnulfo sa ibang paaralan.",
      ],
      answer: 1,
      explanation: "Bilang mas may karanasang guro, kinilala ni Miss Legaspi ang unti-unting pagmamalasakit ni Mimi bago pa ito aminin ni Mimi sa sarili.",
    },
    {
      question: "Paano nabuo ni Mimi ang hinala tungkol sa dahilan ng pagliban ng magkapatid?",
      choices: [
        "Umamin agad sina Arnulfo at Jose.",
        "Sinabi ito sa kaniya ng mga magulang ng mga bata.",
        "Napansin niyang magkamukha sila, pareho ang apelyido at tirahan, salit-salitang lumiliban, at iisa ang suot.",
        "Nakita niyang naglalaro sila sa labas ng paaralan.",
      ],
      answer: 2,
      explanation: "Pinag-ugnay niya ang magkakatugmang detalye at napansing hindi sabay pumapasok ang magkapatid dahil pinaghahatian nila ang damit.",
    },
    {
      question: "Bakit maituturing na tauhang bilog si Mimi?",
      choices: [
        "Nanatili siyang walang pakialam sa mga bata.",
        "Nagbago siya mula sa materyalistiko at walang gana tungo sa isang gurong nakauunawa at nakatagpo ng layunin.",
        "Hindi nagbago ang kaniyang ugali ngunit dumami ang kaniyang damit.",
        "Siya ang naging kontrabida sa magkapatid.",
      ],
      answer: 1,
      explanation: "Ang pagkilala niya sa kalagayan nina Arnulfo at Jose ang gumising sa kaniyang malasakit at nagbigay ng bagong saysay sa pagtuturo.",
    },
    {
      question: "Ano ang ipinahihiwatig nang ang mga mata ni Mimi ang umiwas sa matatag na tingin ni Arnulfo?",
      choices: [
        "Nagalit siya dahil nahuli ang bata.",
        "Nakaramdam siya ng hiya at pagkakasala sa dati niyang paghusga at sa sarili niyang labis na luho.",
        "Hindi niya nakilala si Arnulfo.",
        "Nais niyang palitan ang bata ng ibang mag-aaral.",
      ],
      answer: 1,
      explanation: "Hindi na niya kayang tawaging bulakbol ang bata matapos maunawaan ang kahirapang dahilan ng pagliban nito.",
    },
  ],
  dalubhasa: [
    {
      question: "Ano ang tinutukoy ng pamagat na “Simula ng Isang Kahulugan”?",
      choices: [
        "Ang unang araw ng pag-aaral ni Arnulfo",
        "Ang pagsisimula ng pag-unawa ni Mimi sa layunin ng kaniyang buhay sa pamamagitan ng paglilingkod bilang guro",
        "Ang plano niyang bumalik sa pagdodoktor",
        "Ang pagbili niya ng bagong kabinet",
      ],
      answer: 1,
      explanation: "Sa wakas ay nasilayan ni Mimi ang kahulugang matagal niyang hinahanap nang makita niya ang tunay na pangangailangan ng kaniyang mag-aaral.",
    },
    {
      question: "Ano ang sinasagisag ng nag-uumapaw na mga kabinet ni Mimi katabi ng iisang damit nina Arnulfo at Jose?",
      choices: [
        "Ang pagkakaiba ng uso sa bata at matanda",
        "Ang matinding agwat ng pribilehiyo at kahirapan na hindi dating napapansin ni Mimi",
        "Ang kahalagahan ng maayos na uniporme",
        "Ang tagumpay ni Mimi bilang guro",
      ],
      answer: 1,
      explanation: "Ipinatabi ng kuwento ang sobra-sobrang pag-aari ni Mimi at ang kakulangan ng magkapatid upang idiin ang hindi pantay na kalagayan nila.",
    },
    {
      question: "Paano nauugnay sa karanasan ni Mimi ang aral na “Hindi ninyo maibibigay sa iba ang wala sa inyo”?",
      choices: [
        "Hindi siya maaaring magturo hangga't wala siyang mamahaling damit.",
        "Kailangan niyang magkaroon muna ng kaalaman, disiplina, at malasakit upang tunay na makatulong sa mga mag-aaral.",
        "Dapat siyang humingi ng mas malaking sahod bago magturo.",
        "Kailangan niyang maging katulad na katulad nina Etang at Pilar.",
      ],
      answer: 1,
      explanation: "Hindi sapat ang pagsunod sa lesson plan; kailangang malinang din sa guro ang pag-unawa at malasakit na nais niyang ibahagi.",
    },
    {
      question: "Ano ang pinakamakatarungang susunod na hakbang ni Mimi matapos malaman ang kalagayan ng magkapatid?",
      choices: [
        "Parusahan sila sa lahat ng araw na lumiban sila.",
        "Ikalat sa klase ang kanilang kahirapan.",
        "Kausapin sila nang may paggalang, alamin ang pangangailangan, at humanap ng suportang hindi sila hinihiya.",
        "Hayaang tuluyan silang huminto sa pag-aaral.",
      ],
      answer: 2,
      explanation: "Ang isang gurong may malasakit ay inuunawa muna ang pinagmumulan ng suliranin at tumutulong habang pinangangalagaan ang dignidad ng bata.",
    },
    {
      question: "Anong suliraning panlipunan ang malinaw na inilalantad ng pagliban nina Arnulfo at Jose?",
      choices: [
        "Ang kawalan ng interes ng lahat ng bata sa paaralan",
        "Ang epekto ng kahirapan sa pantay na pagpasok at pagkatuto ng mga mag-aaral",
        "Ang kakulangan ng asignaturang Ingles",
        "Ang sobrang dami ng guro sa paaralan",
      ],
      answer: 1,
      explanation: "May kakayahan at nais matuto ang magkapatid, ngunit ang kakulangan sa pangunahing kagamitan ay humahadlang sa regular nilang pagpasok.",
    },
    {
      question: "Alin ang pinakamalapit sa pangunahing mensahe ng kuwento?",
      choices: [
        "Matatagpuan ang kahulugan ng buhay sa dami ng nabibili.",
        "Ang trabaho ay mahalaga lamang kapag malaki ang sahod.",
        "Mas mabuting hayaang iba ang magpasiya sa ating buhay.",
        "Maaaring matagpuan ang layunin kapag lumampas tayo sa sarili at tumugon nang may malasakit sa pangangailangan ng iba.",
      ],
      answer: 3,
      explanation: "Nagkaroon ng kabuluhan ang gawain ni Mimi nang makita niyang may mga batang nangangailangan ng kaniyang pag-unawa at paglilingkod.",
    },
  ],
});

export const simulaNgIsangKahulugan: Story = {
  id: "m1-story-3",
  markahan: 1,
  order: 3,
  title: "Simula ng Isang Kahulugan",
  subtitle: "Ang Saysay ng Paglilingkod",
  author: "Genoveva Edroza-Matute",
  summary: "Isang bagong guro na naghahanap ng layunin ang namulat sa tunay na kalagayan ng dalawang magkapatid at nagsimulang makita ang kabuluhan ng kaniyang gawain.",
  coverImage: require("../../assets/images/stories/ang-huling-upuan.png"),
  estimatedMinutes: 12,
  readingXp: 40,
  completionXp: 80,
  scenes: [
    {
      id: "simula-kahulugan-1",
      title: "Ano ang Kasalanan?",
      paragraphs: [
        "“Diyos ko! Patawarin Mo po ako!” Ngayon lamang—ngayon na ngayon lamang—nagkaroon ng tunay na kahulugan sa akin ang pahayag na ito.",
        "Madalas ko itong nasabi noong araw, ngunit naging bihira nitong mga huling taon. Noong bata ako, nasasabi ko iyon dahil sa pang-iinggit sa mga kalaro. Ngunit nitong mga huling taon, ano nga ba ang maibibilang na kasalanan? Ang pagkukuwento tungkol sa mga kaibigang alam ko namang ikinukuwento rin ako? Ang pagtanggap sa boyfriend ng kaibigan ko? At ang seks at thrills na dulot niyon—bahagi lamang iyon ng kalikasan, katuwiran ko. Sa mga taong gaya ni Sister Fe sa kolehiyong pinasukan ko, kasalanan pa rin ang gayong mga bagay. Ngunit ano nga ba talaga ang maibibilang na kasalanan?",
        "Galing ako sa isang party noon at hatid ako ni Mon. Pagod na raw siya at tinanong kung kailangan pa niya akong ihatid mismo sa mga magulang ko. Natawa ako. Makaluma na iyon, kaya pinauwi ko na siya.",
        "Hindi alam nina Mommy at Daddy na nakauwi na ako. Narinig ko tuloy ang pag-uusap nila. Ako ang pinag-uusapan. Natawa ako—ginagawang paksa ng tsismis ng dalawang matanda.",
      ],
    },
    {
      id: "simula-kahulugan-2",
      title: "Mga Kursong Iniwan",
      paragraphs: [
        "Tinanong ni Mommy kung ano ba talaga ang gusto ko. Sinabi ni Daddy na hayaan ako sa gusto ko, ngunit inisa-isa ni Mommy ang mga kursong iniwan ko. Doktora raw, ngunit unang taon pa lamang at usapin pa lamang tungkol sa dugo ay nasusuka na ako. Lumipat ako sa Foreign Service, ngunit iniwan ko rin iyon. Sa huli ay pumayag akong magguro.",
        "Para kay Mommy, nakabuti sa akin ang pagtuturo dahil nagkaroon ako ng kaunting disiplina. Para kay Daddy, sayang na ang kaisa-isa nilang anak ay pumareho lamang kina Etang at Pilar, mga pinsan ko sa panig ni Mommy.",
        "Naalala kong sina Etang at Pilar ang nag-anyaya sa aking mag-Normal kasama nila. Si Mommy ang nagpasiya: makabubuti raw sa akin ang mahirapan nang kaunti at magiging mabuting impluwensiya ang magkapatid.",
        "Kung hindi dahil sa kanila, natitiyak kong hindi ko matatapos ang Normal. Kung mahigpit si Sister Fe sa mataas na paaralan, sampung ulit ang disiplinang tiniis ko sa kursong iyon. Lagi kong naririnig sa mga guro: “Hindi ninyo maibibigay sa iba ang wala sa inyo.”",
      ],
    },
    {
      id: "simula-kahulugan-3",
      title: "Ang Hinahanap na Kahulugan",
      paragraphs: [
        "Abot-langit ang mga daing ko: napakahirap ng mga gawain, kailangang disiplinahin ang sarili, at maliit naman ang sahod pagkatapos. Tinatawanan lamang ako nina Etang at Pilar. Mahusay nilang dinadala ang sariling pasanin: tumatanggap ng labada ang kanilang ina upang mapag-aral sila matapos sumama sa ibang babae ang kanilang ama. Tumutulong ang magkapatid sa aklatan at kantina ng dalubhasaan upang mapagaan ang hirap ng kanilang ina.",
        "Wala akong pakialam doon, sabi ko sa sarili. Ang mahalaga sa akin ay wala akong hilig sa kursong kinasadlakan ko at wala itong magandang hinaharap. Iba naman ako sa mga pinsan ko—ano ang magagawa ko?",
        "Isang araw ay masuyong tinanong ni Daddy kung ano ba talaga ang gusto ko. Halos hindi ko nakilala ang sariling tinig nang sumagot ako: “Ang talagang gusto ko ay makatagpo ng kahulugan—kahulugan kung bakit ako nabubuhay.”",
        "Kahit ako ay nagulat sa sinabi ko. Para bang isang mabigat na pasanin ang naalis sa aking kalooban. Ipinaalala ko sa kanila ang dalawang naunang anak na talagang ginusto nila ngunit sabay na namatay sa aksidente. Ako, na hindi nila binalak, ang naririto at hindi ko malaman kung saan ilalagay ang sarili ko.",
        "Tiniyak nina Daddy at Mommy na mahal na mahal nila ako at kaya nila akong buhayin kahit hindi ako magtrabaho. Ngunit binalikan ni Mommy ang sinabi ko: kung naghahanap ako ng kahulugan, hindi ko kaya iyon matagpuan sa gawain?",
      ],
    },
    {
      id: "simula-kahulugan-4",
      title: "Unang Taon sa Pagtuturo",
      paragraphs: [
        "Unang Baitang ang ibinigay sa akin sa unang taon ng pagtuturo. Gabi-gabi ay may bago akong kuwento sa bahay. Cute sana ang mga bata, ngunit napakahirap turuan—lalo na ang hindi nagdaan sa kindergarten.",
        "“What's your name?” tanong ko. “Was yu nem?” sagot nila. Sa unang araw pagkatapos ng recess, mga labinlimang bata ang hindi na bumalik sa silid. Nagyaya silang umuwi sa mga magulang o nakatatandang kapatid na naghihintay sa labas. May ayaw maiwan at mayroon pang umihi sa sahig nang makitang wala na ang naghatid.",
        "Magkahalo ang tawa at buntong-hininga sa pagkukuwento ko kina Daddy at Mommy. “What a life! Baka hindi ako tumagal ng isang taon. Mabuti pang magtinda na lamang ako sa palengke.” Ikinuwento ko rin si Miss Legaspi na labindalawang taon nang nagtuturo sa Ikatlong Baitang. Ako, ni hindi yata makakaisang taon.",
        "Madalas kaming magkausap ni Miss Legaspi. Tinanong ko kung paano siya nakatagal. Ngumiti siya at sinabing naisip din niya noong una ang magbitiw, ngunit tiniyak niyang hindi ako mamamatay sa hirap at hindi rin ako magre-resign. Unti-unti ko raw maiibigan ang pagtuturo.",
      ],
    },
    {
      id: "simula-kahulugan-5",
      title: "Si Arnulfo",
      paragraphs: [
        "Isang linggo pa lamang ang lumipas nang unti-unting natutong sumagot ang mga bata. Isa na lamang ang hindi nakasasagot—si Arnulfo. Pinagsabihan ko siya dahil ilang ulit na siyang lumiban sa unang linggo pa lamang.",
        "Nakatitig sa akin ang mabibilog niyang mga mata sa butuhan niyang mukha. Hindi umiwas ang mga iyon. Sa mga sumunod na linggo ay napansin kong mabilis siyang matuto at may angking talino. Ang hirap lamang, dalawa o tatlong araw siyang lumiliban bawat linggo kaya marami siyang hindi napapakinggang aralin.",
        "Tinanong ko kung nagkakasakit siya. Umiling si Arnulfo. “Kung gayon, bulakbol ka talaga!” sabi ko. “Hindi po,” tugon niya habang nananatiling nakatitig sa akin ang mabibilog niyang mga mata.",
        "Isang gabi ay ikinuwento ko sa mga magulang ko ang batang matalino sana ngunit laging lumiliban. Nagtaka si Mommy sa dahilan. Sinabi naman ni Daddy na hayaan ko siya kung ayaw niyang pumasok—bakit ko raw kukunsumihin ang sarili ko?",
      ],
    },
    {
      id: "simula-kahulugan-6",
      title: "Unti-unting Pagbabago",
      paragraphs: [
        "Bakit nga ba ako magpapakunsumi? Punô ng mga bagong bestido, sapatos, at bag ang dati kong kabinet kaya ipinagawa ako ni Daddy ng mas malaking kabinet. Ilang buwan na akong nagtuturo at hindi pa ako nag-uulit ng bestido. Sarili ko ang kita ko at bihira na akong humingi kina Daddy at Mommy—maliban kapag kinukulang ang suweldo sa iba ko pang gustong bilhin.",
        "Samantala, marunong na ang mga bata kong magsalita, umawit, sumayaw, at bumilang. Sinabi ko kay Miss Legaspi na sa susunod na linggo ay magsisimula na kaming bumasa.",
        "“Nakita mo na, Mimi? Nagsisimula mo nang maiibigan ang pagtuturo,” sabi niya. Itinanggi ko iyon, ngunit hindi ko mapigilang ibalita kung gaano ka-cute ang mga bata kapag tumutula, sumasayaw, at bumibilang—lahat sila, maliban sa isa.",
      ],
    },
    {
      id: "simula-kahulugan-7",
      title: "Ang Magkapatid",
      paragraphs: [
        "Isang bata ang biglang dumating at hinanap si Miss Legaspi. Pinabalik muna niya ito dahil may kausap siya at kailangan pa nilang pag-usapan ang mga pagliban nito. Nang lumayo ang bata ay napahawak ako sa kamay ni Miss Legaspi. May kamukha ang batang iyon.",
        "Jose ang pangalan niya. Bigla kong naalala si Arnulfo. Magkamukhang-magkamukha sila, iisa ang apelyido, at iisa ang tirahan. Magkapatid ang dalawa.",
        "Nang bumalik si Jose ay tinanong ko kung may sakit si Arnulfo at bakit ito laging lumiliban. Umiling lamang si Jose at hindi sumagot. May bahagyang galit sa kaniyang mga mata. Sinabi ni Miss Legaspi na ganoon din si Jose—matalino sana ngunit dalawa o tatlong araw ding lumiliban bawat linggo.",
        "Pinalapit namin si Jose. Matagal kong tinitigan ang suot niya. Iyon ang palagi kong nakikitang suot ni Arnulfo. Hindi ako nakapagsalita kay Jose o kay Miss Legaspi.",
      ],
    },
    {
      id: "simula-kahulugan-8",
      title: "Pagsilang ng Kahulugan",
      paragraphs: [
        "Kinabukasan ay pumasok si Arnulfo. Liban naman si Jose sa klase ni Miss Legaspi. Matagal kong tinitigan ang suot ni Arnulfo. May biglang nagpalabo sa aking mga mata.",
        "Tuwid na nakatingin sa akin ang mabibilog na mga mata sa butuhan niyang mukha. Hindi umiwas ang mga iyon. Ang aking mga mata ang umiwas sa kaniya.",
        "Nagsayaw sa aking balintataw ang mga bestidong nagsisiksikan sa dalawa kong kabinet. Umalingawngaw sa aking pandinig ang walang katapusan kong “Wala na akong maisusuot,” na ikinakunot-noo ni Mommy at ikinatatawa ni Daddy. Sinumbatan ako ng kahungkagang ikinainip ko sa pagtuturo: “What's your name? I take a bath and change my clothes.”",
        "“Diyos ko! Patawarin Mo po ako!”",
        "Ngunit salamat—salamat, Diyos ko—sa pagsilang ng kahulugang matagal kong hinanap sa aking buhay.",
      ],
    },
  ],
  activities,
  collectible: {
    id: "collectible-simula-kahulugan",
    title: "Paglilingkod",
    category: "Aral ng Kuwento",
    description: "Nagkakaroon ng saysay ang gawain kapag iniaalay ang kakayahan at malasakit sa mga taong nangangailangan.",
    icon: "school-outline",
  },
};
