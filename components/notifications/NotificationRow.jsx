import React, {
  useMemo,
} from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import Colors from "../../constants/Colors";
import VerifiedBadge from "../common/VerifiedBadge";

function getActionText(notification) {
  switch (notification?.type) {
    case "like":
      return "liked your post";

    case "comment":
      return "commented on your post";

    case "follow":
      return "started following you";

    case "mention":
      return "mentioned you";

    case "reply":
      return "replied to your comment";

    case "story_like":
      return "liked your story";

    case "story_reply":
      return "replied to your story";

    case "reel_like":
      return "liked your reel";

    case "reel_comment":
      return "commented on your reel";

    case "message":
      return "sent you a message";

    case "follow_request":
      return "requested to follow you";

    case "follow_accept":
      return "accepted your follow request";

    case "call":
      return "called you";

    case "live":
      return "is live now";

    case "system":
      return notification?.text || "Snapgram update";

    default:
      return (
        notification?.text ||
        "interacted with you"
      );
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case "like":
    case "story_like":
    case "reel_like":
      return "heart";

    case "comment":
    case "reply":
    case "story_reply":
    case "reel_comment":
      return "chatbubble";

    case "follow":
    case "follow_request":
    case "follow_accept":
      return "person-add";

    case "mention":
      return "at";

    case "message":
      return "mail";

    case "call":
      return "call";

    case "live":
      return "radio";

    case "system":
      return "information-circle";

    default:
      return "notifications";
  }
}

function getIconColor(type) {
  switch (type) {
    case "like":
    case "story_like":
    case "reel_like":
      return "#ED4956";

    case "live":
      return "#ED4956";

    case "message":
      return "#0095F6";

    case "call":
      return "#34A853";

    case "system":
      return "#8E8E8E";

    default:
      return "#0095F6";
  }
}

function getPostImage(notification) {
  return (
    notification?.post?.image ||
    notification?.post?.media?.[0]?.url ||
    notification?.post?.media?.[0]?.uri ||
    notification?.reel?.thumbnail ||
    notification?.reel?.coverImage ||
    notification?.reel?.media?.[0]?.url ||
    notification?.story?.image ||
    notification?.story?.media?.[0]?.url ||
    null
  );
}

function isNotificationRead(notification) {
  if (
    typeof notification?.isRead ===
    "boolean"
  ) {
    return notification.isRead;
  }

  /*
   * Backward compatibility for old
   * notification documents.
   */
  if (
    typeof notification?.read ===
    "boolean"
  ) {
    return notification.read;
  }

  return true;
}

export default function NotificationRow({
  notification,
  onPress,
  onFollow,
}) {
  const sender =
    notification?.sender || {};

  const avatar =
    sender?.avatar ||
    sender?.profilePicture ||
    sender?.profileImage ||
    null;

  const username =
    sender?.username ||
    "someone";

  const fullName =
    sender?.name ||
    sender?.fullName ||
    username;

  const isVerified =
    Boolean(
      sender?.isVerified ||
      sender?.verified
    );

  const read =
    isNotificationRead(
      notification
    );

  const postImage =
    getPostImage(
      notification
    );

  const actionText =
    getActionText(
      notification
    );

  const icon =
    useMemo(
      () =>
        getNotificationIcon(
          notification?.type
        ),
      [notification?.type]
    );

  const iconColor =
    getIconColor(
      notification?.type
    );

  const isFollowNotification =
    notification?.type ===
      "follow" ||
    notification?.type ===
      "follow_request";

  const isLive =
    notification?.type === "live";

  const isFollowing =
    Boolean(
      notification?.following ??
        notification?.isFollowing ??
        sender?.isFollowing
    );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !read &&
          styles.unreadContainer,
        isLive &&
          styles.liveContainer,
      ]}
      onPress={() =>
        onPress?.(notification)
      }
      activeOpacity={0.75}
    >
      <View
        style={styles.avatarWrapper}
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
              {fullName
                .charAt(0)
                .toUpperCase()}
            </Text>
          )}
        </View>

        {icon ? (
          <View
            style={[
              styles.notificationIcon,
              {
                backgroundColor:
                  iconColor,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={11}
              color="#ffffff"
            />
          </View>
        ) : null}
      </View>

      <View
        style={styles.content}
      >
        <Text
          style={styles.message}
          numberOfLines={3}
        >
          {sender?._id ? (
            <>
              <Text
                style={styles.username}
              >
                {username}
              </Text>

              {isVerified ? (
                <Text>
                  {" "}
                  <VerifiedBadge
                    size={13}
                  />
                </Text>
              ) : null}

              <Text
                style={
                  styles.actionText
                }
              >
                {" "}
                {actionText}
              </Text>
            </>
          ) : (
            <Text
              style={
                styles.actionText
              }
            >
              {actionText}
            </Text>
          )}

          <Text
            style={styles.time}
          >
            {" "}
            {formatTime(
              notification?.createdAt
            )}
          </Text>
        </Text>

        {notification?.type ===
          "live" ? (
          <View
            style={
              styles.liveBadge
            }
          >
            <View
              style={
                styles.liveDot
              }
            />

            <Text
              style={
                styles.liveBadgeText
              }
            >
              LIVE NOW
            </Text>
          </View>
        ) : null}

        {notification?.text &&
        [
          "comment",
          "reply",
          "mention",
          "story_reply",
          "reel_comment",
        ].includes(
          notification?.type
        ) ? (
          <Text
            style={
              styles.preview
            }
            numberOfLines={1}
          >
            {notification.text}
          </Text>
        ) : null}
      </View>

      {isFollowNotification ? (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing &&
              styles.followingButton,
          ]}
          onPress={(event) => {
            event?.stopPropagation?.();

            onFollow?.(
              notification,
              !isFollowing
            );
          }}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.followButtonText,
              isFollowing &&
                styles.followingButtonText,
            ]}
          >
            {isFollowing
              ? "Following"
              : "Follow"}
          </Text>
        </TouchableOpacity>
      ) : isLive ? (
        <View
          style={styles.joinButton}
        >
          <Text
            style={
              styles.joinButtonText
            }
          >
            Join
          </Text>
        </View>
      ) : postImage ? (
        <TouchableOpacity
          style={
            styles.thumbnailWrapper
          }
          activeOpacity={0.8}
          onPress={() =>
            onPress?.(notification)
          }
        >
          <Image
            source={{
              uri: postImage,
            }}
            style={
              styles.postImage
            }
          />
        </TouchableOpacity>
      ) : null}

      {!read ? (
        <View
          style={styles.unreadDot}
        />
      ) : null}
    </TouchableOpacity>
  );
}

function formatTime(date) {
  if (!date) {
    return "";
  }

  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(timestamp)
  ) {
    return "";
  }

  const difference =
    Math.max(
      0,
      Date.now() - timestamp
    );

  const seconds =
    Math.floor(
      difference / 1000
    );

  if (seconds < 60) {
    return "now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days}d`;
  }

  const weeks =
    Math.floor(
      days / 7
    );

  if (weeks < 4) {
    return `${weeks}w`;
  }

  const months =
    Math.floor(
      days / 30
    );

  if (months < 12) {
    return `${months}mo`;
  }

  const years =
    Math.floor(
      days / 365
    );

  return `${years}y`;
}

const styles =
  StyleSheet.create({
    container: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: "#ffffff",
    },

    unreadContainer: {
      backgroundColor: "#F8FAFF",
    },

    liveContainer: {
      backgroundColor: "#FFF8F8",
    },

    avatarWrapper: {
      width: 50,
      height: 50,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        Colors.surface || "#F2F2F2",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      fontSize: 17,
      fontWeight: "700",
      color:
        Colors.black || "#111111",
    },

    notificationIcon: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 19,
      height: 19,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#ffffff",
    },

    content: {
      flex: 1,
      minWidth: 0,
      marginLeft: 11,
      marginRight: 8,
      justifyContent: "center",
    },

    message: {
      fontSize: 14,
      lineHeight: 19,
      color:
        Colors.black || "#111111",
    },

    username: {
      fontSize: 14,
      fontWeight: "700",
      color:
        Colors.black || "#111111",
    },

    actionText: {
      fontSize: 14,
      fontWeight: "400",
      color:
        Colors.black || "#111111",
    },

    time: {
      fontSize: 13,
      color:
        Colors.secondaryText ||
        "#8E8E8E",
    },

    preview: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 17,
      color:
        Colors.secondaryText ||
        "#737373",
    },

    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },

    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#ED4956",
      marginRight: 5,
    },

    liveBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#ED4956",
      letterSpacing: 0.4,
    },

    followButton: {
      minWidth: 82,
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0095F6",
      marginLeft: 4,
    },

    followingButton: {
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#DBDBDB",
    },

    followButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#ffffff",
    },

    followingButtonText: {
      color: "#111111",
    },

    joinButton: {
      minWidth: 55,
      height: 31,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ED4956",
      paddingHorizontal: 12,
    },

    joinButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "800",
    },

    thumbnailWrapper: {
      width: 44,
      height: 44,
      borderRadius: 2,
      overflow: "hidden",
      marginLeft: 4,
    },

    postImage: {
      width: 44,
      height: 44,
      resizeMode: "cover",
    },

    unreadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#0095F6",
      marginLeft: 2,
    },
  });