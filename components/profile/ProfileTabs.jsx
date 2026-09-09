import React, { useMemo } from "react";

import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function ProfileTabs({
  activeTab = "posts",
  onChange,
  showReels = true,
  showTagged = true,
}) {
  const tabs = useMemo(() => {
    const result = [
      {
        id: "posts",
        icon: "grid-outline",
        activeIcon: "grid",
        label: "Posts",
      },
    ];

    if (showReels) {
      result.push({
        id: "reels",
        icon: "play-outline",
        activeIcon: "play",
        label: "Reels",
      });
    }

    if (showTagged) {
      result.push({
        id: "tagged",
        icon: "person-outline",
        activeIcon: "person",
        label: "Tagged",
      });
    }

    return result;
  }, [showReels, showTagged]);

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive =
          activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() =>
              onChange?.(tab.id)
            }
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={
              tab.label
            }
            accessibilityState={{
              selected: isActive,
            }}
          >
            <View
              style={[
                styles.iconContainer,
                isActive &&
                  styles.activeIconContainer,
              ]}
            >
              <Ionicons
                name={
                  isActive
                    ? tab.activeIcon
                    : tab.icon
                }
                size={24}
                color={
                  isActive
                    ? "#111111"
                    : "#8E8E8E"
                }
              />
            </View>

            <View
              style={[
                styles.indicator,
                isActive &&
                  styles.activeIndicator,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,

    flexDirection: "row",
    alignItems: "stretch",

    backgroundColor: "#FFFFFF",

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderColor: "#DBDBDB",
  },

  tab: {
    flex: 1,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  activeIconContainer: {
    transform: [
      {
        scale: 1.02,
      },
    ],
  },

  indicator: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    height: 1.5,

    backgroundColor:
      "transparent",
  },

  activeIndicator: {
    backgroundColor: "#111111",
  },
});