import React, { useCallback } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

export default function MediaPicker({ onSelected }) {
  const openGallery = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Snapgram needs access to your photos and videos."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],
          allowsEditing: false,
          allowsMultipleSelection: false,
          quality: 0.9,
        });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      const type =
        asset.type === "video"
          ? "video"
          : "image";

      if (typeof onSelected === "function") {
        onSelected({
          uri: asset.uri,
          type,
          mimeType: asset.mimeType || null,
          fileName: asset.fileName || null,
          width: asset.width || null,
          height: asset.height || null,
          duration: asset.duration || null,
        });
      }
    } catch (error) {
      console.error("MEDIA PICKER ERROR:", error);

      Alert.alert(
        "Media picker error",
        "Unable to open your gallery. Please try again."
      );
    }
  }, [onSelected]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={openGallery}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="Open gallery"
      >
        <Ionicons
          name="images-outline"
          size={27}
          color="#111111"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
});