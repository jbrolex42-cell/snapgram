import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";

import {
  Ionicons,
} from "@expo/vector-icons";

import CaptionInput from "../../components/create/CaptionInput";
import MediaPreview from "../../components/create/MediaPreview";
import EditorToolbar from "../../components/create/EditorToolbar";
import CropSelector from "../../components/create/CropSelector";
import FilterSelector from "../../components/create/FilterSelector";
import AdjustControls from "../../components/create/AdjustControls";

import {
  createPost,
} from "../../services/postService";

const SCREEN_WIDTH =
  Dimensions.get("window").width;

const MAX_MEDIA = 10;

function parseMediaParam(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item?.uri)
      .slice(0, MAX_MEDIA);
  } catch (error) {
    console.error(
      "Media parse error:",
      error
    );

    return [];
  }
}

function normalizeMediaItem(
  item,
  index
) {
  const type =
    item?.type === "video"
      ? "video"
      : "image";

  return {
    ...item,
    type,
    assetId:
      item?.assetId ||
      `${Date.now()}-${index}`,
  };
}

function getMimeType(item) {
  if (item?.mimeType) {
    return item.mimeType;
  }

  if (item?.type === "video") {
    const name =
      String(
        item?.fileName ||
          item?.uri ||
          ""
      ).toLowerCase();

    return name.endsWith(".mov")
      ? "video/quicktime"
      : "video/mp4";
  }

  const name =
    String(
      item?.fileName ||
        item?.uri ||
        ""
    ).toLowerCase();

  if (name.endsWith(".png")) {
    return "image/png";
  }

  if (name.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

export default function CreateEditor() {
  const params =
    useLocalSearchParams();

  const initialMedia = useMemo(
    () =>
      parseMediaParam(
        params?.media
      ).map(normalizeMediaItem),
    [params?.media]
  );

  const [media, setMedia] =
    useState(initialMedia);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [caption, setCaption] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [taggedUsers, setTaggedUsers] =
    useState([]);

  const [visibility, setVisibility] =
    useState("public");

  const [posting, setPosting] =
    useState(false);

  const [activeTool, setActiveTool] =
    useState(null);

  const [cropRatio, setCropRatio] =
    useState("original");

  const [selectedFilter, setSelectedFilter] =
    useState("Normal");

  const currentMedia =
    media[currentIndex];

  const updateCurrentMedia =
    useCallback(
      (updates) => {
        setMedia((current) =>
          current.map(
            (item, index) =>
              index === currentIndex
                ? {
                    ...item,
                    ...updates,
                  }
                : item
          )
        );
      },
      [currentIndex]
    );

  const selectTool =
    useCallback((tool) => {
      setActiveTool((current) =>
        current === tool
          ? null
          : tool
      );
    }, []);

  const rotateImage =
    useCallback(async () => {
      if (!currentMedia?.uri) {
        return;
      }

      if (
        currentMedia.type ===
        "video"
      ) {
        Alert.alert(
          "Video rotation",
          "Video rotation is not available yet."
        );
        return;
      }

      try {
        const context =
          ImageManipulator.manipulate(
            currentMedia.uri
          );

        context.rotate(90);

        const image =
          await context.renderAsync();

        const result =
          await image.saveAsync({
            format:
              SaveFormat.JPEG,
            compress: 0.92,
          });

        updateCurrentMedia({
          uri: result.uri,
          mimeType: "image/jpeg",
          fileName: `snapgram-${Date.now()}.jpg`,
          width: result.width,
          height: result.height,
        });
      } catch (error) {
        console.error(
          "Rotate error:",
          error
        );

        Alert.alert(
          "Rotate failed",
          "Unable to rotate this image."
        );
      }
    }, [
      currentMedia,
      updateCurrentMedia,
    ]);

  const cropImage =
    useCallback(
      async (ratio) => {
        setCropRatio(ratio);

        if (
          ratio === "original"
        ) {
          return;
        }

        if (!currentMedia?.uri) {
          return;
        }

        if (
          currentMedia.type ===
          "video"
        ) {
          Alert.alert(
            "Crop video",
            "Video cropping is not available yet."
          );
          return;
        }

        const originalWidth =
          Number(
            currentMedia.width
          ) || 1080;

        const originalHeight =
          Number(
            currentMedia.height
          ) || 1080;

        let targetRatio;

        switch (ratio) {
          case "1:1":
            targetRatio = 1;
            break;

          case "4:5":
            targetRatio = 4 / 5;
            break;

          case "16:9":
            targetRatio = 16 / 9;
            break;

          default:
            return;
        }

        const originalRatio =
          originalWidth /
          originalHeight;

        let cropWidth =
          originalWidth;

        let cropHeight =
          originalHeight;

        if (
          originalRatio >
          targetRatio
        ) {
          cropWidth = Math.round(
            originalHeight *
              targetRatio
          );
        } else {
          cropHeight = Math.round(
            originalWidth /
              targetRatio
          );
        }

        const originX = Math.max(
          0,
          Math.round(
            (originalWidth -
              cropWidth) /
              2
          )
        );

        const originY = Math.max(
          0,
          Math.round(
            (originalHeight -
              cropHeight) /
              2
          )
        );

        try {
          const context =
            ImageManipulator.manipulate(
              currentMedia.uri
            );

          context.crop({
            originX,
            originY,
            width: cropWidth,
            height: cropHeight,
          });

          const image =
            await context.renderAsync();

          const result =
            await image.saveAsync({
              format:
                SaveFormat.JPEG,
              compress: 0.92,
            });

          updateCurrentMedia({
            uri: result.uri,
            mimeType:
              "image/jpeg",
            fileName: `snapgram-${Date.now()}.jpg`,
            width: result.width,
            height: result.height,
          });
        } catch (error) {
          console.error(
            "Crop error:",
            error
          );

          Alert.alert(
            "Crop failed",
            "Unable to crop this image."
          );
        }
      },
      [
        currentMedia,
        updateCurrentMedia,
      ]
    );

  const handleFilter =
    useCallback((filter) => {
      setSelectedFilter(filter);
    }, []);

  const handleAddLocation =
    useCallback(() => {
      Alert.alert(
        "Add location",
        "Location selection will be connected to your location/search system."
      );
    }, []);

  const handleTagPeople =
    useCallback(() => {
      Alert.alert(
        "Tag people",
        "People tagging will be connected to your user search system."
      );
    }, []);

  const publishPost =
    useCallback(async () => {
      if (
        posting ||
        !media.length
      ) {
        return;
      }

      if (
        caption.trim().length >
        2200
      ) {
        Alert.alert(
          "Caption too long",
          "Your caption cannot exceed 2200 characters."
        );
        return;
      }

      try {
        setPosting(true);

        const result =
          await createPost({
            media: media.map(
              (item) => ({
                uri: item.uri,
                type:
                  item.type ===
                  "video"
                    ? "video"
                    : "image",
                mimeType:
                  getMimeType(item),
                fileName:
                  item.fileName ||
                  `snapgram-${Date.now()}`,
              })
            ),
            caption:
              caption.trim(),
            location:
              location.trim(),
            taggedUsers,
            visibility,
          });

        if (!result?.post?._id) {
          throw new Error(
            "The server did not return the created post."
          );
        }

        Alert.alert(
          "Post shared",
          "Your post has been published successfully.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace(
                  "/(tabs)"
                ),
            },
          ]
        );
      } catch (error) {
        console.error(
          "Create post error:",
          error
        );

        const message =
          error?.response?.data
            ?.message ||
          error?.message ||
          "We couldn't publish your post.";

        Alert.alert(
          "Couldn't share",
          message
        );
      } finally {
        setPosting(false);
      }
    }, [
      posting,
      media,
      caption,
      location,
      taggedUsers,
      visibility,
    ]);

  if (!media.length) {
    return (
      <View style={styles.empty}>
        <Ionicons
          name="images-outline"
          size={48}
          color="#262626"
        />

        <Text style={styles.emptyTitle}>
          No media selected
        </Text>

        <Text
          style={styles.emptySubtitle}
        >
          Select a photo or video to
          create your post.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.emptyButtonText}
          >
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          disabled={posting}
          hitSlop={10}
        >
          <Ionicons
            name="close"
            size={29}
            color="#262626"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          New post
        </Text>

        <TouchableOpacity
          onPress={publishPost}
          disabled={posting}
          hitSlop={10}
        >
          {posting ? (
            <ActivityIndicator
              size="small"
              color="#0095f6"
            />
          ) : (
            <Text
              style={styles.shareButton}
            >
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.mediaContainer
          }
        >
          <MediaPreview
            media={media}
            currentIndex={
              currentIndex
            }
            onIndexChange={
              setCurrentIndex
            }
            filter={
              selectedFilter
            }
          />

          {media.length > 1 && (
            <View
              style={styles.mediaCount}
            >
              <Text
                style={
                  styles.mediaCountText
                }
              >
                {currentIndex + 1}/
                {media.length}
              </Text>
            </View>
          )}
        </View>

        <EditorToolbar
          activeTool={activeTool}
          onCrop={() =>
            selectTool("crop")
          }
          onRotate={
            rotateImage
          }
          onFilter={() =>
            selectTool("filter")
          }
        />

        {activeTool ===
          "crop" && (
          <View
            style={styles.panel}
          >
            <View
              style={styles.panelHeader}
            >
              <Text
                style={
                  styles.panelTitle
                }
              >
                Crop
              </Text>

              <Text
                style={
                  styles.panelSubtitle
                }
              >
                Adjust your photo
              </Text>
            </View>

            <CropSelector
              selected={
                cropRatio
              }
              onSelect={
                cropImage
              }
            />
          </View>
        )}

        {activeTool ===
          "filter" && (
          <View
            style={styles.panel}
          >
            <View
              style={styles.panelHeader}
            >
              <Text
                style={
                  styles.panelTitle
                }
              >
                Filters
              </Text>

              <Text
                style={
                  styles.panelSubtitle
                }
              >
                Choose a look
              </Text>
            </View>

            <FilterSelector
              selected={
                selectedFilter
              }
              onSelect={
                handleFilter
              }
            />
          </View>
        )}

        {activeTool ===
          "adjust" && (
          <View
            style={styles.panel}
          >
            <AdjustControls />
          </View>
        )}

        <View
          style={styles.captionSection}
        >
          <CaptionInput
            value={caption}
            onChangeText={
              setCaption
            }
          />

          <View
            style={styles.captionMeta}
          >
            <Text
              style={
                styles.captionCount
              }
            >
              {caption.length}/2200
            </Text>
          </View>
        </View>

        <View
          style={styles.options}
        >
          <TouchableOpacity
            style={styles.option}
            onPress={
              handleAddLocation
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="location-outline"
              size={23}
              color="#262626"
            />

            <Text
              style={styles.optionText}
            >
              Add location
            </Text>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#8e8e8e"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={
              handleTagPeople
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-add-outline"
              size={23}
              color="#262626"
            />

            <Text
              style={styles.optionText}
            >
              Tag people
            </Text>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#8e8e8e"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
          >
            <Ionicons
              name="eye-outline"
              size={23}
              color="#262626"
            />

            <View
              style={
                styles.visibilityContent
              }
            >
              <Text
                style={
                  styles.optionText
                }
              >
                Audience
              </Text>

              <Text
                style={
                  styles.visibilityValue
                }
              >
                {visibility ===
                "public"
                  ? "Everyone"
                  : visibility ===
                    "followers"
                  ? "Followers"
                  : "Only you"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#8e8e8e"
            />
          </TouchableOpacity>
        </View>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      {posting && (
        <View
          style={
            styles.postingOverlay
          }
        >
          <View
            style={
              styles.postingCard
            }
          >
            <ActivityIndicator
              size="large"
              color="#0095f6"
            />

            <Text
              style={
                styles.postingTitle
              }
            >
              Sharing your post
            </Text>

            <Text
              style={
                styles.postingSubtitle
              }
            >
              Uploading your media…
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 54,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
  },

  shareButton: {
    color: "#0095f6",
    fontSize: 15,
    fontWeight: "700",
  },

  mediaContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: "#000",
  },

  mediaCount: {
    position: "absolute",
    top: 12,
    right: 12,
    minWidth: 43,
    height: 27,
    paddingHorizontal: 9,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.65)",
  },

  mediaCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  panel: {
    backgroundColor: "#fff",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  panelHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
  },

  panelSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#737373",
  },

  captionSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  captionMeta: {
    alignItems: "flex-end",
    marginTop: 3,
  },

  captionCount: {
    color: "#8e8e8e",
    fontSize: 11,
  },

  options: {
    paddingHorizontal: 16,
  },

  option: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  optionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 15,
    color: "#262626",
  },

  visibilityContent: {
    flex: 1,
    marginLeft: 15,
  },

  visibilityValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#737373",
  },

  bottomSpace: {
    height: 40,
  },

  postingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },

  postingCard: {
    width:
      SCREEN_WIDTH * 0.78,
    paddingVertical: 30,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  postingTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: "#262626",
  },

  postingSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#737373",
  },

  empty: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "700",
    color: "#262626",
  },

  emptySubtitle: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
  },

  emptyButton: {
    marginTop: 22,
    paddingHorizontal: 25,
    paddingVertical: 11,
    borderRadius: 7,
    backgroundColor: "#0095f6",
  },

  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});