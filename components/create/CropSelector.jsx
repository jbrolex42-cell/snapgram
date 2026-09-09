import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const RATIOS = [
  {
    label: "Original",
    value: "original",
  },
  {
    label: "1:1",
    value: "1:1",
  },
  {
    label: "4:5",
    value: "4:5",
  },
  {
    label: "16:9",
    value: "16:9",
  },
];

export default function CropSelector({
  selected,
  onSelect,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.container
      }
    >
      {RATIOS.map((ratio) => {
        const active =
          selected === ratio.value;

        return (
          <TouchableOpacity
            key={ratio.value}
            style={[
              styles.button,
              active &&
                styles.activeButton,
            ]}
            onPress={() =>
              onSelect(ratio.value)
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.text,
                active &&
                  styles.activeText,
              ]}
            >
              {ratio.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  button: {
    minWidth: 72,
    paddingHorizontal: 15,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#f2f2f2",
  },

  activeButton: {
    backgroundColor: "#262626",
  },

  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#262626",
  },

  activeText: {
    color: "#fff",
  },
});