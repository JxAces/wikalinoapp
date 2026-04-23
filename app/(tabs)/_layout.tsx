import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="landing" />
      <Tabs.Screen name="markahan" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="challenge-player" />
      <Tabs.Screen name="result" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="about" />
    </Tabs>
  );
}
