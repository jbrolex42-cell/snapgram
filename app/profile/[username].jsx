import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

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
  getFollowStatus,
  unfollowUser,
} from "../../services/followService";

import ProfileGrid from "../../components/profile/ProfileGrid";
import VerifiedBadge from "../../components/common/VerifiedBadge";

function getId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return (
    value._id ||
    value.id ||
    value.userId ||
    null
  );
}


function getUsername(user, fallback = "") {
  const value =
    user?.username ||
    user?.profile?.username ||
    fallback;

  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function getFullName(user) {
  const candidates = [
    user?.fullName,
    user?.name,
    user?.displayName,
    user?.profile?.fullName,
    user?.profile?.name,
  ];

  const username = getUsername(user);

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();

    if (!value) continue;

    if (
      username &&
      value.toLowerCase() === username.toLowerCase()
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
    user?.profile?.avatar ||
    user?.profileImage ||
    user?.profilePicture ||
    user?.photoURL ||
    null
  );
}


function getBio(user) {
  return (
    user?.bio ||
    user?.profile?.bio ||
    ""
  );
}


function getWebsite(user) {
  return (
    user?.website ||
    user?.profile?.website ||
    ""
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


function getFollowingCount(user) {
  return Number(
    user?.followingCount ??
    user?.followingsCount ??
    user?.following?.length ??
    0
  );
}


function getPostCount(user, posts = []) {
  return Number(
    user?.postsCount ??
    user?.postCount ??
    posts.length ??
    0
  );
}


function isVerifiedUser(user) {
  return Boolean(
    user?.isVerified ||
    user?.verified ||
    user?.verification?.isVerified ||
    user?.verification?.verified
  );
}

function isReelPost(post) {
  if (!post) {
    return false;
  }

  if (post.isReel === true) {
    return true;
  }

  const type = String(
    post.type ||
    post.mediaType ||
    post.contentType ||
    ""
  ).toLowerCase();

  if (
    type === "reel" ||
    type === "reels"
  ) {
    return true;
  }

  const firstMedia = Array.isArray(post.media)
    ? post.media[0]
    : post.media;

  const mediaType = String(
    firstMedia?.type ||
    firstMedia?.mediaType ||
    firstMedia?.contentType ||
    ""
  ).toLowerCase();

  return (
    mediaType === "reel" ||
    mediaType === "video/reel"
  );
}


function isTaggedPost(post, username) {
  if (!post || !username) {
    return false;
  }

  const normalizedUsername = username.toLowerCase();

  const taggedUsers =
    post.taggedUsers ||
    post.tags ||
    post.mentions ||
    [];

  if (!Array.isArray(taggedUsers)) {
    return false;
  }

  return taggedUsers.some((item) => {
    const taggedUsername = String(
      item?.username ||
      item?.user?.username ||
      item?.name ||
      item ||
      ""
    )
      .replace(/^@/, "")
      .toLowerCase();

    return taggedUsername === normalizedUsername;
  });
}

export default function UserProfileScreen() {
  const params = useLocalSearchParams();

  const routeUsername = Array.isArray(params.username)
    ? params.username[0]
    : params.username;

  const username = String(
    routeUsername || ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  const [profile, setProfile] = useState(null);

  const [posts, setPosts] = useState([]);

  const [activeTab, setActiveTab] = useState("posts");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [followLoading, setFollowLoading] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  const [isRequested, setIsRequested] = useState(false);

  const loadProfile = useCallback(
    async (showLoader = true) => {
      if (!username) {
        setError("Invalid username.");
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const [profileResponse, postsResponse] =
          await Promise.all([
            getUserProfile(username),
            getUserPosts(username),
          ]);

        const loadedProfile =
          profileResponse?.user ||
          profileResponse?.profile ||
          profileResponse?.data ||
          profileResponse;

        const loadedPosts =
          postsResponse?.posts ||
          postsResponse?.data ||
          (Array.isArray(postsResponse)
            ? postsResponse
            : []);

        setProfile(loadedProfile || null);

        setPosts(
          Array.isArray(loadedPosts)
            ? loadedPosts
            : []
        );

        const targetUserId = getId(loadedProfile);

        if (targetUserId) {
          try {
            const statusResponse =
              await getFollowStatus(targetUserId);

            const following =
              statusResponse?.isFollowing ??
              statusResponse?.following ??
              statusResponse?.data?.isFollowing ??
              false;

            const requested =
              statusResponse?.isRequested ??
              statusResponse?.requested ??
              statusResponse?.data?.isRequested ??
              false;

            setIsFollowing(Boolean(following));
            setIsRequested(Boolean(requested));
          } catch (followError) {
            console.log(
              "FOLLOW STATUS ERROR:",
              followError
            );
          }
        }
      } catch (loadError) {
        console.error(
          "PROFILE LOAD ERROR:",
          loadError
        );

        setError(
          loadError?.response?.data?.message ||
          "Unable to load this profile."
        );
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile(false);
    }, [loadProfile])
  );

  const handleRefresh = useCallback(
    async () => {
      try {
        setRefreshing(true);
        await loadProfile(false);
      } finally {
        setRefreshing(false);
      }
    },
    [loadProfile]
  );

  const user = profile || {};

  const displayUsername =
    getUsername(user, username);

  const fullName =
    getFullName(user);

  const avatar =
    getAvatar(user);

  const bio =
    getBio(user);

  const website =
    getWebsite(user);

  const verified =
    isVerifiedUser(user);

  const followersCount =
    getFollowersCount(user);

  const followingCount =
    getFollowingCount(user);

  const postCount =
    getPostCount(user, posts);

  const visiblePosts = useMemo(() => {
    if (activeTab === "posts") {
      return posts.filter(
        (post) => !isReelPost(post)
      );
    }

    if (activeTab === "reels") {
      return posts.filter(
        (post) => isReelPost(post)
      );
    }

    if (activeTab === "tagged") {
      return posts.filter(
        (post) =>
          isTaggedPost(
            post,
            displayUsername
          )
      );
    }

    return posts;
  }, [
    activeTab,
    posts,
    displayUsername,
  ]);

  const handleFollow = useCallback(
    async () => {
      const targetUserId =
        getId(profile);

      if (!targetUserId) {
        Alert.alert(
          "Unable to follow",
          "This profile does not have a valid user ID."
        );
        return;
      }

      if (followLoading) {
        return;
      }

      try {
        setFollowLoading(true);

        if (isFollowing) {
          await unfollowUser(
            targetUserId
          );

          setIsFollowing(false);
          setIsRequested(false);
        } else {
          const response =
            await followUser(
              targetUserId
            );

          const requested =
            response?.isRequested ??
            response?.requested ??
            response?.status === "requested" ??
            false;

          const following =
            response?.isFollowing ??
            response?.following ??
            response?.status === "following" ??
            !requested;

          setIsFollowing(
            Boolean(following)
          );

          setIsRequested(
            Boolean(requested)
          );
        }
      } catch (followError) {
        console.error(
          "FOLLOW ERROR:",
          followError
        );

        Alert.alert(
          "Something went wrong",
          followError?.response?.data?.message ||
          "Unable to update follow status."
        );
      } finally {
        setFollowLoading(false);
      }
    },
    [
      profile,
      followLoading,
      isFollowing,
    ]
  );

  const handleMessage = useCallback(() => {
    const targetUserId =
      getId(profile);

    if (!targetUserId) {
      Alert.alert(
        "Unable to message",
        "This profile does not have a valid user ID."
      );
      return;
    }

    router.push({
      pathname: "/messages/new",
      params: {
        userId: String(targetUserId),
        username: displayUsername,
      },
    });
  }, [
    profile,
    displayUsername,
  ]);

  const handleMenu = useCallback(() => {
    Alert.alert(
      displayUsername
        ? `@${displayUsername}`
        : "Profile",
      undefined,
      [
        {
          text: "Share profile",
          onPress: () => {
            Alert.alert(
              "Share profile",
              `Share @${displayUsername}`
            );
          },
        },
        {
          text: "Report",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Report",
              "Reporting will be connected to the backend here."
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }, [
    displayUsername,
  ]);

  const openPost = useCallback(
    (post) => {
      const postId =
        getId(post);

      if (!postId) {
        return;
      }

      if (isReelPost(post)) {
        router.push({
          pathname: "/reels/[id]",
          params: {
            id: String(postId),
          },
        });

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

  const openWebsite = useCallback(() => {
    if (!website) {
      return;
    }

    Alert.alert(
      "Website",
      website
    );
  }, [
    website,
  ]);

  if (loading && !profile) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.secondaryText}
          />

          <Text style={styles.errorTitle}>
            Profile unavailable
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadProfile(true)}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={Colors.text}
          />
        </Pressable>

        <Text
          style={styles.headerUsername}
          numberOfLines={1}
        >
          @{displayUsername}
        </Text>

        <Pressable
          style={styles.headerButton}
          onPress={handleMenu}
          hitSlop={10}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={Colors.text}
          />
        </Pressable>
      </View>


      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                            */}
      {/* ------------------------------------------------------------------ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* -------------------------------------------------------------- */}
        {/* PROFILE HEADER                                                 */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.profileSection}>
          {/* Avatar */}

          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image
                source={{
                  uri: avatar,
                }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={styles.avatarPlaceholder}
              >
                <Ionicons
                  name="person"
                  size={46}
                  color={
                    Colors.secondaryText
                  }
                />
              </View>
            )}
          </View>


          {/* Stats */}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {postCount}
              </Text>

              <Text style={styles.statLabel}>
                Posts
              </Text>
            </View>

            <Pressable
              style={styles.stat}
              onPress={() =>
                router.push({
                  pathname:
                    "/profile/followers",
                  params: {
                    userId: String(
                      getId(profile) || ""
                    ),
                  },
                })
              }
            >
              <Text style={styles.statNumber}>
                {followersCount}
              </Text>

              <Text style={styles.statLabel}>
                Followers
              </Text>
            </Pressable>

            <Pressable
              style={styles.stat}
              onPress={() =>
                router.push({
                  pathname:
                    "/profile/following",
                  params: {
                    userId: String(
                      getId(profile) || ""
                    ),
                  },
                })
              }
            >
              <Text style={styles.statNumber}>
                {followingCount}
              </Text>

              <Text style={styles.statLabel}>
                Following
              </Text>
            </Pressable>
          </View>
        </View>


        {/* -------------------------------------------------------------- */}
        {/* IDENTITY                                                        */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.identity}>
          {/* Full name + verified badge */}

          <View style={styles.nameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {fullName}
            </Text>

            {verified && (
              <VerifiedBadge
                size={17}
                style={styles.verifiedBadge}
              />
            )}
          </View>


          {/* Username */}

          <Text
            style={styles.username}
            numberOfLines={1}
          >
            @{displayUsername}
          </Text>


          {/* Bio */}

          {!!bio && (
            <Text style={styles.bio}>
              {bio}
            </Text>
          )}


          {/* Website */}

          {!!website && (
            <Pressable
              onPress={openWebsite}
              style={styles.websiteRow}
            >
              <Ionicons
                name="link-outline"
                size={15}
                color={Colors.primary}
              />

              <Text
                style={styles.website}
                numberOfLines={1}
              >
                {website}
              </Text>
            </Pressable>
          )}
        </View>


        {/* -------------------------------------------------------------- */}
        {/* ACTIONS                                                         */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primaryAction,
              isFollowing &&
                styles.followingButton,
              isRequested &&
                styles.requestedButton,
            ]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  isFollowing
                    ? Colors.text
                    : "#FFFFFF"
                }
              />
            ) : (
              <Text
                style={[
                  styles.primaryActionText,
                  isFollowing &&
                    styles.followingText,
                  isRequested &&
                    styles.requestedText,
                ]}
              >
                {isFollowing
                  ? "Following"
                  : isRequested
                    ? "Requested"
                    : "Follow"}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.messageButton}
            onPress={handleMessage}
          >
            <Text style={styles.messageText}>
              Message
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionIconButton}
            onPress={handleMenu}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color={Colors.text}
            />
          </Pressable>
        </View>


        {/* -------------------------------------------------------------- */}
        {/* TABS                                                            */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "posts" &&
                styles.activeTab,
            ]}
            onPress={() =>
              setActiveTab("posts")
            }
          >
            <Ionicons
              name={
                activeTab === "posts"
                  ? "grid"
                  : "grid-outline"
              }
              size={24}
              color={
                activeTab === "posts"
                  ? Colors.text
                  : Colors.secondaryText
              }
            />
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === "reels" &&
                styles.activeTab,
            ]}
            onPress={() =>
              setActiveTab("reels")
            }
          >
            <Ionicons
              name={
                activeTab === "reels"
                  ? "play-circle"
                  : "play-circle-outline"
              }
              size={25}
              color={
                activeTab === "reels"
                  ? Colors.text
                  : Colors.secondaryText
              }
            />
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === "tagged" &&
                styles.activeTab,
            ]}
            onPress={() =>
              setActiveTab("tagged")
            }
          >
            <Ionicons
              name={
                activeTab === "tagged"
                  ? "person"
                  : "person-outline"
              }
              size={24}
              color={
                activeTab === "tagged"
                  ? Colors.text
                  : Colors.secondaryText
              }
            />
          </Pressable>
        </View>


        {/* -------------------------------------------------------------- */}
        {/* POSTS                                                           */}
        {/* -------------------------------------------------------------- */}

        <View style={styles.gridContainer}>
          {visiblePosts.length > 0 ? (
            <ProfileGrid
              posts={visiblePosts}
              onPostPress={openPost}
            />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    activeTab === "reels"
                      ? "play-outline"
                      : activeTab === "tagged"
                        ? "person-outline"
                        : "camera-outline"
                  }
                  size={34}
                  color={
                    Colors.secondaryText
                  }
                />
              </View>

              <Text style={styles.emptyTitle}>
                {activeTab === "reels"
                  ? "No reels yet"
                  : activeTab === "tagged"
                    ? "No tagged posts"
                    : "No posts yet"}
              </Text>

              <Text style={styles.emptyText}>
                {activeTab === "reels"
                  ? "Reels shared by this account will appear here."
                  : activeTab === "tagged"
                    ? "Posts where this account is tagged will appear here."
                    : "Posts shared by this account will appear here."}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      Colors.background || "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color:
      Colors.secondaryText || "#737373",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color:
      Colors.secondaryText || "#737373",
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor:
      Colors.primary || "#0095F6",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor:
      Colors.border || "#DBDBDB",
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerUsername: {
    flex: 1,
    marginHorizontal: 10,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor:
      Colors.surface || "#F2F2F2",
  },

  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.surface || "#F2F2F2",
  },

  stats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 18,
  },

  stat: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 65,
  },

  statNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },

  statLabel: {
    marginTop: 3,
    fontSize: 13,
    color:
      Colors.secondaryText || "#737373",
  },

  identity: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },

  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  verifiedBadge: {
    marginLeft: 5,
  },

  username: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "400",
    color:
      Colors.secondaryText || "#737373",
  },

  bio: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    maxWidth: "100%",
  },

  website: {
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color:
      Colors.primary || "#0095F6",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },

  primaryAction: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor:
      Colors.primary || "#0095F6",
  },

  primaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  followingButton: {
    backgroundColor:
      Colors.surface || "#EFEFEF",
  },

  followingText: {
    color: Colors.text,
  },

  requestedButton: {
    backgroundColor:
      Colors.surface || "#EFEFEF",
  },

  requestedText: {
    color: Colors.text,
  },

  messageButton: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor:
      Colors.surface || "#EFEFEF",
  },

  messageText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  actionIconButton: {
    width: 40,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor:
      Colors.surface || "#EFEFEF",
  },

  tabs: {
    flexDirection: "row",
    height: 48,
    marginTop: 18,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderTopColor:
      Colors.border || "#DBDBDB",
    borderBottomColor:
      Colors.border || "#DBDBDB",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor: Colors.text,
  },

  gridContainer: {
    minHeight: 220,
  },

  emptyState: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      Colors.border || "#DBDBDB",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color:
      Colors.secondaryText || "#737373",
  },

  bottomSpace: {
    height: 30,
  },
});