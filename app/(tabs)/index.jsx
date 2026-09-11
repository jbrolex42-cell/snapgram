import React, {
  useCallback,
  useEffect,
  useRef,
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
import { router } from "expo-router";

import PostCard from "../../components/post/PostCard";
import StoryTray from "../../components/story/StoryTray";

import { getHomeFeed } from "../../services/feedService";
import { getStories } from "../../services/storyService";

import { useAuth } from "../../context/AuthContext";

function normalizePosts(response) {
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
}

function normalizeStories(response) {
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
}

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();

  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadHome = useCallback(
    async ({ refresh = false } = {}) => {
      if (loadingRef.current && !refresh) {
        return;
      }

      if (!user) {
        if (!mountedRef.current) {
          return;
        }

        setPosts([]);
        setStories([]);
        setError("");
        setLoading(false);
        setRefreshing(false);

        return;
      }

      loadingRef.current = true;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const results =
          await Promise.allSettled([
            getHomeFeed(),
            getStories(),
          ]);

        if (!mountedRef.current) {
          return;
        }

        const feedResult = results[0];

        if (feedResult.status === "fulfilled") {
          const nextPosts =
            normalizePosts(
              feedResult.value
            );

          setPosts(nextPosts);
        } else {
          console.error(
            "HOME FEED ERROR:",
            feedResult.reason
          );

          if (!refresh) {
            setPosts([]);
          }

          setError(
            "We couldn't load your feed."
          );
        }

        const storiesResult = results[1];

        if (
          storiesResult.status ===
          "fulfilled"
        ) {
          setStories(
            normalizeStories(
              storiesResult.value
            )
          );
        } else {
          console.error(
            "STORIES ERROR:",
            storiesResult.reason
          );

          setStories([]);
        }
      } catch (error) {
        console.error(
          "LOAD HOME ERROR:",
          error
        );

        if (mountedRef.current) {
          setError(
            "Something went wrong while loading your feed."
          );
        }
      } finally {
        loadingRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadHome();
  }, [authLoading, loadHome]);

  const handleRefresh = useCallback(() => {
    loadHome({
      refresh: true,
    });
  }, [loadHome]);

  const handleCreate = useCallback(() => {
    router.push({
      pathname: "/(tabs)/create",
      params: {
        mode: "post",
      },
    });
  }, []);

  const handleCreateStory = useCallback(() => {
    router.push({
      pathname: "/(tabs)/create",
      params: {
        mode: "story",
      },
    });
  }, []);

  const handleNotifications = useCallback(() => {
    router.push("/notifications");
  }, []);

  const handleMessages = useCallback(() => {
    router.push("/messages");
  }, []);

  const handleExplore = useCallback(() => {
    router.push("/(tabs)/explore");
  }, []);

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

      router.push(
        `/stories/${storyId}`
      );
    },
    []
  );

  const handlePostPress = useCallback(
    (post) => {
      const postId =
        post?._id ||
        post?.id ||
        post?.postId;

      if (!postId) {
        return;
      }

      router.push(
        `/post/${postId}`
      );
    },
    []
  );

  const renderPost = useCallback(
    ({ item }) => {
      if (!item) {
        return null;
      }

      return (
        <PostCard
          post={item}
          onPress={() =>
            handlePostPress(item)
          }
        />
      );
    },
    [handlePostPress]
  );

  const getPostKey = useCallback(
    (item, index) => {
      return String(
        item?._id ||
          item?.id ||
          item?.postId ||
          `post-${index}`
      );
    },
    []
  );

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>

        <View style={styles.header}>
          <Pressable
            onPress={handleCreate}
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerButton,
              pressed &&
                styles.headerButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create post"
          >
            <Ionicons
              name="add-outline"
              size={29}
              color="#000"
            />
          </Pressable>

          <Text style={styles.logo}>
            Snapgram
          </Text>

          <View style={styles.headerActions}>
            <Pressable
              onPress={
                handleNotifications
              }
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerButton,
                pressed &&
                  styles.headerButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name="heart-outline"
                size={27}
                color="#000"
              />
            </Pressable>

            <Pressable
              onPress={handleMessages}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerButton,
                pressed &&
                  styles.headerButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Messages"
            >
              <Ionicons
                name="chatbubble-outline"
                size={25}
                color="#000"
              />
            </Pressable>
          </View>
        </View>

        {stories.length > 0 ? (
          <View style={styles.storyContainer}>
            <StoryTray
              stories={stories}
              onStoryPress={
                handleStoryPress
              }
              onCreateStory={
                handleCreateStory
              }
            />
          </View>
        ) : (
          <View style={styles.storyEmpty}>
            <Pressable
              onPress={
                handleCreateStory
              }
              style={({ pressed }) => [
                styles.createStoryButton,
                pressed &&
                  styles.createStoryPressed,
              ]}
            >
              <View style={styles.createStoryIcon}>
                <Ionicons
                  name="add"
                  size={24}
                  color="#000"
                />
              </View>

              <Text
                style={styles.createStoryText}
              >
                Your story
              </Text>
            </Pressable>
          </View>
        )}

        {!!error && posts.length > 0 && (
          <Pressable
            onPress={() =>
              loadHome()
            }
            style={styles.errorStrip}
          >
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color="#000"
            />

            <Text
              style={styles.errorStripText}
            >
              Couldn't refresh your feed.
              Tap to retry.
            </Text>
          </Pressable>
        )}
      </View>
    );
  }, [
    stories,
    posts.length,
    error,
    handleCreate,
    handleCreateStory,
    handleStoryPress,
    handleNotifications,
    handleMessages,
    loadHome,
  ]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator
            size="small"
            color="#000"
          />

          <Text style={styles.emptyTitle}>
            Loading
          </Text>
        </View>
      );
    }

    if (!user) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyCircle}>
            <Ionicons
              name="person-outline"
              size={28}
              color="#000"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Sign in to continue
          </Text>

          <Text style={styles.emptySubtitle}>
            Log in to see posts from
            people you follow.
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyCircle}>
            <Ionicons
              name="cloud-offline-outline"
              size={28}
              color="#000"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Couldn't load your feed
          </Text>

          <Text style={styles.emptySubtitle}>
            Check your connection and
            try again.
          </Text>

          <Pressable
            onPress={() =>
              loadHome()
            }
            style={({ pressed }) => [
              styles.retryButton,
              pressed &&
                styles.retryPressed,
            ]}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View style={styles.emptyCircle}>
          <Ionicons
            name="images-outline"
            size={29}
            color="#000"
          />
        </View>

        <Text style={styles.emptyTitle}>
          Your feed is empty
        </Text>

        <Text style={styles.emptySubtitle}>
          Follow people to see their
          photos and videos here.
        </Text>

        <Pressable
          onPress={handleExplore}
          style={({ pressed }) => [
            styles.exploreButton,
            pressed &&
              styles.explorePressed,
          ]}
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

  const renderFooter = useCallback(() => {
    if (
      loading ||
      refreshing ||
      posts.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color="#8e8e8e"
        />

        <Text style={styles.footerText}>
          You're all caught up
        </Text>
      </View>
    );
  }, [
    loading,
    refreshing,
    posts.length,
  ]);

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <View style={styles.authLoading}>
          <Text style={styles.logo}>
            Snapgram
          </Text>

          <ActivityIndicator
            size="small"
            color="#000"
            style={styles.authSpinner}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={getPostKey}
        ListHeaderComponent={
          renderHeader
        }
        ListEmptyComponent={
          renderEmpty
        }
        ListFooterComponent={
          renderFooter
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          posts.length === 0
            ? styles.emptyList
            : styles.feedList
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
            colors={["#000"]}
          />
        }
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={5}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  feedList: {
    paddingBottom: 24,
  },

  emptyList: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  authSpinner: {
    marginTop: 18,
  },

  headerContainer: {
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  logo: {
    position: "absolute",
    left: 72,
    right: 72,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#000",
  },

  headerActions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonPressed: {
    backgroundColor: "#f2f2f2",
  },

  storyContainer: {
    backgroundColor: "#fff",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  storyEmpty: {
    height: 108,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    justifyContent: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  createStoryButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  createStoryIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },

  createStoryText: {
    marginTop: 6,
    fontSize: 11,
    color: "#000",
    fontWeight: "500",
  },

  createStoryPressed: {
    opacity: 0.65,
  },

  errorStrip: {
    minHeight: 38,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#fafafa",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  errorStripText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },

  empty: {
    minHeight: 390,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },

  emptySubtitle: {
    maxWidth: 300,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    textAlign: "center",
  },

  retryButton: {
    minWidth: 100,
    height: 38,
    marginTop: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
  },

  retryPressed: {
    opacity: 0.65,
  },

  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },

  exploreButton: {
    minWidth: 145,
    height: 38,
    marginTop: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  explorePressed: {
    opacity: 0.7,
  },

  exploreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  footer: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  footerText: {
    fontSize: 12,
    color: "#8e8e8e",
  },
});