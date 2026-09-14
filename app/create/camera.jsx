import React, { useCallback, useMemo } from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import CameraView from "../../components/create/CameraView";

export default function CameraScreen() {
  const params = useLocalSearchParams();

  const mode = useMemo(() => {
    const value = Array.isArray(params?.mode)
      ? params.mode[0]
      : params?.mode;

    if (typeof value !== "string") {
      return "post";
    }

    const normalized = value.toLowerCase().trim();

    if (
      normalized === "story" ||
      normalized === "reel" ||
      normalized === "live" ||
      normalized === "post"
    ) {
      return normalized;
    }

    return "post";
  }, [params?.mode]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, []);

  const normalizeMedia = useCallback((media) => {
    if (!media?.uri) {
      return null;
    }

    const isVideo =
      media.type === "video" ||
      media.mimeType?.startsWith("video/");

    const type = isVideo
      ? "video"
      : "image";

    const mimeType =
      media.mimeType ||
      (isVideo
        ? "video/mp4"
        : "image/jpeg");

    const extension = isVideo
      ? "mp4"
      : "jpg";

    return {
      uri: media.uri,
      type,
      mimeType,

      fileName:
        media.fileName ||
        `snapgram-${Date.now()}.${extension}`,

      width:
        typeof media.width === "number"
          ? media.width
          : undefined,

      height:
        typeof media.height === "number"
          ? media.height
          : undefined,

      duration:
        typeof media.duration === "number"
          ? media.duration
          : 0,
    };
  }, []);

  const handleCaptured = useCallback(
    (media) => {
      console.log("CAMERA CAPTURED:", media);

      const normalizedMedia =
        normalizeMedia(media);

      if (!normalizedMedia?.uri) {
        console.error(
          "CAMERA CAPTURE ERROR: Missing media URI"
        );
        return;
      }

      const mediaParam = JSON.stringify([
        normalizedMedia,
      ]);

      switch (mode) {
        case "story":
          router.push({
            pathname: "/create/story",
            params: {
              media: mediaParam,
            },
          });
          return;

        case "reel":
          router.push({
            pathname: "/create/reel",
            params: {
              media: mediaParam,
            },
          });
          return;

        case "live":
          router.replace({
            pathname: "/create/live",
            params: {
              mode: "live",
            },
          });
          return;

        case "post":
        default:
          router.push({
            pathname: "/create/editor",
            params: {
              media: mediaParam,
              mode: "post",
            },
          });
      }
    },
    [mode, normalizeMedia]
  );

  return (
    <View style={styles.container}>
      <CameraView
        mode={mode}
        onCaptured={handleCaptured}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});