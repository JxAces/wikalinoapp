export type ChallengeType =
  | "multiple_choice"
  | "identification"
  | "true_false"
  | "arrange";

export type Challenge =
  | {
      id: string;
      markahan: number;
      order: number;
      title: string;
      difficulty: 1 | 2 | 3;
      type: "multiple_choice";
      instruction: string;
      question: string;
      choices: string[];
      answer: string;
    }
  | {
      id: string;
      markahan: number;
      order: number;
      title: string;
      difficulty: 1 | 2 | 3;
      type: "identification";
      instruction: string;
      question: string;
      answer: string;
    }
  | {
      id: string;
      markahan: number;
      order: number;
      title: string;
      difficulty: 1 | 2 | 3;
      type: "true_false";
      instruction: string;
      question: string;
      answer: boolean;
    }
  | {
      id: string;
      markahan: number;
      order: number;
      title: string;
      difficulty: 1 | 2 | 3;
      type: "arrange";
      instruction: string;
      question: string;
      words: string[];
      answer: string[];
    };

export type MarkahanUnit = {
  id: string;
  markahan: number;
  title: string;
  isLocked?: boolean;
  challenges: Challenge[];
};

export const markahanUnits: MarkahanUnit[] = [
  {
    id: "markahan-1",
    markahan: 1,
    title: "Unang Markahan",
    isLocked: false,
    challenges: [
      {
        id: "m1-c1",
        markahan: 1,
        order: 1,
        title: "Ang Tuklas",
        difficulty: 1,
        type: "multiple_choice",
        instruction: "Piliin ang tamang sagot.",
        question: "Ano ang pangunahing tauhan sa kuwento?",
        choices: ["Ang magsasaka", "Ang guro", "Ang bata", "Ang pulubi"],
        answer: "Ang bata",
      },
      {
        id: "m1-c2",
        markahan: 1,
        order: 2,
        title: "Ang Pagsubok",
        difficulty: 2,
        type: "identification",
        instruction: "Isulat ang tamang sagot.",
        question: "Ano ang gamit na simbolo sa kuwento?",
        answer: "lampara",
      },
      {
        id: "m1-c3",
        markahan: 1,
        order: 3,
        title: "Hasa-Wika",
        difficulty: 3,
        type: "arrange",
        instruction: "Ayusin ang mga pangyayari sa tamang pagkakasunod-sunod.",
        question: "Ayusin ang mga pangyayari.",
        words: [
          "Nakita niya ang isang lumang lantern.",
          "Naglakad siya pauwi sa gabi.",
          "Nabigyan siya ng aral ng matanda.",
          "Nawala ang kanyang daan.",
        ],
        answer: [
          "Naglakad siya pauwi sa gabi.",
          "Nawala ang kanyang daan.",
          "Nakita niya ang isang lumang lantern.",
          "Nabigyan siya ng aral ng matanda.",
        ],
      },
      {
        id: "m1-c4",
        markahan: 1,
        order: 4,
        title: "Tama o Mali",
        difficulty: 1,
        type: "true_false",
        instruction: "Piliin kung Tama o Mali.",
        question:
          "Ang maikling kuwento ay maikling salaysay ng isang pangyayari.",
        answer: true,
      },
    ],
  },
  {
    id: "markahan-2",
    markahan: 2,
    title: "Ikalawang Markahan",
    isLocked: false,
    challenges: [
      {
        id: "m2-c1",
        markahan: 2,
        order: 1,
        title: "Ang Tuklas",
        difficulty: 1,
        type: "multiple_choice",
        instruction: "Piliin ang tamang sagot.",
        question: "Ano ang tema ng akda?",
        choices: ["Pag-asa", "Takot", "Galit", "Yaman"],
        answer: "Pag-asa",
      },
      {
        id: "m2-c2",
        markahan: 2,
        order: 2,
        title: "Ang Pagsubok",
        difficulty: 2,
        type: "identification",
        instruction: "Isulat ang tamang sagot.",
        question: "Ano ang tawag sa pinakamahalagang mensahe ng akda?",
        answer: "tema",
      },
      {
        id: "m2-c3",
        markahan: 2,
        order: 3,
        title: "Hasa-Wika",
        difficulty: 1,
        type: "true_false",
        instruction: "Piliin kung Tama o Mali.",
        question: "Ang tema ay walang kaugnayan sa mensahe ng akda.",
        answer: false,
      },
      {
        id: "m2-c4",
        markahan: 2,
        order: 4,
        title: "Ayusin",
        difficulty: 3,
        type: "arrange",
        instruction: "Ayusin ang mga salita.",
        question: "Buuin ang tamang pangungusap.",
        words: ["si", "Rizal", "ay", "bayani"],
        answer: ["si", "Rizal", "ay", "bayani"],
      },
    ],
  },
  {
    id: "markahan-3",
    markahan: 3,
    title: "Ikatlong Markahan",
    isLocked: false,
    challenges: [
      {
        id: "m3-c1",
        markahan: 3,
        order: 1,
        title: "Pag-unawa",
        difficulty: 1,
        type: "multiple_choice",
        instruction: "Piliin ang tamang sagot.",
        question: "Ano ang panaguri sa pangungusap na 'Masipag ang bata'?",
        choices: ["Masipag", "ang", "bata", "Masipag ang bata"],
        answer: "Masipag",
      },
      {
        id: "m3-c2",
        markahan: 3,
        order: 2,
        title: "Pagsagot",
        difficulty: 2,
        type: "identification",
        instruction: "Isulat ang tamang sagot.",
        question: "Ano ang tawag sa salitang nagsasaad ng kilos?",
        answer: "pandiwa",
      },
      {
        id: "m3-c3",
        markahan: 3,
        order: 3,
        title: "Tama o Mali",
        difficulty: 1,
        type: "true_false",
        instruction: "Piliin kung Tama o Mali.",
        question: "Ang pang-uri ay naglalarawan sa pangngalan.",
        answer: true,
      },
      {
        id: "m3-c4",
        markahan: 3,
        order: 4,
        title: "Ayusin",
        difficulty: 3,
        type: "arrange",
        instruction: "Ayusin ang mga salita.",
        question: "Buuin ang tamang pangungusap.",
        words: ["maganda", "ang", "bulaklak"],
        answer: ["ang", "bulaklak", "maganda"],
      },
    ],
  },
  {
    id: "markahan-4",
    markahan: 4,
    title: "Ikaapat na Markahan",
    isLocked: false,
    challenges: [
      {
        id: "m4-c1",
        markahan: 4,
        order: 1,
        title: "Pag-unawa",
        difficulty: 2,
        type: "multiple_choice",
        instruction: "Piliin ang tamang sagot.",
        question: "Ano ang kahulugan ng salitang matalinghaga?",
        choices: [
          "Direktang pahayag",
          "May malalim na kahulugan",
          "Pangalan ng tao",
          "Uri ng panghalip",
        ],
        answer: "May malalim na kahulugan",
      },
      {
        id: "m4-c2",
        markahan: 4,
        order: 2,
        title: "Pagsagot",
        difficulty: 2,
        type: "identification",
        instruction: "Isulat ang tamang sagot.",
        question: "Ano ang tawag sa tauhang kalaban ng pangunahing tauhan?",
        answer: "kontrabida",
      },
      {
        id: "m4-c3",
        markahan: 4,
        order: 3,
        title: "Tama o Mali",
        difficulty: 1,
        type: "true_false",
        instruction: "Piliin kung Tama o Mali.",
        question: "Ang simula, gitna, at wakas ay bahagi ng banghay.",
        answer: true,
      },
      {
        id: "m4-c4",
        markahan: 4,
        order: 4,
        title: "Ayusin",
        difficulty: 3,
        type: "arrange",
        instruction: "Ayusin ang mga salita.",
        question: "Buuin ang tamang pangungusap.",
        words: ["masaya", "ang", "mga", "bata"],
        answer: ["ang", "mga", "bata", "masaya"],
      },
    ],
  },
];

export function getMarkahanByNumber(markahan: number) {
  return markahanUnits.find((item) => item.markahan === markahan);
}

export function getChallengesByMarkahan(markahan: number) {
  return getMarkahanByNumber(markahan)?.challenges ?? [];
}

export function getChallengeById(markahan: number, challengeId: string) {
  return getChallengesByMarkahan(markahan).find(
    (item) => item.id === challengeId,
  );
}

export function formatChallengeType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
