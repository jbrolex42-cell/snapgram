import React, { useMemo } from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import FollowButton from "./FollowButton";

export default function ProfileHeader({
  user,
  isOwnProfile = false,

  isFollowing = false,
  isRequested = false,

  onFollow,
  onUnfollow,
  onCancelRequest,

  onEditProfile,
  onMessage,
  onMore,
}) {
  if (!user) {
    return null;
  }

  const username =
    user.username ||
    user.userName ||
    "";

  const name =
    user.name ||
    user.fullName ||
    "";

  const avatar =
    user.avatar ||
    user.avatarUrl ||
    user.profilePicture ||
    user.profileImage ||
    user.photoURL ||
    null;

  const postsCount = Number(
    user.postsCount ??
      user.postCount ??
      user.posts ??
      0
  );

  const followersCount = Number(
    user.followersCount ??
      user.followers ??
      0
  );

  const followingCount = Number(
    user.followingCount ??
      user.following ??
      0
  );

  const isVerified = Boolean(
    user.isVerified ??
      user.verified ??
      false
  );

  const website = useMemo(() => {
    if (!user.website) {
      return null;
    }

    return String(user.website)
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  }, [user.website]);

  return (
    <View style={styles.container}>

      <View style={styles.profileRow}>

        <View style={styles.avatarWrapper}>
          <Image
            source={
              avatar
                ? { uri: avatar }
                : require("../../assets/default-avatar.png")
            }
            style={styles.avatar}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {postsCount}
            </Text>

            <Text style={styles.statLabel}>
              Posts
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {followersCount}
            </Text>

            <Text style={styles.statLabel}>
              Followers
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {followingCount}
            </Text>

            <Text style={styles.statLabel}>
              Following
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bioContainer}>
        {!!name && (
          <View style={styles.nameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {name}
            </Text>

            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#0095F6"
                style={styles.verifiedIcon}
              />
            )}
          </View>
        )}

        {!!username && (
          <Text
            style={styles.username}
            numberOfLines={1}
          >
            @{username}
          </Text>
        )}

        {!!user.bio && (
          <Text style={styles.bio}>
            {user.bio}
          </Text>
        )}

        {!!website && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {

            }}
          >
            <Text
              style={styles.website}
              numberOfLines={1}
            >
              {website}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        {isOwnProfile ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onEditProfile}
            style={[
              styles.actionButton,
              styles.secondaryButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Edit profile
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <FollowButton
              isFollowing={
                isFollowing
              }
              isRequested={
                isRequested
              }
              onFollow={
                onFollow
              }
              onUnfollow={
                onUnfollow
              }
              onCancelRequest={
                onCancelRequest
              }
              style={
                styles.followButton
              }
            />

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onMessage}
              style={[
                styles.actionButton,
                styles.secondaryButton,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Message ${username}`}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Message
              </Text>
            </TouchableOpacity>
          </>
        )}

        {typeof onMore ===
          "function" && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onMore}
            style={styles.moreButton}
            accessibilityRole="button"
            accessibilityLabel="More profile options"
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={23}
              color="#111111"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
  },

  avatar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EFEFEF",
  },

  statsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginLeft: 18,
  },

  stat: {
    minWidth: 65,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111111",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "400",
    color: "#555555",
  },

  bioContainer: {
    marginTop: 13,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },

  name: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111111",
  },

  verifiedIcon: {
    marginLeft: 4,
  },

  username: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#737373",
  },

  bio: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#222222",
  },

  website: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: "#00376B",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },

  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  followButton: {
    flex: 1,
  },

  secondaryButton: {
    backgroundColor: "#EFEFEF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DBDBDB",
  },

  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#111111",
  },

  moreButton: {
    width: 38,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});