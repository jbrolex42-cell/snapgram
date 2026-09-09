import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  RTCView,
} from "react-native-webrtc";

export default function RemoteVideo({
  stream,
  username,
}) {
  return (
    <View style={styles.container}>
      {stream ? (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.video}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.avatar}>
            👤
          </Text>

          <Text style={styles.username}>
            {username || "Snapgram User"}
          </Text>

          <Text style={styles.status}>
            Connecting video...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
  },

  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  avatar: {
    fontSize: 80,
    marginBottom: 15,
  },

  username: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
  },

  status: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 8,
  },
});