import type { Story, StoryActivity } from "../data/story-types";

export type AssessmentAnswer = string | string[];

type ScoredAnswer = { correct: boolean };

/** null means the response is not one of this question's possible answers. */
export function gradeAssessmentAnswer(activity: StoryActivity, answer: AssessmentAnswer): boolean | null {
  if (activity.type === "plot_sequence") {
    if (!Array.isArray(answer) || answer.length !== activity.items.length ||
      new Set(answer).size !== answer.length || answer.some(item => !activity.items.includes(item))) return null;
    return answer.every((item, index) => item === activity.answer[index]);
  }
  if (typeof answer !== "string" || !activity.choices.includes(answer)) return null;
  return answer === activity.answer;
}

export function getAssessmentSummary(story: Story, results: Record<string, ScoredAnswer>) {
  const answers = story.activities.map(activity => results[activity.id]).filter(Boolean);
  const total = story.activities.length;
  const correct = answers.filter(answer => answer.correct).length;
  const complete = total > 0 && answers.length === total;
  const rate = total > 0 ? correct / total : 0;
  return {
    total,
    answered: answers.length,
    correct,
    incorrect: answers.length - correct,
    percentage: Math.round(rate * 100),
    complete,
    stars: complete ? (rate >= 0.9 ? 3 : rate >= 0.75 ? 2 : 1) : 0,
  };
}
