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

import {
  toggleCommentLike,
} from "../../services/commentService";

import VerifiedBadge from "../../common/VerifiedBadge";

export default function CommentItem({
  comment,
}) {
  const [
    liked,
    setLiked,
  ] = useState(
    Boolean(
      comment?.isLiked
    )
  );

  const [
    likes,
    setLikes,
  ] = useState(
    comment?.likes?.length ||
      0
  );

  async function handleLike() {
    const oldLiked =
      liked;

    const oldLikes =
      likes;

    setLiked(
      !liked
    );

    setLikes(
      value =>
        liked
          ? Math.max(
              0,
              value - 1
            )
          : value + 1
    );

    try {
      const result =
        await toggleCommentLike(
          comment._id
        );

      setLiked(
        Boolean(
          result?.liked
        )
      );

      setLikes(
        result?.likesCount ??
          oldLikes
      );
    } catch (error) {
      setLiked(
        oldLiked
      );

      setLikes(
        oldLikes
      );

      console.error(
        "COMMENT LIKE ERROR:",
        error
      );
    }
  }

  const commentUser =
    comment?.user || {};

  const fullName =
    commentUser?.name ||
    commentUser?.fullName ||
    commentUser?.username ||
    "User";

  const username =
    commentUser?.username ||
    "user";

  const avatar =
    commentUser?.avatar ||
    null;

  const isVerified =
    Boolean(
      commentUser?.isVerified
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
              styles.image
            }
          />
        ) : (
          <Text
            style={
              styles.initial
            }
          >
            {fullName
              .charAt(0)
              .toUpperCase()}
          </Text>
        )}
      </View>

      {/* CONTENT */}

      <View
        style={styles.content}
      >
        <View
          style={styles.commentRow}
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
            style={styles.text}
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
          style={styles.meta}
        >
          <TouchableOpacity
            onPress={
              handleLike
            }
            activeOpacity={0.7}
          >
            <Text
              style={
                styles.metaText
              }
            >
              Like
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.metaText
            }
          >
            Reply
          </Text>

          {likes > 0 && (
            <Text
              style={
                styles.metaText
              }
            >
              {likes}{" "}
              {likes === 1
                ? "like"
                : "likes"}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={
          handleLike
        }
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.like,
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
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        "#eee",
      justifyContent:
        "center",
      alignItems:
        "center",
      overflow:
        "hidden",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    initial: {
      fontSize: 15,
      fontWeight:
        "800",
    },

    content: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },

    commentRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      alignItems:
        "flex-start",
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
      color: "#111",
      fontSize: 14,
    },

    username: {
      marginTop: 2,
      fontSize: 11,
      color: "#888",
    },

    text: {
      fontSize: 14,
      lineHeight: 20,
      color: "#111",
    },

    meta: {
      flexDirection:
        "row",
      gap: 18,
      marginTop: 5,
    },

    metaText: {
      fontSize: 12,
      color: "#777",
      fontWeight:
        "600",
    },

    like: {
      fontSize: 19,
      paddingTop: 5,
      color: "#111",
    },

    liked: {
      color: "#ed4956",
    },
  });