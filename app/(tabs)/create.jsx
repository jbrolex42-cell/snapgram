import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

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

  const initialMode = normalizeMode(
    params.mode
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

  const selectType = useCallback(
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

      const media =
        JSON.stringify(assets);

      if (activeType === "post") {
        router.push({
          pathname: "/create/editor",
          params: {
            media,
            mode: "post",
          },
        });

        return;
      }

      if (activeType === "story") {
        router.push({
          pathname: "/create/story",
          params: {
            media,
          },
        });

        return;
      }

      if (activeType === "reel") {
        router.push({
          pathname: "/create/reel",
          params: {
            media,
          },
        });

        return;
      }
    },
    [activeType]
  );

  const handleCamera = useCallback(() => {

    if (activeType === "post") {
      router.push({
        pathname: "/create/camera",
        params: {
          mode: "post",
        },
      });

      return;
    }

    if (activeType === "story") {
      router.push({
        pathname: "/create/story-camera",
        params: {
          mode: "story",
        },
      });

      return;
    }

    if (activeType === "reel") {
      router.push({
        pathname: "/create/reel-camera",
        params: {
          mode: "reel",
        },
      });

      return;
    }

    if (activeType === "live") {
      router.push("/create/live");
    }
  }, [activeType]);

  const renderTypeButton = useCallback(
    (item) => {
      const selected =
        activeType === item.id;

      return (
        <Pressable
          key={item.id}
          onPress={() =>
            selectType(item.id)
          }
          style={[
            styles.typeButton,
            selected &&
              styles.typeButtonSelected,
          ]}
        >
          <Ionicons
            name={item.icon}
            size={21}
            color={
              selected
                ? "#111"
                : "#777"
            }
          />

          <Text
            style={[
              styles.typeLabel,
              selected &&
                styles.typeLabelSelected,
            ]}
          >
            {item.label}
          </Text>

          {selected && (
            <View
              style={styles.activeLine}
            />
          )}
        </Pressable>
      );
    },
    [activeType, selectType]
  );

  const renderLive = useCallback(() => {
    return (
      <View style={styles.liveContainer}>
        <View style={styles.liveIcon}>
          <Ionicons
            name="radio"
            size={38}
            color="#fff"
          />
        </View>

        <Text style={styles.liveTitle}>
          Go Live
        </Text>

        <Text style={styles.liveDescription}>
          Share what's happening right
          now with your followers.
        </Text>

        <Pressable
          onPress={handleCamera}
          style={styles.liveButton}
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
    );
  }, [handleCamera]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.closeButton}
          >
            <Ionicons
              name="close"
              size={28}
              color="#111"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Create
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* MODE SELECTOR */}
        <View style={styles.typeBar}>
          {CREATE_TYPES.map(
            renderTypeButton
          )}
        </View>

        {/* CONTENT */}
        {activeType === "live" ? (
          renderLive()
        ) : (
          <View style={styles.mediaArea}>
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
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  closeButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
  },

  headerSpacer: {
    width: 42,
    height: 42,
  },

  typeBar: {
    height: 58,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  typeButton: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  typeButtonSelected: {
    backgroundColor: "#fafafa",
  },

  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
  },

  typeLabelSelected: {
    color: "#111",
    fontWeight: "800",
  },

  activeLine: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 0,
    height: 2,
    backgroundColor: "#111",
  },

  mediaArea: {
    flex: 1,
  },

  liveContainer: {
    flex: 1,
    paddingHorizontal: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  liveIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    marginBottom: 20,
  },

  liveTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111",
  },

  liveDescription: {
    maxWidth: 290,
    marginTop: 8,
    marginBottom: 25,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
  },

  liveButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#111",
  },

  liveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});