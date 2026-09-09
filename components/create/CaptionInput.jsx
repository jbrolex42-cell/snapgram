import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CaptionInput({
  value = "",
  onChangeText,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Caption</Text>

        <Text style={styles.counter}>
          {value.length}/2200
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Write a caption..."
        placeholderTextColor="#8e8e8e"
        multiline
        maxLength={2200}
        textAlignVertical="top"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  counter: {
    fontSize: 12,
    color: "#8e8e8e",
  },

  input: {
    minHeight: 95,
    maxHeight: 180,
    fontSize: 15,
    lineHeight: 21,
    color: "#111",
    padding: 0,
  },
});