import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ComponentProps } from "react";
import {
  ColorValue,
  StyleSheet,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";

type IconName =
  ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          Colors.primary,

        tabBarInactiveTintColor:
          "#9795A1",

        tabBarStyle: {
          position: "absolute",

          left: 14,
          right: 14,
          bottom: 12,

          height: 72,

          paddingTop: 7,
          paddingBottom: 7,

          borderTopWidth: 0,

          borderWidth: 1,
          borderColor:
            Colors.border,

          borderRadius: 24,

          backgroundColor:
            Colors.surface,

          shadowColor: "#302E70",

          shadowOpacity: 0.15,

          shadowRadius: 18,

          shadowOffset: {
            width: 0,
            height: 8,
          },

          elevation: 14,
        },

        tabBarLabelStyle: {
          fontSize: 9,

          fontWeight: "900",

          marginTop: 1,
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      {/* ======================================
          V2 MAIN NAVIGATION
      ====================================== */}

      <Tabs.Screen
        name="landing"
        options={{
          title: "Aralin",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <GameTabIcon
              focused={focused}
              color={color}
              activeIcon="map"
              inactiveIcon="map-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="collection"
        options={{
          title: "Koleksyon",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <GameTabIcon
              focused={focused}
              color={color}
              activeIcon="cards"
              inactiveIcon="cards-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progreso",

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <GameTabIcon
              focused={focused}
              color={color}
              activeIcon="trophy"
              inactiveIcon="trophy-outline"
            />
          ),
        }}
      />

      {/* ======================================
          STARTUP
      ====================================== */}

      <Tabs.Screen
        name="index"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      {/* ======================================
          V2 GAME FLOW
      ====================================== */}

      <Tabs.Screen
        name="markahan"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="story"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="activity-player"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="story-result"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      {/* ======================================
          LEGACY VERSION 1
      ====================================== */}

      <Tabs.Screen
        name="challenges"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="challenge-player"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <Tabs.Screen
        name="result"
        options={{
          href: null,

          tabBarStyle: {
            display: "none",
          },
        }}
      />
    </Tabs>
  );
}

function GameTabIcon({
  focused,
  color,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  color: ColorValue;
  activeIcon: IconName;
  inactiveIcon: IconName;
}) {
  return (
    <View
      style={[
        styles.iconWrapper,

        focused &&
          styles.iconWrapperActive,
      ]}
    >
      <MaterialCommunityIcons
        name={
          focused
            ? activeIcon
            : inactiveIcon
        }
        size={22}
        color={color}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    iconWrapper: {
      width: 38,
      height: 32,

      alignItems: "center",
      justifyContent: "center",

      borderRadius: 12,
    },

    iconWrapperActive: {
      backgroundColor:
        Colors.primarySoft,
    },
  });
