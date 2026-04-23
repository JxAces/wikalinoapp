import { Question } from "@/types/question";

export const questions: Question[] = [
  {
    id: "g7q1l1q1",
    grade: 7,
    quarter: 1,
    lesson: 1,
    type: "multiple_choice",
    question: "Ano ang pangngalan sa pangungusap na 'Ang bata ay masaya'?",
    choices: ["bata", "masaya", "ay", "ang"],
    answer: "bata",
  },
  {
    id: "g7q1l1q2",
    grade: 7,
    quarter: 1,
    lesson: 1,
    type: "true_false",
    question: "Ang salitang 'takbo' ay isang pangngalan.",
    answer: false,
  },
  {
    id: "g7q1l1q3",
    grade: 7,
    quarter: 1,
    lesson: 1,
    type: "identification",
    question: "Ano ang tawag sa salitang ngalan ng tao, bagay, hayop, o lugar?",
    answer: "pangngalan",
  },
];
