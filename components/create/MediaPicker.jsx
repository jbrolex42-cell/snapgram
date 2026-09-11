import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MAX_MEDIA = 10;
const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const TILE_SIZE =
  (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

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
    uri: asset?.uri,

    type,

    mimeType:
      asset?.mimeType ||
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
      asset?.fileName ||
      `snapgram-${Date.now()}-${index}.${extension}`,

    width: asset?.width || null,

    height: asset?.height || null,

    duration: asset?.duration || 0,

    assetId:
      asset?.assetId ||
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
  const [permissionLoading, setPermissionLoading] =
    useState(false);

  const [galleryLoading, setGalleryLoading] =
    useState(false);

  const [recentAsset, setRecentAsset] =
    useState(null);

  const [cameraPermission, setCameraPermission] =
    useState(null);

  const config = useMemo(() => {
    if (activeType === "story") {
      return {
        title: "Story",
        galleryLabel: "Add from gallery",
        cameraLabel: "Camera",
        multiple: false,
        limit: 1,
      };
    }

    if (activeType === "reel") {
      return {
        title: "Reel",
        galleryLabel: "Add from gallery",
        cameraLabel: "Camera",
        multiple: false,
        limit: 1,
      };
    }

    return {
      title: "Post",
      galleryLabel: "Select multiple",
      cameraLabel: "Camera",
      multiple: true,
      limit: MAX_MEDIA,
    };
  }, [activeType]);

  useEffect(() => {
    let mounted = true;

    const loadCameraPermission = async () => {
      try {
        const result =
          await ImagePicker.getCameraPermissionsAsync();

        if (mounted) {
          setCameraPermission(
            result?.granted === true
          );
        }
      } catch (error) {
        console.log(
          "Camera permission check failed:",
          error
        );
      }
    };

    loadCameraPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const chooseGallery = useCallback(async () => {
    if (galleryLoading) {
      return;
    }

    try {
      setGalleryLoading(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photos permission required",
          "Snapgram needs access to your photos and videos so you can create posts, stories and reels.",
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],

          allowsMultipleSelection:
            config.multiple,

          selectionLimit:
            config.limit,

          quality: 1,

          videoMaxDuration:
            activeType === "reel"
              ? 90
              : 60,

          exif: false,

          orderedSelection:
            config.multiple,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const selectedAssets =
        result.assets
          .slice(0, MAX_MEDIA)
          .map(createAsset);

      setRecentAsset(
        selectedAssets[0] || null
      );

      if (
        activeType === "post" &&
        result.assets.length > MAX_MEDIA
      ) {
        Alert.alert(
          "Maximum 10 items",
          "You can select up to 10 photos or videos for one post."
        );
      }

      onSelected?.(selectedAssets);
    } catch (error) {
      console.error(
        "Gallery error:",
        error
      );

      Alert.alert(
        "Gallery error",
        "Unable to open your gallery. Please try again."
      );
    } finally {
      setGalleryLoading(false);
    }
  }, [
    activeType,
    config,
    galleryLoading,
    onSelected,
  ]);

  const chooseCamera = useCallback(
    async () => {
      if (!onCamera) {
        Alert.alert(
          "Camera unavailable",
          "The camera is not available right now."
        );

        return;
      }

      try {
        setPermissionLoading(true);

        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Camera permission required",
            "Snapgram needs camera access to take photos and record videos."
          );

          return;
        }

        setCameraPermission(true);

        onCamera();
      } catch (error) {
        console.error(
          "Camera permission error:",
          error
        );

        Alert.alert(
          "Camera error",
          "Unable to open the camera."
        );
      } finally {
        setPermissionLoading(false);
      }
    },
    [onCamera]
  );

  const handleGalleryPress = useCallback(() => {
    chooseGallery();
  }, [chooseGallery]);

  const handleCameraPress = useCallback(() => {
    chooseCamera();
  }, [chooseCamera]);

  const renderGridItem = useCallback(
    ({ item }) => {
      const isVideo =
        item?.type === "video";

      return (
        <Pressable
          onPress={handleGalleryPress}
          style={({ pressed }) => [
            styles.gridItem,
            pressed &&
              styles.gridItemPressed,
          ]}
        >
          <Image
            source={{
              uri: item.uri,
            }}
            style={styles.gridImage}
            resizeMode="cover"
          />

          {isVideo && (
            <View style={styles.videoBadge}>
              <Ionicons
                name="videocam"
                size={13}
                color="#fff"
              />
            </View>
          )}
        </Pressable>
      );
    },
    [handleGalleryPress]
  );

  const emptyGallery = useMemo(
    () => [
      {
        id: "gallery-1",
        type: "gallery",
      },
      {
        id: "gallery-2",
        type: "gallery",
      },
      {
        id: "gallery-3",
        type: "gallery",
      },
    ],
    []
  );

  return (
    <View style={styles.container}>

      <Pressable
        onPress={handleGalleryPress}
        style={styles.previewArea}
      >
        {recentAsset?.uri ? (
          <Image
            source={{
              uri: recentAsset.uri,
            }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyPreview}>
            <View style={styles.previewIcon}>
              <Ionicons
                name="images-outline"
                size={38}
                color="#777"
              />
            </View>

            <Text style={styles.previewTitle}>
              {activeType === "reel"
                ? "Choose a video"
                : activeType === "story"
                ? "Choose a photo or video"
                : "Choose photos or videos"}
            </Text>

            <Text style={styles.previewSubtitle}>
              Select media from your gallery
            </Text>
          </View>
        )}

        {recentAsset?.type === "video" && (
          <View style={styles.previewVideoBadge}>
            <Ionicons
              name="play"
              size={16}
              color="#fff"
            />
          </View>
        )}

        <View style={styles.previewOverlay}>
          <View style={styles.previewPill}>
            <Ionicons
              name="images-outline"
              size={15}
              color="#fff"
            />

            <Text style={styles.previewPillText}>
              Recent
            </Text>

            <Ionicons
              name="chevron-down"
              size={14}
              color="#fff"
            />
          </View>
        </View>
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable
          onPress={handleGalleryPress}
          disabled={galleryLoading}
          style={({ pressed }) => [
            styles.toolbarButton,
            pressed &&
              styles.toolbarButtonPressed,
          ]}
        >
          <View style={styles.toolbarIcon}>
            {galleryLoading ? (
              <ActivityIndicator
                size="small"
                color="#000"
              />
            ) : (
              <Ionicons
                name="images-outline"
                size={23}
                color="#000"
              />
            )}
          </View>

          <Text style={styles.toolbarText}>
            {config.galleryLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCameraPress}
          disabled={permissionLoading}
          style={({ pressed }) => [
            styles.toolbarButton,
            pressed &&
              styles.toolbarButtonPressed,
          ]}
        >
          <View style={styles.toolbarIcon}>
            {permissionLoading ? (
              <ActivityIndicator
                size="small"
                color="#000"
              />
            ) : (
              <Ionicons
                name={
                  activeType === "reel"
                    ? "videocam-outline"
                    : "camera-outline"
                }
                size={24}
                color="#000"
              />
            )}
          </View>

          <Text style={styles.toolbarText}>
            {config.cameraLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>
          Recent
        </Text>

        <Pressable
          onPress={handleGalleryPress}
          hitSlop={10}
          style={styles.galleryHeaderButton}
        >
          <Text style={styles.galleryHeaderButtonText}>
            See all
          </Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color="#000"
          />
        </Pressable>
      </View>

      <FlatList
        data={emptyGallery}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={() => (
          <Pressable
            onPress={handleGalleryPress}
            style={({ pressed }) => [
              styles.galleryTile,
              pressed &&
                styles.galleryTilePressed,
            ]}
          >
            <Ionicons
              name="image-outline"
              size={25}
              color="#c7c7c7"
            />
          </Pressable>
        )}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={
          styles.galleryRow
        }
        contentContainerStyle={
          styles.galleryContent
        }
      />

      <View style={styles.bottomArea}>
        <Pressable
          onPress={handleGalleryPress}
          disabled={galleryLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed &&
              styles.primaryButtonPressed,
          ]}
        >
          <Ionicons
            name="add"
            size={20}
            color="#fff"
          />

          <Text style={styles.primaryButtonText}>
            {activeType === "post"
              ? "Select from gallery"
              : activeType === "story"
              ? "Add to story"
              : "Add video"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  previewArea: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: SCREEN_WIDTH,
    backgroundColor: "#f5f5f5",
    position: "relative",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  emptyPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  previewIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
    marginBottom: 16,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  previewSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#737373",
  },

  previewOverlay: {
    position: "absolute",
    top: 14,
    left: 14,
  },

  previewPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.68)",
  },

  previewPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  previewVideoBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.68)",
  },

  toolbar: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  toolbarButton: {
    minWidth: 120,
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
  },

  toolbarButtonPressed: {
    backgroundColor: "#f5f5f5",
  },

  toolbarIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  toolbarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },

  galleryHeader: {
    height: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  galleryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },

  galleryHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  galleryHeaderButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },

  galleryContent: {
    paddingBottom: 4,
  },

  galleryRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  galleryTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
  },

  galleryTilePressed: {
    opacity: 0.65,
  },

  gridItem: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "#f4f4f4",
  },

  gridImage: {
    width: "100%",
    height: "100%",
  },

  gridItemPressed: {
    opacity: 0.75,
  },

  videoBadge: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  bottomArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
  },

  primaryButton: {
    height: 46,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#000",
  },

  primaryButtonPressed: {
    opacity: 0.75,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});