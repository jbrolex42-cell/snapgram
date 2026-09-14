import {
    StyleSheet,
    View,
} from "react-native";

import {
    RTCView,
} from "react-native-webrtc";

export default function LocalVideo({
  stream,
}) {
  if (!stream) {
    return null;
  }

  return (
    <View style={styles.container}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror
      />
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
    flex: 1,
  },
});