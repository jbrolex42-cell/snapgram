import React, {
  useEffect,
  useMemo,
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

import { router } from "expo-router";

import Colors from "../../constants/Colors";

import {
  followUser,
  unfollowUser,
} from "../../services/followService";

import VerifiedBadge from "../common/VerifiedBadge";

function getUserId(user) {
  if (!user) {
    return null;
  }

  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    null
  );
}


function getUsername(user) {
  const value =
    user?.username ||
    user?.profile?.username ||
    "";

  return String(value)
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function getFullName(user) {
  const username = getUsername(user);

  const candidates = [
    user?.fullName,
    user?.name,
    user?.displayName,
    user?.profile?.fullName,
    user?.profile?.name,
  ];

  for (const candidate of candidates) {
    const value = String(
      candidate || ""
    ).trim();

    if (!value) {
      continue;
    }

    if (
      username &&
      value.toLowerCase() ===
        username.toLowerCase()
    ) {
      continue;
    }

    return value;
  }

  return "User";
}


function getAvatar(user) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.profileImage ||
    user?.photoURL ||
    user?.profile?.avatar ||
    null
  );
}


function getFollowersCount(user) {
  return Number(
    user?.followersCount ??
      user?.followerCount ??
      user?.followers?.length ??
      0
  );
}


function getVerificationStatus(user) {
 
  return Boolean(
    user?.isVerified ||
    user?.verified ||
    user?.verification?.isVerified ||
    user?.verification?.verified ||
    user?.profile?.isVerified ||
    user?.profile?.verified
  );
}

export default function UserRow({
  user,
  showFollow = true,
}) {
  const userId = getUserId(user);

  const username = getUsername(user);

  const fullName = getFullName(user);

  const avatar = getAvatar(user);

  const isVerified =
    getVerificationStatus(user);

  const isOwnProfile = Boolean(
    user?.isOwnProfile
  );

  const [following, setFollowing] =
    useState(
      Boolean(
        user?.isFollowing
      )
    );

  const [followersCount, setFollowersCount] =
    useState(
      getFollowersCount(user)
    );

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setFollowing(
      Boolean(
        user?.isFollowing
      )
    );

    setFollowersCount(
      getFollowersCount(user)
    );
  }, [
    user?.isFollowing,
    user?.followersCount,
    user?.followerCount,
    user?.followers?.length,
  ]);

  const avatarLetter = useMemo(() => {
    const value = String(
      fullName || "U"
    ).trim();

    return (
      value.charAt(0).toUpperCase() ||
      "U"
    );
  }, [fullName]);

  const handleFollow = async () => {
    if (
      loading ||
      !userId
    ) {
      return;
    }

    const previousFollowing =
      following;

    const previousCount =
      followersCount;

    try {
      setLoading(true);

      if (previousFollowing) {
        const result =
          await unfollowUser(
            String(userId)
          );

        setFollowing(false);

        if (
          result?.followersCount !==
          undefined
        ) {
          setFollowersCount(
            Number(
              result.followersCount
            )
          );
        } else {
          setFollowersCount(
            Math.max(
              0,
              previousCount - 1
            )
          );
        }
      } else {
        const result =
          await followUser(
            String(userId)
          );

        const requested =
          result?.isRequested ||
          result?.requested ||
          result?.status ===
            "requested";

        setFollowing(
          requested
            ? false
            : true
        );

        if (
          result?.followersCount !==
          undefined
        ) {
          setFollowersCount(
            Number(
              result.followersCount
            )
          );
        } else if (!requested) {
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

      setFollowing(
        previousFollowing
      );

      setFollowersCount(
        previousCount
      );
    } finally {
      setLoading(false);
    }
  };

  const openProfile = () => {
    if (!username) {
      return;
    }

    router.push({
      pathname:
        "/profile/[username]",
      params: {
        username,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* USER                                                                */}
      {/* ------------------------------------------------------------------ */}

      <TouchableOpacity
        style={styles.userInfo}
        onPress={openProfile}
        activeOpacity={0.7}
        disabled={!username}
      >
        {/* Avatar */}

        <View
          style={styles.avatar}
        >
          {avatar ? (
            <Image
              source={{
                uri: String(
                  avatar
                ),
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
              {avatarLetter}
            </Text>
          )}
        </View>


        {/* Identity */}

        <View
          style={styles.details}
        >
          {/* Full name + blue tick */}

          <View
            style={styles.nameRow}
          >
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {fullName}
            </Text>

            {isVerified && (
              <VerifiedBadge
                size={15}
                style={
                  styles.verifiedBadge
                }
              />
            )}
          </View>


          {/* Username */}

          {!!username && (
            <Text
              style={styles.username}
              numberOfLines={1}
            >
              @{username}
            </Text>
          )}
        </View>
      </TouchableOpacity>


      {/* ------------------------------------------------------------------ */}
      {/* FOLLOW BUTTON                                                       */}
      {/* ------------------------------------------------------------------ */}

      {showFollow &&
        !isOwnProfile &&
        userId && (
          <TouchableOpacity
            style={[
              styles.followButton,
              following &&
                styles.followingButton,
            ]}
            onPress={
              handleFollow
            }
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
    backgroundColor:
      Colors.white ||
      Colors.background ||
      "#FFFFFF",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor:
      Colors.surface ||
      "#F2F2F2",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color:
      Colors.text ||
      Colors.black ||
      "#000000",
  },

  details: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color:
      Colors.text ||
      Colors.black ||
      "#000000",
  },

  verifiedBadge: {
    marginLeft: 4,
    flexShrink: 0,
  },

  username: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "400",
    color:
      Colors.secondaryText ||
      "#737373",
  },

  followButton: {
    minWidth: 88,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.primary ||
      "#0095F6",
  },

  followingButton: {
    backgroundColor:
      Colors.surface ||
      "#EFEFEF",
    borderWidth: 1,
    borderColor:
      Colors.border ||
      "#DBDBDB",
  },

  followText: {
    fontSize: 13,
    fontWeight: "700",
    color:
      Colors.white ||
      "#FFFFFF",
  },

  followingText: {
    color:
      Colors.text ||
      Colors.black ||
      "#000000",
  },
});