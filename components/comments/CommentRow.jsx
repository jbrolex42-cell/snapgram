import React, {
  useState,
} from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../../constants/Colors";

import VerifiedBadge from "../../common/VerifiedBadge";

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
  const [liked, setLiked] =
    useState(
      Boolean(
        comment?.isLiked
      )
    );

  const [likes, setLikes] =
    useState(
      comment?.likes?.length ||
        0
    );

  async function toggleLike() {
    try {
      const result =
        await likeComment(
          comment._id
        );

      setLiked(
        Boolean(
          result?.liked
        )
      );

      setLikes(
        result?.likesCount ??
          likes
      );
    } catch (error) {
      console.error(
        "COMMENT LIKE ERROR:",
        error
      );
    }
  }

  async function removeComment() {
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
    }
  }

  const commentUser =
    comment?.user || {};

  const avatar =
    commentUser?.avatar ||
    null;

  const fullName =
    commentUser?.name ||
    commentUser?.fullName ||
    commentUser?.username ||
    "User";

  const username =
    commentUser?.username ||
    "user";

  const isVerified =
    Boolean(
      commentUser?.isVerified
    );

  const commentUserId =
    commentUser?._id ||
    commentUser?.id;

  const isOwner =
    String(
      commentUserId
    ) ===
    String(
      currentUserId
    );

  return (
    <View
      style={styles.container}
    >
      {/* AVATAR */}

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
            {fullName
              .charAt(0)
              .toUpperCase()}
          </Text>
        )}
      </View>

      {/* COMMENT */}

      <View
        style={styles.content}
      >
        <View
          style={
            styles.commentRow
          }
        >
          <View
            style={
              styles.identityRow
            }
          >
            <Text
              style={
                styles.fullName
              }
            >
              {fullName}
            </Text>

            {isVerified && (
              <VerifiedBadge
                size={14}
              />
            )}
          </View>

          <Text
            style={
              styles.commentText
            }
          >
            {" "}
            {comment?.text ||
              ""}
          </Text>
        </View>

        <Text
          style={
            styles.username
          }
        >
          @{username}
        </Text>

        <View
          style={styles.actions}
        >
          <Text
            style={styles.likes}
          >
            {likes}{" "}
            {likes === 1
              ? "like"
              : "likes"}
          </Text>

          <TouchableOpacity
            onPress={() =>
              onReply?.(
                comment
              )
            }
            activeOpacity={0.7}
          >
            <Text
              style={
                styles.action
              }
            >
              Reply
            </Text>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={
                removeComment
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.action,
                  styles.delete,
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LIKE */}

      <TouchableOpacity
        onPress={
          toggleLike
        }
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.heart,
            liked &&
              styles.liked,
          ]}
        >
          {liked
            ? "♥"
            : "♡"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexDirection:
        "row",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        Colors.surface,
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      fontWeight:
        "800",
      fontSize: 15,
    },

    content: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },

    commentRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      flexWrap:
        "wrap",
    },

    identityRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 3,
    },

    fullName: {
      fontWeight:
        "800",
      color:
        Colors.black,
      fontSize: 14,
    },

    username: {
      marginTop: 2,
      fontSize: 11,
      color:
        Colors.secondaryText ||
        "#777",
    },

    commentText: {
      fontSize: 14,
      lineHeight: 20,
      color:
        Colors.black,
      flexShrink: 1,
    },

    actions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 15,
      marginTop: 6,
    },

    likes: {
      color:
        Colors.secondaryText,
      fontSize: 12,
    },

    action: {
      color:
        Colors.secondaryText,
      fontWeight:
        "700",
      fontSize: 12,
    },

    delete: {
      color:
        Colors.primary,
    },

    heart: {
      fontSize: 23,
      color:
        Colors.black,
      paddingTop: 4,
    },

    liked: {
      color:
        Colors.primary,
    },
  });