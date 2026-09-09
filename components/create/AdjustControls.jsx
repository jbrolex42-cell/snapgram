import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AdjustControls() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Adjustments
      </Text>

      <Text style={styles.description}>
        Advanced photo adjustments will be
        applied during media processing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#262626",
  },

  description: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },
});