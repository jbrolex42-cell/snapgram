import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import Colors from "../../constants/Colors";

import {
  followUser,
  unfollowUser,
} from "../../services/followService";

import VerifiedBadge from "../common/VerifiedBadge";

export default function UserRow({
  user,
  showFollow = true,
}) {
  const [following, setFollowing] = useState(
    Boolean(user?.isFollowing)
  );

  const [followersCount, setFollowersCount] = useState(
    Number(user?.followersCount || 0)
  );

  const [loading, setLoading] = useState(false);

  /*
   * Keep local state synchronized when the
   * parent reloads the user object.
   */
  useEffect(() => {
    setFollowing(Boolean(user?.isFollowing));
    setFollowersCount(
      Number(user?.followersCount || 0)
    );
  }, [
    user?._id,
    user?.isFollowing,
    user?.followersCount,
  ]);

  async function handleFollow() {
    if (loading || !user?._id) {
      return;
    }

    const userId = String(user._id);
    const previousFollowing = following;
    const previousCount = followersCount;

    try {
      setLoading(true);

      if (previousFollowing) {
        const result = await unfollowUser(userId);

        setFollowing(false);

        if (
          result?.followersCount !== undefined
        ) {
          setFollowersCount(
            Number(result.followersCount)
          );
        } else {
          setFollowersCount(
            Math.max(0, previousCount - 1)
          );
        }
      } else {
        const result = await followUser(userId);

        setFollowing(true);

        if (
          result?.followersCount !== undefined
        ) {
          setFollowersCount(
            Number(result.followersCount)
          );
        } else {
          setFollowersCount(
            previousCount + 1
          );
        }
      }
    } catch (error) {
      console.error(
        "USER FOLLOW ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      /*
       * Restore the UI if the server rejected
       * the operation.
       */
      setFollowing(previousFollowing);
      setFollowersCount(previousCount);
    } finally {
      setLoading(false);
    }
  }

  function openProfile() {
    if (!user?.username) {
      return;
    }

    router.push({
      pathname: "/profile/[username]",
      params: {
        username: String(user.username),
      },
    });
  }

  const fullName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    "User";

  const username =
    user?.username || "user";

  const avatar =
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.profileImage ||
    user?.photoURL ||
    null;

  const isVerified = Boolean(
    user?.isVerified ??
      user?.verified ??
      user?.verification?.isVerified
  );

  const isOwnProfile = Boolean(
    user?.isOwnProfile
  );

  const avatarLetter =
    String(fullName)
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <View style={styles.container}>
      {/* USER */}

      <TouchableOpacity
        style={styles.userInfo}
        onPress={openProfile}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {avatar ? (
            <Image
              source={{ uri: String(avatar) }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {avatarLetter}
            </Text>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {fullName}
            </Text>

            {isVerified && (
              <VerifiedBadge size={14} />
            )}
          </View>

          <Text
            style={styles.username}
            numberOfLines={1}
          >
            @{username}
          </Text>
        </View>
      </TouchableOpacity>

      {/* FOLLOW / FOLLOWING */}

      {showFollow && !isOwnProfile && (
        <TouchableOpacity
          style={[
            styles.followButton,
            following &&
              styles.followingButton,
          ]}
          onPress={handleFollow}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                following
                  ? Colors.black
                  : Colors.white
              }
            />
          ) : (
            <Text
              style={[
                styles.followText,
                following &&
                  styles.followingText,
              ]}
            >
              {following
                ? "Following"
                : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
  },

  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    minWidth: 0,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.black,
  },

  details: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: Colors.black,
  },

  username: {
    marginTop: 2,
    fontSize: 12,
    color:
      Colors.secondaryText || "#777",
  },

  followButton: {
    minWidth: 90,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  followingButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  followText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.white,
  },

  followingText: {
    color: Colors.black,
  },
});