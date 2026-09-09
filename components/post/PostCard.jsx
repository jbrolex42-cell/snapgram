import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Colors from "../../constants/Colors";
import VerifiedBadge from "../common/VerifiedBadge";

import {
  togglePostLike,
  toggleSavePost,
} from "../../services/postService";

import { sharePost } from "../../services/shareService";

export default function PostCard({
  post,
  currentUserId,
  onComment,
  onShare,
  onMore,
}) {
  const postId =
    post?._id ||
    post?.id ||
    null;

  const postUser = useMemo(
    () => post?.user || {},
    [post]
  );

  const username =
    postUser?.username ||
    post?.username ||
    "user";

  const fullName =
    postUser?.name ||
    postUser?.fullName ||
    post?.fullName ||
    username;

  const avatar =
    postUser?.avatar ||
    postUser?.profilePicture ||
    postUser?.profileImage ||
    post?.avatar ||
    null;

  const isVerified =
    Boolean(
      postUser?.isVerified ??
        postUser?.verified ??
        post?.isVerified
    );

  const userId =
    postUser?._id ||
    postUser?.id ||
    post?.userId ||
    post?.authorId ||
    null;

  const mediaItem =
    post?.media?.[0] ||
    null;

  const image =
    mediaItem?.url ||
    mediaItem?.secure_url ||
    mediaItem?.uri ||
    post?.image ||
    post?.imageUrl ||
    post?.mediaUrl ||
    null;

  const mediaType =
    mediaItem?.type ||
    post?.mediaType ||
    "image";

  const isVideo =
    mediaType === "video" ||
    mediaItem?.mimeType?.startsWith?.(
      "video/"
    );

  const initialLiked = Boolean(
    post?.isLiked ??
      post?.liked ??
      post?.likes?.some(
        (like) =>
          String(
            like?._id ??
              like?.id ??
              like
          ) ===
          String(currentUserId)
      )
  );

  const initialLikesCount =
    Number(
      post?.likesCount ??
        post?.likeCount ??
        post?.likes?.length ??
        0
    );

  const initialSaved = Boolean(
    post?.isSaved ??
      post?.saved ??
      post?.isBookmarked ??
      post?.bookmarked
  );

  const commentsCount =
    Number(
      post?.commentsCount ??
        post?.commentCount ??
        post?.comments?.length ??
        0
    );

  const [liked, setLiked] =
    useState(initialLiked);

  const [likesCount, setLikesCount] =
    useState(
      initialLikesCount
    );

  const [saved, setSaved] =
    useState(initialSaved);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [shareLoading, setShareLoading] =
    useState(false);

  const [imageLoading, setImageLoading] =
    useState(Boolean(image));

  const [imageError, setImageError] =
    useState(false);

  const doubleTapTimeout =
    useRef(null);

  const handleLike = useCallback(
    async () => {
      if (!postId || likeLoading) {
        return;
      }

      const previousLiked =
        liked;

      const previousCount =
        likesCount;

      const nextLiked =
        !previousLiked;

      /*
       * Optimistic UI.
       */
      setLiked(nextLiked);

      setLikesCount(
        Math.max(
          0,
          previousCount +
            (nextLiked ? 1 : -1)
        )
      );

      setLikeLoading(true);

      try {
        const result =
          await togglePostLike(
            postId
          );

        if (
          result &&
          typeof result ===
            "object"
        ) {
          if (
            typeof result.liked ===
            "boolean"
          ) {
            setLiked(
              result.liked
            );
          }

          if (
            typeof result.likesCount ===
            "number"
          ) {
            setLikesCount(
              result.likesCount
            );
          } else if (
            typeof result.likeCount ===
            "number"
          ) {
            setLikesCount(
              result.likeCount
            );
          }
        }
      } catch (error) {
        console.error(
          "POST LIKE ERROR:",
          error
        );

        setLiked(
          previousLiked
        );

        setLikesCount(
          previousCount
        );
      } finally {
        setLikeLoading(false);
      }
    },
    [
      postId,
      likeLoading,
      liked,
      likesCount,
    ]
  );

  const handleMediaPress = useCallback(
    () => {
      if (!postId) {
        return;
      }

      if (
        doubleTapTimeout.current
      ) {
        clearTimeout(
          doubleTapTimeout.current
        );

        doubleTapTimeout.current =
          null;

        if (!liked) {
          handleLike();
        }

        return;
      }

      doubleTapTimeout.current =
        setTimeout(() => {
          doubleTapTimeout.current =
            null;

          router.push({
            pathname:
              "/post/[id]",
            params: {
              id: String(
                postId
              ),
            },
          });
        }, 220);
    },
    [
      postId,
      liked,
      handleLike,
    ]
  );

  const handleSave = useCallback(
    async () => {
      if (
        !postId ||
        saveLoading
      ) {
        return;
      }

      const previousSaved =
        saved;

      const nextSaved =
        !previousSaved;

      setSaved(nextSaved);
      setSaveLoading(true);

      try {
        const result =
          await toggleSavePost(
            postId
          );

        if (
          result &&
          typeof result ===
            "object"
        ) {
          if (
            typeof result.saved ===
            "boolean"
          ) {
            setSaved(
              result.saved
            );
          } else if (
            typeof result.isSaved ===
            "boolean"
          ) {
            setSaved(
              result.isSaved
            );
          }
        }
      } catch (error) {
        console.error(
          "POST SAVE ERROR:",
          error
        );

        setSaved(
          previousSaved
        );
      } finally {
        setSaveLoading(false);
      }
    },
    [
      postId,
      saveLoading,
      saved,
    ]
  );

  const handleShare =
    useCallback(
      async () => {
        if (
          !postId ||
          shareLoading
        ) {
          return;
        }

        setShareLoading(true);

        try {
          if (
            typeof onShare ===
            "function"
          ) {
            await onShare(
              post
            );
          } else {
            await sharePost(
              post
            );
          }
        } catch (error) {
          console.error(
            "POST SHARE ERROR:",
            error
          );
        } finally {
          setShareLoading(false);
        }
      },
      [
        postId,
        shareLoading,
        onShare,
        post,
      ]
    );

  const handleComment =
    useCallback(() => {
      if (!postId) {
        return;
      }

      if (
        typeof onComment ===
        "function"
      ) {
        onComment(post);
        return;
      }

      router.push({
        pathname:
          "/post/[id]/comments",
        params: {
          id: String(
            postId
          ),
        },
      });
    }, [
      postId,
      onComment,
      post,
    ]);

  const openProfile =
    useCallback(() => {
      if (
        !userId &&
        !username
      ) {
        return;
      }

      router.push({
        pathname:
          "/profile/[id]",
        params: {
          id: String(
            userId ||
              username
          ),
        },
      });
    }, [
      userId,
      username,
    ]);

  const handleMore =
    useCallback(() => {
      if (
        typeof onMore ===
        "function"
      ) {
        onMore(post);
        return;
      }

      console.log(
        "POST OPTIONS:",
        postId
      );
    }, [
      onMore,
      post,
      postId,
    ]);

  const formattedLikes =
    likesCount.toLocaleString();

  return (
    <View
      style={styles.card}
    >

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.userButton}
          activeOpacity={0.75}
          onPress={
            openProfile
          }
          accessibilityRole="button"
          accessibilityLabel={`Open ${username}'s profile`}
        >
          <View
            style={styles.avatar}
          >
            {avatar ? (
              <Image
                source={{
                  uri: avatar,
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
                {(
                  fullName ||
                  username ||
                  "S"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            )}
          </View>

          <View
            style={styles.identity}
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
                numberOfLines={1}
              >
                {fullName}
              </Text>

              {isVerified ? (
                <VerifiedBadge
                  size={14}
                />
              ) : null}
            </View>

            <Text
              style={
                styles.username
              }
              numberOfLines={1}
            >
              @{username}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.moreButton
          }
          activeOpacity={0.7}
          onPress={
            handleMore
          }
          accessibilityRole="button"
          accessibilityLabel="More post options"
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={
              Colors.black
            }
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPress={
          handleMediaPress
        }
        style={
          styles.mediaContainer
        }
      >
        {image &&
        !imageError ? (
          <>
            <Image
              source={{
                uri: image,
              }}
              style={
                styles.media
              }
              resizeMode="cover"
              onLoadStart={() =>
                setImageLoading(
                  true
                )
              }
              onLoad={() =>
                setImageLoading(
                  false
                )
              }
              onError={() => {
                setImageLoading(
                  false
                );
                setImageError(
                  true
                );
              }}
            />

            {imageLoading ? (
              <View
                style={
                  styles.mediaLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              </View>
            ) : null}

            {isVideo ? (
              <View
                style={
                  styles.videoIndicator
                }
              >
                <Ionicons
                  name="play"
                  size={16}
                  color="#ffffff"
                />
              </View>
            ) : null}
          </>
        ) : (
          <View
            style={
              styles.emptyMedia
            }
          >
            <Ionicons
              name="image-outline"
              size={42}
              color={
                Colors.secondaryText ||
                "#999999"
              }
            />

            <Text
              style={
                styles.emptyMediaText
              }
            >
              Media unavailable
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View
        style={styles.actions}
      >
        <View
          style={
            styles.leftActions
          }
        >
          {/* LIKE */}

          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleLike
            }
            disabled={
              likeLoading
            }
            activeOpacity={0.65}
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
              size={27}
              color={
                liked
                  ? "#ED4956"
                  : Colors.black
              }
            />
          </TouchableOpacity>

          {/* COMMENT */}

          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleComment
            }
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel="Comment on post"
          >
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color={
                Colors.black
              }
            />
          </TouchableOpacity>

          {/* SHARE */}

          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleShare
            }
            disabled={
              shareLoading
            }
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            {shareLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  Colors.black
                }
              />
            ) : (
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={
                  Colors.black
                }
              />
            )}
          </TouchableOpacity>
        </View>

        {/* SAVE */}

        <TouchableOpacity
          style={
            styles.actionButton
          }
          onPress={
            handleSave
          }
          disabled={
            saveLoading
          }
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel={
            saved
              ? "Remove saved post"
              : "Save post"
          }
        >
          {saveLoading ? (
            <ActivityIndicator
              size="small"
              color={
                Colors.black
              }
            />
          ) : (
            <Ionicons
              name={
                saved
                  ? "bookmark"
                  : "bookmark-outline"
              }
              size={27}
              color={
                Colors.black
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {likesCount > 0 ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (!postId) {
              return;
            }

            router.push({
              pathname:
                "/post/[id]/likes",
              params: {
                id: String(
                  postId
                ),
              },
            });
          }}
        >
          <Text
            style={styles.likes}
          >
            {formattedLikes}{" "}
            {likesCount === 1
              ? "like"
              : "likes"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {post?.caption ? (
        <View
          style={
            styles.captionContainer
          }
        >
          <Text
            style={
              styles.captionText
            }
          >
            <Text
              style={
                styles.captionUsername
              }
            >
              {username}
            </Text>

            {" "}

            {post.caption}
          </Text>
        </View>
      ) : null}

      {commentsCount > 0 ? (
        <TouchableOpacity
          style={
            styles.commentsButton
          }
          onPress={
            handleComment
          }
          activeOpacity={0.7}
        >
          <Text
            style={
              styles.commentsText
            }
          >
            View all{" "}
            {commentsCount.toLocaleString()}{" "}
            {commentsCount === 1
              ? "comment"
              : "comments"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {post?.createdAt ? (
        <Text
          style={
            styles.dateText
          }
        >
          {formatPostDate(
            post.createdAt
          )}
        </Text>
      ) : null}
    </View>
  );
}

function formatPostDate(
  date
) {
  const timestamp =
    new Date(
      date
    ).getTime();

  if (
    Number.isNaN(
      timestamp
    )
  ) {
    return "";
  }

  const difference =
    Date.now() -
    timestamp;

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "JUST NOW";
  }

  if (minutes < 60) {
    return `${minutes} MINUTES AGO`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} HOURS AGO`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} DAYS AGO`;
  }

  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        new Date(
          date
        ).getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

const styles =
  StyleSheet.create({
    card: {
      backgroundColor:
        Colors.white ||
        Colors.background ||
        "#ffffff",

      marginBottom: 10,
    },

    header: {
      minHeight: 60,

      paddingHorizontal: 12,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    userButton: {
      flex: 1,

      minWidth: 0,

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    avatar: {
      width: 38,
      height: 38,

      borderRadius: 19,

      overflow:
        "hidden",

      backgroundColor:
        Colors.surface ||
        "#F2F2F2",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      fontSize: 15,

      fontWeight:
        "800",

      color:
        Colors.black ||
        "#111111",
    },

    identity: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,
    },

    nameRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flexShrink: 1,
    },

    fullName: {
      flexShrink: 1,

      fontSize: 14,

      lineHeight: 18,

      fontWeight:
        "700",

      color:
        Colors.black ||
        "#111111",
    },

    username: {
      marginTop: 0,

      fontSize: 12,

      lineHeight: 16,

      color:
        Colors.secondaryText ||
        "#737373",
    },

    moreButton: {
      width: 40,
      height: 40,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginLeft: 4,
    },

    mediaContainer: {
      width: "100%",

      aspectRatio: 1,

      backgroundColor:
        Colors.surface ||
        "#F2F2F2",

      overflow:
        "hidden",
    },

    media: {
      width: "100%",
      height: "100%",
    },

    mediaLoading: {
      position:
        "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.12)",
    },

    videoIndicator: {
      position:
        "absolute",

      top: 12,
      right: 12,

      width: 30,
      height: 30,

      borderRadius: 15,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    emptyMedia: {
      width: "100%",
      height: "100%",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyMediaText: {
      marginTop: 8,

      fontSize: 13,

      color:
        Colors.secondaryText ||
        "#888888",
    },

    actions: {
      height: 50,

      paddingHorizontal: 9,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    leftActions: {
      flexDirection:
        "row",

      alignItems:
        "center",
    },

    actionButton: {
      width: 42,
      height: 42,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 1,
    },

    likes: {
      paddingHorizontal: 12,

      marginTop: 1,

      fontSize: 14,

      lineHeight: 19,

      fontWeight:
        "700",

      color:
        Colors.black ||
        "#111111",
    },

    captionContainer: {
      paddingHorizontal: 12,

      marginTop: 5,

      paddingBottom: 1,
    },

    captionText: {
      fontSize: 14,

      lineHeight: 19,

      color:
        Colors.black ||
        "#111111",
    },

    captionUsername: {
      fontWeight:
        "700",

      color:
        Colors.black ||
        "#111111",
    },

    commentsButton: {
      paddingHorizontal: 12,

      marginTop: 5,
    },

    commentsText: {
      fontSize: 14,

      lineHeight: 19,

      color:
        Colors.secondaryText ||
        "#737373",
    },

    dateText: {
      paddingHorizontal: 12,

      marginTop: 7,

      marginBottom: 8,

      fontSize: 10,

      lineHeight: 14,

      letterSpacing:
        0.25,

      color:
        Colors.secondaryText ||
        "#8E8E8E",
    },
  });