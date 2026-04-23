export type ChallengeType =
  | "multiple_choice"
  | "identification"
  | "true_false"
  | "fill_blank";

export type BaseQuestion = {
  id: string;
  grade: number;
  quarter: number;
  lesson: number;
  type: ChallengeType;
  question: string;
  explanation?: string;
};

export type MultipleChoiceQuestion = BaseQuestion & {
  type: "multiple_choice";
  choices: string[];
  answer: string;
};

export type IdentificationQuestion = BaseQuestion & {
  type: "identification";
  answer: string;
};

export type TrueFalseQuestion = BaseQuestion & {
  type: "true_false";
  answer: boolean;
};

export type FillBlankQuestion = BaseQuestion & {
  type: "fill_blank";
  answer: string;
};

export type Question =
  | MultipleChoiceQuestion
  | IdentificationQuestion
  | TrueFalseQuestion
  | FillBlankQuestion;
