import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import Colors from "../../constants/Colors";

import {
  getUserPosts,
  getUserProfile,
} from "../../services/userService";

import {
  followUser,
  unfollowUser,
  getFollowStatus,
} from "../../services/followService";

import ProfileGrid from "../../components/profile/ProfileGrid";
import VerifiedBadge from "../../components/common/VerifiedBadge";

export default function UserProfileScreen() {
  const params = useLocalSearchParams();

  const username = Array.isArray(params.username)
    ? params.username[0]
    : params.username;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  /**
   * Load profile, posts and the REAL follow status.
   *
   * The follow status endpoint is the source of truth.
   */
  const loadProfile = useCallback(
    async ({ refresh = false } = {}) => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const normalizedUsername =
          String(username);

        const [
          profile,
          userPosts,
        ] = await Promise.all([
          getUserProfile(normalizedUsername),
          getUserPosts(normalizedUsername),
        ]);

        if (!profile) {
          setUser(null);
          setPosts([]);
          setFollowing(false);
          return;
        }

        setUser(profile);

        setPosts(
          Array.isArray(userPosts)
            ? userPosts
            : []
        );

        /*
         * Own profile does not need follow status.
         */
        if (profile.isOwnProfile) {
          setFollowing(false);
          return;
        }

        const targetUserId =
          profile?._id || profile?.id;

        if (!targetUserId) {
          console.warn(
            "FOLLOW STATUS: Missing target user ID."
          );

          setFollowing(
            Boolean(profile?.isFollowing)
          );

          return;
        }

        /*
         * Always ask the backend for the actual
         * follow relationship.
         */
        try {
          const followStatus =
            await getFollowStatus(
              String(targetUserId)
            );

          const serverFollowing =
            followStatus?.following ??
            followStatus?.isFollowing ??
            false;

          setFollowing(
            Boolean(serverFollowing)
          );

          /*
           * Keep the follower count synchronized
           * with the backend.
           */
          if (
            followStatus?.followersCount !==
            undefined
          ) {
            setUser((current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                followersCount: Number(
                  followStatus.followersCount
                ),
                isFollowing:
                  Boolean(serverFollowing),
              };
            });
          }
        } catch (statusError) {
          /*
           * If the dedicated status request fails,
           * fall back to profile data rather than
           * breaking the entire profile.
           */
          console.error(
            "FOLLOW STATUS ERROR:",
            statusError?.response?.data ||
              statusError
          );

          setFollowing(
            Boolean(profile?.isFollowing)
          );
        }
      } catch (error) {
        console.error(
          refresh
            ? "PROFILE REFRESH ERROR:"
            : "PROFILE LOADING ERROR:",
          error?.response?.data || error
        );

        if (!refresh) {
          setUser(null);
          setPosts([]);
          setFollowing(false);
        }
      } finally {
        if (refresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [username]
  );

  /**
   * Reload whenever the profile receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      loadProfile();

      return undefined;
    }, [loadProfile])
  );

  /**
   * Pull-to-refresh.
   */
  const refreshProfile = useCallback(() => {
    return loadProfile({
      refresh: true,
    });
  }, [loadProfile]);

  /**
   * Follow / unfollow.
   *
   * The local UI updates immediately after the
   * server confirms the operation.
   */
  const handleFollow = useCallback(async () => {
    const targetUserId =
      user?._id || user?.id;

    if (!targetUserId || busy) {
      return;
    }

    const previousFollowing = following;

    try {
      setBusy(true);

      /*
       * UNFOLLOW
       */
      if (previousFollowing) {
        const result =
          await unfollowUser(
            String(targetUserId)
          );

        const serverFollowing =
          result?.following === true;

        setFollowing(serverFollowing);

        setUser((current) => {
          if (!current) {
            return current;
          }

          const currentCount = Number(
            current.followersCount || 0
          );

          const serverCount =
            result?.followersCount;

          return {
            ...current,

            followersCount:
              serverCount !== undefined
                ? Math.max(
                    0,
                    Number(serverCount)
                  )
                : Math.max(
                    0,
                    currentCount - 1
                  ),

            isFollowing:
              serverFollowing,
          };
        });

        return;
      }

      /*
       * FOLLOW
       */
      const result =
        await followUser(
          String(targetUserId)
        );

      const serverFollowing =
        result?.following !== false;

      setFollowing(serverFollowing);

      setUser((current) => {
        if (!current) {
          return current;
        }

        const currentCount = Number(
          current.followersCount || 0
        );

        const serverCount =
          result?.followersCount;

        /*
         * If the backend tells us the user was
         * already following, do NOT increment.
         */
        const nextFollowersCount =
          serverCount !== undefined
            ? Math.max(
                0,
                Number(serverCount)
              )
            : result?.alreadyFollowing
              ? currentCount
              : currentCount + 1;

        return {
          ...current,

          followersCount:
            nextFollowersCount,

          isFollowing:
            serverFollowing,
        };
      });
    } catch (error) {
      console.error(
        "FOLLOW ERROR:",
        error?.response?.data || error
      );

      /*
       * Restore the state that existed before
       * the operation failed.
       */
      setFollowing(previousFollowing);

      Alert.alert(
        "Something went wrong",
        error?.response?.data?.message ||
          error?.message ||
          "We couldn't update your follow status. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    following,
    user,
  ]);

  /**
   * Open followers list.
   */
  const openFollowers = useCallback(() => {
    const userId =
      user?._id || user?.id;

    if (!userId) {
      return;
    }

    router.push({
      pathname: "/profile/followers",
      params: {
        userId: String(userId),
        username: String(
          user.username || ""
        ),
      },
    });
  }, [user]);

  /**
   * Open following list.
   */
  const openFollowing = useCallback(() => {
    const userId =
      user?._id || user?.id;

    if (!userId) {
      return;
    }

    router.push({
      pathname: "/profile/following",
      params: {
        userId: String(userId),
        username: String(
          user.username || ""
        ),
      },
    });
  }, [user]);

  /**
   * Open post.
   */
  const openPost = useCallback(
    (post) => {
      const postId =
        post?._id ||
        post?.id ||
        post?.postId;

      if (!postId) {
        console.warn(
          "Cannot open profile post: missing post ID.",
          post
        );
        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: {
          id: String(postId),
        },
      });
    },
    []
  );

  /**
   * Open messages.
   */
  const openMessage = useCallback(() => {
    if (!user?.username) {
      return;
    }

    router.push({
      pathname: "/messages",
      params: {
        username: String(
          user.username
        ),
      },
    });
  }, [user]);

  /**
   * Share profile.
   */
  const shareProfile = useCallback(() => {
    Alert.alert(
      "Share profile",
      `Share @${user?.username || username}`
    );
  }, [user, username]);

  /**
   * Block user.
   */
  const handleBlock = useCallback(() => {
    if (!user?.username) {
      return;
    }

    Alert.alert(
      "Block user?",
      `You won't be able to see or interact with @${user.username}.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Block",
              "Block action is ready to connect to your backend."
            );
          },
        },
      ]
    );
  }, [user]);

  /**
   * Report user.
   */
  const handleReport = useCallback(() => {
    Alert.alert(
      "Report",
      "Choose a reason for reporting this profile.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Spam",
          onPress: () => {
            Alert.alert(
              "Report submitted",
              "Thank you for helping keep Snapgram safe."
            );
          },
        },
        {
          text: "Inappropriate",
          onPress: () => {
            Alert.alert(
              "Report submitted",
              "Thank you for helping keep Snapgram safe."
            );
          },
        },
      ]
    );
  }, []);

  /**
   * Open edit profile.
   */
  const openEditProfile = useCallback(() => {
    router.push(
      "/settings/profile/edit-profile"
    );
  }, []);

  /**
   * Profile menu.
   */
  const openProfileMenu = useCallback(() => {
    if (!user) {
      return;
    }

    const ownProfile = Boolean(
      user.isOwnProfile
    );

    const menuItems = [];

    if (!ownProfile) {
      menuItems.push({
        text: following
          ? "Unfollow"
          : "Follow",
        onPress: handleFollow,
      });

      menuItems.push({
        text: "Share profile",
        onPress: shareProfile,
      });

      menuItems.push({
        text: "Block",
        style: "destructive",
        onPress: handleBlock,
      });

      menuItems.push({
        text: "Report",
        style: "destructive",
        onPress: handleReport,
      });
    } else {
      menuItems.push({
        text: "Share profile",
        onPress: shareProfile,
      });

      menuItems.push({
        text: "Edit profile",
        onPress: openEditProfile,
      });
    }

    Alert.alert(
      `@${user.username}`,
      undefined,
      [
        ...menuItems,
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }, [
    following,
    handleBlock,
    handleFollow,
    handleReport,
    openEditProfile,
    shareProfile,
    user,
  ]);

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  /**
   * User not found.
   */
  if (!user) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <Ionicons
            name="person-outline"
            size={52}
            color={Colors.secondaryText}
          />

          <Text style={styles.errorTitle}>
            User not found
          </Text>

          <Text style={styles.errorMessage}>
            We couldn't find @
            {username || "this user"}.
          </Text>

          <TouchableOpacity
            style={styles.backAction}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    user.name ||
    user.fullName ||
    user.displayName ||
    user.username ||
    "User";

  const isVerified = Boolean(
    user.isVerified ??
      user.verified ??
      user.verification?.isVerified
  );

  const avatar =
    user.avatar ||
    user.avatarUrl ||
    user.profilePicture ||
    user.profileImage ||
    user.photoURL ||
    user.photoUrl ||
    user.image ||
    null;

  const avatarLetter =
    String(fullName)
      .charAt(0)
      .toUpperCase() || "U";

  const postCount = Number(
    user.postsCount ??
      user.postCount ??
      posts.length
  );

  const followersCount = Number(
    user.followersCount || 0
  );

  const followingCount = Number(
    user.followingCount || 0
  );

  const isOwnProfile = Boolean(
    user.isOwnProfile
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshProfile}
            />
          }
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={25}
                color={Colors.black}
              />
            </TouchableOpacity>

            <Text
              style={styles.headerUsername}
              numberOfLines={1}
            >
              {user.username}
            </Text>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={openProfileMenu}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Profile menu"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={25}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>

          {/* PROFILE TOP */}

          <View style={styles.profileTop}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                {avatar ? (
                  <Image
                    source={{
                      uri: avatar,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {avatarLetter}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {postCount}
                </Text>

                <Text style={styles.statLabel}>
                  posts
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stat}
                onPress={openFollowers}
                activeOpacity={0.65}
                accessibilityRole="button"
                accessibilityLabel="View followers"
              >
                <Text style={styles.statNumber}>
                  {followersCount}
                </Text>

                <Text style={styles.statLabel}>
                  followers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stat}
                onPress={openFollowing}
                activeOpacity={0.65}
                accessibilityRole="button"
                accessibilityLabel="View following"
              >
                <Text style={styles.statNumber}>
                  {followingCount}
                </Text>

                <Text style={styles.statLabel}>
                  following
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NAME / BIO */}

          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {fullName}
              </Text>

              {isVerified && (
                <VerifiedBadge
                  size={16}
                  style={styles.verifiedBadge}
                />
              )}
            </View>

            {!!user.bio && (
              <Text style={styles.bio}>
                {user.bio}
              </Text>
            )}

            {!!user.website && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text
                  style={styles.website}
                  numberOfLines={1}
                >
                  {user.website}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ACTION BUTTONS */}

          {!isOwnProfile && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.primaryAction,
                  following &&
                    styles.followingAction,
                ]}
                onPress={handleFollow}
                disabled={busy}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  following
                    ? "Unfollow user"
                    : "Follow user"
                }
              >
                {busy ? (
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
                      styles.primaryActionText,
                      following &&
                        styles.followingActionText,
                    ]}
                  >
                    {following
                      ? "Following"
                      : "Follow"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={openMessage}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Message user"
              >
                <Text
                  style={styles.secondaryActionText}
                >
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isOwnProfile && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryActionFull}
                onPress={openEditProfile}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Text
                  style={styles.secondaryActionText}
                >
                  Edit profile
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PROFILE TABS */}

          <View style={styles.tabs}>
            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Posts"
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={Colors.black}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Reels"
            >
              <Ionicons
                name="play-outline"
                size={25}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Tagged"
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* POSTS */}

          {posts.length > 0 ? (
            <ProfileGrid
              posts={posts}
              onPostPress={openPost}
            />
          ) : (
            <View style={styles.empty}>
              <View
                style={styles.emptyIconCircle}
              >
                <Ionicons
                  name="camera-outline"
                  size={42}
                  color={Colors.black}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Posts Yet
              </Text>

              <Text style={styles.emptyText}>
                When{" "}
                {isOwnProfile
                  ? "you"
                  : `@${user.username}`}{" "}
                shares photos and videos,
                they'll appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  header: {
    height: 52,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
  },

  headerButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  headerUsername: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.black,
  },

  profileTop: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 92,
    height: 92,
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.black,
  },

  stats: {
    flex: 1,
    marginLeft: 14,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  stat: {
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.black,
  },

  statLabel: {
    marginTop: 3,
    fontSize: 13,
    color: Colors.black,
  },

  identity: {
    paddingHorizontal: 16,
    marginTop: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.black,
  },

  verifiedBadge: {
    marginLeft: 4,
  },

  bio: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.black,
  },

  website: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },

  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },

  primaryAction: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  followingAction: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  primaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },

  followingActionText: {
    color: Colors.black,
  },

  secondaryAction: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },

  secondaryActionFull: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.black,
  },

  tabs: {
    height: 48,
    marginTop: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.border,
    flexDirection: "row",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.black,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
    color: Colors.secondaryText,
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "700",
    color: Colors.black,
  },

  errorMessage: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: Colors.secondaryText,
  },

  backAction: {
    marginTop: 18,
    minWidth: 110,
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },

  backText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
});