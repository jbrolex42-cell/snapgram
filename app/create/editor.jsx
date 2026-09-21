import React, {
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  manipulateAsync,
  SaveFormat,
} from "expo-image-manipulator";

import CaptionInput from "../../components/create/CaptionInput";
import EditorToolbar from "../../components/create/EditorToolbar";
import CropSelector from "../../components/create/CropSelector";
import FilterSelector from "../../components/create/FilterSelector";
import AdjustControls from "../../components/create/AdjustControls";

import { createPost } from "../../services/postService";

const DEFAULT_ADJUSTMENTS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  fade: 0,
};

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    title: "Everyone",
    subtitle: "Anyone can see this post",
    icon: "globe-outline",
  },
  {
    value: "followers",
    title: "Followers",
    subtitle: "Only your followers can see this",
    icon: "people-outline",
  },
  {
    value: "private",
    title: "Only me",
    subtitle: "Only you can see this post",
    icon: "lock-closed-outline",
  },
];

function parseMedia(params) {
  try {
    if (params?.media) {
      const parsed = JSON.parse(params.media);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => item?.uri
        );
      }
    }

    if (params?.uri) {
      return [
        {
          uri: params.uri,

          type:
            params.type === "video"
              ? "video"
              : "image",

          mimeType:
            params.mimeType ||
            (params.type === "video"
              ? "video/mp4"
              : "image/jpeg"),

          fileName:
            params.fileName ||
            `snapgram-${Date.now()}`,
        },
      ];
    }
  } catch (error) {
    console.error(
      "CREATE MEDIA PARSE ERROR:",
      error
    );
  }

  return [];
}

function isVideoMedia(media) {
  return (
    media?.type === "video" ||
    String(media?.mimeType || "")
      .toLowerCase()
      .startsWith("video/")
  );
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const initialMedia = useMemo(
    () => parseMedia(params),
    [params]
  );

  const [media, setMedia] =
    useState(initialMedia);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [caption, setCaption] =
    useState("");

  const [activeTool, setActiveTool] =
    useState("filter");

  const [cropRatio, setCropRatio] =
    useState("original");

  const [filter, setFilter] =
    useState("Normal");

  const [adjustments, setAdjustments] =
    useState(DEFAULT_ADJUSTMENTS);

  const [visibility, setVisibility] =
    useState("public");

  const [location, setLocation] =
    useState(null);

  const [locationModal, setLocationModal] =
    useState(false);

  const [locationText, setLocationText] =
    useState("");

  const [tagModal, setTagModal] =
    useState(false);

  const [tagText, setTagText] =
    useState("");

  const [taggedUsers, setTaggedUsers] =
    useState([]);

  const [audienceModal, setAudienceModal] =
    useState(false);

  const [posting, setPosting] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const currentMedia =
    media[currentIndex] || null;

  const selectedAudience =
    VISIBILITY_OPTIONS.find(
      (item) =>
        item.value === visibility
    );

  function updateCurrentMedia(updater) {
    setMedia((previous) =>
      previous.map((item, index) => {
        if (index !== currentIndex) {
          return item;
        }

        if (
          typeof updater === "function"
        ) {
          return updater(item);
        }

        return {
          ...item,
          ...updater,
        };
      })
    );
  }

  async function handleCrop(ratio) {
    if (posting) {
      return;
    }

    setCropRatio(ratio);

    if (!currentMedia?.uri) {
      return;
    }

    if (isVideoMedia(currentMedia)) {
      Alert.alert(
        "Crop unavailable",
        "Video cropping is not supported in this editor yet."
      );
      return;
    }

    if (ratio === "original") {
      return;
    }

    try {
      const result =
        await manipulateAsync(
          currentMedia.uri,
          [],
          {
            compress: 0.95,
            format: SaveFormat.JPEG,
          }
        );

      if (!result?.uri) {
        return;
      }

      updateCurrentMedia({
        uri: result.uri,
        type: "image",
        mimeType: "image/jpeg",
        fileName: `snapgram-${Date.now()}.jpg`,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.error(
        "CROP ERROR:",
        error
      );

      Alert.alert(
        "Crop failed",
        "We couldn't process this image."
      );
    }
  }

  async function handleRotate() {
    if (posting) {
      return;
    }

    if (!currentMedia?.uri) {
      return;
    }

    if (isVideoMedia(currentMedia)) {
      Alert.alert(
        "Rotate unavailable",
        "Video rotation is not supported in this editor yet."
      );
      return;
    }

    try {
      const result =
        await manipulateAsync(
          currentMedia.uri,
          [
            {
              rotate: 90,
            },
          ],
          {
            compress: 0.95,
            format: SaveFormat.JPEG,
          }
        );

      if (!result?.uri) {
        return;
      }

      updateCurrentMedia({
        uri: result.uri,
        type: "image",
        mimeType: "image/jpeg",
        fileName: `snapgram-${Date.now()}.jpg`,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.error(
        "ROTATE ERROR:",
        error
      );

      Alert.alert(
        "Rotate failed",
        "We couldn't rotate this image."
      );
    }
  }

  function removeCurrentMedia() {
    if (posting) {
      return;
    }

    if (media.length === 1) {
      Alert.alert(
        "Media required",
        "A post must contain at least one photo or video."
      );
      return;
    }

    setMedia((previous) =>
      previous.filter(
        (_, index) =>
          index !== currentIndex
      )
    );

    setCurrentIndex((previous) =>
      Math.max(
        0,
        Math.min(
          previous,
          media.length - 2
        )
      )
    );
  }

  function saveLocation() {
    if (posting) {
      return;
    }

    const value =
      locationText.trim();

    if (!value) {
      setLocation(null);
      setLocationText("");
      setLocationModal(false);
      return;
    }

    setLocation({
      name: value,
    });

    setLocationText(value);
    setLocationModal(false);
  }

  function saveTags() {
    if (posting) {
      return;
    }

    const usernames = tagText
      .split(",")
      .map((item) =>
        item
          .trim()
          .replace(/^@/, "")
      )
      .filter(Boolean)
      .filter(
        (item, index, array) =>
          array.indexOf(item) ===
          index
      );

    setTaggedUsers(usernames);
    setTagModal(false);
  }

  async function handleShare() {
    if (posting) {
      return;
    }

    if (!media.length) {
      Alert.alert(
        "Media required",
        "Please select at least one photo or video."
      );
      return;
    }

    const validMedia =
      media.filter(
        (item) => item?.uri
      );

    if (!validMedia.length) {
      Alert.alert(
        "Invalid media",
        "The selected media could not be processed."
      );
      return;
    }

    try {
      setPosting(true);
      setUploadProgress(0);

      const postType =
        validMedia.some(
          isVideoMedia
        )
          ? "reel"
          : "post";

      const response =
        await createPost({
          media: validMedia,

          caption:
            caption.trim(),

          location,

          taggedUsers,

          visibility,

          postType,

          edit: {
            filter,
            adjustments,
            cropRatio,
          },

          onUploadProgress:
            (progress) => {
              const safeProgress =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(progress) || 0
                  )
                );

              setUploadProgress(
                safeProgress
              );
            },
        });

      console.log(
        "POST CREATED:",
        response
      );

      if (
        !response ||
        response.success === false
      ) {
        throw new Error(
          response?.message ||
            "The post could not be created."
        );
      }

      setUploadProgress(100);

      router.replace("/(tabs)");
    } catch (error) {
      console.error(
        "CREATE POST ERROR:",
        error?.response?.data ||
          error
      );

      setUploadProgress(0);

      Alert.alert(
        "Upload failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create your post."
      );
    } finally {
      setPosting(false);
    }
  }

  if (!media.length) {
    return (
      <SafeAreaView
        style={styles.emptyScreen}
      >
        <View
          style={styles.emptyContent}
        >
          <Ionicons
            name="images-outline"
            size={54}
            color="#8e8e8e"
          />

          <Text
            style={styles.emptyTitle}
          >
            No media selected
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.emptyButtonText
              }
            >
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            disabled={posting}
            style={styles.headerButton}
          >
            <Ionicons
              name="close"
              size={27}
              color="#111"
            />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            New post
          </Text>

          <TouchableOpacity
            onPress={handleShare}
            disabled={posting}
            style={styles.shareButton}
          >
            <Text
              style={[
                styles.shareText,
                posting &&
                  styles.shareDisabled,
              ]}
            >
              {posting
                ? "Sharing..."
                : "Share"}
            </Text>
          </TouchableOpacity>
        </View>

        {posting && (
          <View
            style={
              styles.progressContainer
            }
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${uploadProgress}%`,
                },
              ]}
            />
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom:
              30 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.mediaContainer
            }
          >
            <Image
              source={{
                uri: currentMedia.uri,
              }}
              style={styles.preview}
            />

            <View
              style={
                styles.mediaTopControls
              }
            >
              <View
                style={styles.mediaCount}
              >
                <Ionicons
                  name={
                    isVideoMedia(
                      currentMedia
                    )
                      ? "videocam"
                      : "image"
                  }
                  size={14}
                  color="#fff"
                />

                <Text
                  style={
                    styles.mediaCountText
                  }
                >
                  {currentIndex + 1}/
                  {media.length}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.deleteMediaButton
                }
                onPress={
                  removeCurrentMedia
                }
                disabled={posting}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {isVideoMedia(
              currentMedia
            ) && (
              <View
                style={
                  styles.videoOverlay
                }
              >
                <View
                  style={
                    styles.videoPlayCircle
                  }
                >
                  <Ionicons
                    name="play"
                    size={24}
                    color="#fff"
                  />
                </View>
              </View>
            )}
          </View>

          {media.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.thumbnailList
              }
            >
              {media.map(
                (item, index) => (
                  <TouchableOpacity
                    key={`${item.uri}-${index}`}
                    onPress={() =>
                      !posting &&
                      setCurrentIndex(
                        index
                      )
                    }
                    activeOpacity={0.85}
                    style={[
                      styles.thumbnailWrapper,
                      index ===
                        currentIndex &&
                        styles.thumbnailSelected,
                    ]}
                  >
                    <Image
                      source={{
                        uri: item.uri,
                      }}
                      style={
                        styles.thumbnail
                      }
                    />

                    {isVideoMedia(
                      item
                    ) && (
                      <View
                        style={
                          styles.videoBadge
                        }
                      >
                        <Ionicons
                          name="play"
                          size={10}
                          color="#fff"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}

          <EditorToolbar
            activeTool={activeTool}
            onToolChange={
              posting
                ? undefined
                : setActiveTool
            }
            onRotate={
              posting
                ? undefined
                : handleRotate
            }
          />

          {activeTool === "crop" && (
            <CropSelector
              selected={cropRatio}
              onSelect={handleCrop}
            />
          )}

          {activeTool === "filter" && (
            <FilterSelector
              selected={filter}
              onSelect={
                posting
                  ? undefined
                  : setFilter
              }
              previewUri={
                currentMedia.uri
              }
            />
          )}

          {activeTool === "adjust" && (
            <AdjustControls
              values={adjustments}
              onChange={
                posting
                  ? undefined
                  : (key, value) => {
                      setAdjustments(
                        (previous) => ({
                          ...previous,
                          [key]: value,
                        })
                      );
                    }
              }
            />
          )}

          <CaptionInput
            value={caption}
            onChangeText={
              posting
                ? undefined
                : setCaption
            }
          />

          <View
            style={styles.optionsCard}
          >

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (posting) {
                  return;
                }

                setLocationText(
                  location?.name || ""
                );

                setLocationModal(
                  true
                );
              }}
              disabled={posting}
            >
              <View
                style={styles.optionLeft}
              >
                <Ionicons
                  name="location-outline"
                  size={23}
                  color="#111"
                />

                <View>
                  <Text
                    style={
                      styles.optionTitle
                    }
                  >
                    Add location
                  </Text>

                  {location?.name && (
                    <Text
                      style={
                        styles.optionValue
                      }
                    >
                      {location.name}
                    </Text>
                  )}
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#8e8e8e"
              />
            </TouchableOpacity>

            <View
              style={styles.divider}
            />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (posting) {
                  return;
                }

                setTagText(
                  taggedUsers
                    .map(
                      (username) =>
                        `@${username}`
                    )
                    .join(", ")
                );

                setTagModal(true);
              }}
              disabled={posting}
            >
              <View
                style={styles.optionLeft}
              >
                <Ionicons
                  name="person-add-outline"
                  size={23}
                  color="#111"
                />

                <View>
                  <Text
                    style={
                      styles.optionTitle
                    }
                  >
                    Tag people
                  </Text>

                  {taggedUsers.length >
                    0 && (
                    <Text
                      style={
                        styles.optionValue
                      }
                    >
                      {taggedUsers
                        .map(
                          (username) =>
                            `@${username}`
                        )
                        .join(", ")}
                    </Text>
                  )}
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#8e8e8e"
              />
            </TouchableOpacity>

            <View
              style={styles.divider}
            />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (posting) {
                  return;
                }

                setAudienceModal(
                  true
                );
              }}
              disabled={posting}
            >
              <View
                style={styles.optionLeft}
              >
                <Ionicons
                  name={
                    selectedAudience?.icon ||
                    "globe-outline"
                  }
                  size={23}
                  color="#111"
                />

                <View>
                  <Text
                    style={
                      styles.optionTitle
                    }
                  >
                    Audience
                  </Text>

                  <Text
                    style={
                      styles.optionValue
                    }
                  >
                    {selectedAudience?.title ||
                      "Everyone"}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#8e8e8e"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={locationModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setLocationModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.bottomSheet}
          >
            <View
              style={styles.sheetHandle}
            />

            <View
              style={styles.sheetHeader}
            >
              <Text
                style={styles.sheetTitle}
              >
                Add location
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setLocationModal(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#111"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              value={locationText}
              onChangeText={
                setLocationText
              }
              placeholder="Enter a location"
              placeholderTextColor="#8e8e8e"
              autoFocus
              style={styles.modalInput}
            />

            <TouchableOpacity
              style={
                styles.primaryModalButton
              }
              onPress={saveLocation}
            >
              <Text
                style={
                  styles.primaryModalButtonText
                }
              >
                Save location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={tagModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setTagModal(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.bottomSheet}
          >
            <View
              style={styles.sheetHandle}
            />

            <View
              style={styles.sheetHeader}
            >
              <Text
                style={styles.sheetTitle}
              >
                Tag people
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setTagModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#111"
                />
              </TouchableOpacity>
            </View>

            <Text
              style={styles.helperText}
            >
              Enter usernames separated
              by commas.
            </Text>

            <TextInput
              value={tagText}
              onChangeText={setTagText}
              placeholder="@username, @username"
              placeholderTextColor="#8e8e8e"
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <TouchableOpacity
              style={
                styles.primaryModalButton
              }
              onPress={saveTags}
            >
              <Text
                style={
                  styles.primaryModalButtonText
                }
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={audienceModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setAudienceModal(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setAudienceModal(false)
          }
        >
          <Pressable
            style={styles.bottomSheet}
            onPress={() => {}}
          >
            <View
              style={styles.sheetHandle}
            />

            <Text
              style={styles.sheetTitle}
            >
              Who can see this post?
            </Text>

            {VISIBILITY_OPTIONS.map(
              (option) => {
                const selected =
                  visibility ===
                  option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={
                      styles.audienceRow
                    }
                    onPress={() => {
                      setVisibility(
                        option.value
                      );

                      setAudienceModal(
                        false
                      );
                    }}
                  >
                    <View
                      style={
                        styles.audienceIcon
                      }
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color="#111"
                      />
                    </View>

                    <View
                      style={
                        styles.audienceContent
                      }
                    >
                      <Text
                        style={
                          styles.audienceTitle
                        }
                      >
                        {option.title}
                      </Text>

                      <Text
                        style={
                          styles.audienceSubtitle
                        }
                      >
                        {option.subtitle}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        selected
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={23}
                      color={
                        selected
                          ? "#0095f6"
                          : "#8e8e8e"
                      }
                    />
                  </TouchableOpacity>
                );
              }
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  keyboard: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  shareButton: {
    minWidth: 70,
    height: 42,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  shareText: {
    color: "#0095f6",
    fontSize: 15,
    fontWeight: "700",
  },

  shareDisabled: {
    opacity: 0.45,
  },

  progressContainer: {
    height: 2,
    backgroundColor: "#efefef",
  },

  progressBar: {
    height: 2,
    backgroundColor: "#0095f6",
  },

  mediaContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000",
    position: "relative",
  },

  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  mediaTopControls: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  mediaCount: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  mediaCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  deleteMediaButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  videoPlayCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailList: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },

  thumbnailSelected: {
    borderWidth: 2,
    borderColor: "#0095f6",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  videoBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  optionsCard: {
    marginTop: 8,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  optionRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  optionValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#8e8e8e",
  },

  divider: {
    height:
      StyleSheet.hairlineWidth,
    backgroundColor: "#efefef",
    marginLeft: 53,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d0d0d0",
    alignSelf: "center",
    marginBottom: 18,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 18,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  modalInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
    marginBottom: 14,
  },

  helperText: {
    fontSize: 13,
    color: "#8e8e8e",
    marginBottom: 10,
  },

  primaryModalButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#0095f6",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryModalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  audienceRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  audienceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  audienceContent: {
    flex: 1,
  },

  audienceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  audienceSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#8e8e8e",
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0095f6",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});