import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FILTERS = [
  "Normal",
  "Clarendon",
  "Gingham",
  "Moon",
  "Lark",
  "Juno",
  "Valencia",
];

const FILTER_STYLES = {
  Normal: {
    backgroundColor: "#d8d8d8",
  },

  Clarendon: {
    backgroundColor: "#b8d6e8",
  },

  Gingham: {
    backgroundColor: "#d7c9bc",
  },

  Moon: {
    backgroundColor: "#898989",
  },

  Lark: {
    backgroundColor: "#d6e2ce",
  },

  Juno: {
    backgroundColor: "#e7c3ae",
  },

  Valencia: {
    backgroundColor: "#e6c5a7",
  },
};

export default function FilterSelector({
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
      {FILTERS.map((filter) => {
        const active =
          selected === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={styles.item}
            onPress={() =>
              onSelect(filter)
            }
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.preview,
                FILTER_STYLES[filter],
                active &&
                  styles.activePreview,
              ]}
            >
              <Text
                style={
                  styles.previewText
                }
              >
                Aa
              </Text>
            </View>

            <Text
              style={[
                styles.text,
                active &&
                  styles.activeText,
              ]}
            >
              {filter}
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
    paddingVertical: 14,
    gap: 15,
  },

  item: {
    width: 68,
    alignItems: "center",
  },

  preview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  activePreview: {
    borderColor: "#0095f6",
  },

  previewText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  text: {
    marginTop: 6,
    fontSize: 11,
    color: "#737373",
  },

  activeText: {
    color: "#000",
    fontWeight: "700",
  },
});