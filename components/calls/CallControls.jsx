import React from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CallControls({
  muted = false,
  speaker = false,
  videoEnabled = true,
  videoCall = false,
  onMute,
  onSpeaker,
  onVideo,
  onSwitchCamera,
  onEnd,
}) {
  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.button}
        onPress={onMute}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>
          {muted ? "🔇" : "🎙️"}
        </Text>

        <Text style={styles.label}>
          {muted ? "Unmute" : "Mute"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onSpeaker}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>
          {speaker ? "🔊" : "🔈"}
        </Text>

        <Text style={styles.label}>
          Speaker
        </Text>
      </TouchableOpacity>

      {videoCall && (
        <TouchableOpacity
          style={styles.button}
          onPress={onVideo}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>
            {videoEnabled ? "📹" : "🚫"}
          </Text>

          <Text style={styles.label}>
            {videoEnabled
              ? "Camera"
              : "Camera Off"}
          </Text>
        </TouchableOpacity>
      )}

      {videoCall && videoEnabled && (
        <TouchableOpacity
          style={styles.button}
          onPress={onSwitchCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>
            🔄
          </Text>

          <Text style={styles.label}>
            Flip
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          styles.endButton,
        ]}
        onPress={onEnd}
        activeOpacity={0.7}
      >
        <Text style={styles.endIcon}>
          📞
        </Text>

        <Text style={styles.label}>
          End
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  endButton: {
    backgroundColor: "#ed4956",
  },

  icon: {
    fontSize: 22,
  },

  endIcon: {
    fontSize: 22,
    transform: [
      {
        rotate: "135deg",
      },
    ],
  },

  label: {
    color: "#fff",
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },
});