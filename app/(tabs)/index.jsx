import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import PostCard from "../../components/post/PostCard";
import StoryTray from "../../components/story/StoryTray";

import { getHomeFeed } from "../../services/feedService";
import { getStories } from "../../services/storyService";

import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /*
   * --------------------------------------------------
   * NORMALIZERS
   * --------------------------------------------------
   */

  const normalizePosts = useCallback((response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.posts)) {
      return response.posts;
    }

    if (Array.isArray(response?.data?.posts)) {
      return response.data.posts;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }, []);

  const normalizeStories = useCallback((response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.stories)) {
      return response.stories;
    }

    if (Array.isArray(response?.data?.stories)) {
      return response.data.stories;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }, []);

  /*
   * --------------------------------------------------
   * LOAD HOME
   * --------------------------------------------------
   */

  const loadHome = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!user) {
        setPosts([]);
        setStories([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [feedResult, storiesResult] =
          await Promise.allSettled([
            getHomeFeed(),
            getStories(),
          ]);

        /*
         * ------------------------------
         * FEED
         * ------------------------------
         */

        if (feedResult.status === "fulfilled") {
          const normalizedPosts = normalizePosts(
            feedResult.value
          );

          setPosts(normalizedPosts);
        } else {
          console.error(
            "HOME FEED ERROR:",
            feedResult.reason
          );

          setError(
            "We couldn't load your feed. Please try again."
          );
        }

        /*
         * ------------------------------
         * STORIES
         * ------------------------------
         */

        if (storiesResult.status === "fulfilled") {
          const normalizedStories = normalizeStories(
            storiesResult.value
          );

          setStories(normalizedStories);
        } else {
          console.error(
            "STORIES ERROR:",
            storiesResult.reason
          );

          /*
           * Stories should not break the entire
           * home feed if the stories request fails.
           */
          setStories([]);
        }
      } catch (err) {
        console.error("LOAD HOME ERROR:", err);

        setError(
          "Something went wrong while loading your feed."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, normalizePosts, normalizeStories]
  );

  /*
   * --------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------
   */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadHome();
  }, [authLoading, loadHome]);

  /*
   * --------------------------------------------------
   * REFRESH
   * --------------------------------------------------
   */

  const handleRefresh = useCallback(() => {
    loadHome({ isRefresh: true });
  }, [loadHome]);

  /*
   * --------------------------------------------------
   * NAVIGATION
   * --------------------------------------------------
   */

  const handleCreate = useCallback(() => {
    router.push({
      pathname: "/(tabs)/create",
      params: {
        mode: "post",
      },
    });
  }, [router]);

  const handleCreateStory = useCallback(() => {
    router.push({
      pathname: "/(tabs)/create",
      params: {
        mode: "story",
      },
    });
  }, [router]);

  const handleNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handleMessages = useCallback(() => {
    router.push("/messages");
  }, [router]);

  const handleExplore = useCallback(() => {
    router.push("/(tabs)/explore");
  }, [router]);

  /*
   * --------------------------------------------------
   * STORY PRESS
   * --------------------------------------------------
   */

  const handleStoryPress = useCallback(
    (story) => {
      const storyId =
        story?._id ||
        story?.id ||
        story?.storyId;

      if (!storyId) {
        console.warn(
          "Cannot open story: missing story ID"
        );
        return;
      }

      router.push(`/stories/${storyId}`);
    },
    [router]
  );

  /*
   * --------------------------------------------------
   * POST PRESS
   * --------------------------------------------------
   */

  const handlePostPress = useCallback(
    (post) => {
      const postId =
        post?._id ||
        post?.id ||
        post?.postId;

      if (!postId) {
        return;
      }

      router.push(`/post/${postId}`);
    },
    [router]
  );

  /*
   * --------------------------------------------------
   * POST RENDERER
   * --------------------------------------------------
   */

  const renderPost = useCallback(
    ({ item }) => {
      if (!item) {
        return null;
      }

      return (
        <PostCard
          post={item}
          onPress={() => handlePostPress(item)}
        />
      );
    },
    [handlePostPress]
  );

  /*
   * --------------------------------------------------
   * EMPTY / ERROR CONTENT
   * --------------------------------------------------
   */

  const renderEmpty = useCallback(() => {
    /*
     * Initial loading
     */
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="small"
            color="#111111"
          />

          <Text style={styles.emptyTitle}>
            Loading your feed
          </Text>

          <Text style={styles.emptySubtitle}>
            Getting the latest posts for you.
          </Text>
        </View>
      );
    }

    /*
     * Authentication not ready
     */
    if (!user) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="person-outline"
              size={28}
              color="#111111"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Sign in to continue
          </Text>

          <Text style={styles.emptySubtitle}>
            Log in to see posts and stories from people
            you follow.
          </Text>
        </View>
      );
    }

    /*
     * Error state
     */
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={28}
              color="#111111"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Couldn't load your feed
          </Text>

          <Text style={styles.emptySubtitle}>
            {error}
          </Text>

          <Pressable
            onPress={() => loadHome()}
            style={styles.retryButton}
            android_ripple={{
              color: "#E5E5E5",
            }}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    /*
     * No posts
     */
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="images-outline"
            size={28}
            color="#111111"
          />
        </View>

        <Text style={styles.emptyTitle}>
          Your feed is empty
        </Text>

        <Text style={styles.emptySubtitle}>
          Follow people and discover new accounts to see
          their posts here.
        </Text>

        <Pressable
          onPress={handleExplore}
          style={styles.exploreButton}
          android_ripple={{
            color: "#E5E5E5",
          }}
        >
          <Text style={styles.exploreText}>
            Discover people
          </Text>
        </Pressable>
      </View>
    );
  }, [
    loading,
    user,
    error,
    loadHome,
    handleExplore,
  ]);

  /*
   * --------------------------------------------------
   * HEADER
   * --------------------------------------------------
   */

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerWrapper}>
        {/* -------------------------------------------
            TOP NAVIGATION
        -------------------------------------------- */}

        <View style={styles.header}>
          <Pressable
            onPress={handleCreate}
            style={styles.headerButton}
            hitSlop={8}
            android_ripple={{
              color: "#EDEDED",
              borderless: true,
            }}
            accessibilityRole="button"
            accessibilityLabel="Create"
          >
            <Ionicons
              name="add-outline"
              size={29}
              color="#111111"
            />
          </Pressable>

          <Text
            style={styles.logo}
            numberOfLines={1}
          >
            Snapgram
          </Text>

          <View style={styles.headerRight}>
            <Pressable
              onPress={handleNotifications}
              style={styles.headerButton}
              hitSlop={8}
              android_ripple={{
                color: "#EDEDED",
                borderless: true,
              }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name="heart-outline"
                size={27}
                color="#111111"
              />
            </Pressable>

            <Pressable
              onPress={handleMessages}
              style={styles.headerButton}
              hitSlop={8}
              android_ripple={{
                color: "#EDEDED",
                borderless: true,
              }}
              accessibilityRole="button"
              accessibilityLabel="Messages"
            >
              <Ionicons
                name="chatbubble-outline"
                size={25}
                color="#111111"
              />
            </Pressable>
          </View>
        </View>

        {/* -------------------------------------------
            STORIES
        -------------------------------------------- */}

        <View style={styles.storiesSection}>
          <StoryTray
            stories={stories}
            onStoryPress={handleStoryPress}
            onCreateStory={handleCreateStory}
          />
        </View>
      </View>
    );
  }, [
    stories,
    handleCreate,
    handleCreateStory,
    handleStoryPress,
    handleNotifications,
    handleMessages,
  ]);

  /*
   * --------------------------------------------------
   * MAIN UI
   * --------------------------------------------------
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <FlatList
        data={posts}
        keyExtractor={(item, index) =>
          String(
            item?._id ||
              item?.id ||
              item?.postId ||
              `post-${index}`
          )
        }
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          posts.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
            colors={["#111111"]}
          />
        }
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  listContent: {
    paddingBottom: 24,
  },

  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /*
   * HEADER
   */

  headerWrapper: {
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DBDBDB",
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  logo: {
    position: "absolute",
    left: 70,
    right: 70,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: "#111111",
  },

  headerRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  /*
   * STORIES
   */

  storiesSection: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DBDBDB",
    paddingBottom: 2,
  },

  /*
   * EMPTY STATE
   */

  emptyContainer: {
    flex: 1,
    minHeight: 360,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    marginBottom: 7,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    color: "#111111",
  },

  emptySubtitle: {
    maxWidth: 300,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
  },

  retryButton: {
    minWidth: 100,
    height: 38,
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
  },

  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },

  exploreButton: {
    minWidth: 140,
    height: 38,
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095F6",
  },

  exploreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});