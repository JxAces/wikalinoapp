import type { ChoiceActivity, ChoiceActivityType } from "../story-types";

export type QuestionLevel = "pamilyar" | "suri" | "dalubhasa";

export type StoryQuestion = {
  question: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  hint?: string;
};

const levelMeta: Record<
  QuestionLevel,
  { title: string; instruction: string; type: ChoiceActivityType; xp: number }
> = {
  pamilyar: {
    title: "Pamilyar",
    instruction: "Balikan ang mahahalagang detalye ng kuwento.",
    type: "multiple_choice",
    xp: 10,
  },
  suri: {
    title: "Suri",
    instruction: "Suriin ang kilos, dahilan, at kahulugan sa kuwento.",
    type: "evidence_hunt",
    xp: 15,
  },
  dalubhasa: {
    title: "Dalubhasa",
    instruction: "Iugnay ang mensahe ng kuwento sa buhay at lipunan.",
    type: "theme_detective",
    xp: 20,
  },
};

export function createQuestionActivities(
  storyPrefix: string,
  groups: Record<QuestionLevel, StoryQuestion[]>,
): ChoiceActivity[] {
  const orderedGroups: QuestionLevel[] = ["pamilyar", "suri", "dalubhasa"];
  const total = orderedGroups.reduce((sum, level) => sum + groups[level].length, 0);
  let questionNumber = 0;

  return orderedGroups.flatMap(level => {
    const meta = levelMeta[level];

    return groups[level].map(question => {
      questionNumber += 1;
      const answer = question.choices[question.answer];

      return {
        id: `${storyPrefix}-q${questionNumber}`,
        type: meta.type,
        title: `${meta.title} ${questionNumber}`,
        instruction: meta.instruction,
        question: question.question,
        choices: [...question.choices],
        answer,
        hint: question.hint ?? "Hanapin ang pahiwatig sa binasang kuwento.",
        explanation: question.explanation,
        xp: meta.xp,
        isFinal: questionNumber === total,
      } satisfies ChoiceActivity;
    });
  });
}
