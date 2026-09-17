import { Redirect, useIsFocused, useLocalSearchParams } from "expo-router";
import { StoryPortalRoom } from "@/components/story-world/StoryPortalRoom";
import { canEnterStory } from "@/components/story-world/quest-progression";
import { getStoryById } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";

export default function StoryRoomScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const focused = useIsFocused();
  const answers = useUserStore(state => state.activityResults);
  const story = getStoryById(storyId);
  if (!focused) return null;
  if (!story || !canEnterStory(story.id, answers)) return <Redirect href="/landing" />;
  return <StoryPortalRoom key={story.id} story={story} />;
}
