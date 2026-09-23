import React, { useMemo } from "react";

import {
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import MediaPicker from "../../components/create/MediaPicker";

function parseMedia(params) {
  try {
    if (params?.media) {
      const rawMedia = Array.isArray(params.media)
        ? params.media[0]
        : params.media;

      const parsed = JSON.parse(rawMedia);

      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item?.uri);
      }
    }

    if (params?.uri) {
      return [
        {
          uri: Array.isArray(params.uri)
            ? params.uri[0]
            : params.uri,

          type: "video",

          mimeType:
            params?.mimeType ||
            "video/mp4",

          fileName:
            params?.fileName ||
            `snapgram-reel-${Date.now()}.mp4`,

          width: Number(params?.width) || null,
          height: Number(params?.height) || null,
          duration: Number(params?.duration) || 0,
        },
      ];
    }
  } catch (error) {
    console.error(
      "[REEL CREATE] Media parse error:",
      error
    );
  }

  return [];
}

export default function ReelScreen() {
  const params = useLocalSearchParams();

  const selectedMedia = useMemo(
    () => parseMedia(params),
    [params]
  );

  function handleSelected(assets) {
    if (!Array.isArray(assets) || assets.length === 0) {
      return;
    }

    const video = assets.find(
      (item) =>
        item?.type === "video" ||
        String(item?.mimeType || "")
          .toLowerCase()
          .startsWith("video/")
    );

    if (!video) {
      return;
    }

    router.replace({
      pathname: "/create/editor",
      params: {
        media: JSON.stringify([video]),
        mode: "reel",
      },
    });
  }

  function handleCamera() {
    router.push({
      pathname: "/create/reel-camera",
      params: {
        mode: "reel",
      },
    });
  }

  /*
   * If a video was already selected, immediately
   * send it to the existing editor.
   */
  if (selectedMedia.length > 0) {
    const video = selectedMedia.find(
      (item) =>
        item?.type === "video" ||
        String(item?.mimeType || "")
          .toLowerCase()
          .startsWith("video/")
    );

    if (video) {
      return (
        <RedirectToEditor
          video={video}
        />
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <MediaPicker
          activeType="reel"
          onSelected={handleSelected}
          onCamera={handleCamera}
        />
      </View>
    </SafeAreaView>
  );
}

function RedirectToEditor({ video }) {
  React.useEffect(() => {
    router.replace({
      pathname: "/create/editor",
      params: {
        media: JSON.stringify([video]),
        mode: "reel",
      },
    });
  }, [video]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingScreen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },
});