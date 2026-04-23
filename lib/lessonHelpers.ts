import { lessons } from "@/data/lessons";
import { questions } from "@/data/questions";

export function getLessonsByGradeAndQuarter(grade: number, quarter: number) {
  return lessons.filter(
    (lesson) => lesson.grade === grade && lesson.quarter === quarter,
  );
}

export function getQuestionsByLesson(
  grade: number,
  quarter: number,
  lesson: number,
) {
  return questions.filter(
    (question) =>
      question.grade === grade &&
      question.quarter === quarter &&
      question.lesson === lesson,
  );
}
