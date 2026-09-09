import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CameraControls({
  flash,
  onFlash,
  onFlip,
  onCapture,
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.sideButton}
        onPress={onFlash}
        activeOpacity={0.8}
      >
        <Ionicons
          name={
            flash === "on"
              ? "flash"
              : "flash-off-outline"
          }
          size={25}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.captureOuter}
        onPress={onCapture}
        activeOpacity={0.9}
      >
        <View style={styles.captureInner} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sideButton}
        onPress={onFlip}
        activeOpacity={0.8}
      >
        <Ionicons
          name="camera-reverse-outline"
          size={27}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 35,
  },

  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  captureOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  captureInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
  },
});