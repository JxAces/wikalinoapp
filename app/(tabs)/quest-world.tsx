import { Redirect, useLocalSearchParams } from "expo-router";
import StoryWorld from "@/components/story-world/StoryWorld";
import { getStoryById } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";

export default function QuestWorldScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const readingCompleted = useUserStore(state => state.readingCompletedStoryIds);
  const story = getStoryById(storyId);
  if (!story) return <Redirect href="/landing" />;
  if (!readingCompleted.includes(story.id)) return <Redirect href={{ pathname: "/story", params: { storyId: story.id } }} />;
  return <StoryWorld key={story.id} questStoryId={story.id} />;
}
