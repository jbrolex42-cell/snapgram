import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { router } from "expo-router";

import Colors from "../../constants/Colors";
import VerifiedBadge from "../common/VerifiedBadge";

import {
  sharePost,
  togglePostLike,
  toggleSavePost,
} from "../../services/postService";

import { getSettings } from "../../services/settingsService";
import TranslatableCaption from "./TranslatableCaption";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MEDIA_WIDTH = SCREEN_WIDTH;
const MEDIA_HEIGHT = SCREEN_WIDTH;

function PostCard({
  post,
  onPress,
  onLike,
  onSave,
  onComment,
  onShare,
  onRefresh,
}) {
  const [liked, setLiked] = useState(
    Boolean(post?.isLiked ?? post?.liked)
  );

  const [saved, setSaved] = useState(
    Boolean(post?.isSaved ?? post?.saved)
  );

  const [likesCount, setLikesCount] = useState(
    Number(post?.likesCount ?? post?.likes?.length ?? 0)
  );

  const [commentsCount, setCommentsCount] = useState(
    Number(post?.commentsCount ?? post?.comments?.length ?? 0)
  );

  const [captionLanguage, setCaptionLanguage] = useState("en");

  const lastTapRef = useRef(0);

  const postId = useMemo(() => {
    return String(post?.id || post?._id || "");
  }, [post]);

  const user = post?.user || {};

  const username =
    user?.username ||
    post?.username ||
    "snapgram";

  const fullName =
    user?.fullName ||
    user?.name ||
    user?.displayName ||
    "";

  const avatar =
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.profileImage ||
    null;

  const verified = Boolean(
    user?.isVerified ??
      user?.verified ??
      post?.isVerified ??
      post?.verified
  );

  const caption = post?.caption || "";

  const mediaItem = useMemo(() => {
    if (!Array.isArray(post?.media) || post.media.length === 0) {
      return null;
    }

    return post.media[0];
  }, [post]);

  const mediaUrl =
    mediaItem?.url ||
    mediaItem?.secure_url ||
    mediaItem?.uri ||
    post?.image ||
    post?.imageUrl ||
    post?.mediaUrl ||
    null;

  const mediaType = String(
    mediaItem?.type ||
      mediaItem?.mediaType ||
      post?.mediaType ||
      ""
  ).toLowerCase();

  const isVideo =
    mediaType === "video" ||
    mediaItem?.mimeType?.startsWith?.("video/") ||
    /\.(mp4|mov|m4v|avi|webm)(\?.*)?$/i.test(
      String(mediaUrl || "")
    );

  const postType = String(post?.postType || "post").toLowerCase();

  const isReel = postType === "reel";

  useEffect(() => {
    setLiked(Boolean(post?.isLiked ?? post?.liked));
    setSaved(Boolean(post?.isSaved ?? post?.saved));

    setLikesCount(
      Number(post?.likesCount ?? post?.likes?.length ?? 0)
    );

    setCommentsCount(
      Number(post?.commentsCount ?? post?.comments?.length ?? 0)
    );
  }, [
    post?.isLiked,
    post?.liked,
    post?.isSaved,
    post?.saved,
    post?.likesCount,
    post?.likes?.length,
    post?.commentsCount,
    post?.comments?.length,
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const settings = await getSettings?.();

        if (!mounted) return;

        const language =
          settings?.language ||
          settings?.appLanguage ||
          settings?.captionLanguage ||
          "en";

        setCaptionLanguage(language);
      } catch {
        if (mounted) {
          setCaptionLanguage("en");
        }
      }
    }

    loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLike = useCallback(async () => {
    if (!postId) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikesCount((count) =>
      Math.max(0, count + (nextLiked ? 1 : -1))
    );

    try {
      const response = await togglePostLike(postId);

      const data = response?.data ?? response ?? {};

      const serverLiked = Boolean(
        data?.isLiked ??
          data?.liked ??
          data?.post?.isLiked ??
          data?.post?.liked ??
          nextLiked
      );

      const serverCount = Number(
        data?.likesCount ??
          data?.post?.likesCount ??
          previousCount + (serverLiked ? 1 : -1)
      );

      setLiked(serverLiked);
      setLikesCount(Math.max(0, serverCount));

      onLike?.(postId, serverLiked, serverCount);
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousCount);

      console.error("[POST CARD] LIKE FAILED:", error?.response?.data || error);

      Alert.alert(
        "Couldn't like post",
        error?.response?.data?.message ||
          "Please try again."
      );
    }
  }, [liked, likesCount, onLike, postId]);

  const handleSave = useCallback(async () => {
    if (!postId) return;

    const previousSaved = saved;

    setSaved(!previousSaved);

    try {
      const response = await toggleSavePost(postId);

      const data = response?.data ?? response ?? {};

      const serverSaved = Boolean(
        data?.isSaved ??
          data?.saved ??
          data?.post?.isSaved ??
          data?.post?.saved ??
          !previousSaved
      );

      setSaved(serverSaved);

      onSave?.(postId, serverSaved);
    } catch (error) {
      setSaved(previousSaved);

      console.error("[POST CARD] SAVE FAILED:", error?.response?.data || error);

      Alert.alert(
        "Couldn't save post",
        error?.response?.data?.message ||
          "Please try again."
      );
    }
  }, [onSave, postId, saved]);

  const handleShare = useCallback(async () => {
    if (!postId) return;

    try {
      await sharePost(postId);

      onShare?.(postId);
    } catch (error) {
      console.error(
        "[POST CARD] SHARE FAILED:",
        error?.response?.data || error
      );

      Alert.alert(
        "Couldn't share post",
        error?.response?.data?.message ||
          "Please try again."
      );
    }
  }, [onShare, postId]);

  const openProfile = useCallback(() => {
    const userId = user?.id || user?._id;

    if (!userId) return;

    router.push({
      pathname: "/profile/[id]",
      params: {
        id: String(userId),
      },
    });
  }, [user]);

  const openPost = useCallback(() => {
    if (!postId) return;

    if (onPress) {
      onPress(post);
      return;
    }

    router.push({
      pathname: "/post/[id]",
      params: {
        id: postId,
      },
    });
  }, [onPress, post, postId]);

  const handleMediaPress = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      handleLike();
      return;
    }

    lastTapRef.current = now;

    setTimeout(() => {
      if (lastTapRef.current === now) {
        lastTapRef.current = 0;
        openPost();
      }
    }, DOUBLE_TAP_DELAY + 20);
  }, [handleLike, openPost]);

  const handleComment = useCallback(() => {
    if (!postId) return;

    if (onComment) {
      onComment(postId);
      return;
    }

    router.push({
      pathname: "/post/[id]",
      params: {
        id: postId,
        focusComments: "true",
      },
    });
  }, [onComment, postId]);

  const handleMenu = useCallback(() => {
    Alert.alert(
      "Post options",
      "",
      [
        {
          text: saved ? "Remove from saved" : "Save",
          onPress: handleSave,
        },
        {
          text: "Go to post",
          onPress: openPost,
        },
        {
          text: "Share",
          onPress: handleShare,
        },
        {
          text: "Not interested",
          onPress: () => {
            Alert.alert(
              "Not interested",
              "We'll show you fewer posts like this."
            );
          },
        },
        {
          text: "Report",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Report post",
              "Thanks. We'll review this post."
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }, [handleSave, handleShare, openPost, saved]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.userButton}
          onPress={openProfile}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name="person"
                size={18}
                color="#777"
              />
            </View>
          )}

          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {username}
              </Text>

              {verified ? (
                <VerifiedBadge
                  size={14}
                  style={styles.verified}
                />
              ) : null}
            </View>

            {fullName && fullName !== username ? (
              <Text
                style={styles.fullName}
                numberOfLines={1}
              >
                {fullName}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleMenu}
          hitSlop={8}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color="#111"
          />
        </TouchableOpacity>
      </View>

      {/* MEDIA */}
      <Pressable
        style={styles.mediaContainer}
        onPress={handleMediaPress}
      >
        {mediaUrl ? (
          isVideo ? (
            <PostVideo
              uri={mediaUrl}
              isReel={isReel}
            />
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={styles.emptyMedia}>
            <Ionicons
              name="image-outline"
              size={42}
              color="#aaa"
            />

            <Text style={styles.emptyMediaText}>
              No media
            </Text>
          </View>
        )}

        {isVideo ? (
          <View pointerEvents="none" style={styles.videoBadge}>
            <Ionicons
              name="play"
              size={15}
              color="#fff"
            />
          </View>
        ) : null}

        {isReel ? (
          <View pointerEvents="none" style={styles.reelBadge}>
            <Ionicons
              name="videocam"
              size={14}
              color="#fff"
            />

            <Text style={styles.reelBadgeText}>
              REEL
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLike}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={27}
              color={liked ? "#ed4956" : "#111"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleComment}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Ionicons
              name="chatbubble-outline"
              size={25}
              color="#111"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Ionicons
              name="paper-plane-outline"
              size={25}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          hitSlop={8}
          style={styles.actionButton}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={26}
            color="#111"
          />
        </TouchableOpacity>
      </View>

      {/* LIKES */}
      {likesCount > 0 ? (
        <View style={styles.likesContainer}>
          <Text style={styles.likesText}>
            {likesCount.toLocaleString()}{" "}
            {likesCount === 1 ? "like" : "likes"}
          </Text>
        </View>
      ) : null}

      {/* CAPTION */}
      {caption ? (
        <View style={styles.captionContainer}>
          <TranslatableCaption
            text={caption}
            language={captionLanguage}
            username={username}
          />
        </View>
      ) : null}

      {/* COMMENTS */}
      {commentsCount > 0 ? (
        <TouchableOpacity
          onPress={handleComment}
          activeOpacity={0.7}
          style={styles.commentsButton}
        >
          <Text style={styles.commentsText}>
            View all {commentsCount.toLocaleString()}{" "}
            {commentsCount === 1 ? "comment" : "comments"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* DATE */}
      {post?.createdAt ? (
        <Text style={styles.dateText}>
          {formatPostDate(post.createdAt)}
        </Text>
      ) : null}
    </View>
  );
}

function PostVideo({ uri, isReel }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener(
      "playingChange",
      (event) => {
        setPlaying(Boolean(event?.isPlaying));
      }
    );

    return () => {
      subscription?.remove?.();
    };
  }, [player]);

  const togglePlayback = useCallback(() => {
    if (!player) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.media}
        contentFit={isReel ? "cover" : "cover"}
        nativeControls={false}
      />

      <Pressable
        style={styles.videoTouchLayer}
        onPress={togglePlayback}
      >
        {!playing ? (
          <View style={styles.largePlayButton}>
            <Ionicons
              name="play"
              size={34}
              color="#fff"
            />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.muteBadge}>
        <Ionicons
          name="volume-mute"
          size={15}
          color="#fff"
        />
      </View>
    </View>
  );
}

function formatPostDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const difference = Math.max(
    0,
    now - date.getTime()
  );

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 12,
  },

  header: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eee",
  },

  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },

  userInfo: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },

  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  username: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "85%",
  },

  verified: {
    marginLeft: 4,
  },

  fullName: {
    marginTop: 1,
    color: "#777",
    fontSize: 12,
  },

  moreButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  mediaContainer: {
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: "#f3f3f3",
    overflow: "hidden",
    position: "relative",
  },

  media: {
    width: "100%",
    height: "100%",
  },

  videoContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    position: "relative",
  },

  videoTouchLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  largePlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },

  videoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  reelBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
    alignItems: "center",
  },

  reelBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 4,
  },

  muteBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMediaText: {
    marginTop: 8,
    color: "#999",
    fontSize: 13,
  },

  actions: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    width: 40,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 2,
  },

  likesContainer: {
    paddingHorizontal: 12,
  },

  likesText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
  },

  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },

  commentsButton: {
    paddingHorizontal: 12,
    paddingTop: 7,
  },

  commentsText: {
    color: "#8e8e8e",
    fontSize: 14,
  },

  dateText: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    color: "#aaa",
    fontSize: 11,
    textTransform: "uppercase",
  },
});

export default memo(PostCard);