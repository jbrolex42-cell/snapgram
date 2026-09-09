import React from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import VerifiedBadge from "../common/VerifiedBadge";

function getActionText(
  notification
) {
  switch (
    notification?.type
  ) {
    case "like":
      return "liked your post";

    case "comment":
      return "commented on your post";

    case "follow":
      return "started following you";

    case "story_like":
      return "liked your story";

    case "story_reply":
      return "replied to your story";

    case "mention":
      return "mentioned you";

    default:
      return (
        notification?.text ||
        "interacted with you"
      );
  }
}

export default function NotificationItem({
  notification,
  onPress,
}) {
  const sender =
    notification?.sender ||
    {};

  const fullName =
    sender?.name ||
    sender?.fullName ||
    sender?.username ||
    "Someone";

  const username =
    sender?.username ||
    "";

  const isVerified =
    Boolean(
      sender?.isVerified
    );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification?.read &&
          styles.unread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={styles.avatar}
      >
        {sender?.avatar ? (
          <Image
            source={{
              uri:
                sender.avatar,
            }}
            style={styles.image}
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

      <View
        style={styles.content}
      >
        <View
          style={
            styles.nameRow
          }
        >
          <Text
            style={
              styles.name
            }
            numberOfLines={1}
          >
            {fullName}
          </Text>

          {isVerified && (
            <VerifiedBadge
              size={14}
            />
          )}
        </View>

        {username ? (
          <Text
            style={
              styles.username
            }
          >
            @{username}
          </Text>
        ) : null}

        <Text
          style={styles.text}
        >
          {getActionText(
            notification
          )}
        </Text>

        <Text
          style={styles.time}
        >
          {formatTime(
            notification?.createdAt
          )}
        </Text>
      </View>

      {notification
        ?.post
        ?.media?.[0]
        ?.url ? (
        <Image
          source={{
            uri:
              notification
                .post
                .media[0]
                .url,
          }}
          style={
            styles.postImage
          }
        />
      ) : null}

      {!notification?.read && (
        <View
          style={styles.dot}
        />
      )}
    </TouchableOpacity>
  );
}

function formatTime(
  date
) {
  if (!date) {
    return "";
  }

  const difference =
    Date.now() -
    new Date(
      date
    ).getTime();

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "now";
  }

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

  return new Date(
    date
  ).toLocaleDateString();
}

const styles =
  StyleSheet.create({
    container: {
      minHeight: 76,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    unread: {
      backgroundColor:
        "#F5F9FF",
    },

    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
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
      fontSize: 18,
      fontWeight:
        "800",
    },

    content: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    name: {
      fontWeight:
        "800",
      fontSize: 14,
      color: "#111",
      flexShrink: 1,
    },

    username: {
      marginTop: 1,
      fontSize: 11,
      color: "#888",
    },

    text: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 18,
    },

    time: {
      marginTop: 3,
      color: "#888",
      fontSize: 12,
    },

    postImage: {
      width: 46,
      height: 46,
      marginLeft: 10,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        "#0095F6",
      marginLeft: 6,
    },
  });