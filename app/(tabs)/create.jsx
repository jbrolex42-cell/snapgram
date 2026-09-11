import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import MediaPicker from "../../components/create/MediaPicker";

const CREATE_TYPES = [
  {
    id: "post",
    label: "Post",
    icon: "images-outline",
  },
  {
    id: "story",
    label: "Story",
    icon: "add-circle-outline",
  },
  {
    id: "reel",
    label: "Reel",
    icon: "film-outline",
  },
  {
    id: "live",
    label: "Live",
    icon: "radio-outline",
  },
];

function normalizeMode(value) {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (
    value === "story" ||
    value === "reel" ||
    value === "live"
  ) {
    return value;
  }

  return "post";
}

export default function CreateScreen() {
  const params = useLocalSearchParams();

  const initialMode = useMemo(
    () => normalizeMode(params.mode),
    [params.mode]
  );

  const [activeType, setActiveType] =
    useState(initialMode);

  useEffect(() => {
    setActiveType(
      normalizeMode(params.mode)
    );
  }, [params.mode]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  }, []);

  const handleTypeChange = useCallback(
    (type) => {
      setActiveType(type);
    },
    []
  );

  const handleSelected = useCallback(
    (assets) => {
      if (
        !Array.isArray(assets) ||
        assets.length === 0
      ) {
        return;
      }

      const media = JSON.stringify(assets);

      switch (activeType) {
        case "story":
          router.push({
            pathname: "/create/story",
            params: {
              media,
            },
          });
          break;

        case "reel":
          router.push({
            pathname: "/create/reel",
            params: {
              media,
            },
          });
          break;

        case "post":
        default:
          router.push({
            pathname: "/create/editor",
            params: {
              media,
              mode: "post",
            },
          });
          break;
      }
    },
    [activeType]
  );

  const handleCamera = useCallback(() => {
    switch (activeType) {
      case "story":
        router.push({
          pathname: "/create/story-camera",
          params: {
            mode: "story",
          },
        });
        break;

      case "reel":
        router.push({
          pathname: "/create/reel-camera",
          params: {
            mode: "reel",
          },
        });
        break;

      case "live":
        router.push("/create/live");
        break;

      case "post":
      default:
        router.push({
          pathname: "/create/camera",
          params: {
            mode: "post",
          },
        });
        break;
    }
  }, [activeType]);

  const renderLive = useCallback(() => {
    return (
      <View style={styles.liveScreen}>
        <View style={styles.liveContent}>
          <View style={styles.liveIcon}>
            <Ionicons
              name="radio"
              size={42}
              color="#fff"
            />
          </View>

          <Text style={styles.liveTitle}>
            Go Live
          </Text>

          <Text style={styles.liveSubtitle}>
            Go live to connect with your
            followers in real time.
          </Text>

          <Pressable
            onPress={handleCamera}
            style={({ pressed }) => [
              styles.liveButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="radio"
              size={19}
              color="#fff"
            />

            <Text style={styles.liveButtonText}>
              Start live video
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }, [handleCamera]);

  const renderTypeButton = useCallback(
    (item) => {
      const selected =
        activeType === item.id;

      return (
        <Pressable
          key={item.id}
          onPress={() =>
            handleTypeChange(item.id)
          }
          style={[
            styles.typeButton,
            selected &&
              styles.typeButtonActive,
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={
              selected
                ? "#000"
                : "#8e8e8e"
            }
          />

          <Text
            style={[
              styles.typeText,
              selected &&
                styles.typeTextActive,
            ]}
          >
            {item.label}
          </Text>

          {selected && (
            <View style={styles.typeIndicator} />
          )}
        </Pressable>
      );
    },
    [activeType, handleTypeChange]
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.container}>

        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Ionicons
              name="close"
              size={28}
              color="#000"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            {activeType === "post"
              ? "New post"
              : activeType === "story"
              ? "New story"
              : activeType === "reel"
              ? "New reel"
              : "Live"}
          </Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.typeBar}>
          {CREATE_TYPES.map(
            renderTypeButton
          )}
        </View>

        {activeType === "live" ? (
          renderLive()
        ) : (
          <View style={styles.mediaContainer}>
            <MediaPicker
              activeType={activeType}
              onSelected={handleSelected}
              onCamera={handleCamera}
            />
          </View>
        )}
      </View>
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

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    position: "absolute",
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },

  headerRight: {
    width: 42,
    height: 42,
  },

  typeBar: {
    height: 54,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  typeButton: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  typeButtonActive: {
    backgroundColor: "#fafafa",
  },

  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8e8e8e",
  },

  typeTextActive: {
    color: "#000",
    fontWeight: "700",
  },

  typeIndicator: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: 2,
    backgroundColor: "#000",
  },

  mediaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  liveScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  liveContent: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
  },

  liveIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  liveTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#000",
  },

  liveSubtitle: {
    maxWidth: 290,
    marginTop: 9,
    marginBottom: 28,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
  },

  liveButton: {
    minWidth: 210,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#000",
  },

  liveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.75,
  },
});