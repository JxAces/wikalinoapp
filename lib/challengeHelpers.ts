import { Question } from "@/types/question";

export function isAnswerCorrect(
  question: Question,
  selectedAnswer: string | boolean,
): boolean {
  if (question.type === "true_false") {
    return question.answer === selectedAnswer;
  }

  return (
    String(question.answer).trim().toLowerCase() ===
    String(selectedAnswer).trim().toLowerCase()
  );
}
