import React from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function StoryActions({
  onLike,
  onSend,
}) {
  const [
    message,
    setMessage,
  ] = React.useState("");

  function send() {
    if (!message.trim()) {
      return;
    }

    onSend?.(message.trim());
    setMessage("");
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Send message"
        placeholderTextColor="#ccc"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={onLike}
        style={styles.button}
      >
        <Text style={styles.icon}>
          ♡
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={send}
        style={styles.button}
      >
        <Text style={styles.icon}>
          ➤
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 30,
  },

  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.6)",
    borderRadius: 22,
    paddingHorizontal: 18,
    color: "#fff",
    backgroundColor:
      "rgba(0,0,0,0.25)",
  },

  button: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    color: "#fff",
    fontSize: 27,
  },
});