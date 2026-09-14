import React, {
  useMemo,
} from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import Colors from "../../constants/Colors";
import VerifiedBadge from "../common/VerifiedBadge";

function normalizeType(notification) {
  return String(
    notification?.type ||
    notification?.notificationType ||
    notification?.action ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}


function getSender(notification) {
  return (
    notification?.sender ||
    notification?.from ||
    notification?.user ||
    notification?.actor ||
    {}
  );
}


function getSenderId(sender) {
  return String(
    sender?._id ||
    sender?.id ||
    ""
  );
}


function getUsername(sender) {
  return (
    sender?.username ||
    sender?.userName ||
    "someone"
  );
}


function getDisplayName(sender) {
  return (
    sender?.name ||
    sender?.fullName ||
    sender?.displayName ||
    getUsername(sender)
  );
}


function getAvatar(sender) {
  return (
    sender?.avatar ||
    sender?.profilePicture ||
    sender?.profileImage ||
    sender?.photo ||
    null
  );
}


function getPostImage(notification) {
  const media =
    notification?.post?.media;

  const reelMedia =
    notification?.reel?.media;

  const storyMedia =
    notification?.story?.media;

  if (
    typeof notification?.post?.image ===
    "string"
  ) {
    return notification.post.image;
  }

  if (
    typeof media?.[0]?.url ===
    "string"
  ) {
    return media[0].url;
  }

  if (
    typeof media?.[0]?.uri ===
    "string"
  ) {
    return media[0].uri;
  }

  if (
    typeof notification?.reel?.thumbnail ===
    "string"
  ) {
    return notification.reel.thumbnail;
  }

  if (
    typeof notification?.reel?.coverImage ===
    "string"
  ) {
    return notification.reel.coverImage;
  }

  if (
    typeof reelMedia?.[0]?.url ===
    "string"
  ) {
    return reelMedia[0].url;
  }

  if (
    typeof notification?.story?.image ===
    "string"
  ) {
    return notification.story.image;
  }

  if (
    typeof storyMedia?.[0]?.url ===
    "string"
  ) {
    return storyMedia[0].url;
  }

  return null;
}


function isRead(notification) {
  
  if (
    typeof notification?.isRead ===
    "boolean"
  ) {
    return notification.isRead;
  }

  if (
    typeof notification?.read ===
    "boolean"
  ) {
    return notification.read;
  }

  return true;
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


function getActionText(
  notification,
  sender
) {
  const type =
    normalizeType(notification);

  const username =
    getUsername(sender);

  switch (type) {
    case "like":
    case "liked":
    case "post_like":
    case "like_post":
      return "liked your post";

    case "comment":
    case "commented":
    case "post_comment":
      return "commented on your post";

    case "reply":
    case "comment_reply":
    case "replied":
      return "replied to your comment";

    case "follow":
    case "followed":
    case "new_follower":
      return "started following you";

    case "follow_request":
    case "followrequest":
    case "requested_to_follow":
      return "requested to follow you";

    case "follow_accept":
    case "follow_accepted":
    case "follow_request_accepted":
      return "accepted your follow request";

    case "mention":
    case "mentioned":
    case "post_mention":
      return "mentioned you";

    case "story_like":
    case "story_liked":
      return "liked your story";

    case "story_reply":
    case "story_replied":
      return "replied to your story";

    case "story_reaction":
      return "reacted to your story";

    case "reel_like":
    case "reel_liked":
      return "liked your reel";

    case "reel_comment":
    case "reel_commented":
      return "commented on your reel";

    case "reel_share":
    case "reel_shared":
      return "shared your reel";

    case "message":
      return "sent you a message";

    case "call":
      return "called you";

    case "live":
      return "is live now";

    case "profile_visit":
    case "profile_view":
      return "viewed your profile";

    case "verified":
    case "verification":
      return "is now verified";

    case "post_shared":
    case "shared_post":
    case "share":
    case "shared":
      return "shared your post";

    case "system":
      return (
        notification?.text ||
        "Snapgram update"
      );

    default:
      return (
        notification?.text ||
        `${username} interacted with you`
      );
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case "like":
    case "liked":
    case "post_like":
    case "like_post":
    case "story_like":
    case "story_liked":
    case "story_reaction":
    case "reel_like":
    case "reel_liked":
      return "heart";

    case "comment":
    case "commented":
    case "post_comment":
    case "reply":
    case "comment_reply":
    case "replied":
    case "story_reply":
    case "story_replied":
    case "reel_comment":
    case "reel_commented":
      return "chatbubble";

    case "follow":
    case "followed":
    case "new_follower":
    case "follow_request":
    case "followrequest":
    case "requested_to_follow":
    case "follow_accept":
    case "follow_accepted":
    case "follow_request_accepted":
      return "person-add";

    case "mention":
    case "mentioned":
    case "post_mention":
      return "at";

    case "message":
      return "mail";

    case "call":
      return "call";

    case "live":
      return "radio";

    case "verified":
    case "verification":
      return "checkmark-circle";

    case "share":
    case "shared":
    case "post_shared":
    case "shared_post":
    case "reel_share":
    case "reel_shared":
      return "paper-plane";

    case "system":
      return "information-circle";

    default:
      return "notifications";
  }
}


function getIconColor(type) {
  switch (type) {
    case "like":
    case "liked":
    case "post_like":
    case "like_post":
    case "story_like":
    case "story_liked":
    case "story_reaction":
    case "reel_like":
    case "reel_liked":
    case "live":
      return "#ED4956";

    case "message":
      return "#0095F6";

    case "call":
      return "#34A853";

    case "verified":
    case "verification":
      return "#0095F6";

    case "system":
      return "#8E8E8E";

    default:
      return "#0095F6";
  }
}

export default function NotificationRow({
  notification,
  onPress,
  onFollow,
}) {
  const type =
    normalizeType(notification);

  const sender =
    getSender(notification);

  const senderId =
    getSenderId(sender);

  const username =
    getUsername(sender);

  const displayName =
    getDisplayName(sender);

  const avatar =
    getAvatar(sender);

  const verified =
    Boolean(
      sender?.isVerified ||
      sender?.verified
    );

  const read =
    isRead(notification);

  const postImage =
    getPostImage(notification);

  const actionText =
    getActionText(
      notification,
      sender
    );

  const icon =
    useMemo(
      () =>
        getNotificationIcon(type),
      [type]
    );

  const iconColor =
    getIconColor(type);

  const isLive =
    type === "live";

  const isFollow =
    type === "follow" ||
    type === "followed" ||
    type === "new_follower";

  const isFollowRequest =
    type === "follow_request" ||
    type === "followrequest" ||
    type === "requested_to_follow";

  const showFollowButton =
    isFollow ||
    isFollowRequest;

  const following =
    Boolean(
      notification?.following ??
      notification?.isFollowing ??
      sender?.isFollowing
    );

  const isRequest =
    isFollowRequest;


  const previewTypes = [
    "comment",
    "commented",
    "post_comment",
    "reply",
    "comment_reply",
    "replied",
    "mention",
    "mentioned",
    "post_mention",
    "story_reply",
    "story_replied",
    "reel_comment",
    "reel_commented",
  ];

  const showPreview =
    Boolean(
      notification?.text &&
      previewTypes.includes(type)
    );


  return (
    <Pressable
      onPress={() =>
        onPress?.(notification)
      }
      style={({ pressed }) => [
        styles.container,

        !read &&
          styles.unreadContainer,

        isLive &&
          styles.liveContainer,

        pressed &&
          styles.pressed,
      ]}
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
              {displayName
                .charAt(0)
                .toUpperCase()}
            </Text>
          )}
        </View>

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
            color="#FFFFFF"
          />
        </View>
      </View>

      <View
        style={styles.content}
      >
        <View
          style={styles.messageRow}
        >
          {senderId ? (
            <Text
              style={styles.message}
              numberOfLines={3}
            >
              <Text
                style={styles.username}
              >
                {username}
              </Text>

              {verified ? (
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

              <Text
                style={styles.time}
              >
                {" "}
                {formatTime(
                  notification?.createdAt
                )}
              </Text>
            </Text>
          ) : (
            <Text
              style={styles.message}
              numberOfLines={3}
            >
              <Text
                style={
                  styles.actionText
                }
              >
                {actionText}
              </Text>

              <Text
                style={styles.time}
              >
                {" "}
                {formatTime(
                  notification?.createdAt
                )}
              </Text>
            </Text>
          )}
        </View>

        {showPreview ? (
          <Text
            style={styles.preview}
            numberOfLines={2}
          >
            {notification.text}
          </Text>
        ) : null}

        {isLive ? (
          <View
            style={styles.liveBadge}
          >
            <View
              style={styles.liveDot}
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
      </View>

      {showFollowButton ? (
        <Pressable
          onPress={(event) => {
            event?.stopPropagation?.();

            onFollow?.(
              notification,
              !following
            );
          }}
          style={({ pressed }) => [
            styles.followButton,

            following &&
              !isRequest &&
              styles.followingButton,

            isRequest &&
              styles.requestButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.followButtonText,

              following &&
                !isRequest &&
                styles.followingButtonText,

              isRequest &&
                styles.requestButtonText,
            ]}
          >
            {isRequest
              ? "Confirm"
              : following
              ? "Following"
              : "Follow"}
          </Text>
        </Pressable>
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

        <Pressable
          onPress={() =>
            onPress?.(notification)
          }
          style={
            styles.thumbnailWrapper
          }
        >
          <Image
            source={{
              uri: postImage,
            }}
            style={styles.postImage}
          />
        </Pressable>
      ) : null}

      {!read ? (
        <View
          style={styles.unreadDot}
        />
      ) : null}
    </Pressable>
  );
}


const styles =
  StyleSheet.create({
    container: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: "#FFFFFF",
    },

    unreadContainer: {
      backgroundColor: "#F7FAFF",
    },

    liveContainer: {
      backgroundColor: "#FFF8F8",
    },

    pressed: {
      opacity: 0.72,
    },

    avatarWrapper: {
      width: 50,
      height: 50,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F2F2F2",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#111111",
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
      borderColor: "#FFFFFF",
    },

    content: {
      flex: 1,
      minWidth: 0,
      marginLeft: 11,
      marginRight: 8,
    },

    messageRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    message: {
      flexShrink: 1,
      fontSize: 14,
      lineHeight: 19,
      color: "#111111",
    },

    username: {
      fontWeight: "700",
      color: "#111111",
    },

    actionText: {
      fontWeight: "400",
      color: "#111111",
    },

    time: {
      color: "#8E8E8E",
      fontSize: 13,
      fontWeight: "400",
    },

    preview: {
      marginTop: 3,
      color: "#737373",
      fontSize: 13,
      lineHeight: 17,
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
      color: "#ED4956",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
    },

    followButton: {
      minWidth: 82,
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
      backgroundColor: "#0095F6",
    },

    followingButton: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#DBDBDB",
    },

    requestButton: {
      backgroundColor: "#0095F6",
    },

    followButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },

    followingButtonText: {
      color: "#111111",
    },

    requestButtonText: {
      color: "#FFFFFF",
    },

    buttonPressed: {
      opacity: 0.7,
    },

    joinButton: {
      minWidth: 55,
      height: 31,
      paddingHorizontal: 12,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ED4956",
    },

    joinButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    thumbnailWrapper: {
      width: 44,
      height: 44,
      marginLeft: 4,
      borderRadius: 2,
      overflow: "hidden",
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
      marginLeft: 2,
      backgroundColor: "#0095F6",
    },
  });