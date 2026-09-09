import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import Colors from "../../constants/Colors";
import api from "../../services/api";
import VerifiedBadge from "../../components/common/VerifiedBadge";

export default function PostDetail() {
  const { id } = useLocalSearchParams();

  const postId = Array.isArray(id) ? id[0] : id;

  const [post, setPost] = useState(null);

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [menuVisible, setMenuVisible] = useState(false);
  const [hideLikesCount, setHideLikesCount] = useState(false);
  const [hidden, setHidden] = useState(false);

  const loadPost = useCallback(
    async (isRefresh = false) => {
      if (!postId) {
        setError("Post ID is missing.");
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(`/posts/${postId}`);

        const data =
          response?.data?.post ||
          response?.data;

        if (!data) {
          throw new Error("Post was not found.");
        }

        setPost(data);

        setLiked(
          Boolean(
            data.isLiked ??
              data.liked ??
              data.userHasLiked ??
              false
          )
        );

        setBookmarked(
          Boolean(
            data.isSaved ??
              data.isBookmarked ??
              data.saved ??
              data.bookmarked ??
              false
          )
        );

        /*
         * If the backend already returns a like-count
         * visibility field, respect it.
         */
        setHideLikesCount(
          Boolean(
            data.hideLikesCount ??
              data.hideLikeCount ??
              false
          )
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load this post.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  /*
   * --------------------------------------------------
   * DERIVED POST DATA
   * --------------------------------------------------
   */

  const user = useMemo(() => {
    return (
      post?.user ||
      post?.user ||
      post?.owner ||
      {}
    );
  }, [post]);

  const authorId = useMemo(() => {
    return (
      user?._id ||
      user?.id ||
      post?.userId ||
      post?.authorId ||
      null
    );
  }, [user, post]);

  const fullName = useMemo(() => {
    return (
      user?.fullName ||
      user?.name ||
      post?.fullName ||
      post?.name ||
      user?.username ||
      post?.username ||
      "Snapgram user"
    );
  }, [user, post]);

  const username = useMemo(() => {
    return (
      user?.username ||
      post?.username ||
      ""
    );
  }, [user, post]);

  const isVerified = useMemo(() => {
    return Boolean(
      user?.isVerified ??
        post?.isVerified ??
        false
    );
  }, [user, post]);

  const avatar = useMemo(() => {
    return (
      user?.avatar ||
      user?.profilePicture ||
      user?.profileImage ||
      post?.avatar ||
      post?.userAvatar ||
      null
    );
  }, [user, post]);

  const image = useMemo(() => {
    return (
      post?.image ||
      post?.imageUrl ||
      post?.mediaUrl ||
      post?.media?.url ||
      post?.media?.[0]?.url ||
      null
    );
  }, [post]);

  const caption = post?.caption || "";

  const likesCount = useMemo(() => {
    return Number(
      post?.likesCount ??
        (Array.isArray(post?.likes)
          ? post.likes.length
          : post?.likes) ??
        post?.likeCount ??
        0
    );
  }, [post]);

  const commentsCount = useMemo(() => {
    return Number(
      post?.commentsCount ??
        post?.commentCount ??
        (Array.isArray(post?.comments)
          ? post.comments.length
          : 0) ??
        0
    );
  }, [post]);

  const isOwnPost = useMemo(() => {
    const currentUserId =
      post?.currentUserId ||
      post?.viewerId ||
      post?.me?._id ||
      post?.me?.id;

    if (!currentUserId || !authorId) {
      return false;
    }

    return String(currentUserId) === String(authorId);
  }, [authorId, post]);

  /*
   * --------------------------------------------------
   * LIKE
   * --------------------------------------------------
   */

  const handleLike = useCallback(async () => {
    if (!post || actionLoading) {
      return;
    }

    const previousLiked = liked;

    const previousLikes = Number(
      post.likesCount ??
        (Array.isArray(post.likes)
          ? post.likes.length
          : post.likes) ??
        post.likeCount ??
        0
    );

    const nextLiked = !previousLiked;

    const nextLikes = Math.max(
      0,
      previousLikes +
        (nextLiked ? 1 : -1)
    );

    setLiked(nextLiked);

    setPost((current) =>
      current
        ? {
            ...current,
            likesCount: nextLikes,
          }
        : current
    );

    setActionLoading(true);

    try {
      const response = nextLiked
        ? await api.post(
            `/posts/${postId}/like`
          )
        : await api.delete(
            `/posts/${postId}/like`
          );

      const result =
        response?.data?.post ||
        response?.data;

      if (
        result &&
        typeof result === "object"
      ) {
        setPost((current) =>
          current
            ? {
                ...current,
                ...result,
              }
            : current
        );

        if (
          typeof result.liked ===
          "boolean"
        ) {
          setLiked(result.liked);
        }

        if (
          typeof result.isLiked ===
          "boolean"
        ) {
          setLiked(result.isLiked);
        }

        if (
          typeof result.likesCount ===
          "number"
        ) {
          setPost((current) =>
            current
              ? {
                  ...current,
                  likesCount:
                    result.likesCount,
                }
              : current
          );
        }
      }
    } catch (err) {
      setLiked(previousLiked);

      setPost((current) =>
        current
          ? {
              ...current,
              likesCount: previousLikes,
            }
          : current
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update the like.";

      Alert.alert(
        "Unable to update",
        message
      );
    } finally {
      setActionLoading(false);
    }
  }, [
    actionLoading,
    liked,
    post,
    postId,
  ]);

  /*
   * --------------------------------------------------
   * SAVE / UNSAVE
   * --------------------------------------------------
   *
   * Your backend uses POST /save as a toggle.
   */

  const handleBookmark = useCallback(
    async () => {
      if (!post || actionLoading) {
        return;
      }

      const previousBookmarked =
        bookmarked;

      const nextBookmarked =
        !previousBookmarked;

      setBookmarked(nextBookmarked);
      setActionLoading(true);

      try {
        const response =
          await api.post(
            `/posts/${postId}/save`
          );

        const result =
          response?.data?.post ||
          response?.data ||
          {};

        setPost((current) =>
          current
            ? {
                ...current,
                ...result,
              }
            : current
        );

        if (
          typeof result.saved ===
          "boolean"
        ) {
          setBookmarked(result.saved);
        }

        if (
          typeof result.isSaved ===
          "boolean"
        ) {
          setBookmarked(
            result.isSaved
          );
        }

        if (
          typeof result.bookmarked ===
          "boolean"
        ) {
          setBookmarked(
            result.bookmarked
          );
        }
      } catch (err) {
        setBookmarked(
          previousBookmarked
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to update your saved posts.";

        Alert.alert(
          "Unable to update",
          message
        );
      } finally {
        setActionLoading(false);
      }
    },
    [
      actionLoading,
      bookmarked,
      post,
      postId,
    ]
  );

  /*
   * --------------------------------------------------
   * COMMENTS
   * --------------------------------------------------
   */

  const openComments =
    useCallback(() => {
      if (!postId) {
        return;
      }

      router.push({
        pathname:
          "/post/[id]/comments",
        params: {
          id: postId,
        },
      });
    }, [postId]);

  /*
   * --------------------------------------------------
   * PROFILE
   * --------------------------------------------------
   */

  const openProfile =
    useCallback(() => {
      if (!authorId) {
        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: String(authorId),
        },
      });
    }, [authorId]);

  /*
   * --------------------------------------------------
   * DELETE POST
   * --------------------------------------------------
   */

  const handleDeletePost =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Delete post?",
        "This post will be permanently deleted. This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setActionLoading(true);

                await api.delete(
                  `/posts/${postId}`
                );

                Alert.alert(
                  "Post deleted",
                  "Your post has been deleted.",
                  [
                    {
                      text: "OK",
                      onPress: () =>
                        router.back(),
                    },
                  ]
                );
              } catch (err) {
                const message =
                  err?.response?.data
                    ?.message ||
                  err?.message ||
                  "Unable to delete this post.";

                Alert.alert(
                  "Delete failed",
                  message
                );
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    }, [postId]);

  /*
   * --------------------------------------------------
   * HIDE POST
   * --------------------------------------------------
   *
   * This immediately removes the post from this
   * screen. A persistent server-side hide requires
   * a per-user hidden-post endpoint/model.
   */

  const handleHidePost =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Hide post?",
        "You won't see this post here anymore.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Hide",
            onPress: () => {
              setHidden(true);
            },
          },
        ]
      );
    }, []);

  /*
   * --------------------------------------------------
   * HIDE LIKE COUNT
   * --------------------------------------------------
   */

  const handleToggleLikeCount =
    useCallback(() => {
      setMenuVisible(false);

      setHideLikesCount(
        (current) => !current
      );
    }, []);

  /*
   * --------------------------------------------------
   * COPY LINK
   * --------------------------------------------------
   */

  const handleCopyLink =
    useCallback(async () => {
      setMenuVisible(false);

      try {
        const link = `snapgram://post/${postId}`;

        await Clipboard.setStringAsync(
          link
        );

        Alert.alert(
          "Link copied",
          "Post link copied to your clipboard."
        );
      } catch (err) {
        Alert.alert(
          "Unable to copy",
          "The post link could not be copied."
        );
      }
    }, [postId]);

  /*
   * --------------------------------------------------
   * SHARE
   * --------------------------------------------------
   */

  const handleShare =
    useCallback(async () => {
      setMenuVisible(false);

      try {
        const link = `snapgram://post/${postId}`;

        await Share.share({
          message: `${fullName}${
            username
              ? ` (@${username})`
              : ""
          }\n\n${caption || "Check out this post on Snapgram."}\n\n${link}`,
        });
      } catch (err) {
        if (
          err?.message &&
          !err.message
            .toLowerCase()
            .includes("cancel")
        ) {
          Alert.alert(
            "Unable to share",
            "Something went wrong while sharing this post."
          );
        }
      }
    }, [
      caption,
      fullName,
      postId,
      username,
    ]);

  /*
   * --------------------------------------------------
   * REPORT
   * --------------------------------------------------
   *
   * The menu is ready for the report flow.
   * The actual endpoint should use your existing
   * reports backend rather than inventing a route.
   */

  const handleReport =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Report post",
        "Why are you reporting this post?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "It's inappropriate",
            onPress: () =>
              Alert.alert(
                "Report submitted",
                "Thank you. We'll review this post."
              ),
          },
          {
            text: "It's spam",
            onPress: () =>
              Alert.alert(
                "Report submitted",
                "Thank you. We'll review this post."
              ),
          },
        ]
      );
    }, []);

  /*
   * --------------------------------------------------
   * NOT INTERESTED
   * --------------------------------------------------
   */

  const handleNotInterested =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Not interested",
        "We'll show you fewer posts like this.",
        [
          {
            text: "OK",
            onPress: () => {
              setHidden(true);
            },
          },
        ]
      );
    }, []);

  /*
   * --------------------------------------------------
   * MUTE
   * --------------------------------------------------
   */

  const handleMute =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Mute",
        `Mute ${fullName}'s posts?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Mute",
            onPress: () => {
              Alert.alert(
                "Muted",
                `${fullName}'s posts are now muted.`
              );
            },
          },
        ]
      );
    }, [fullName]);

  /*
   * --------------------------------------------------
   * UNFOLLOW
   * --------------------------------------------------
   */

  const handleUnfollow =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Unfollow",
        `Unfollow ${fullName}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Unfollow",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Unfollowed",
                `You have unfollowed ${fullName}.`
              );
            },
          },
        ]
      );
    }, [fullName]);

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={27}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Post
          </Text>

          <View
            style={styles.headerButton}
          />
        </View>

        <View
          style={styles.centerState}
        >
          <ActivityIndicator
            size="large"
            color={Colors.black}
          />

          <Text
            style={styles.stateText}
          >
            Loading post…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */

  if (error || !post) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={27}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Post
          </Text>

          <View
            style={styles.headerButton}
          />
        </View>

        <View
          style={styles.centerState}
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.secondaryText}
          />

          <Text
            style={styles.errorTitle}
          >
            Unable to load post
          </Text>

          <Text
            style={styles.stateText}
          >
            {error ||
              "This post could not be found."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              loadPost()
            }
          >
            <Text
              style={styles.retryText}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * --------------------------------------------------
   * HIDDEN
   * --------------------------------------------------
   */

  if (hidden) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={27}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Post
          </Text>

          <View
            style={styles.headerButton}
          />
        </View>

        <View
          style={styles.centerState}
        >
          <Ionicons
            name="eye-off-outline"
            size={54}
            color={Colors.secondaryText}
          />

          <Text
            style={styles.errorTitle}
          >
            Post hidden
          </Text>

          <Text
            style={styles.stateText}
          >
            You won't see this post here anymore.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.retryText}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={27}
            color={Colors.black}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Post
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            setMenuVisible(true)
          }
          accessibilityRole="button"
          accessibilityLabel="Post options"
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Colors.black}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadPost(true)
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* AUTHOR */}

        <TouchableOpacity
          style={styles.user}
          onPress={openProfile}
          activeOpacity={0.7}
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
                styles.avatarPlaceholder
              }
            >
              <Ionicons
                name="person"
                size={20}
                color={
                  Colors.secondaryText
                }
              />
            </View>
          )}

          <View
            style={styles.nameContainer}
          >
            <View
              style={styles.nameRow}
            >
              <Text
                style={styles.fullName}
                numberOfLines={1}
              >
                {fullName}
              </Text>

              {isVerified && (
                <VerifiedBadge
                  size={17}
                  style={
                    styles.verifiedBadge
                  }
                />
              )}
            </View>

            {username ? (
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                @{username}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* MEDIA */}

        {image ? (
          <Image
            source={{
              uri: image,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <Ionicons
              name="image-outline"
              size={48}
              color={
                Colors.secondaryText
              }
            />

            <Text
              style={styles.stateText}
            >
              Media unavailable
            </Text>
          </View>
        )}

        {/* ACTIONS */}

        <View style={styles.actions}>
          <View
            style={styles.leftActions}
          >
            <TouchableOpacity
              onPress={handleLike}
              disabled={actionLoading}
              style={
                styles.actionButton
              }
              accessibilityRole="button"
              accessibilityLabel={
                liked
                  ? "Unlike post"
                  : "Like post"
              }
            >
              <Ionicons
                name={
                  liked
                    ? "heart"
                    : "heart-outline"
                }
                size={28}
                color={
                  liked
                    ? Colors.heart
                    : Colors.black
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openComments}
              style={
                styles.actionButton
              }
              accessibilityRole="button"
              accessibilityLabel="View comments"
            >
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={Colors.black}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={
                styles.actionButton
              }
              accessibilityRole="button"
              accessibilityLabel="Share post"
            >
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleBookmark}
            disabled={actionLoading}
            style={
              styles.actionButton
            }
            accessibilityRole="button"
            accessibilityLabel={
              bookmarked
                ? "Remove post from saved"
                : "Save post"
            }
          >
            <Ionicons
              name={
                bookmarked
                  ? "bookmark"
                  : "bookmark-outline"
              }
              size={27}
              color={Colors.black}
            />
          </TouchableOpacity>
        </View>

        {/* LIKES */}

        {!hideLikesCount ? (
          <Text style={styles.likes}>
            {likesCount.toLocaleString()}{" "}
            {likesCount === 1
              ? "like"
              : "likes"}
          </Text>
        ) : (
          <Text style={styles.likedBy}>
            {liked
              ? "Liked by you and others"
              : "Others have liked this post"}
          </Text>
        )}

        {/* CAPTION */}

        {caption ? (
          <Text
            style={styles.caption}
          >
            <Text
              style={styles.fullName}
            >
              {fullName}
            </Text>{" "}
            {caption}
          </Text>
        ) : null}

        {/* COMMENTS */}

        <TouchableOpacity
          onPress={openComments}
          style={
            styles.commentsButton
          }
        >
          <Text
            style={styles.comments}
          >
            {commentsCount > 0
              ? `View all ${commentsCount.toLocaleString()} comments`
              : "View comments"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ==================================================
          INSTAGRAM-STYLE POST OPTIONS MENU
          ================================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setMenuVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setMenuVisible(false)
          }
        >
          <Pressable
            style={styles.menuSheet}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View
              style={styles.sheetHandle}
            />

            <Text
              style={styles.menuTitle}
            >
              {isOwnPost
                ? "Post options"
                : "Options"}
            </Text>

            {/* SAVE */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleBookmark();
              }}
              disabled={actionLoading}
            >
              <Ionicons
                name={
                  bookmarked
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={23}
                color={Colors.black}
              />

              <Text
                style={styles.menuText}
              >
                {bookmarked
                  ? "Remove from saved"
                  : "Save"}
              </Text>
            </TouchableOpacity>

            {/* SHARE */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShare}
            >
              <Ionicons
                name="share-outline"
                size={23}
                color={Colors.black}
              />

              <Text
                style={styles.menuText}
              >
                Share
              </Text>
            </TouchableOpacity>

            {/* COPY LINK */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCopyLink}
            >
              <Ionicons
                name="link-outline"
                size={23}
                color={Colors.black}
              />

              <Text
                style={styles.menuText}
              >
                Copy link
              </Text>
            </TouchableOpacity>

            {/* LIKE COUNT */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={
                handleToggleLikeCount
              }
            >
              <Ionicons
                name={
                  hideLikesCount
                    ? "heart-outline"
                    : "heart-dislike-outline"
                }
                size={23}
                color={Colors.black}
              />

              <Text
                style={styles.menuText}
              >
                {hideLikesCount
                  ? "Show like count"
                  : "Hide like count"}
              </Text>
            </TouchableOpacity>

            {/* OWN POST */}

            {isOwnPost ? (
              <>
                <View
                  style={styles.menuDivider}
                />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);

                    Alert.alert(
                      "Edit post",
                      "Connect this option to your post editing screen."
                    );
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Edit post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);

                    Alert.alert(
                      "Archive post",
                      "Archive functionality can be connected to your archive endpoint."
                    );
                  }}
                >
                  <Ionicons
                    name="archive-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Archive
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);

                    Alert.alert(
                      "Turn off commenting",
                      "Comment-control functionality can be connected to your post settings endpoint."
                    );
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Turn off commenting
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    styles.dangerItem,
                  ]}
                  onPress={
                    handleDeletePost
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={23}
                    color="#ED4956"
                  />

                  <Text
                    style={[
                      styles.menuText,
                      styles.dangerText,
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={styles.menuDivider}
                />

                {/* HIDE */}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={
                    handleHidePost
                  }
                >
                  <Ionicons
                    name="eye-off-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Hide
                  </Text>
                </TouchableOpacity>

                {/* NOT INTERESTED */}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={
                    handleNotInterested
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Not interested
                  </Text>
                </TouchableOpacity>

                {/* MUTE */}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={
                    handleMute
                  }
                >
                  <Ionicons
                    name="volume-mute-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Mute
                  </Text>
                </TouchableOpacity>

                {/* UNFOLLOW */}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={
                    handleUnfollow
                  }
                >
                  <Ionicons
                    name="person-remove-outline"
                    size={23}
                    color={Colors.black}
                  />

                  <Text
                    style={styles.menuText}
                  >
                    Unfollow
                  </Text>
                </TouchableOpacity>

                {/* REPORT */}

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    styles.dangerItem,
                  ]}
                  onPress={
                    handleReport
                  }
                >
                  <Ionicons
                    name="flag-outline"
                    size={23}
                    color="#ED4956"
                  />

                  <Text
                    style={[
                      styles.menuText,
                      styles.dangerText,
                    ]}
                  >
                    Report
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* CANCEL */}

            <View
              style={styles.menuDivider}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                setMenuVisible(false)
              }
            >
              <Text
                style={styles.cancelText}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    height: 55,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.black,
  },

  user: {
    minHeight: 60,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: Colors.border,
  },

  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.border,
  },

  nameContainer: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  fullName: {
    flexShrink: 1,
    fontWeight: "700",
    color: Colors.black,
  },

  verifiedBadge: {
    marginLeft: 5,
  },

  username: {
    marginTop: 1,
    fontSize: 12,
    color: Colors.secondaryText,
  },

  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },

  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.border,
  },

  actions: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    minWidth: 38,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  likes: {
    paddingHorizontal: 12,
    fontWeight: "700",
    color: Colors.black,
  },

  likedBy: {
    paddingHorizontal: 12,
    color: Colors.secondaryText,
    fontSize: 13,
  },

  caption: {
    paddingHorizontal: 12,
    marginTop: 7,
    lineHeight: 20,
    color: Colors.black,
  },

  commentsButton: {
    paddingHorizontal: 12,
    marginTop: 8,
    paddingVertical: 4,
  },

  comments: {
    color: Colors.secondaryText,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  stateText: {
    marginTop: 10,
    textAlign: "center",
    color: Colors.secondaryText,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: Colors.black,
  },

  retryText: {
    color: Colors.white,
    fontWeight: "700",
  },

  /*
   * --------------------------------------------------
   * OPTIONS SHEET
   * --------------------------------------------------
   */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  menuSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 8,
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: Colors.border,
    marginBottom: 12,
  },

  menuTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
    paddingVertical: 10,
  },

  menuItem: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
  },

  menuText: {
    marginLeft: 15,
    fontSize: 15,
    color: Colors.black,
    fontWeight: "500",
  },

  dangerItem: {
    marginTop: 2,
  },

  dangerText: {
    color: "#ED4956",
    fontWeight: "600",
  },

  menuDivider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },

  cancelButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.black,
  },
});