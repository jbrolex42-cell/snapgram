import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  useVideoPlayer,
  VideoView,
} from "expo-video";

import {
  getStoryGroups,
  viewStory,
  toggleStoryLike,
  replyToStory,
  deleteStory,
  getStoryViewers,
} from "../../services/storyService";

import { createHighlight } from "../../services/highlightService";

import { useAuth } from "../../context/AuthContext";

import Colors from "../../constants/Colors";

import VerifiedBadge from "../../components/common/VerifiedBadge";

const {
  width,
  height,
} = Dimensions.get(
  "window"
);

const IMAGE_DURATION =
  5000;

function StoryVideo({
  uri,
  onEnd,
}) {
  const player =
    useVideoPlayer(
      uri || null,
      videoPlayer => {
        if (!videoPlayer) {
          return;
        }

        videoPlayer.loop =
          false;

        videoPlayer.play();
      }
    );

  useEffect(() => {
    if (!player) {
      return;
    }

    const subscription =
      player.addListener(
        "playToEnd",
        onEnd
      );

    return () => {
      subscription.remove();
    };
  }, [
    player,
    onEnd,
  ]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function StoryViewer() {
  const { id } =
    useLocalSearchParams();

  const { user } = useAuth();

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const [
    highlightModalVisible,
    setHighlightModalVisible,
  ] = useState(false);

  const [
    highlightTitle,
    setHighlightTitle,
  ] = useState("");

  const [
    savingHighlight,
    setSavingHighlight,
  ] = useState(false);

  const [
    viewersModalVisible,
    setViewersModalVisible,
  ] = useState(false);

  const [
    viewers,
    setViewers,
  ] = useState([]);

  const [
    viewersLoading,
    setViewersLoading,
  ] = useState(false);

  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    groupIndex,
    setGroupIndex,
  ] = useState(0);

  const [
    storyIndex,
    setStoryIndex,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    reply,
    setReply,
  ] = useState("");

  const [
    liked,
    setLiked,
  ] = useState(false);

  const [
    likesCount,
    setLikesCount,
  ] = useState(0);

  const progress =
    useRef(
      new Animated.Value(0)
    ).current;

  const timer =
    useRef(null);

  function getGroupStories(
    group
  ) {
    const items =
      group?.stories ||
      group?.items ||
      group?.storyList ||
      [];

    return Array.isArray(
      items
    )
      ? items
      : [];
  }

  const currentGroup =
    groups[groupIndex];

  const currentGroupStories =
    getGroupStories(
      currentGroup
    );

  const story =
    currentGroupStories[
      storyIndex
    ];

  useEffect(() => {
    loadGroups();

    return () => {
      stopTimer();
    };
  }, [id]);

  useEffect(() => {
    if (!story?._id) {
      return;
    }

    setLiked(
      Boolean(
        story?.liked ||
          story?.isLiked
      )
    );

    setLikesCount(
      story?.likesCount || 0
    );

    markViewed(
      story
    );

    startProgress(
      story
    );

    return () => {
      stopTimer();
    };
  }, [
    groupIndex,
    storyIndex,
    story?._id,
  ]);

  async function loadGroups() {
    try {
      setLoading(true);

      const result =
        await getStoryGroups();

      const groupList =
        Array.isArray(
          result
        )
          ? result
          : result?.groups ||
            [];

      if (
        !groupList.length
      ) {
        router.back();
        return;
      }

      setGroups(
        groupList
      );

      let foundGroupIndex = 0;
      let foundStoryIndex = 0;

      findLoop:
      for (
        let g = 0;
        g < groupList.length;
        g++
      ) {
        const items =
          getGroupStories(
            groupList[g]
          );

        for (
          let s = 0;
          s < items.length;
          s++
        ) {
          if (
            String(
              items[s]?._id
            ) ===
            String(id)
          ) {
            foundGroupIndex = g;
            foundStoryIndex = s;
            break findLoop;
          }
        }
      }

      setGroupIndex(
        foundGroupIndex
      );

      setStoryIndex(
        foundStoryIndex
      );
    } catch (error) {
      console.error(
        "STORY GROUPS LOADING ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function markViewed(
    currentStory
  ) {
    if (!currentStory?._id) {
      return;
    }

    try {
      await viewStory(
        currentStory._id
      );
    } catch (error) {
      console.error(
        "VIEW STORY ERROR:",
        error
      );
    }
  }

  async function handleLike() {
    if (!story?._id) {
      return;
    }

    try {
      const result =
        await toggleStoryLike(
          story._id
        );

      setLiked(
        Boolean(
          result?.liked
        )
      );

      setLikesCount(
        result?.likesCount ??
          likesCount
      );
    } catch (error) {
      console.error(
        "STORY LIKE ERROR:",
        error
      );
    }
  }

  async function handleReply() {
    const text =
      reply.trim();

    if (
      !text ||
      !story?._id
    ) {
      return;
    }

    try {
      await replyToStory(
        story._id,
        text
      );

      setReply("");
    } catch (error) {
      console.error(
        "STORY REPLY ERROR:",
        error
      );
    }
  }

  function openMoreOptions() {
    Alert.alert(
      "Story options",
      undefined,
      [
        {
          text: "Add to highlight",
          onPress:
            openAddToHighlight,
        },
        {
          text: "Delete story",
          style: "destructive",
          onPress:
            confirmDeleteStory,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }

  function openAddToHighlight() {
    setHighlightTitle("");
    setHighlightModalVisible(
      true
    );
  }

  async function saveHighlight() {
    const cleanTitle =
      highlightTitle.trim();

    if (!cleanTitle) {
      Alert.alert(
        "Name required",
        "Give your highlight a name."
      );

      return;
    }

    if (!story?._id) {
      return;
    }

    try {
      setSavingHighlight(true);
      
      await createHighlight({
        title: cleanTitle,
        storyIds: [story._id],
        coverUrl: getMediaUrl(
          story
        ),
      });

      setHighlightModalVisible(
        false
      );

      Alert.alert(
        "Added to highlights",
        `Saved to "${cleanTitle}" on your profile.`
      );
    } catch (error) {
      console.error(
        "ADD TO HIGHLIGHT ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add this story to a highlight."
      );
    } finally {
      setSavingHighlight(false);
    }
  }

  function confirmDeleteStory() {
    if (!story?._id) {
      return;
    }

    Alert.alert(
      "Delete story?",
      "This story will be removed for everyone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress:
            async () => {
              try {
                await deleteStory(
                  story._id
                );

                nextStory();
              } catch (error) {
                console.error(
                  "DELETE STORY ERROR:",
                  error
                );

                Alert.alert(
                  "Error",
                  "Unable to delete this story."
                );
              }
            },
        },
      ]
    );
  }

  async function openViewers() {
    if (!story?._id) {
      return;
    }

    setViewersModalVisible(
      true
    );

    try {
      setViewersLoading(true);

      const list =
        await getStoryViewers(
          story._id
        );

      setViewers(
        Array.isArray(list)
          ? list
          : []
      );
    } catch (error) {
      console.error(
        "STORY VIEWERS ERROR:",
        error
      );

      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  }

  function stopTimer() {
    if (timer.current) {
      clearTimeout(
        timer.current
      );

      timer.current =
        null;
    }
  }

  function startProgress(
    currentStory
  ) {
    stopTimer();

    progress.setValue(0);

    if (!currentStory) {
      return;
    }

    const mediaType =
      currentStory?.mediaType ||
      currentStory?.media
        ?.type ||
      "image";

    if (
      mediaType ===
      "video"
    ) {
      return;
    }

    Animated.timing(
      progress,
      {
        toValue: 1,
        duration:
          IMAGE_DURATION,
        useNativeDriver:
          false,
      }
    ).start();

    timer.current =
      setTimeout(
        () => {
          nextStory();
        },
        IMAGE_DURATION
      );
  }

  function nextStory() {
    stopTimer();

    if (
      storyIndex <
      currentGroupStories.length -
        1
    ) {
      setStoryIndex(
        current =>
          current + 1
      );

      return;
    }

    if (
      groupIndex <
      groups.length - 1
    ) {
      setGroupIndex(
        current =>
          current + 1
      );

      setStoryIndex(0);

      return;
    }

    router.back();
  }

  function previousStory() {
    stopTimer();

    if (
      storyIndex > 0
    ) {
      setStoryIndex(
        current =>
          current - 1
      );

      return;
    }

    if (
      groupIndex > 0
    ) {
      const previousGroupStories =
        getGroupStories(
          groups[
            groupIndex - 1
          ]
        );

      setGroupIndex(
        current =>
          current - 1
      );

      setStoryIndex(
        Math.max(
          previousGroupStories.length -
            1,
          0
        )
      );

      return;
    }

    startProgress(
      story
    );
  }

  function getMediaUrl(
    currentStory
  ) {
    return (
      currentStory?.mediaUrl ||
      currentStory?.media
        ?.url ||
      ""
    );
  }

  function getMediaType(
    currentStory
  ) {
    return (
      currentStory?.mediaType ||
      currentStory?.media
        ?.type ||
      "image"
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <ActivityIndicator
          size="large"
          color={
            Colors.white
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading story...
        </Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Story unavailable
        </Text>
      </View>
    );
  }

  const mediaUrl =
    getMediaUrl(
      story
    );

  const mediaType =
    getMediaType(
      story
    );

  const storyUser =
    story?.user ||
    {};

  const fullName =
    storyUser?.name ||
    storyUser?.fullName ||
    storyUser?.username ||
    "Snapgram";

  const username =
    storyUser?.username ||
    "";

  const isVerified =
    Boolean(
      storyUser?.isVerified
    );

  const isOwnStory =
    Boolean(currentUserId) &&
    String(
      storyUser?._id ||
        storyUser?.id ||
        ""
    ) === currentUserId;

  return (
    <View
      style={
        styles.container
      }
    >
      {mediaType ===
      "video" ? (
        <StoryVideo
          uri={mediaUrl}
          onEnd={
            nextStory
          }
        />
      ) : (
        <Image
          source={{
            uri: mediaUrl,
          }}
          style={
            styles.media
          }
          resizeMode="cover"
        />
      )}

      <SafeAreaView
        style={
          styles.overlay
        }
      >

        <View
          style={
            styles.progressRow
          }
        >
          {currentGroupStories.map(
            (
              item,
              index
            ) => (
              <View
                key={String(
                  item?._id
                )}
                style={
                  styles.progressBackground
                }
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        index <
                        storyIndex
                          ? "100%"
                          : index ===
                            storyIndex
                          ? progress.interpolate(
                              {
                                inputRange:
                                  [
                                    0,
                                    1,
                                  ],
                                outputRange:
                                  [
                                    "0%",
                                    "100%",
                                  ],
                              }
                            )
                          : "0%",
                    },
                  ]}
                />
              </View>
            )
          )}
        </View>

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.userInfo
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              {storyUser?.avatar ? (
                <Image
                  source={{
                    uri:
                      storyUser.avatar,
                  }}
                  style={
                    styles.avatarImage
                  }
                />
              ) : (
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {fullName
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              )}
            </View>

            <View
              style={
                styles.identity
              }
            >
              <View
                style={
                  styles.nameRow
                }
              >
                <Text
                  style={
                    styles.fullName
                  }
                  numberOfLines={
                    1
                  }
                >
                  {fullName}
                </Text>

                {isVerified && (
                  <VerifiedBadge
                    size={15}
                  />
                )}
              </View>

              {username ? (
                <Text
                  style={
                    styles.username
                  }
                  numberOfLines={
                    1
                  }
                >
                  @{username}
                </Text>
              ) : null}

              {likesCount >
                0 && (
                <Text
                  style={
                    styles.likesText
                  }
                >
                  {likesCount}{" "}
                  {likesCount ===
                  1
                    ? "like"
                    : "likes"}
                </Text>
              )}
            </View>
          </View>

          <View
            style={
              styles.headerRight
            }
          >
            {isOwnStory && (
              <Pressable
                onPress={
                  openMoreOptions
                }
                style={
                  styles.moreButton
                }
                hitSlop={10}
              >
                <Text
                  style={
                    styles.moreIcon
                  }
                >
                  ⋯
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() =>
                router.back()
              }
              style={
                styles.closeButton
              }
              hitSlop={10}
            >
              <Text
                style={
                  styles.close
                }
              >
                ×
              </Text>
            </Pressable>
          </View>
        </View>

        {story.caption ? (
          <View
            style={
              styles.caption
            }
          >
            <Text
              style={
                styles.captionText
              }
            >
              {story.caption}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={
            styles.leftTouch
          }
          onPress={
            previousStory
          }
        />

        <Pressable
          style={
            styles.rightTouch
          }
          onPress={
            nextStory
          }
        />

        <KeyboardAvoidingView
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : undefined
          }
          style={
            styles.bottom
          }
        >
          {isOwnStory ? (
            <TouchableOpacity
              onPress={
                openViewers
              }
              style={
                styles.viewsPill
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.viewsIcon
                }
              >
                👁
              </Text>

              <Text
                style={
                  styles.viewsText
                }
              >
                {story?.viewsCount ??
                  story?.viewersCount ??
                  0}{" "}
                views
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={
                styles.replyBox
              }
            >
              <TextInput
                value={reply}
                onChangeText={
                  setReply
                }
                placeholder="Reply..."
                placeholderTextColor="#aaa"
                style={
                  styles.input
                }
                multiline
              />

              <TouchableOpacity
                onPress={
                  handleLike
                }
                style={
                  styles.likeButton
                }
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.likeIcon
                  }
                >
                  {liked
                    ? "❤️"
                    : "♡"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  handleReply
                }
                style={
                  styles.sendButton
                }
                disabled={
                  !reply.trim()
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sendIcon,
                    !reply.trim() &&
                      styles.sendDisabled,
                  ]}
                >
                  ➤
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={
          highlightModalVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          !savingHighlight &&
          setHighlightModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Add to highlight
            </Text>

            <TextInput
              value={
                highlightTitle
              }
              onChangeText={
                setHighlightTitle
              }
              placeholder="Highlight name"
              placeholderTextColor="#999"
              style={
                styles.modalInput
              }
              maxLength={16}
              autoFocus
            />

            <View
              style={
                styles.modalButtons
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setHighlightModalVisible(
                    false
                  )
                }
                disabled={
                  savingHighlight
                }
                style={
                  styles.modalCancelButton
                }
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  saveHighlight
                }
                disabled={
                  savingHighlight
                }
                style={
                  styles.modalSaveButton
                }
              >
                <Text
                  style={
                    styles.modalSaveText
                  }
                >
                  {savingHighlight
                    ? "Saving..."
                    : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          viewersModalVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setViewersModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.viewersCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Viewed by
            </Text>

            {viewersLoading ? (
              <ActivityIndicator
                color={
                  Colors.white
                }
                style={
                  styles.viewersLoading
                }
              />
            ) : viewers.length ? (
              <ScrollView
                style={
                  styles.viewersList
                }
              >
                {viewers.map(
                  (viewer) => (
                    <View
                      key={String(
                        viewer?._id ||
                          viewer?.id
                      )}
                      style={
                        styles.viewerRow
                      }
                    >
                      <Text
                        style={
                          styles.viewerName
                        }
                      >
                        {viewer?.username ||
                          viewer?.name ||
                          "user"}
                      </Text>
                    </View>
                  )
                )}
              </ScrollView>
            ) : (
              <Text
                style={
                  styles.noViewersText
                }
              >
                No views yet.
              </Text>
            )}

            <TouchableOpacity
              onPress={() =>
                setViewersModalVisible(
                  false
                )
              }
              style={
                styles.modalCloseButton
              }
            >
              <Text
                style={
                  styles.modalCloseText
                }
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        Colors.black,
    },

    media: {
      width,
      height,
      backgroundColor:
        Colors.black,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
    },

    loading: {
      flex: 1,
      backgroundColor:
        Colors.black,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color:
        Colors.white,
      marginTop: 10,
      fontSize: 15,
    },

    progressRow: {
      flexDirection:
        "row",
      gap: 4,
      paddingHorizontal: 8,
      paddingTop: 8,
      zIndex: 20,
    },

    progressBackground: {
      flex: 1,
      height: 3,
      borderRadius: 3,
      backgroundColor:
        "rgba(255,255,255,0.35)",
      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        Colors.white,
    },

    header: {
      paddingHorizontal: 15,
      marginTop: 12,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      zIndex: 20,
    },

    userInfo: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
      marginRight: 10,
    },

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow:
        "hidden",
      backgroundColor:
        Colors.surface,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      color:
        Colors.white,
      fontWeight:
        "800",
    },

    identity: {
      marginLeft: 9,
      flexShrink: 1,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      flexShrink: 1,
    },

    fullName: {
      color:
        Colors.white,
      fontWeight:
        "800",
      fontSize: 15,
      flexShrink: 1,
    },

    username: {
      marginTop: 1,
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 11,
    },

    likesText: {
      color:
        "rgba(255,255,255,0.8)",
      marginTop: 2,
      fontSize: 11,
    },

    headerRight: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    moreButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    moreIcon: {
      color:
        Colors.white,
      fontSize: 24,
      fontWeight:
        "800",
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    close: {
      color:
        Colors.white,
      fontSize: 38,
      fontWeight:
        "300",
    },

    caption: {
      position:
        "absolute",
      bottom: 115,
      left: 20,
      right: 20,
      zIndex: 15,
    },

    captionText: {
      color:
        Colors.white,
      fontSize: 16,
      textAlign:
        "center",
    },

    leftTouch: {
      position:
        "absolute",
      left: 0,
      top: 70,
      bottom: 90,
      width:
        width * 0.35,
      zIndex: 5,
    },

    rightTouch: {
      position:
        "absolute",
      right: 0,
      top: 70,
      bottom: 90,
      width:
        width * 0.65,
      zIndex: 5,
    },

    bottom: {
      position:
        "absolute",
      left: 12,
      right: 12,
      bottom: 12,
      zIndex: 30,
    },

    replyBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.7)",
      borderRadius: 25,
      paddingLeft: 16,
      paddingRight: 8,
      minHeight: 48,
      backgroundColor:
        "rgba(0,0,0,0.25)",
    },

    input: {
      flex: 1,
      color:
        Colors.white,
      fontSize: 14,
      maxHeight: 80,
      paddingVertical: 8,
    },

    likeButton: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    likeIcon: {
      fontSize: 25,
    },

    sendButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sendIcon: {
      color:
        Colors.white,
      fontSize: 20,
    },

    sendDisabled: {
      opacity: 0.35,
    },

    viewsPill: {
      alignSelf:
        "flex-start",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor:
        "rgba(0,0,0,0.4)",
    },

    viewsIcon: {
      fontSize: 15,
    },

    viewsText: {
      color:
        Colors.white,
      fontSize: 13,
      fontWeight:
        "700",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.55)",
      justifyContent:
        "flex-end",
    },

    modalCard: {
      backgroundColor:
        "#1c1c1c",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 30,
    },

    modalTitle: {
      color:
        Colors.white,
      fontSize: 17,
      fontWeight:
        "800",
      marginBottom: 14,
    },

    modalInput: {
      height: 48,
      borderRadius: 10,
      paddingHorizontal: 14,
      color:
        Colors.white,
      backgroundColor:
        "#2a2a2a",
      fontSize: 15,
    },

    modalButtons: {
      flexDirection:
        "row",
      justifyContent:
        "flex-end",
      gap: 12,
      marginTop: 18,
    },

    modalCancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    modalCancelText: {
      color:
        "rgba(255,255,255,0.7)",
      fontSize: 14,
      fontWeight:
        "700",
    },

    modalSaveButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor:
        "#0095F6",
    },

    modalSaveText: {
      color:
        Colors.white,
      fontSize: 14,
      fontWeight:
        "800",
    },

    viewersCard: {
      maxHeight: "60%",
      backgroundColor:
        "#1c1c1c",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 30,
    },

    viewersLoading: {
      marginTop: 20,
    },

    viewersList: {
      marginTop: 4,
    },

    viewerRow: {
      paddingVertical: 10,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "rgba(255,255,255,0.15)",
    },

    viewerName: {
      color:
        Colors.white,
      fontSize: 14,
    },

    noViewersText: {
      marginTop: 16,
      color:
        "rgba(255,255,255,0.6)",
      fontSize: 13,
    },

    modalCloseButton: {
      marginTop: 16,
      alignItems:
        "center",
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor:
        "#2a2a2a",
    },

    modalCloseText: {
      color:
        Colors.white,
      fontWeight:
        "700",
      fontSize: 14,
    },
  });