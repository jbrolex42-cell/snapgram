import React, { useCallback } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import Colors from "../../constants/Colors";

const MAX_MEDIA = 10;

function createAsset(asset, index = 0) {
  const type =
    asset?.type === "video"
      ? "video"
      : "image";

  const extension =
    asset?.fileName
      ?.split(".")
      .pop()
      ?.toLowerCase() ||
    (type === "video" ? "mp4" : "jpg");

  return {
    uri: asset.uri,

    type,

    mimeType:
      asset.mimeType ||
      (type === "video"
        ? extension === "mov"
          ? "video/quicktime"
          : "video/mp4"
        : extension === "png"
        ? "image/png"
        : extension === "webp"
        ? "image/webp"
        : "image/jpeg"),

    fileName:
      asset.fileName ||
      `snapgram-${Date.now()}-${index}.${extension}`,

    width: asset.width || null,

    height: asset.height || null,

    duration: asset.duration || 0,

    assetId:
      asset.assetId ||
      `${Date.now()}-${index}-${Math.random()
        .toString(36)
        .slice(2)}`,
  };
}

export default function MediaPicker({
  activeType = "post",
  onSelected,
  onCamera,
}) {

  const chooseGallery = useCallback(async () => {
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

          allowsMultipleSelection:
            activeType === "post",

          selectionLimit:
            activeType === "post"
              ? MAX_MEDIA
              : 1,

          quality: 1,

          videoMaxDuration: 60,

          exif: false,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const assets = result.assets
        .slice(0, MAX_MEDIA)
        .map(createAsset);

      if (
        activeType === "post" &&
        result.assets.length > MAX_MEDIA
      ) {
        Alert.alert(
          "10 items maximum",
          "A post can contain up to 10 photos or videos."
        );
      }

      onSelected?.(assets);
    } catch (error) {
      console.error(
        "Gallery error:",
        error
      );

      Alert.alert(
        "Gallery error",
        "Unable to open your gallery."
      );
    }
  }, [activeType, onSelected]);

  const chooseCamera = useCallback(() => {
    if (!onCamera) {
      Alert.alert(
        "Camera unavailable",
        "The camera is not available right now."
      );

      return;
    }

    onCamera();
  }, [onCamera]);

  const getCameraTitle = () => {
    if (activeType === "story") {
      return "Create a story";
    }

    if (activeType === "reel") {
      return "Record a reel";
    }

    return "Open camera";
  };

  const getCameraDescription = () => {
    if (activeType === "story") {
      return "Take a photo or record a video";
    }

    if (activeType === "reel") {
      return "Record and share a short video";
    }

    return "Take a photo or record a video";
  };

  const getCameraIcon = () => {
    if (activeType === "reel") {
      return "videocam-outline";
    }

    return "camera-outline";
  };

  return (
    <View style={styles.container}>

      {/* GALLERY */}
      <TouchableOpacity
        style={styles.option}
        onPress={chooseGallery}
        activeOpacity={0.7}
      >
        <View style={styles.icon}>
          <Ionicons
            name="images-outline"
            size={27}
            color={Colors.black || "#000"}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Gallery
          </Text>

          <Text style={styles.description}>
            {activeType === "post"
              ? "Choose photos or videos"
              : activeType === "story"
              ? "Choose a photo or video"
              : "Choose a video"}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#8e8e8e"
        />
      </TouchableOpacity>

      {/* CAMERA */}
      <TouchableOpacity
        style={styles.option}
        onPress={chooseCamera}
        activeOpacity={0.7}
      >
        <View style={styles.icon}>
          <Ionicons
            name={getCameraIcon()}
            size={27}
            color={Colors.black || "#000"}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {getCameraTitle()}
          </Text>

          <Text style={styles.description}>
            {getCameraDescription()}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#8e8e8e"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },

  option: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  description: {
    marginTop: 3,
    color: "#737373",
    fontSize: 13,
  },
});