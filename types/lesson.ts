export type Lesson = {
  id: string;
  grade: number;
  quarter: number;
  lesson: number;
  title: string;
  description?: string;
  isLocked?: boolean;
};
