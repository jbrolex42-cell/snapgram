import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import Colors from "../../constants/Colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.secondaryText,

        tabBarStyle: {
          height: 60,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          backgroundColor: Colors.white,
        },

        tabBarLabelStyle: {
          display: "none",
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* SEARCH + EXPLORE */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Search",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* CREATE */}
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={29}
              color={color}
            />
          ),
        }}
      />

      {/* REELS */}
      <Tabs.Screen
        name="reels"
        options={{
          title: "Reels",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "play-circle" : "play-circle-outline"}
              size={27}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "person-circle"
                  : "person-circle-outline"
              }
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}