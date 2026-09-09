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

  /*
   * ==============================
   * CAMERA MODE
   * ==============================
   *
   * Supported:
   * post
   * story
   * reel
   * live
   */
  const mode = useMemo(() => {
    const value = params?.mode;

    if (typeof value !== "string") {
      return "post";
    }

    const normalized = value.toLowerCase();

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

  /*
   * ==============================
   * CLOSE CAMERA
   * ==============================
   */
  const handleClose = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/");
    } catch (error) {
      console.log(
        "CAMERA CLOSE ERROR:",
        error
      );

      router.replace("/");
    }
  }, []);

  /*
   * ==============================
   * NORMALIZE CAPTURED MEDIA
   * ==============================
   */
  const normalizeMedia = useCallback((media) => {
    if (!media?.uri) {
      return null;
    }

    const isVideo =
      media.type === "video";

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

  /*
   * ==============================
   * HANDLE CAPTURE
   * ==============================
   */
  const handleCaptured = useCallback(
    (media) => {
      console.log(
        "CAMERA CAPTURED:",
        media
      );

      const normalizedMedia =
        normalizeMedia(media);

      if (!normalizedMedia) {
        console.log(
          "CAMERA CAPTURE ERROR: No media URI"
        );
        return;
      }

      /*
       * Expo Router parameters
       * must be serializable strings.
       */
      const mediaParam =
        JSON.stringify([
          normalizedMedia,
        ]);

      /*
       * ==============================
       * POST
       * ==============================
       */
      if (mode === "post") {
        router.push({
          pathname: "/create/editor",
          params: {
            media: mediaParam,
            mode: "post",
          },
        });

        return;
      }

      /*
       * ==============================
       * STORY
       * ==============================
       */
      if (mode === "story") {
        router.push({
          pathname: "/create/story",
          params: {
            media: mediaParam,
          },
        });

        return;
      }

      /*
       * ==============================
       * REEL
       * ==============================
       */
      if (mode === "reel") {
        router.push({
          pathname: "/create/reel",
          params: {
            media: mediaParam,
          },
        });

        return;
      }

      /*
       * ==============================
       * LIVE
       * ==============================
       *
       * Live should not wait for
       * captured media.
       */
      if (mode === "live") {
        router.replace({
          pathname: "/create/live",
          params: {
            mode: "live",
          },
        });

        return;
      }

      /*
       * ==============================
       * FALLBACK
       * ==============================
       */
      router.push({
        pathname: "/create/editor",
        params: {
          media: mediaParam,
          mode: "post",
        },
      });
    },
    [mode, normalizeMedia]
  );

  /*
   * ==============================
   * RENDER
   * ==============================
   */
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
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
});