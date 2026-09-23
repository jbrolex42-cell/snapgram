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
import {
  router,
  useFocusEffect,
} from "expo-router";

import PostCard from "../../components/post/PostCard";
import StoryTray from "../../components/story/StoryTray";

import {
  getHomeFeed,
} from "../../services/feedService";

import {
  getStories,
} from "../../services/storyService";

import {
  useAuth,
} from "../../context/AuthContext";

const FEED_LIMIT = 15;

const COLORS = {
  background: "#FFFFFF",
  text: "#000000",
  secondary: "#737373",
  muted: "#8E8E8E",
  border: "#DBDBDB",
  light: "#F5F5F5",
  blue: "#0095F6",
};

function getId(
  item,
  fallback = ""
) {
  return String(
    item?._id ||
      item?.id ||
      item?.postId ||
      item?.storyId ||
      fallback
  );
}

function normalizePosts(
  response
) {
  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.posts
    )
  ) {
    return response.posts;
  }

  if (
    Array.isArray(
      response?.data?.posts
    )
  ) {
    return response.data.posts;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
}

function normalizeStories(
  response
) {
  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.stories
    )
  ) {
    return response.stories;
  }

  if (
    Array.isArray(
      response?.data?.stories
    )
  ) {
    return response.data.stories;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
}

function getPagination(
  response
) {
  if (
    response?.pagination &&
    typeof response.pagination ===
      "object"
  ) {
    return response.pagination;
  }

  if (
    response?.data?.pagination &&
    typeof response.data.pagination ===
      "object"
  ) {
    return response.data.pagination;
  }

  return {
    limit:
      FEED_LIMIT,
    hasMore:
      false,
    nextCursor:
      null,
  };
}

function getErrorMessage(
  error
) {
  const status =
    error?.response?.status;

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You don't have permission to view this feed.";
  }

  if (status >= 500) {
    return "The server is temporarily unavailable.";
  }

  const message =
    error?.message
      ?.toLowerCase?.() ||
    "";

  if (
    message.includes(
      "network"
    ) ||
    message.includes(
      "timeout"
    ) ||
    message.includes(
      "connection"
    )
  ) {
    return "Check your internet connection and try again.";
  }

  return "We couldn't load your feed. Please try again.";
}

function mergeUniquePosts(
  existingPosts,
  incomingPosts
) {
  const seen =
    new Set();

  const merged = [];

  [
    ...existingPosts,
    ...incomingPosts,
  ].forEach(
    (post, index) => {
      if (!post) {
        return;
      }

      const id =
        getId(
          post,
          `fallback-${index}`
        );

      if (
        !id ||
        seen.has(id)
      ) {
        return;
      }

      seen.add(id);

      merged.push(
        post
      );
    }
  );

  return merged;
}

export default function HomeScreen() {
  const {
    user,
    loading:
      authLoading,
  } = useAuth();

  const mountedRef =
    useRef(true);

  const initialRequestRef =
    useRef(false);

  const loadingMoreRef =
    useRef(false);

  const [
    posts,
    setPosts,
  ] = useState([]);

  const [
    stories,
    setStories,
  ] = useState([]);

  /*
   * Cursor for the next feed request.
   *
   * null = first page.
   */
  const [
    nextCursor,
    setNextCursor,
  ] = useState(null);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    feedError,
    setFeedError,
  ] = useState("");

  const [
    storyError,
    setStoryError,
  ] = useState("");

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;
    };
  }, []);

  /*
   * Initial Home load / refresh.
   */
  const loadHome =
    useCallback(
      async ({
        refresh = false,
      } = {}) => {
        if (!user) {
          if (
            !mountedRef.current
          ) {
            return;
          }

          setPosts([]);
          setStories([]);
          setNextCursor(null);
          setHasMore(false);
          setFeedError("");
          setStoryError("");
          setLoading(false);
          setRefreshing(false);

          return;
        }

        if (
          initialRequestRef.current
        ) {
          return;
        }

        initialRequestRef.current =
          true;

        if (refresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setFeedError("");
        setStoryError("");

        try {
          const [
            feedResult,
            storiesResult,
          ] =
            await Promise.allSettled(
              [
                getHomeFeed(
                  null,
                  FEED_LIMIT
                ),

                getStories(),
              ]
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          /*
           * FEED
           */
          if (
            feedResult.status ===
            "fulfilled"
          ) {
            const nextPosts =
              normalizePosts(
                feedResult.value
              );

            const pagination =
              getPagination(
                feedResult.value
              );

            setPosts(
              nextPosts
            );

            setNextCursor(
              pagination.nextCursor ??
                null
            );

            setHasMore(
              Boolean(
                pagination.hasMore
              )
            );

            setFeedError("");
          } else {
            console.error(
              "[HOME] FEED ERROR:",
              feedResult.reason
            );

            setFeedError(
              getErrorMessage(
                feedResult.reason
              )
            );

            if (!refresh) {
              setPosts([]);
              setNextCursor(
                null
              );
              setHasMore(
                false
              );
            }
          }

          /*
           * STORIES
           */
          if (
            storiesResult.status ===
            "fulfilled"
          ) {
            const nextStories =
              normalizeStories(
                storiesResult.value
              );

            setStories(
              nextStories
            );

            setStoryError("");
          } else {
            console.error(
              "[HOME] STORIES ERROR:",
              storiesResult.reason
            );

            setStoryError(
              "Stories couldn't be loaded."
            );
          }
        } catch (error) {
          console.error(
            "[HOME] LOAD ERROR:",
            error
          );

          if (
            mountedRef.current
          ) {
            setFeedError(
              getErrorMessage(
                error
              )
            );
          }
        } finally {
          initialRequestRef.current =
            false;

          if (
            mountedRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [user]
    );

  /*
   * Infinite scroll.
   */
  const loadMore =
    useCallback(
      async () => {
        if (
          !user ||
          loading ||
          refreshing ||
          loadingMoreRef.current ||
          !hasMore ||
          !nextCursor
        ) {
          return;
        }

        loadingMoreRef.current =
          true;

        if (
          mountedRef.current
        ) {
          setLoadingMore(
            true
          );
        }

        try {
          const result =
            await getHomeFeed(
              nextCursor,
              FEED_LIMIT
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          const newPosts =
            normalizePosts(
              result
            );

          const pagination =
            getPagination(
              result
            );

          setPosts(
            (previousPosts) =>
              mergeUniquePosts(
                previousPosts,
                newPosts
              )
          );

          setNextCursor(
            pagination.nextCursor ??
              null
          );

          setHasMore(
            Boolean(
              pagination.hasMore
            )
          );

          console.log(
            "[HOME] LOADED MORE:",
            {
              received:
                newPosts.length,

              hasMore:
                pagination.hasMore,

              nextCursor:
                pagination.nextCursor
                  ? "available"
                  : null,
            }
          );
        } catch (error) {
          console.error(
            "[HOME] LOAD MORE ERROR:",
            error
          );
        } finally {
          loadingMoreRef.current =
            false;

          if (
            mountedRef.current
          ) {
            setLoadingMore(
              false
            );
          }
        }
      },
      [
        user,
        loading,
        refreshing,
        hasMore,
        nextCursor,
      ]
    );

  /*
   * Refresh whenever Home gets focus.
   */
  useFocusEffect(
    useCallback(
      () => {
        if (
          authLoading ||
          !user
        ) {
          return;
        }

        loadHome();

        return undefined;
      },
      [
        authLoading,
        user,
        loadHome,
      ]
    )
  );

  const handleCreatePost =
    useCallback(() => {
      router.push({
        pathname:
          "/(tabs)/create",
        params: {
          mode: "post",
        },
      });
    }, []);

  const handleCreateStory =
    useCallback(() => {
      router.push({
        pathname:
          "/(tabs)/create",
        params: {
          mode: "story",
        },
      });
    }, []);

  const handleNotifications =
    useCallback(() => {
      router.push(
        "/notifications"
      );
    }, []);

  const handleMessages =
    useCallback(() => {
      router.push(
        "/messages"
      );
    }, []);

  const handleExplore =
    useCallback(() => {
      router.push(
        "/(tabs)/explore"
      );
    }, []);

  const handleStoryPress =
    useCallback(
      (story) => {
        const storyId =
          getId(story);

        if (!storyId) {
          console.warn(
            "[HOME] Missing story ID."
          );

          return;
        }

        router.push(
          `/stories/${storyId}`
        );
      },
      []
    );

  const handlePostPress =
    useCallback(
      (post) => {
        const postId =
          getId(post);

        if (!postId) {
          console.warn(
            "[HOME] Missing post ID."
          );

          return;
        }

        router.push(
          `/post/${postId}`
        );
      },
      []
    );

  const handleRetry =
    useCallback(() => {
      loadHome();
    }, [loadHome]);

  const handleRefresh =
    useCallback(() => {
      setNextCursor(null);
      setHasMore(true);

      loadHome({
        refresh: true,
      });
    }, [loadHome]);

  const renderPost =
    useCallback(
      ({ item }) => {
        if (!item) {
          return null;
        }

        return (
          <View
            style={
              styles.postWrapper
            }
          >
            <PostCard
              post={item}
              onPress={() =>
                handlePostPress(
                  item
                )
              }
            />
          </View>
        );
      },
      [handlePostPress]
    );

  const keyExtractor =
    useCallback(
      (item, index) =>
        getId(
          item,
          `post-${index}`
        ),
      []
    );

  const renderHeader =
    useCallback(() => {
      return (
        <View
          style={
            styles.headerContainer
          }
        >
          <View
            style={
              styles.topHeader
            }
          >
            <Pressable
              onPress={
                handleCreatePost
              }
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Create post"
              style={({
                pressed,
              }) => [
                styles.headerIconButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="add-outline"
                size={29}
                color={
                  COLORS.text
                }
              />
            </Pressable>

            <Text
              style={
                styles.logo
              }
              numberOfLines={1}
            >
              Snapgram
            </Text>

            <View
              style={
                styles.headerRight
              }
            >
              <Pressable
                onPress={
                  handleNotifications
                }
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                style={({
                  pressed,
                }) => [
                  styles.headerIconButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={27}
                  color={
                    COLORS.text
                  }
                />
              </Pressable>

              <Pressable
                onPress={
                  handleMessages
                }
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Messages"
                style={({
                  pressed,
                }) => [
                  styles.headerIconButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={25}
                  color={
                    COLORS.text
                  }
                />
              </Pressable>
            </View>
          </View>

          {stories.length >
          0 ? (
            <View
              style={
                styles.storySection
              }
            >
              <StoryTray
                stories={
                  stories
                }
                onStoryPress={
                  handleStoryPress
                }
                onCreateStory={
                  handleCreateStory
                }
              />
            </View>
          ) : (
            <View
              style={
                styles.emptyStorySection
              }
            >
              <Pressable
                onPress={
                  handleCreateStory
                }
                accessibilityRole="button"
                accessibilityLabel="Create your story"
                style={({
                  pressed,
                }) => [
                  styles.storyButton,
                  pressed &&
                    styles.storyPressed,
                ]}
              >
                <View
                  style={
                    styles.storyAvatar
                  }
                >
                  <Ionicons
                    name="add"
                    size={25}
                    color={
                      COLORS.text
                    }
                  />
                </View>

                <Text
                  style={
                    styles.storyLabel
                  }
                >
                  Your story
                </Text>
              </Pressable>
            </View>
          )}

          {!!storyError && (
            <Pressable
              onPress={
                handleRetry
              }
              style={
                styles.storyError
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={
                  COLORS.secondary
                }
              />

              <Text
                style={
                  styles.storyErrorText
                }
              >
                Stories unavailable ·
                Tap to retry
              </Text>
            </Pressable>
          )}

          {!!feedError &&
            posts.length > 0 && (
              <Pressable
                onPress={
                  handleRetry
                }
                accessibilityRole="button"
                accessibilityLabel="Retry loading feed"
                style={
                  styles.feedError
                }
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={17}
                  color={
                    COLORS.text
                  }
                />

                <Text
                  style={
                    styles.feedErrorText
                  }
                >
                  Couldn't refresh your
                  feed. Tap to retry.
                </Text>
              </Pressable>
            )}
        </View>
      );
    }, [
      stories,
      storyError,
      feedError,
      posts.length,
      handleCreatePost,
      handleCreateStory,
      handleNotifications,
      handleMessages,
      handleStoryPress,
      handleRetry,
    ]);

  const renderEmpty =
    useCallback(() => {
      if (loading) {
        return (
          <View
            style={
              styles.emptyState
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.text
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              Loading your feed
            </Text>
          </View>
        );
      }

      if (!user) {
        return (
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="person-outline"
                size={29}
                color={
                  COLORS.text
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Sign in to continue
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              Log in to see posts from
              people you follow.
            </Text>
          </View>
        );
      }

      if (feedError) {
        return (
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="cloud-offline-outline"
                size={29}
                color={
                  COLORS.text
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Couldn't load your feed
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              {feedError}
            </Text>

            <Pressable
              onPress={
                handleRetry
              }
              accessibilityRole="button"
              accessibilityLabel="Try loading feed again"
              style={({
                pressed,
              }) => [
                styles.retryButton,
                pressed &&
                  styles.pressedButton,
              ]}
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try again
              </Text>
            </Pressable>
          </View>
        );
      }

      return (
        <View
          style={
            styles.emptyState
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="images-outline"
              size={30}
              color={
                COLORS.text
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Your feed is empty
          </Text>

          <Text
            style={
              styles.emptySubtitle
            }
          >
            Discover posts and reels from
            people you follow and other
            accounts you may enjoy.
          </Text>

          <Pressable
            onPress={
              handleExplore
            }
            accessibilityRole="button"
            accessibilityLabel="Discover people"
            style={({
              pressed,
            }) => [
              styles.exploreButton,
              pressed &&
                styles.explorePressed,
            ]}
          >
            <Text
              style={
                styles.exploreText
              }
            >
              Discover people
            </Text>
          </Pressable>
        </View>
      );
    }, [
      loading,
      user,
      feedError,
      handleRetry,
      handleExplore,
    ]);

  const renderFooter =
    useCallback(() => {
      if (
        posts.length === 0
      ) {
        return null;
      }

      if (loadingMore) {
        return (
          <View
            style={
              styles.footer
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.muted
              }
            />

            <Text
              style={
                styles.footerText
              }
            >
              Loading more
            </Text>
          </View>
        );
      }

      if (
        !hasMore &&
        !refreshing
      ) {
        return (
          <View
            style={
              styles.footer
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={
                COLORS.muted
              }
            />

            <Text
              style={
                styles.footerText
              }
            >
              You're all caught up
            </Text>
          </View>
        );
      }

      return null;
    }, [
      posts.length,
      loadingMore,
      hasMore,
      refreshing,
    ]);

  if (authLoading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.authLoading
          }
        >
          <Text
            style={
              styles.authLogo
            }
          >
            Snapgram
          </Text>

          <ActivityIndicator
            size="small"
            color={
              COLORS.text
            }
            style={
              styles.authSpinner
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={
        styles.safeArea
      }
    >
      <FlatList
        data={posts}
        renderItem={
          renderPost
        }
        keyExtractor={
          keyExtractor
        }
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
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={
          false
        }
        contentContainerStyle={
          posts.length === 0
            ? styles.emptyList
            : styles.feedList
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={
              COLORS.text
            }
            colors={[
              COLORS.text,
            ]}
          />
        }
        onEndReached={
          loadMore
        }
        onEndReachedThreshold={
          0.7
        }
        initialNumToRender={
          4
        }
        maxToRenderPerBatch={
          5
        }
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    headerContainer: {
      backgroundColor:
        COLORS.background,
    },

    topHeader: {
      height: 56,
      paddingHorizontal: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        COLORS.background,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    logo: {
      position:
        "absolute",
      left: 75,
      right: 75,
      textAlign:
        "center",
      color:
        COLORS.text,
      fontSize: 22,
      fontWeight:
        "800",
      letterSpacing:
        -0.7,
    },

    headerRight: {
      marginLeft:
        "auto",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    headerIconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    pressed: {
      opacity: 0.55,
    },

    storySection: {
      backgroundColor:
        COLORS.background,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    emptyStorySection: {
      height: 108,
      paddingHorizontal: 14,
      alignItems:
        "flex-start",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.background,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    storyButton: {
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    storyAvatar: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#FAFAFA",
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    storyLabel: {
      marginTop: 6,
      color:
        COLORS.text,
      fontSize: 11,
      fontWeight:
        "500",
    },

    storyPressed: {
      opacity: 0.6,
    },

    storyError: {
      minHeight: 34,
      paddingHorizontal: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      backgroundColor:
        "#FAFAFA",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    storyErrorText: {
      color:
        COLORS.secondary,
      fontSize: 12,
      fontWeight:
        "600",
    },

    feedError: {
      minHeight: 38,
      paddingHorizontal: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      backgroundColor:
        "#FAFAFA",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
    },

    feedErrorText: {
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight:
        "600",
    },

    feedList: {
      paddingBottom: 24,
    },

    postWrapper: {
      width: "100%",
      backgroundColor:
        COLORS.background,
    },

    emptyList: {
      flexGrow: 1,
      paddingBottom: 24,
    },

    emptyState: {
      minHeight: 390,
      paddingHorizontal: 30,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      marginBottom: 18,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.background,
    },

    emptyTitle: {
      color:
        COLORS.text,
      fontSize: 18,
      fontWeight:
        "700",
      textAlign:
        "center",
    },

    emptySubtitle: {
      maxWidth: 300,
      marginTop: 8,
      color:
        COLORS.secondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign:
        "center",
    },

    retryButton: {
      minWidth: 100,
      height: 38,
      marginTop: 20,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#EFEFEF",
    },

    pressedButton: {
      opacity: 0.65,
    },

    retryText: {
      color:
        COLORS.text,
      fontSize: 14,
      fontWeight:
        "700",
    },

    exploreButton: {
      minWidth: 145,
      height: 38,
      marginTop: 20,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.blue,
    },

    explorePressed: {
      opacity: 0.7,
    },

    exploreText: {
      color:
        "#FFFFFF",
      fontSize: 14,
      fontWeight:
        "700",
    },

    footer: {
      minHeight: 80,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
    },

    footerText: {
      color:
        COLORS.muted,
      fontSize: 12,
    },

    authLoading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    authLogo: {
      color:
        COLORS.text,
      fontSize: 26,
      fontWeight:
        "800",
      letterSpacing:
        -0.8,
    },

    authSpinner: {
      marginTop: 18,
    },
  });