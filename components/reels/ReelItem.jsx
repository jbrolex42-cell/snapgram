import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useVideoPlayer,
  VideoView,
} from "expo-video";

import { Ionicons } from "@expo/vector-icons";

import {
  likeReel,
  saveReel,
  viewReel,
} from "../../services/reelService";

const DOUBLE_TAP_DELAY = 260;

function formatCount(value) {
  const count = Number(value) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000)
      .toFixed(1)
      .replace(/\.0$/, "")}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000)
      .toFixed(1)
      .replace(/\.0$/, "")}K`;
  }

  return String(count);
}

function getUserId(user) {
  return user?._id || user?.id || null;
}

function getUsername(user) {
  return (
    user?.username ||
    user?.name ||
    "Snapgram"
  );
}

export default function ReelItem({
  reel,
  active,
  muted,

  isLiked,
  isSaved,
  isFollowing,

  onLike,
  onSave,
  onFollow,
  onComment,
  onShare,
  onProfile,
  onDoubleTap,
}) {

  const videoUrl =
    reel?.video?.url ||
    reel?.videoUrl ||
    reel?.url ||
    "";

  const player = useVideoPlayer(
    videoUrl || null,
    (videoPlayer) => {
      if (!videoPlayer) {
        return;
      }

      videoPlayer.loop = true;
      videoPlayer.muted = Boolean(muted);
    }
  );

  const [likes, setLikes] = useState(
    Number(reel?.likesCount) || 0
  );

  const [paused, setPaused] = useState(false);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const tapTimeoutRef = useRef(null);

  const viewedRef = useRef(false);

  const heartScale = useRef(
    new Animated.Value(0)
  ).current;

  const pauseOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    if (!player) {
      return;
    }

    player.muted = Boolean(muted);
  }, [muted, player]);

  useEffect(() => {
    if (!player) {
      return;
    }

    if (active) {
      setPaused(false);

      try {
        player.play();
      } catch (error) {
        console.error(
          "Reel play error:",
          error
        );
      }

      if (
        reel?._id &&
        !viewedRef.current
      ) {
        viewedRef.current = true;

        viewReel(reel._id).catch(
          (error) => {
            console.error(
              "Reel view error:",
              error
            );
          }
        );
      }
    } else {
      try {
        player.pause();
      } catch (error) {
        console.error(
          "Reel pause error:",
          error
        );
      }

      setPaused(false);
    }
  }, [
    active,
    player,
    reel?._id,
  ]);

  useEffect(() => {
    setLikes(
      Number(reel?.likesCount) || 0
    );
  }, [reel?.likesCount]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(
          tapTimeoutRef.current
        );

        tapTimeoutRef.current = null;
      }
    };
  }, []);

  const triggerHeartBurst =
    useCallback(() => {
      heartScale.setValue(0);

      Animated.sequence([
        Animated.spring(
          heartScale,
          {
            toValue: 1,
            friction: 5,
            tension: 70,
            useNativeDriver: true,
          }
        ),

        Animated.delay(350),

        Animated.timing(
          heartScale,
          {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }
        ),
      ]).start();
    }, [heartScale]);

  const showPauseAnimation =
    useCallback(
      (nextPaused) => {
        pauseOpacity.stopAnimation();

        pauseOpacity.setValue(1);

        Animated.timing(
          pauseOpacity,
          {
            toValue: 0,
            duration: 500,
            delay: 100,
            useNativeDriver: true,
          }
        ).start();
      },
      [pauseOpacity]
    );

  const handleLike = useCallback(
    async () => {
      if (
        !reel?._id ||
        likeLoading
      ) {
        return;
      }

      const wasLiked = Boolean(
        isLiked
      );

      const previousLikes = likes;

      const nextLikes = wasLiked
        ? Math.max(0, likes - 1)
        : likes + 1;

      setLikes(nextLikes);

      onLike?.();

      setLikeLoading(true);

      try {
        const result =
          await likeReel(reel._id);

        if (
          typeof result?.likesCount ===
          "number"
        ) {
          setLikes(
            result.likesCount
          );
        }

        if (
          typeof result?.liked ===
            "boolean" &&
          result.liked === wasLiked
        ) {
          onLike?.();
        }
      } catch (error) {
        console.error(
          "Reel like error:",
          error
        );

        setLikes(previousLikes);

        onLike?.();
      } finally {
        setLikeLoading(false);
      }
    },
    [
      isLiked,
      likeLoading,
      likes,
      onLike,
      reel?._id,
    ]
  );

  const handleSave = useCallback(
    async () => {
      if (
        !reel?._id ||
        saveLoading
      ) {
        return;
      }

      const wasSaved = Boolean(
        isSaved
      );

      onSave?.();

      setSaveLoading(true);

      try {
        const result =
          await saveReel(reel._id);

        if (
          typeof result?.saved ===
            "boolean" &&
          result.saved === wasSaved
        ) {
          onSave?.();
        }
      } catch (error) {
        console.error(
          "Reel save error:",
          error
        );

        onSave?.();
      } finally {
        setSaveLoading(false);
      }
    },
    [
      isSaved,
      onSave,
      reel?._id,
      saveLoading,
    ]
  );

  const handleDoubleTap =
    useCallback(() => {
      triggerHeartBurst();

      if (!isLiked) {
        handleLike();
      }

      onDoubleTap?.(reel);
    }, [
      handleLike,
      isLiked,
      onDoubleTap,
      reel,
      triggerHeartBurst,
    ]);

  const togglePlayback =
    useCallback(() => {
      if (!player) {
        return;
      }

      setPaused((previous) => {
        const next = !previous;

        try {
          if (next) {
            player.pause();
          } else {
            player.play();
          }
        } catch (error) {
          console.error(
            "Playback toggle error:",
            error
          );
        }

        showPauseAnimation(next);

        return next;
      });
    }, [
      player,
      showPauseAnimation,
    ]);

  const handleVideoPress =
    useCallback(() => {
      if (tapTimeoutRef.current) {
        clearTimeout(
          tapTimeoutRef.current
        );

        tapTimeoutRef.current = null;

        handleDoubleTap();

        return;
      }

      tapTimeoutRef.current =
        setTimeout(() => {
          tapTimeoutRef.current = null;

          togglePlayback();
        }, DOUBLE_TAP_DELAY);
    }, [
      handleDoubleTap,
      togglePlayback,
    ]);

  const user =
    reel?.user ||
    reel?.author ||
    {};

  const username =
    getUsername(user);

  const userId =
    getUserId(user);

  const avatar =
    user?.avatar ||
    user?.profilePicture ||
    user?.profileImage ||
    "";

  const caption =
    reel?.caption ||
    reel?.description ||
    "";

  const musicName =
    reel?.music?.name ||
    reel?.music?.title ||
    reel?.audio?.name ||
    reel?.audio?.title ||
    "";

  const commentsCount =
    Number(
      reel?.commentsCount
    ) || 0;

  return (
    <View style={styles.container}>

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleVideoPress}
      >
        {videoUrl ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <View
            style={
              styles.videoPlaceholder
            }
          >
            <Ionicons
              name="videocam-off-outline"
              size={34}
              color="rgba(255,255,255,0.45)"
            />

            <Text
              style={
                styles.placeholderText
              }
            >
              Video unavailable
            </Text>
          </View>
        )}
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartBurst,
          {
            opacity: heartScale,

            transform: [
              {
                scale:
                  heartScale.interpolate(
                    {
                      inputRange: [
                        0,
                        1,
                      ],
                      outputRange: [
                        0.45,
                        1.1,
                      ],
                    }
                  ),
              },
            ],
          },
        ]}
      >
        <Ionicons
          name="heart"
          size={118}
          color="#fff"
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.pauseFlash,
          {
            opacity:
              pauseOpacity,
          },
        ]}
      >
        <View
          style={
            styles.pauseCircle
          }
        >
          <Ionicons
            name={
              paused
                ? "play"
                : "pause"
            }
            size={30}
            color="#fff"
          />
        </View>
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={styles.actionsWrapper}
      >
        <View style={styles.actions}>
          {/* LIKE */}

          <Pressable
            onPress={handleLike}
            disabled={likeLoading}
            hitSlop={10}
            style={styles.action}
          >
            <Ionicons
              name={
                isLiked
                  ? "heart"
                  : "heart-outline"
              }
              size={31}
              color={
                isLiked
                  ? "#ff3040"
                  : "#fff"
              }
            />

            <Text
              style={styles.actionCount}
            >
              {formatCount(likes)}
            </Text>
          </Pressable>

          {/* COMMENT */}

          <Pressable
            onPress={() =>
              onComment?.(reel)
            }
            hitSlop={10}
            style={styles.action}
          >
            <Ionicons
              name="chatbubble-outline"
              size={29}
              color="#fff"
            />

            <Text
              style={styles.actionCount}
            >
              {formatCount(
                commentsCount
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              onShare?.(reel)
            }
            hitSlop={10}
            style={styles.action}
          >
            <Ionicons
              name="paper-plane-outline"
              size={28}
              color="#fff"
            />

            <Text
              style={styles.actionLabel}
            >
              Share
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saveLoading}
            hitSlop={10}
            style={styles.action}
          >
            <Ionicons
              name={
                isSaved
                  ? "bookmark"
                  : "bookmark-outline"
              }
              size={29}
              color="#fff"
            />

            <Text
              style={styles.actionLabel}
            >
              Save
            </Text>
          </Pressable>

          {/* MORE */}

          <Pressable
            onPress={() => {

            }}
            hitSlop={10}
            style={[
              styles.action,
              styles.moreAction,
            ]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={27}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={styles.bottomOverlay}
      >
        <View style={styles.bottomContent}>
          {/* USER ROW */}

          <View style={styles.userRow}>
            <Pressable
              onPress={() =>
                onProfile?.(user)
              }
              hitSlop={8}
              style={styles.profilePress}
            >
              {avatar ? (
                <Image
                  source={{
                    uri: avatar,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={
                    styles.avatarFallback
                  }
                >
                  <Text
                    style={
                      styles.avatarFallbackText
                    }
                  >
                    {username
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() =>
                onProfile?.(user)
              }
              style={styles.usernamePress}
            >
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {username}
              </Text>

              {user?.isVerified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#3897f0"
                  style={
                    styles.verifiedIcon
                  }
                />
              ) : null}
            </Pressable>

            {!isFollowing && userId ? (
              <Pressable
                onPress={() =>
                  onFollow?.(userId)
                }
                hitSlop={7}
                style={
                  styles.followButton
                }
              >
                <Text
                  style={
                    styles.followText
                  }
                >
                  Follow
                </Text>
              </Pressable>
            ) : null}
          </View>

          {caption ? (
            <Text
              style={styles.caption}
              numberOfLines={3}
            >
              {caption}
            </Text>
          ) : null}

          {musicName ? (
            <Pressable
              style={styles.musicRow}
            >
              <Ionicons
                name="musical-notes"
                size={14}
                color="#fff"
              />

              <Text
                style={styles.musicText}
                numberOfLines={1}
              >
                {musicName}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        pointerEvents="none"
        style={styles.audioDisc}
      >
        <View
          style={styles.audioDiscInner}
        >
          <Ionicons
            name="musical-notes"
            size={13}
            color="#fff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
  },

  videoPlaceholder: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    marginTop: 9,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },

  heartBurst: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 40,
  },

  pauseFlash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 35,
  },

  pauseCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,

    backgroundColor:
      "rgba(0,0,0,0.48)",

    alignItems: "center",
    justifyContent: "center",
  },

  actionsWrapper: {
    position: "absolute",

    right: 10,
    bottom: 94,

    zIndex: 50,
  },

  actions: {
    width: 48,

    alignItems: "center",
    justifyContent: "flex-end",
  },

  action: {
    width: 48,
    minHeight: 55,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 17,
  },

  actionCount: {
    marginTop: 4,

    color: "#fff",

    fontSize: 11,
    fontWeight: "600",

    textShadowColor:
      "rgba(0,0,0,0.65)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },

  actionLabel: {
    marginTop: 4,

    color: "#fff",

    fontSize: 11,
    fontWeight: "600",

    textShadowColor:
      "rgba(0,0,0,0.65)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },

  moreAction: {
    marginTop: 1,
    marginBottom: 0,
    minHeight: 38,
  },

  bottomOverlay: {
    position: "absolute",

    left: 0,
    right: 64,
    bottom: 26,

    zIndex: 45,
  },

  bottomContent: {
    paddingLeft: 14,
    paddingRight: 8,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,
  },

  profilePress: {
    marginRight: 9,
  },

  avatar: {
    width: 38,
    height: 38,

    borderRadius: 19,

    borderWidth: 1.2,
    borderColor:
      "rgba(255,255,255,0.85)",
  },

  avatarFallback: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#333",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.7)",

    alignItems: "center",
    justifyContent: "center",
  },

  avatarFallbackText: {
    color: "#fff",

    fontSize: 15,
    fontWeight: "700",
  },

  usernamePress: {
    maxWidth: 160,

    flexDirection: "row",
    alignItems: "center",
  },

  username: {
    color: "#fff",

    fontSize: 14,
    fontWeight: "700",

    textShadowColor:
      "rgba(0,0,0,0.7)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },

  verifiedIcon: {
    marginLeft: 4,
  },

  followButton: {
    marginLeft: 11,

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.85)",

    borderRadius: 5,

    backgroundColor:
      "rgba(0,0,0,0.12)",
  },

  followText: {
    color: "#fff",

    fontSize: 12,
    fontWeight: "700",
  },

  caption: {
    color: "#fff",

    fontSize: 14,
    lineHeight: 19,

    marginBottom: 7,

    maxWidth: "94%",

    textShadowColor:
      "rgba(0,0,0,0.75)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },

  musicRow: {
    flexDirection: "row",
    alignItems: "center",

    maxWidth: "92%",

    marginTop: 1,
  },

  musicText: {
    color: "#fff",

    fontSize: 12.5,
    fontWeight: "500",

    marginLeft: 6,

    flexShrink: 1,

    textShadowColor:
      "rgba(0,0,0,0.75)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },

  audioDisc: {
    position: "absolute",

    right: 15,
    bottom: 27,

    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor:
      "rgba(20,20,20,0.9)",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.8)",

    alignItems: "center",
    justifyContent: "center",

    zIndex: 60,
  },

  audioDiscInner: {
    width: 24,
    height: 24,

    borderRadius: 12,

    backgroundColor: "#111",

    alignItems: "center",
    justifyContent: "center",
  },
});