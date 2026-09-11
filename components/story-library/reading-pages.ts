import type { Story } from "@/data/stories";

/** Prediction reveals contain narrative transitions. Keep that prose while
 * omitting the questions, choices and activities from the review edition. */
export function getReadingPages(story: Story) {
  return story.scenes.map(scene => ({
    id: scene.id,
    title: scene.title,
    paragraphs: [...scene.paragraphs, ...(scene.prediction?.reveal ? [scene.prediction.reveal] : [])],
  }));
}
