import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
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
  deleteComment,
  likeComment,
} from "../../services/commentService";

export default function CommentRow({
  comment,
  currentUserId,
  onReply,
  onDelete,
}) {
  const [liked, setLiked] = useState(
    Boolean(comment?.isLiked)
  );

  const [likes, setLikes] = useState(
    Array.isArray(comment?.likes)
      ? comment.likes.length
      : Number(comment?.likesCount || 0)
  );

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const commentUser = useMemo(() => {
    return (
      comment?.user ||
      comment?.author ||
      {}
    );
  }, [comment]);

  const username = String(
    commentUser?.username ||
      comment?.username ||
      ""
  ).trim();

  const fullName = String(
    commentUser?.fullName ||
      commentUser?.name ||
      commentUser?.displayName ||
      comment?.fullName ||
      comment?.name ||
      ""
  ).trim();

  const displayName =
    fullName || username || "User";

  const avatar =
    commentUser?.avatar ||
    commentUser?.profilePicture ||
    commentUser?.profile?.avatar ||
    null;

  const isVerified = Boolean(
    commentUser?.isVerified ??
      commentUser?.verified ??
      comment?.isVerified ??
      false
  );

  const commentUserId =
    commentUser?._id ||
    commentUser?.id ||
    comment?.userId ||
    null;

  const isOwner =
    Boolean(currentUserId) &&
    Boolean(commentUserId) &&
    String(commentUserId) ===
      String(currentUserId);

  const openProfile = useCallback(() => {
    if (!username) {
      return;
    }

    router.push({
      pathname: "/profile/[username]",
      params: {
        username,
      },
    });
  }, [username]);

  const handleLike = useCallback(
    async () => {
      if (
        likeLoading ||
        !comment?._id
      ) {
        return;
      }

      const previousLiked = liked;
      const previousLikes = likes;

      setLiked(!previousLiked);

      setLikes(
        previousLiked
          ? Math.max(
              0,
              previousLikes - 1
            )
          : previousLikes + 1
      );

      setLikeLoading(true);

      try {
        const result =
          await likeComment(
            comment._id
          );

        if (
          typeof result?.liked ===
          "boolean"
        ) {
          setLiked(result.liked);
        }

        if (
          result?.likesCount !==
          undefined
        ) {
          setLikes(
            Math.max(
              0,
              Number(
                result.likesCount
              )
            )
          );
        }
      } catch (error) {
        console.error(
          "COMMENT LIKE ERROR:",
          error
        );

        setLiked(previousLiked);
        setLikes(previousLikes);
      } finally {
        setLikeLoading(false);
      }
    },
    [
      comment?._id,
      liked,
      likes,
      likeLoading,
    ]
  );

  const handleDelete = useCallback(
    async () => {
      if (
        deleteLoading ||
        !comment?._id
      ) {
        return;
      }

      setDeleteLoading(true);

      try {
        await deleteComment(
          comment._id
        );

        onDelete?.(
          comment._id
        );
      } catch (error) {
        console.error(
          "DELETE COMMENT ERROR:",
          error
        );
      } finally {
        setDeleteLoading(false);
      }
    },
    [
      comment?._id,
      deleteLoading,
      onDelete,
    ]
  );

  const handleReply = useCallback(() => {
    onReply?.(comment);
  }, [comment, onReply]);

  

  return (
    <View style={styles.container}>
      {/* ------------------------------------------- */}
      {/* AVATAR                                      */}
      {/* ------------------------------------------- */}

      <TouchableOpacity
        onPress={openProfile}
        disabled={!username}
        activeOpacity={0.8}
        style={styles.avatarButton}
      >
        <View style={styles.avatar}>
          {avatar ? (
            <Image
              source={{
                uri: avatar,
              }}
              style={styles.avatarImage}
            />
          ) : (
            <Text
              style={
                styles.avatarInitial
              }
            >
              {displayName
                .charAt(0)
                .toUpperCase()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ------------------------------------------- */}
      {/* COMMENT CONTENT                             */}
      {/* ------------------------------------------- */}

      <View style={styles.content}>
        {/* Name + comment */}
        <View style={styles.commentLine}>
          <TouchableOpacity
            onPress={openProfile}
            disabled={!username}
            activeOpacity={0.7}
            style={styles.identity}
          >
            <Text
              style={styles.displayName}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            {isVerified && (
              <View
                style={
                  styles.verifiedBadge
                }
              >
                <VerifiedBadge
                  size={14}
                />
              </View>
            )}
          </TouchableOpacity>

          <Text
            style={styles.commentText}
          >
            {" "}
            {comment?.text || ""}
          </Text>
        </View>

        {/* --------------------------------------- */}
        {/* USERNAME                                */}
        {/* --------------------------------------- */}

        {username ? (
          <TouchableOpacity
            onPress={openProfile}
            activeOpacity={0.7}
            style={styles.usernameButton}
          >
            <Text
              style={styles.username}
              numberOfLines={1}
            >
              @{username}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* --------------------------------------- */}
        {/* ACTIONS                                 */}
        {/* --------------------------------------- */}

        <View style={styles.actions}>
          {likes > 0 && (
            <Text
              style={styles.actionText}
            >
              {likes}{" "}
              {likes === 1
                ? "like"
                : "likes"}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleReply}
            activeOpacity={0.7}
          >
            <Text
              style={styles.actionText}
            >
              Reply
            </Text>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleteLoading}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.actionText,
                  styles.deleteText,
                ]}
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ------------------------------------------- */}
      {/* LIKE BUTTON                                 */}
      {/* ------------------------------------------- */}

      <TouchableOpacity
        onPress={handleLike}
        disabled={likeLoading}
        activeOpacity={0.7}
        style={styles.likeButton}
      >
        <Ionicons
          name={
            liked
              ? "heart"
              : "heart-outline"
          }
          size={18}
          color={
            liked
              ? "#ED4956"
              : Colors.black ||
                "#111111"
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    paddingHorizontal: 14,
    paddingVertical: 9,

    alignItems: "flex-start",

    backgroundColor:
      Colors.background ||
      "#FFFFFF",
  },

  avatarButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",

    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      Colors.surface ||
      "#F1F1F1",

    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 15,
    fontWeight: "800",

    color:
      Colors.black ||
      "#111111",
  },

  content: {
    flex: 1,

    minWidth: 0,

    marginLeft: 10,

    paddingRight: 8,
  },

  commentLine: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "flex-start",
  },

  identity: {
    flexDirection: "row",

    alignItems: "center",

    marginRight: 3,

    maxWidth: "100%",
  },

  displayName: {
    fontSize: 14,

    lineHeight: 19,

    fontWeight: "700",

    color:
      Colors.black ||
      "#111111",

    flexShrink: 1,
  },

  verifiedBadge: {
    marginLeft: 3,

    alignItems: "center",
    justifyContent: "center",
  },

  commentText: {
    fontSize: 14,

    lineHeight: 20,

    color:
      Colors.black ||
      "#111111",

    flexShrink: 1,
  },

  usernameButton: {
    alignSelf: "flex-start",

    marginTop: 2,
  },

  username: {
    fontSize: 11,

    lineHeight: 15,

    color:
      Colors.secondaryText ||
      "#8E8E8E",

    maxWidth: "100%",
  },

  actions: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,
  },

  actionText: {
    marginRight: 16,

    fontSize: 12,

    lineHeight: 16,

    fontWeight: "600",

    color:
      Colors.secondaryText ||
      "#8E8E8E",
  },

  deleteText: {
    color: "#ED4956",
  },

  likeButton: {
    width: 32,
    height: 32,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 2,
  },
});