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
  Image,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const TOOLBAR_HEIGHT = 72;

const FILTERS = [
  {
    id: "normal",
    name: "Normal",
  },
  {
    id: "bright",
    name: "Bright",
  },
  {
    id: "warm",
    name: "Warm",
  },
  {
    id: "cool",
    name: "Cool",
  },
  {
    id: "vintage",
    name: "Vintage",
  },
  {
    id: "mono",
    name: "Mono",
  },
];

const STICKERS = [
  {
    id: "location",
    label: "Location",
    icon: "location-outline",
  },
  {
    id: "mention",
    label: "Mention",
    icon: "person-outline",
  },
  {
    id: "hashtag",
    label: "Hashtag",
    icon: "pricetag-outline",
  },
  {
    id: "music",
    label: "Music",
    icon: "musical-notes-outline",
  },
  {
    id: "poll",
    label: "Poll",
    icon: "stats-chart-outline",
  },
  {
    id: "question",
    label: "Questions",
    icon: "help-circle-outline",
  },
  {
    id: "gif",
    label: "GIF",
    icon: "film-outline",
  },
  {
    id: "emoji",
    label: "Emoji",
    icon: "happy-outline",
  },
  {
    id: "link",
    label: "Link",
    icon: "link-outline",
  },
  {
    id: "countdown",
    label: "Countdown",
    icon: "timer-outline",
  },
];

function getParamValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseMedia(params) {
  const raw = getParamValue(params?.media);

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      typeof raw === "string"
        ? JSON.parse(raw)
        : raw;

    const item = Array.isArray(parsed)
      ? parsed[0]
      : parsed;

    if (!item?.uri) {
      return null;
    }

    return item;
  } catch (error) {
    console.error(
      "STORY MEDIA PARSE ERROR:",
      error
    );

    return null;
  }
}

function getMediaType(media) {
  if (!media) {
    return "image";
  }

  if (
    media.type === "video" ||
    media.mimeType?.startsWith("video/")
  ) {
    return "video";
  }

  return "image";
}

export default function StoryScreen() {
  const params = useLocalSearchParams();

  const media = useMemo(
    () => parseMedia(params),
    [params]
  );

  const mediaType = useMemo(
    () => getMediaType(media),
    [media]
  );

  const [caption, setCaption] = useState("");

  const [activeTool, setActiveTool] =
    useState(null);

  const [showStickerSheet, setShowStickerSheet] =
    useState(false);

  const [showMusicSheet, setShowMusicSheet] =
    useState(false);

  const [showFilterSheet, setShowFilterSheet] =
    useState(false);

  const [showShareSheet, setShowShareSheet] =
    useState(false);

  const [showTextInput, setShowTextInput] =
    useState(false);

  const [textValue, setTextValue] =
    useState("");

  const [textColor, setTextColor] =
    useState("#ffffff");

  const [selectedFilter, setSelectedFilter] =
    useState("normal");

  const [selectedMusic, setSelectedMusic] =
    useState(null);

  const [stickers, setStickers] =
    useState([]);

  const [storyText, setStoryText] =
    useState([]);

  const [isPublishing, setIsPublishing] =
    useState(false);

  const [keyboardVisible, setKeyboardVisible] =
    useState(false);

  useEffect(() => {
    const showSubscription =
      Keyboard.addListener(
        "keyboardDidShow",
        () => setKeyboardVisible(true)
      );

    const hideSubscription =
      Keyboard.addListener(
        "keyboardDidHide",
        () => setKeyboardVisible(false)
      );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const closeScreen = useCallback(() => {
    if (isPublishing) {
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [isPublishing]);

  const handleText = useCallback(() => {
    setActiveTool("text");
    setShowTextInput(true);
  }, []);

  const saveText = useCallback(() => {
    const cleanText = textValue.trim();

    if (!cleanText) {
      setShowTextInput(false);
      setActiveTool(null);
      return;
    }

    setStoryText((previous) => [
      ...previous,
      {
        id: `${Date.now()}`,
        text: cleanText,
        color: textColor,
      },
    ]);

    setTextValue("");
    setShowTextInput(false);
    setActiveTool(null);
  }, [textValue, textColor]);

  const handleSticker = useCallback(
    (sticker) => {
      if (!sticker) {
        return;
      }

      if (sticker.id === "music") {
        setShowStickerSheet(false);
        setShowMusicSheet(true);
        return;
      }

      setStickers((previous) => [
        ...previous,
        {
          id: `${sticker.id}-${Date.now()}`,
          type: sticker.id,
          label: sticker.label,
          icon: sticker.icon,
        },
      ]);

      setShowStickerSheet(false);
    },
    []
  );

  const handleMusic = useCallback(
    (music) => {
      setSelectedMusic(music);
      setShowMusicSheet(false);

      setStickers((previous) => [
        ...previous.filter(
          (item) => item.type !== "music"
        ),
        {
          id: `music-${Date.now()}`,
          type: "music",
          label: music.title,
          icon: "musical-notes",
        },
      ]);
    },
    []
  );

  const handleFilter = useCallback(
    (filter) => {
      setSelectedFilter(filter.id);
      setShowFilterSheet(false);
    },
    []
  );

  const handlePublish = useCallback(async () => {
    if (!media?.uri) {
      Alert.alert(
        "No media",
        "Please capture or select a photo or video first."
      );
      return;
    }

    if (isPublishing) {
      return;
    }

    try {
      Keyboard.dismiss();

      setIsPublishing(true);

      console.log("STORY PUBLISH START:", {
        uri: media.uri,
        type: mediaType,
        mimeType: media.mimeType,
        fileName: media.fileName,
      });

      await createStory(
        media.uri,
        mediaType,
        caption
      );

      setIsPublishing(false);

      Alert.alert(
        "Story shared",
        "Your story has been shared successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)");
            },
          },
        ]
      );
    } catch (error) {
      setIsPublishing(false);

      console.error(
        "CREATE STORY ERROR:",
        error
      );

      const serverMessage =
        error?.response?.data?.message;

      const message =
        serverMessage ||
        error?.message ||
        "Unable to upload your story.";

      Alert.alert(
        "Story upload failed",
        message
      );
    }
  }, [
    media,
    mediaType,
    caption,
    isPublishing,
  ]);

  const openShareSheet = useCallback(() => {
    Keyboard.dismiss();
    setShowShareSheet(true);
  }, []);

  if (!media?.uri) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons
            name="images-outline"
            size={64}
            color="#ffffff"
          />

          <Text style={styles.emptyTitle}>
            No media selected
          </Text>

          <Text style={styles.emptyText}>
            Capture a photo or video before creating
            your story.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.replace("/create")}
          >
            <Text style={styles.emptyButtonText}>
              Back to Create
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={closeScreen}
            disabled={isPublishing}
          >
            <Ionicons
              name="close"
              size={30}
              color="#ffffff"
            />
          </TouchableOpacity>

          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.topButton}
              onPress={handleText}
              disabled={isPublishing}
            >
              <Ionicons
                name="text"
                size={25}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topButton}
              onPress={() =>
                setShowStickerSheet(true)
              }
              disabled={isPublishing}
            >
              <Ionicons
                name="happy-outline"
                size={27}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topButton}
              onPress={() =>
                setShowFilterSheet(true)
              }
              disabled={isPublishing}
            >
              <Ionicons
                name="sparkles-outline"
                size={26}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topButton}
              onPress={() =>
                Alert.alert(
                  "Drawing",
                  "Drawing mode is ready for the editor layer."
                )
              }
              disabled={isPublishing}
            >
              <Ionicons
                name="pencil-outline"
                size={25}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* MEDIA */}
        <View style={styles.previewArea}>
          <View
            style={[
              styles.mediaContainer,
              selectedFilter === "mono" &&
                styles.filterMono,
              selectedFilter === "warm" &&
                styles.filterWarm,
              selectedFilter === "cool" &&
                styles.filterCool,
              selectedFilter === "vintage" &&
                styles.filterVintage,
              selectedFilter === "bright" &&
                styles.filterBright,
            ]}
          >
            <Image
              source={{ uri: media.uri }}
              style={styles.media}
              resizeMode="cover"
            />

            {/* DARK GRADIENT-LIKE OVERLAYS */}
            <View style={styles.topGradient} />
            <View style={styles.bottomGradient} />

            {/* TEXT LAYERS */}
            <View
              pointerEvents="none"
              style={styles.textLayer}
            >
              {storyText.map((item) => (
                <View
                  key={item.id}
                  style={styles.storyTextItem}
                >
                  <Text
                    style={[
                      styles.storyText,
                      {
                        color: item.color,
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* STICKERS */}
            <View
              pointerEvents="none"
              style={styles.stickerLayer}
            >
              {stickers.map((sticker) => (
                <View
                  key={sticker.id}
                  style={styles.stickerItem}
                >
                  <Ionicons
                    name={sticker.icon}
                    size={20}
                    color="#111111"
                  />

                  <Text style={styles.stickerText}>
                    {sticker.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* MUSIC */}
            {selectedMusic && (
              <View
                style={styles.musicCard}
              >
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color="#ffffff"
                />

                <View style={styles.musicTextWrap}>
                  <Text
                    style={styles.musicTitle}
                    numberOfLines={1}
                  >
                    {selectedMusic.title}
                  </Text>

                  <Text
                    style={styles.musicArtist}
                    numberOfLines={1}
                  >
                    {selectedMusic.artist}
                  </Text>
                </View>
              </View>
            )}

            {/* VIDEO INDICATOR */}
            {mediaType === "video" && (
              <View
                style={styles.videoIndicator}
              >
                <Ionicons
                  name="videocam"
                  size={18}
                  color="#ffffff"
                />

                <Text
                  style={styles.videoText}
                >
                  Video
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* TOOLBAR */}
        {!keyboardVisible && (
          <View style={styles.bottomArea}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.toolsScroll
              }
            >
              <StoryTool
                icon="text"
                label="Text"
                onPress={handleText}
              />

              <StoryTool
                icon="happy-outline"
                label="Stickers"
                onPress={() =>
                  setShowStickerSheet(true)
                }
              />

              <StoryTool
                icon="musical-notes-outline"
                label="Music"
                onPress={() =>
                  setShowMusicSheet(true)
                }
              />

              <StoryTool
                icon="sparkles-outline"
                label="Effects"
                onPress={() =>
                  setShowFilterSheet(true)
                }
              />

              <StoryTool
                icon="location-outline"
                label="Location"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "location"
                    )
                  )
                }
              />

              <StoryTool
                icon="at-outline"
                label="Mention"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "mention"
                    )
                  )
                }
              />

              <StoryTool
                icon="pricetag-outline"
                label="Hashtag"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "hashtag"
                    )
                  )
                }
              />

              <StoryTool
                icon="stats-chart-outline"
                label="Poll"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "poll"
                    )
                  )
                }
              />

              <StoryTool
                icon="help-circle-outline"
                label="Question"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "question"
                    )
                  )
                }
              />

              <StoryTool
                icon="film-outline"
                label="GIF"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "gif"
                    )
                  )
                }
              />

              <StoryTool
                icon="link-outline"
                label="Link"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "link"
                    )
                  )
                }
              />

              <StoryTool
                icon="timer-outline"
                label="Countdown"
                onPress={() =>
                  handleSticker(
                    STICKERS.find(
                      (item) =>
                        item.id === "countdown"
                    )
                  )
                }
              />
            </ScrollView>

            {/* SHARE ROW */}
            <View style={styles.shareRow}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() =>
                  Alert.alert(
                    "Save",
                    "Save-to-device can be connected to Expo MediaLibrary."
                  )
                }
                disabled={isPublishing}
              >
                <Ionicons
                  name="download-outline"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={openShareSheet}
                disabled={isPublishing}
              >
                <Text style={styles.shareButtonText}>
                  Share
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* TEXT MODAL */}
      <Modal
        visible={showTextInput}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowTextInput(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.textModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add text
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowTextInput(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              value={textValue}
              onChangeText={setTextValue}
              placeholder="Type something..."
              placeholderTextColor="#888888"
              autoFocus
              multiline
              style={[
                styles.textInput,
                {
                  color: textColor,
                },
              ]}
            />

            <View style={styles.colorRow}>
              {[
                "#ffffff",
                "#000000",
                "#ff3040",
                "#0095f6",
                "#34c759",
                "#ffcc00",
                "#af52de",
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() =>
                    setTextColor(color)
                  }
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: color,
                    },
                    textColor === color &&
                      styles.selectedColor,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={saveText}
            >
              <Text style={styles.doneButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STICKER SHEET */}
      <Modal
        visible={showStickerSheet}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowStickerSheet(false)
        }
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Stickers
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowStickerSheet(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.stickerGrid}>
              {STICKERS.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={styles.stickerOption}
                  onPress={() =>
                    handleSticker(sticker)
                  }
                >
                  <View
                    style={
                      styles.stickerIconCircle
                    }
                  >
                    <Ionicons
                      name={sticker.icon}
                      size={26}
                      color="#ffffff"
                    />
                  </View>

                  <Text
                    style={styles.stickerOptionText}
                  >
                    {sticker.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* MUSIC SHEET */}
      <Modal
        visible={showMusicSheet}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowMusicSheet(false)
        }
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Music
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowMusicSheet(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.musicSearch}>
              <Ionicons
                name="search"
                size={20}
                color="#888888"
              />

              <TextInput
                placeholder="Search music"
                placeholderTextColor="#888888"
                style={styles.musicSearchInput}
              />
            </View>

            <MusicOption
              title="Trending sounds"
              artist="Snapgram Music"
              onPress={() =>
                handleMusic({
                  title: "Trending sounds",
                  artist: "Snapgram Music",
                })
              }
            />

            <MusicOption
              title="Original audio"
              artist="Your story"
              onPress={() =>
                handleMusic({
                  title: "Original audio",
                  artist: "Your story",
                })
              }
            />

            <MusicOption
              title="Popular audio"
              artist="Snapgram"
              onPress={() =>
                handleMusic({
                  title: "Popular audio",
                  artist: "Snapgram",
                })
              }
            />

            <Text style={styles.musicNotice}>
              Music catalog integration can be
              connected to your backend/music provider.
            </Text>
          </View>
        </View>
      </Modal>

      {/* FILTER SHEET */}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowFilterSheet(false)
        }
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Effects & filters
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowFilterSheet(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.filterScroll
              }
            >
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    selectedFilter ===
                      filter.id &&
                      styles.selectedFilter,
                  ]}
                  onPress={() =>
                    handleFilter(filter)
                  }
                >
                  <View
                    style={[
                      styles.filterPreview,
                      filter.id === "mono" &&
                        styles.filterMono,
                      filter.id === "warm" &&
                        styles.filterWarm,
                      filter.id === "cool" &&
                        styles.filterCool,
                      filter.id === "vintage" &&
                        styles.filterVintage,
                      filter.id === "bright" &&
                        styles.filterBright,
                    ]}
                  >
                    <Image
                      source={{
                        uri: media.uri,
                      }}
                      style={styles.filterImage}
                    />
                  </View>

                  <Text
                    style={
                      styles.filterOptionText
                    }
                  >
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SHARE SHEET */}
      <Modal
        visible={showShareSheet}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowShareSheet(false)
        }
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.shareSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Share to story
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowShareSheet(false)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sharePreviewRow}>
              <Image
                source={{
                  uri: media.uri,
                }}
                style={styles.sharePreview}
              />

              <View style={styles.shareInfo}>
                <Text style={styles.shareTitle}>
                  Your story
                </Text>

                <Text style={styles.shareSubtitle}>
                  Share this with your followers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryShare}
              onPress={() => {
                setShowShareSheet(false);
                handlePublish();
              }}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <>
                  <Text
                    style={styles.primaryShareText}
                  >
                    Share to Story
                  </Text>

                  <Ionicons
                    name="paper-plane"
                    size={19}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeShareButton}
              onPress={() =>
                setShowShareSheet(false)
              }
              disabled={isPublishing}
            >
              <Text
                style={styles.closeShareText}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StoryTool({
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.storyTool}
      onPress={onPress}
    >
      <View style={styles.storyToolIcon}>
        <Ionicons
          name={icon}
          size={23}
          color="#ffffff"
        />
      </View>

      <Text style={styles.storyToolLabel}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MusicOption({
  title,
  artist,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.musicOption}
      onPress={onPress}
    >
      <View style={styles.musicIcon}>
        <Ionicons
          name="musical-notes"
          size={22}
          color="#ffffff"
        />
      </View>

      <View style={styles.musicOptionInfo}>
        <Text
          style={styles.musicOptionTitle}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={styles.musicOptionArtist}
          numberOfLines={1}
        >
          {artist}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#777777"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },

  topBar: {
    height: 58,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  topButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  mediaContainer: {
    width: SCREEN_WIDTH,
    height:
      SCREEN_HEIGHT -
      TOOLBAR_HEIGHT -
      58,
    maxHeight: SCREEN_HEIGHT * 0.82,
    overflow: "hidden",
    backgroundColor: "#111111",
  },

  media: {
    width: "100%",
    height: "100%",
  },

  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  textLayer: {
    position: "absolute",
    top: "38%",
    left: 20,
    right: 20,
    alignItems: "center",
  },

  storyTextItem: {
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
  },

  storyText: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },

  stickerLayer: {
    position: "absolute",
    top: "55%",
    left: 20,
    right: 20,
    alignItems: "center",
    gap: 8,
  },

  stickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },

  stickerText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 14,
  },

  musicCard: {
    position: "absolute",
    left: 18,
    bottom: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.68)",
    maxWidth: SCREEN_WIDTH * 0.7,
  },

  musicTextWrap: {
    marginLeft: 8,
    flexShrink: 1,
  },

  musicTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  musicArtist: {
    color: "#dddddd",
    fontSize: 11,
    marginTop: 2,
  },

  videoIndicator: {
    position: "absolute",
    right: 18,
    bottom: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  videoText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  bottomArea: {
    height: TOOLBAR_HEIGHT,
    backgroundColor: "#000000",
  },

  toolsScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 15,
  },

  storyTool: {
    width: 62,
    alignItems: "center",
  },

  storyToolIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1d1d1d",
  },

  storyToolLabel: {
    marginTop: 3,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "600",
  },

  shareRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1d1d1d",
    alignItems: "center",
    justifyContent: "center",
  },

  shareButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0095f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  shareButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 18,
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    color: "#999999",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },

  emptyButton: {
    marginTop: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0095f6",
  },

  emptyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },

  textModal: {
    backgroundColor: "#181818",
    borderRadius: 18,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  textInput: {
    minHeight: 130,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#242424",
    padding: 15,
    fontSize: 24,
    textAlignVertical: "top",
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
  },

  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#444444",
  },

  selectedColor: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },

  doneButton: {
    height: 46,
    borderRadius: 23,
    marginTop: 18,
    backgroundColor: "#0095f6",
    alignItems: "center",
    justifyContent: "center",
  },

  doneButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  sheet: {
    minHeight: SCREEN_HEIGHT * 0.55,
    backgroundColor: "#151515",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },

  filterSheet: {
    minHeight: SCREEN_HEIGHT * 0.36,
    backgroundColor: "#151515",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },

  shareSheet: {
    backgroundColor: "#151515",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555555",
    alignSelf: "center",
    marginBottom: 15,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  sheetTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
  },

  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  stickerOption: {
    width: "30%",
    alignItems: "center",
    marginBottom: 22,
  },

  stickerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },

  stickerOptionText: {
    color: "#ffffff",
    marginTop: 7,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  musicSearch: {
    height: 45,
    borderRadius: 10,
    backgroundColor: "#242424",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  musicSearchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#ffffff",
    fontSize: 14,
  },

  musicOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#303030",
  },

  musicIcon: {
    width: 45,
    height: 45,
    borderRadius: 9,
    backgroundColor: "#2b2b2b",
    alignItems: "center",
    justifyContent: "center",
  },

  musicOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },

  musicOptionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  musicOptionArtist: {
    color: "#999999",
    fontSize: 12,
    marginTop: 3,
  },

  musicNotice: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
    textAlign: "center",
  },

  filterScroll: {
    paddingVertical: 10,
    gap: 15,
  },

  filterOption: {
    width: 90,
    alignItems: "center",
  },

  selectedFilter: {
    opacity: 1,
  },

  filterPreview: {
    width: 78,
    height: 105,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },

  filterImage: {
    width: "100%",
    height: "100%",
  },

  filterOptionText: {
    marginTop: 7,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },

  filterMono: {
    opacity: 0.75,
  },

  filterWarm: {
    backgroundColor: "rgba(255,145,60,0.22)",
  },

  filterCool: {
    backgroundColor: "rgba(60,150,255,0.22)",
  },

  filterVintage: {
    backgroundColor: "rgba(190,140,80,0.25)",
  },

  filterBright: {
    opacity: 0.95,
  },

  sharePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  sharePreview: {
    width: 65,
    height: 85,
    borderRadius: 8,
  },

  shareInfo: {
    marginLeft: 13,
    flex: 1,
  },

  shareTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  shareSubtitle: {
    color: "#999999",
    fontSize: 13,
    marginTop: 5,
  },

  primaryShare: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0095f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  primaryShareText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  closeShareButton: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  closeShareText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});