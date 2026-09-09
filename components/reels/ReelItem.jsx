import React, {
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
  TouchableOpacity,
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

  const [likes, setLikes] =
    useState(
      reel?.likesCount || 0
    );

  const [paused, setPaused] =
    useState(false);

  const tapTimeoutRef =
    useRef(null);

  const heartScale =
    useRef(
      new Animated.Value(0)
    ).current;

  const pauseFlashOpacity =
    useRef(
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
      player.play();

      if (reel?._id) {
        viewReel(reel._id).catch(
          (error) =>
            console.error(
              "Reel view error:",
              error
            )
        );
      }
    } else {
      player.pause();
    }
  }, [
    active,
    player,
    reel?._id,
  ]);

  useEffect(() => {
    setLikes(
      reel?.likesCount || 0
    );
  }, [reel?.likesCount]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(
          tapTimeoutRef.current
        );
      }
    };
  }, []);

  async function handleLike() {
    if (!reel?._id) {
      return;
    }

    const wasLiked = isLiked;
    const previousLikes = likes;

    setLikes(
      wasLiked
        ? Math.max(
            0,
            likes - 1
          )
        : likes + 1
    );

    onLike?.();

    try {
      const result =
        await likeReel(
          reel._id
        );

      setLikes(
        result?.likesCount ??
          previousLikes
      );

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
    }
  }

  async function handleSave() {
    if (!reel?._id) {
      return;
    }

    const wasSaved = isSaved;

    onSave?.();

    try {
      const result =
        await saveReel(
          reel._id
        );

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
    }
  }

  function triggerHeartBurst() {
    heartScale.setValue(0);

    Animated.sequence([
      Animated.spring(
        heartScale,
        {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }
      ),
      Animated.timing(
        heartScale,
        {
          toValue: 0,
          duration: 250,
          delay: 400,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }

  function flashPauseIcon() {
    pauseFlashOpacity.setValue(1);

    Animated.timing(
      pauseFlashOpacity,
      {
        toValue: 0,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }
    ).start();
  }

  function togglePlayback() {
    if (!player) {
      return;
    }

    setPaused((previous) => {
      const next = !previous;

      if (next) {
        player.pause();
      } else {
        player.play();
      }

      return next;
    });

    flashPauseIcon();
  }

  function handleVideoPress() {
    if (tapTimeoutRef.current) {
      clearTimeout(
        tapTimeoutRef.current
      );
      tapTimeoutRef.current = null;

      triggerHeartBurst();

      if (!isLiked) {
        handleLike();
      }

      onDoubleTap?.(reel);
    } else {
      tapTimeoutRef.current =
        setTimeout(() => {
          tapTimeoutRef.current = null;
          togglePlayback();
        }, DOUBLE_TAP_DELAY);
    }
  }

  const username =
    reel?.user?.username ||
    "Snapgram";

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
              size={30}
              color="rgba(255,255,255,0.5)"
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

      {/* DOUBLE-TAP HEART BURST */}
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
                        0, 1,
                      ],
                      outputRange: [
                        0.4, 1.15,
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
          size={110}
          color="#fff"
        />
      </Animated.View>

      {/* TAP-TO-PAUSE FLASH */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pauseFlash,
          {
            opacity: pauseFlashOpacity,
          },
        ]}
      >
        <View
          style={
            styles.pauseFlashCircle
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
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={styles.bottom}>
          <View style={styles.info}>
            <Pressable
              style={styles.userRow}
              onPress={() =>
                onProfile?.(
                  reel?.user
                )
              }
              hitSlop={6}
            >
              {reel?.user?.avatar ? (
                <Image
                  source={{
                    uri:
                      reel.user
                        .avatar,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={
                    styles.avatarPlaceholder
                  }
                >
                  <Text
                    style={
                      styles.avatarPlaceholderText
                    }
                  >
                    {username
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}

              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {username}
              </Text>

              {!isFollowing && (
                <TouchableOpacity
                  onPress={() =>
                    onFollow?.(
                      reel?.user
                    )
                  }
                  style={
                    styles.followButton
                  }
                  hitSlop={6}
                >
                  <Text
                    style={
                      styles.followText
                    }
                  >
                    Follow
                  </Text>
                </TouchableOpacity>
              )}
            </Pressable>

            {reel?.caption ? (
              <Text
                style={styles.caption}
                numberOfLines={2}
              >
                {reel.caption}
              </Text>
            ) : null}

            {reel?.music?.name ? (
              <View
                style={styles.musicRow}
              >
                <Ionicons
                  name="musical-notes"
                  size={13}
                  color="#fff"
                />

                <Text
                  style={styles.music}
                  numberOfLines={1}
                >
                  {reel.music.name}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleLike}
              style={styles.action}
              hitSlop={8}
            >
              <Ionicons
                name={
                  isLiked
                    ? "heart"
                    : "heart-outline"
                }
                size={30}
                color={
                  isLiked
                    ? "#ff3040"
                    : "#fff"
                }
              />

              <Text
                style={styles.actionText}
              >
                {formatCount(likes)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onComment?.(reel)
              }
              style={styles.action}
              hitSlop={8}
            >
              <Ionicons
                name="chatbubble-outline"
                size={27}
                color="#fff"
              />

              <Text
                style={styles.actionText}
              >
                {formatCount(
                  reel?.commentsCount ||
                    0
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                onShare?.(reel)
              }
              style={styles.action}
              hitSlop={8}
            >
              <Ionicons
                name="paper-plane-outline"
                size={25}
                color="#fff"
              />

              <Text
                style={styles.actionText}
              >
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.action}
              hitSlop={8}
            >
              <Ionicons
                name={
                  isSaved
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={26}
                color="#fff"
              />

              <Text
                style={styles.actionText}
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              hitSlop={8}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={23}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
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
  },

  video: {
    width: "100%",
    height: "100%",
  },

  videoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    gap: 8,
  },

  placeholderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },

  heartBurst: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseFlash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseFlashCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  bottom: {
    position: "absolute",
    left: 15,
    right: 10,
    bottom: 30,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  info: {
    flex: 1,
    paddingRight: 14,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  avatarPlaceholderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  followButton: {
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  followText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  caption: {
    color: "#fff",
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 6,
  },

  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  music: {
    color: "#fff",
    fontSize: 12.5,
    flexShrink: 1,
  },

  actions: {
    width: 56,
    alignItems: "center",
  },

  action: {
    alignItems: "center",
    marginBottom: 18,
  },

  actionText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});