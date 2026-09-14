import React, {
  useEffect,
  useRef,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

export default function LocalVideo({
  stream,
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
          "LOCAL WEB VIDEO PLAY ERROR:",
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

  if (!stream) {
    return null;
  }

  return (
    <View style={styles.container}>
      {React.createElement("video", {
        ref: videoRef,
        autoPlay: true,
        playsInline: true,
        muted: true,
        style: styles.video,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    right: 15,
    width: 110,
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#222",
    zIndex: 10,
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
});