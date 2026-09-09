import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  createStory,
} from "../../services/storyService";

function parseMedia(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    return Array.isArray(parsed)
      ? parsed.filter(
          (item) => item?.uri
        )
      : [];
  } catch (error) {
    console.error(
      "STORY MEDIA PARSE ERROR:",
      error
    );

    return [];
  }
}

export default function StoryScreen() {
  const params =
    useLocalSearchParams();

  const [publishing, setPublishing] =
    useState(false);

  const media = useMemo(
    () => parseMedia(params.media),
    [params.media]
  );

  const selectedMedia = media[0];

  const mediaUri =
    selectedMedia?.uri ||
    selectedMedia?.localUri ||
    selectedMedia?.url ||
    null;

  const mediaType =
    selectedMedia?.type === "video"
      ? "video"
      : "image";

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(tabs)/create",
      params: {
        mode: "story",
      },
    });
  }, []);

  const handlePublish =
    useCallback(async () => {
      if (!mediaUri) {
        Alert.alert(
          "No media selected",
          "Please select a photo or video for your story."
        );

        return;
      }

      if (publishing) {
        return;
      }

      try {
        setPublishing(true);

        await createStory(
          mediaUri,
          mediaType,
          ""
        );

        Alert.alert(
          "Story posted",
          "Your story is now live.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(
                  "/(tabs)"
                );
              },
            },
          ]
        );
      } catch (error) {
        console.error(
          "CREATE STORY ERROR:",
          error
        );

        Alert.alert(
          "Couldn't post story",
          error?.response?.data
            ?.message ||
            error?.message ||
            "Something went wrong while posting your story."
        );
      } finally {
        setPublishing(false);
      }
    }, [
      mediaUri,
      mediaType,
      publishing,
    ]);

  if (!mediaUri) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Ionicons
          name="images-outline"
          size={52}
          color="#777"
        />

        <Text style={styles.emptyTitle}>
          Create your story
        </Text>

        <Text style={styles.emptyText}>
          Choose a photo or video from
          your gallery or camera.
        </Text>

        <Pressable
          onPress={() =>
            router.replace({
              pathname:
                "/(tabs)/create",
              params: {
                mode: "story",
              },
            })
          }
          style={styles.selectButton}
        >
          <Text
            style={
              styles.selectButtonText
            }
          >
            Choose media
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={styles.topButton}
        >
          <Ionicons
            name="close"
            size={30}
            color="#fff"
          />
        </Pressable>

        <Text style={styles.title}>
          Your story
        </Text>

        <Pressable
          onPress={handlePublish}
          disabled={publishing}
          style={[
            styles.shareButton,
            publishing &&
              styles.shareButtonDisabled,
          ]}
        >
          {publishing ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text
              style={styles.shareText}
            >
              Share
            </Text>
          )}
        </Pressable>
      </View>

      {/* MEDIA */}
      <View
        style={styles.mediaContainer}
      >
        {mediaType === "image" ? (
          <Image
            source={{
              uri: mediaUri,
            }}
            resizeMode="contain"
            style={styles.media}
          />
        ) : (
          <View
            style={
              styles.videoPlaceholder
            }
          >
            <Ionicons
              name="play-circle-outline"
              size={72}
              color="#fff"
            />

            <Text
              style={
                styles.videoText
              }
            >
              Video story
            </Text>
          </View>
        )}

        {/* STORY TOOL BUTTONS */}
        <View style={styles.tools}>
          <Pressable
            style={styles.toolButton}
          >
            <Ionicons
              name="text-outline"
              size={22}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={styles.toolButton}
          >
            <Ionicons
              name="happy-outline"
              size={22}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={styles.toolButton}
          >
            <Ionicons
              name="color-palette-outline"
              size={22}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={styles.toolButton}
          >
            <Ionicons
              name="musical-notes-outline"
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>

      {/* BOTTOM SHARE */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handlePublish}
          disabled={publishing}
          style={styles.bottomShare}
        >
          {publishing ? (
            <ActivityIndicator
              color="#fff"
            />
          ) : (
            <>
              <Ionicons
                name="paper-plane"
                size={19}
                color="#fff"
              />

              <Text
                style={
                  styles.bottomShareText
                }
              >
                Share to story
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topBar: {
    height: 62,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
  },

  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  shareButton: {
    minWidth: 64,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  shareButtonDisabled: {
    opacity: 0.6,
  },

  shareText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  mediaContainer: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  media: {
    width: "100%",
    height: "100%",
  },

  videoPlaceholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  videoText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  tools: {
    position: "absolute",
    right: 14,
    top: 18,
    gap: 12,
  },

  toolButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",
  },

  bottomBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: "#000",
  },

  bottomShare: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0095f6",
  },

  bottomShareText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    paddingHorizontal: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
  },

  selectButton: {
    marginTop: 20,
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  selectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});