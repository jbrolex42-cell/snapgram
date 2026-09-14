import React, {
  useEffect,
  useRef,
} from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RemoteVideo({
  stream,
  username,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!stream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = stream;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn(
          "REMOTE WEB VIDEO PLAY ERROR:",
          error?.message || error
        );
      }
    };

    playVideo();

    return () => {
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <View style={styles.container}>
      {stream ? (
        React.createElement("video", {
          ref: videoRef,
          autoPlay: true,
          playsInline: true,
          muted: false,
          style: styles.video,
        })
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
    width: "100%",
    height: "100%",
    objectFit: "cover",
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