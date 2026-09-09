import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TOOLS = [
  {
    key: "crop",
    label: "Crop",
    icon: "crop-outline",
  },
  {
    key: "rotate",
    label: "Rotate",
    icon: "refresh-outline",
  },
  {
    key: "filter",
    label: "Filters",
    icon: "color-filter-outline",
  },
];

export default function EditorToolbar({
  activeTool,
  onCrop,
  onRotate,
  onFilter,
}) {
  const handlers = {
    crop: onCrop,
    rotate: onRotate,
    filter: onFilter,
  };

  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => {
        const active =
          activeTool === tool.key;

        return (
          <TouchableOpacity
            key={tool.key}
            style={styles.tool}
            onPress={handlers[tool.key]}
            activeOpacity={0.65}
          >
            <Ionicons
              name={tool.icon}
              size={23}
              color={
                active
                  ? "#0095f6"
                  : "#262626"
              }
            />

            <Text
              style={[
                styles.text,
                active &&
                  styles.activeText,
              ]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  tool: {
    minWidth: 85,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#262626",
  },

  activeText: {
    color: "#0095f6",
  },
});