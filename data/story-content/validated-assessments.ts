import type { QuestionLevel, StoryQuestion } from "./question-factory";

type Assessment = Record<QuestionLevel, StoryQuestion[]>;

function withInstructions(
  questions: Assessment,
  instructions: Record<QuestionLevel, string>,
): Assessment {
  return {
    pamilyar: questions.pamilyar.map(question => ({ ...question, instruction: `Panuto: ${instructions.pamilyar}` })),
    suri: questions.suri.map(question => ({ ...question, instruction: `Panuto: ${instructions.suri}` })),
    dalubhasa: questions.dalubhasa.map(question => ({ ...question, instruction: `Panuto: ${instructions.dalubhasa}` })),
  };
}

// Validated question wording, option order, passages, and keys from the supplied
// assessment. Explanations are app-authored feedback, separate from the questions.
export const sandaangDamitAssessment = withInstructions({
  pamilyar: [
    {
      question: "Sino ang pangunahing tauhan sa kuwento na madalas na tahimik, nakayuko, at umiiwas sa kaniyang mga kaklase?",
      choices: ["batang babaeng mahirap", "Ina", "Guro", "Kaklase"],
      answer: 0,
      explanation: "Ang batang babaeng mahirap ang pangunahing tauhang madalas na tahimik at umiiwas sa mga kaklase.",
    },
    {
      question: "Saan pangunahing naganap ang mga pangyayaring may kaugnayan sa panunukso sa batang babae?",
      choices: ["Bahay", "Paaralan", "Palengke.", "Simbahan."],
      answer: 1,
      explanation: "Sa paaralan siya tinutukso ng kaniyang mga kaklase dahil sa damit at baon niya.",
    },
    {
      question: "Alin sa mga sumusunod ang pangunahing tunggaliang naranasan ng batang babae sa kuwento?",
      choices: [
        "pagharap sa pangungutya ng kaniyang mga kaklase",
        "pakikipagpaligsahan sa pagguhit kasama ang mga kaklase",
        "pakikipagtalo sa guro tungkol sa kaniyang pag-aaral",
        "pakikipagtalo sa ina tungkol sa kaniyang mga damit",
      ],
      answer: 0,
      explanation: "Ang paulit-ulit na pangungutya ng mga kaklase ang pangunahing suliraning hinaharap ng bata.",
    },
  ],
  suri: [
    {
      question: "Nang sabihin ng batang babae na mayroon siyang “Sandaang Damit,” ano ang maaaring ipinahihiwatig ng kaniyang pahayag?",
      choices: [
        "Nais niyang makuha ang paghanga at pagtanggap ng mga kaklase.",
        "Nais niyang ipakitang hindi mahalaga ang opinyon ng iba.",
        "Nais niyang ipakitang kaya niyang makipagsabayan sa iba.",
        "Ginamit niya ang imahinasyon upang harapin ang pangungutya.",
      ],
      answer: 3,
      explanation: "Ginamit niya ang pagkukuwento at imahinasyon upang magkaroon ng tinig sa harap ng pangungutya.",
    },
    {
      question: "Ano ang maaaring ipinahihiwatig ng mga iginuhit na sandaang damit na nakadikit sa dingding ng kanilang bahay?",
      choices: [
        "nagpapakita ng kaniyang pagnanais na mapabilang sa mundo ng mga kaklase",
        "sumasalamin sa kaniyang paghahangad ng magagandang kasuotan",
        "sumisimbolo sa kaniyang mga pangarap at pag-asa sa buhay",
        "nagpapahiwatig ng kaniyang pagkahilig sa pagguhit ng damit",
      ],
      answer: 2,
      explanation: "Nagbibigay-anyo ang mga guhit sa kaniyang mga pangarap at pag-asa sa kabila ng kahirapan.",
    },
    {
      question: "Alin ang pinakamahusay na nagpapaliwanag sa pagbabago ng batang babae mula sa pagiging tahimik at mapag-isa tungo sa pagiging masayahin at palakaibigan?",
      choices: [
        "Naramdaman niyang tinanggap siya ng mga kaklase dahil sa kaniyang kuwento.",
        "Naisip niyang makakamit ang pagkakaibigan sa pamamagitan ng pagpapahanga sa iba.",
        "Naniwala siyang magiging masaya siya kapag napansin ng kaniyang mga kaklase.",
        "Natutuhan niyang harapin ang pangungutya gamit ang imahinasyon.",
      ],
      answer: 3,
      explanation: "Sa paggamit ng imahinasyon at pagkukuwento, natutuhan niyang harapin ang pangungutya at ipahayag ang sarili.",
    },
  ],
  dalubhasa: [
    {
      question: "Kung ikaw ay kaklase ng batang babae at nakita mong tinutukso siya dahil sa luma niyang damit at simpleng baon, ano ang gagawin mo batay sa aral ng kuwento?",
      choices: [
        "Ipagtatanggol siya at ipapakita ang paggalang anuman ang kaniyang kalagayan.",
        "Kakausapin siya at hihikayating maging mas aktibo sa pakikisalamuha.",
        "Tutulungan siyang magkaroon ng mas maayos na pananamit sa paaralan.",
        "Aanyayahan siyang sumali sa mga gawain upang magkaroon ng kaibigan.",
      ],
      answer: 0,
      explanation: "Ang pagprotekta sa kapuwa laban sa pang-aapi at paggalang anuman ang kalagayan ang angkop na paglalapat ng aral.",
    },
    {
      question: "Isang mag-aaral sa inyong klase ang palaging tahimik at umiiwas sa mga kaklase. Batay sa natutuhan mo sa “Sandaang Damit,” alin ang pinakamainam na pag-unawa sa kaniyang kalagayan?",
      choices: [
        "Maaaring may pinagdaraanan siyang suliranin kaya kailangan niya ng pag-unawa at paggalang.",
        "Maaaring nahihiya siyang makisalamuha kaya kailangan niya ng panahon upang makibagay.",
        "Maaaring mas gusto niyang mapag-isa upang maiwasan ang pakikisalamuha sa iba.",
        "Maaaring nais niyang mapansin kaya pinipili niyang manatiling tahimik.",
      ],
      answer: 0,
      explanation: "Ipinapaalala ng karanasan ng bata na unawain at igalang ang maaaring pinagdaraanan ng isang tahimik na mag-aaral.",
    },
    {
      question: "Kung gagawa ka ng isang paalala para sa mga mag-aaral batay sa mensahe ng “Sandaang Damit,” alin ang pinakamainam?",
      choices: [
        "“Pahalagahan ang magagandang damit upang magkaroon ng tiwala sa sarili at makuha ang paghanga ng ibang tao.”",
        "“Huwag kailanman husgahan ang pagkatao ng iba batay sa kanilang panlabas na anyo at kalagayan sa buhay.”",
        "“Panatilihin ang pagiging tahimik at mapag-isa upang maiwasan ang pangungutya at masasakit na salita ng ibang tao.”",
        "“Sikaping magkaroon ng magagandang bagay at kasuotan upang makuha ang paggalang at pagtanggap ng ibang tao.”",
      ],
      answer: 1,
      explanation: "Ang kuwento ay nagtuturo ng paggalang sa pagkatao sa halip na paghusga batay sa kasuotan o estado sa buhay.",
    },
    {
      question: "Kung bibigyan mo ng bagong pamagat ang kuwento na kumakatawan sa pinakamahalagang kaisipan nito, alin ang pinakamainam?",
      choices: [
        "Ang Pangarap sa Likod ng Kahirapan",
        "Ang Paghahangad ng Pagtanggap",
        "Higit sa Panlabas na Anyo",
        "Ang Pag-asa sa Bawat Guhit",
      ],
      answer: 2,
      explanation: "“Higit sa Panlabas na Anyo” ang tumutukoy sa pagpapahalaga sa pagkatao sa halip na sa nakikitang kasuotan at kalagayan.",
    },
  ],
}, {
  pamilyar: "Basahin at unawaing mabuti ang bawat tanong. Tukuyin ang mahahalagang detalye, tauhan, tagpuan, at tunggalian sa binasang kuwento. Piliin at pindutin ang titik ng tamang sagot.",
  suri: "Basahin at unawaing mabuti ang bawat tanong. Suriin ang mga pahiwatig, simbolo, at pagbabago ng tauhan sa binasang kuwento. Piliin at pindutin ang titik ng pinakaangkop na sagot",
  dalubhasa: "Basahin at suriing mabuti ang bawat sitwasyon. Iugnay ang mga pangyayari at mahahalagang kaisipan mula sa kuwentong “Sandaang Damit” sa sariling karanasan, pagpapahalaga, at pag-unawa. Piliin at pindutin ang titik ng pinakaangkop na sagot.",
});

export const ugatAssessment = withInstructions({
  pamilyar: [
    {
      passage: "“Malalalim na’t nagkabuhol-buhol na ugat.”",
      question: "Ano ang inilarawan ni Lolo Tacio na malalim at nagkabuhol-buhol?",
      choices: ["mga suliranin sa kaniyang pamilya", "pinagmumulan ng katiwalian", "mga ugat", "kaniyang mga apo"],
      answer: 2,
      explanation: "Sa literal na pahayag, mga ugat ang inilarawang malalim at nagkabuhol-buhol.",
    },
    {
      passage: "“Gumapang na rin pala ang ugat sa akin—lahat na pala kami, pati ako!”",
      question: "Sino ang sinabi ni Lolo Tacio na naapektuhan din ng “Ugat”?",
      choices: [
        "ang kaniyang mga kamag-anak at iba pang kakilala",
        "ang buong pamilya, kasama ang kaniyang sarili",
        "ang kaniyang mga anak at apo lamang",
        "ang kaniyang mga kapitbahay",
      ],
      answer: 1,
      explanation: "Ipinapakita ng “lahat na pala kami, pati ako” na kabilang ang buong pamilya at ang matanda mismo.",
    },
    {
      passage: "“Buo na ang kaniyang pasiya: magpakalayo-layo ma’y hindi niya maaaring takasan ang sarili.”",
      question: "Ano ang pangunahing kaisipang malinaw na ipinahayag sa bahaging ito?",
      choices: [
        "Ang paglayo sa pamilya ay maaaring maging paraan upang magkaroon ng bagong simula.",
        "Ang paglipat sa ibang lugar ay makatutulong upang makalimutan ang mga suliranin.",
        "Ang pag-alis sa sariling tahanan ay makapagbibigay ng pagkakataong magbago.",
        "Hindi sapat ang paglayo upang makatakas sa problemang bahagi rin ng sarili.",
      ],
      answer: 3,
      explanation: "Hindi mawawala sa paglayo ang suliraning dala rin ng sariling kilos at pagpapahalaga.",
    },
  ],
  suri: [
    {
      passage: "“Sapagkat ang kaniyang mga salita ay parang mga ugat na lalong tumitibay, lalong lumalalim...”",
      question: "Batay sa pagkakasunod-sunod ng mga pangyayari, ano ang ipinahihiwatig ng paulit-ulit na paggamit ng salitang “ugat” sa kuwento?",
      choices: [
        "Unti-unting lumalalim ang katiwalian sa buhay ng mga tao",
        "Unti-unting humihina ang ugnayan ni Lolo Tacio sa pamilya.",
        "Unti-unting nabubura ang mga alaala ni Lolo Tacio sa nakaraan.",
        "Unti-unting lumalawak ang mga suliranin sa pamilya ni Lolo Tacio.",
      ],
      answer: 0,
      explanation: "Ang tumitibay at lumalalim na ugat ay nagpapahiwatig ng katiwaliang patuloy na kumakapit sa buhay ng mga tao.",
    },
    {
      passage: "“Bigyan mo ng gift certificate—halagang tatlong libong piso? Hindi, gawin mo nang limang libo—big shot na iyon ngayon e...”",
      question: "Paano nakatutulong ang pahayag sa pagbuo ng tunggalian sa kuwento?",
      choices: [
        "Ipinakikita nitong nakalimutan na ni Lolo Tacio ang kaniyang mga prinsipyo.",
        "Ipinahihiwatig nitong nasasangkot din siya sa katiwaliang kaniyang tinututulan.",
        "Ipinakikita nitong nais na niyang umiwas sa kaniyang pamilya.",
        "Ipinahihiwatig nitong nais niyang bumalik sa EDSA.",
      ],
      answer: 1,
      explanation: "Nais niyang gumamit ng regalo at koneksiyon upang makuha ang kasulatan, kaya nasasangkot din siya sa katiwaliang tinututulan niya.",
    },
    {
      passage: "“Nagsalimbayan sa kaniyang utak: ang mga sagot ni Ricky sa kaniyang homework ni Tasing; ang handa na niyang sabihin kay Kardo tungkol kay De Castro...”",
      question: "Ano ang ipinakikita ng paggunita ni Lolo Tacio sa mga naunang pangyayari?",
      choices: [
        "Naalala niya ang mga pangyayaring kaugnay ng kaniyang suliranin.",
        "Nais niyang baguhin ang mga desisyon ng kaniyang kamag-anak.",
        "Nais niyang kalimutan ang mga suliranin ng kaniyang pamilya.",
        "Nais niyang iwasan ang mga pangyayari sa kaniyang nakaraan.",
      ],
      answer: 0,
      explanation: "Pinag-uugnay ng kaniyang paggunita ang mga sagot ng mga apo at ang balak niyang paghingi ng tulong kay De Castro.",
    },
  ],
  dalubhasa: [
    {
      passage: "“Himagsikan sa EDSA. Isa siya sa mga sumugod doon. Handa na siyang mamatay noon... maiwan lamang niya ang mga anak at inapo sa pagtanaw sa naiibang kinabukasan.”",
      question: "Kung susuriin ang pangyayaring ito batay sa konteksto ng panahon na ipinakita sa kuwento, alin ang pinakamakatuwirang pag-unawa?",
      choices: [
        "Ang EDSA ay sumasalamin sa personal na karanasan ni Lolo Tacio sa panahon ng kaguluhan.",
        "Ang EDSA ay nagpapakita ng kaniyang pagnanais na kalimutan ang mga suliranin ng bansa.",
        "Ang EDSA ay sumisimbolo sa pag-asa ni Lolo Tacio para sa pagbabago ng lipunan.",
        "Ang EDSA ay nagpapahiwatig ng kaniyang hangaring manirahan sa ibang bansa.",
      ],
      answer: 2,
      explanation: "Ang paglahok niya sa EDSA ay nakaugat sa pag-asang maiiwan ang mas mabuting lipunan sa mga anak at apo.",
    },
    {
      passage: "“Ako, ’Lo? Eto, o, Pilipino!”\nSamantala, sinabi ni Ricky na American citizen ang kaniyang pipiliin.",
      question: "Batay sa magkaibang sagot nina Tasing at Ricky, anong pag-unawa ang mabubuo tungkol sa kanilang pananaw sa pagkakakilanlan at bansa?",
      choices: [
        "Ipinahihiwatig na pareho nilang nais magkaroon ng magandang kinabukasan sa ibang bansa.",
        "Ipinakikita na pareho silang may pagpapahalaga sa pagiging mamamayan ng Pilipinas.",
        "Ipinahihiwatig na magkaiba ang kanilang pananaw sa kahalagahan ng edukasyon.",
        "Ipinakikita ang magkaibang pananaw nila sa bansa.",
      ],
      answer: 3,
      explanation: "Magkaiba ang kanilang pagpili ng pagkamamamayan, kaya lumilitaw ang magkaibang pananaw nila sa bansa.",
    },
    {
      passage: "“Diyos ko! Nasa dugo ko rin pala! Gumapang na rin pala ang ugat sa akin—lahat na pala kami, pati ako!”",
      question: "Kung ilalapat ang pag-unawang ito sa isang kasalukuyang suliranin sa inyong paaralan o komunidad, alin ang nagpapakita ng wastong pagbuo ng kaalaman mula sa akda?",
      choices: [
        "Hanapin ang taong may pananagutan upang matukoy ang pinagmulan ng suliranin.",
        "Suriin ang sariling pananagutan bago humanap ng solusyon sa suliranin.",
        "Iwasan ang pakikialam upang hindi madamay sa suliranin ng ibang tao.",
        "Hintayin ang pagkilos ng iba upang malutas ang suliranin.",
      ],
      answer: 1,
      explanation: "Ang pagkilala ng matanda sa kaniyang sariling pananagutan ay maaaring ilapat sa tapat na pagsusuri sa sariling bahagi sa isang suliranin.",
    },
    {
      passage: "“Buo na ang kaniyang pasiya: magpakalayo-layo ma’y hindi niya maaaring takasan ang sarili.”",
      question: "Batay sa kabuuang pangyayari sa Ugat, paano maaaring suriin ang mensahe ng may-akda tungkol sa paglutas ng suliraning panlipunan?",
      choices: [
        "Nagsisimula ang pagbabago sa pagkilala at pagwawasto sa sariling pagkukulang.",
        "Nalulutas ang suliranin sa pamamagitan ng paglayo sa sariling bansa.",
        "Nawawala ang suliranin kapag lumipas na ang mahabang panahon.",
        "Nakasalalay sa mga kabataan ang lahat ng pagbabago sa lipunan.",
      ],
      answer: 0,
      explanation: "Sa wakas, nagpasiya siyang hanapan ng lunas ang suliranin sa sarili muna, kaya pagkilala at pagwawasto ang simula ng pagbabago.",
    },
  ],
}, {
  pamilyar: "Basahin at unawaing mabuti ang bawat pahayag mula sa kuwentong Ugat ni Genoveva Edroza-Matute. Suriin ang mga detalye at kaisipang nakapaloob dito. Piliin at pindutin ang titik ng pinakaangkop na sagot",
  suri: "Basahin at unawaing mabuti ang bawat pahayag mula sa kuwentong “Ugat.” Suriin ang mga pahiwatig at kaugnayan ng mga pangyayari upang maipaliwanag ang mahahalagang kaisipan sa kuwento. Piliin at pindutin ang titik ng pinakaangkop na sagot",
  dalubhasa: "Basahin at suriing mabuti ang bawat pahayag at sitwasyon mula sa kuwentong Ugat. Iugnay ang mahahalagang pangyayari sa konteksto ng panahon, pananaw ng mga tauhan, at mga suliranin sa lipunan. Piliin at pindutin ang titik ng pinakaangkop na sagot.",
});

export const utosNgHariAssessment = withInstructions({
  pamilyar: [
    {
      question: "Aling pangyayari ang naging mahalagang bahagi ng pag-unlad ng banghay sa kuwento?",
      choices: [
        "Pag-uusap ni Jojo at ni Mrs. Moral Character",
        "Pagkikita ni Jojo at ng kaniyang mga kaibigan",
        "Pag-usap ni Jojo sa kaniyang upuan",
        "Pagpasok ni Jojo sa paaralan",
      ],
      answer: 0,
      explanation: "Ang pag-uusap nina Jojo at Mrs. Moral Character ang naglalantad ng mga tunggalian at pananaw sa kuwento.",
    },
    {
      question: "Bakit ipinatawag ni Mrs. Moral Character si Jojo?",
      choices: [
        "Mababa ang kaniyang marka sa kanilang pagsusulit",
        "May problema sa kanyang pag-uugali at pagsagot sa klase",
        "Bibigyan siya ng posisyon sa trabaho",
        "Para paglinisin sa opisina",
      ],
      answer: 1,
      explanation: "Ipinatawag si Jojo upang kausapin tungkol sa kaniyang pag-uugali at paraan ng pagsagot sa klase.",
    },
    {
      question: "Aling detalye tungkol kay Minyong ang nagbibigay ng mahalagang pahiwatig tungkol sa paraan ng pagtingin ni Jojo sa ibang tao?",
      choices: [
        "Ang kaniyang pinagmulan at kalagayan",
        "Ang kaniyang paboritong asignatura",
        "Ang kaniyang lugar sa silid-aralan",
        "Ang kaniyang marka sa klase",
      ],
      answer: 0,
      explanation: "Isinasaalang-alang ni Jojo ang pinagmulan at kalagayan ni Minyong sa pag-unawa sa karanasan nito.",
    },
  ],
  suri: [
    {
      question: "Paano nagkakaugnay ang karanasan nina Jojo at Minyong?",
      choices: [
        "Pareho silang lumaban upang makamit ang katarungan",
        "Pareho nilang piniling sumunod sa lahat ng pamantayang itinakda ng mga guro.",
        "Pareho nilang naranasan ang hindi pantay na pagtingin dahil sa kanilang kalagayan at pinagmulan",
        "Pareho silang nagkaroon ng suliranin dahil ayaw nilang pumasok sa paaralan.",
      ],
      answer: 2,
      explanation: "Inilalantad ng kanilang mga karanasan ang hindi pantay na pagtingin na may kaugnayan sa kalagayan at pinagmulan.",
    },
    {
      question: "Sa patuloy na pagtango at paghingi ng paumanhin ni Jojo habang kinakausap siya ng kaniyang guro, anong saloobin ang maaaring mahinuha sa kaniyang kilos?",
      choices: [
        "Lubos niyang sinasang-ayunan ang lahat ng sinabi ng kaniyang guro.",
        "Maaaring hindi siya sumasang-ayon sa guro ngunit umiiwas siyang makipagtalo.",
        "Hindi niya nauunawaan ang pinag-uusapan nila.",
        "Nais niyang matapos agad ang kaniyang pag-aaral.",
      ],
      answer: 1,
      explanation: "Maaaring tumango at humingi ng paumanhin si Jojo upang umiwas sa pagtatalo kahit may pagtutol siya.",
    },
    {
      question: "Sa pahayag na “Hindi baleng dropout, basta tao lang ako,” anong pagpapahalaga ang higit na ipinahihiwatig ni Jojo?",
      choices: [
        "pagpapahalaga sa dignidad at pagkatao higit sa bulag na pagsunod",
        "pagtanggap sa anumang desisyon ng nakatataas",
        "pagwawalang-bahala sa kaniyang pag-aaral",
        "pagtanggi sa kahalagahan ng edukasyon",
      ],
      answer: 0,
      explanation: "Binibigyang-halaga ng pahayag ang dignidad, tinig, at pagkatao ni Jojo sa harap ng awtoridad.",
    },
  ],
  dalubhasa: [
    {
      question: "Isang paaralan ang gumagamit ng iisang pamantayan sa lahat ng mag-aaral kahit magkakaiba ang kanilang kultura, kalagayan sa buhay, at pinagmulan. Batay sa kaisipang mabubuo mula sa Utos ng Hari, anong prinsipyo ang maaaring gamitin sa pagsusuri sa ganitong sistema?",
      choices: [
        "Ang iisang pamantayan ay makatarungan dahil pareho itong ginagamit sa lahat.",
        "Ang pag-aalis ng mga pamantayan ay makatutulong upang matiyak ang pagkakapantay-pantay.",
        "Ang pagbuo ng pamantayan ay nangangailangan ng pagsasaalang-alang sa magkakaibang kalagayan.",
        "Ang pagsunod sa pamantayan ay nakabatay sa pasiya ng nakatataas.",
      ],
      answer: 2,
      explanation: "Ang makatarungang pamantayan ay kailangang isaalang-alang ang magkakaibang kultura, pinagmulan, at kalagayan ng mga mag-aaral.",
    },
    {
      question: "May dalawang mag-aaral na parehong mababa ang marka. Mas pinapaboran ang isa dahil sa kaniyang katayuan sa buhay samantalang mas mahigpit ang pagtingin sa isa dahil sa kaniyang pinagmulan. Batay sa mensaheng nabuo mula sa Utos ng Hari, anong pag-unawa ang maaaring ilapat sa sitwasyong ito?",
      choices: [
        "Ang mababang marka lamang ang dapat maging batayan ng pagtingin sa mag-aaral.",
        "Maaaring makaapekto ang katayuan at pinagmulan sa pagtrato sa isang tao.",
        "Maaaring gamitin ang katayuan upang matukoy ang kakayahan ng mag-aaral.",
        "Walang kaugnayan ang kalagayan sa paraan ng pagtrato sa isang tao.",
      ],
      answer: 1,
      explanation: "Ipinakikita ng hindi pantay na trato na maaaring maimpluwensiyahan ng katayuan at pinagmulan ang pagtingin sa isang tao.",
    },
    {
      question: "Kung gagamitin ang mga pangyayari sa Utos ng Hari upang bumuo ng pananaw tungkol sa papel ng mga naunang pangyayari sa isang kuwento, anong konklusyon ang maaaring mabuo?",
      choices: [
        "Ang mga naunang pangyayari ay nagpapakita lamang ng kalagayan ng tauhan sa simula ng kuwento.",
        "Ang mga unang pangyayari ay nagsisilbing paglalarawan ng mga suliraning kinakaharap ng tauhan.",
        "Ang mga naunang karanasan ay nakaaapekto sa pagbuo ng paninindigan at pasiya ng tauhan.",
        "Ang mga unang pangyayari ay nagbibigay-diin sa mga karanasang nais kalimutan ng tauhan.",
      ],
      answer: 2,
      explanation: "Nahuhubog ng mga naunang karanasan ang paninindigan at mga pasiya ng tauhan sa pag-usad ng kuwento.",
    },
    {
      question: "Batay sa kabuuang mensahe ng Utos ng Hari, anong pangkalahatang prinsipyo ang maaaring mabuo tungkol sa paggamit ng mga pamantayan sa lipunan?",
      choices: [
        "Ang pagkakaiba ng mga tao ay dapat isantabi upang maging pantay ang lahat.",
        "Ang mga pamantayan ay dapat suriin batay sa epekto nito sa dignidad ng tao.",
        "Ang mga pamantayan ay sapat na batayan upang matukoy ang halaga ng tao.",
        "Ang mga pamantayan ay dapat sundin dahil itinakda ito ng nakatataas.",
      ],
      answer: 1,
      explanation: "Dapat suriin kung ang mga pamantayan at paggamit ng kapangyarihan ay gumagalang sa dignidad at pagkatao.",
    },
  ],
}, {
  pamilyar: "Basahin at unawaing mabuti ang bawat tanong na may kaugnayan sa binasang akdang tuluyan. Piliin ang titik ng tamang sagot batay sa iyong pag-unawa sa akda.",
  suri: "Basahin at unawaing mabuti ang bawat tanong batay sa akdang Utos ng Hari. Suriin ang magkakaugnay na karanasan, kilos, at pahayag ng mga tauhan upang mabigyang-kahulugan ang kanilang saloobin, pagpapahalaga, at mga ipinahihiwatig na kaisipan sa kuwento. Piliin at pindutin ang titik ng pinakaangkop na sagot",
  dalubhasa: "Basahin at suriing mabuti ang bawat sitwasyon at tanong. Iugnay ang mga pangyayari, karanasan ng mga tauhan, at mahahalagang kaisipan mula sa akdang Utos ng Hari sa mga sitwasyon sa tunay na buhay. Piliin at pindutin ang titik ng pinakaangkop na sagot.",
});
