import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getExplorePosts,
  searchExplore,
} from "../../../services/exploreService";

import VerifiedBadge from "../../../components/common/VerifiedBadge";

const COLORS = {
  background: "#FFFFFF",
  text: "#111111",
  secondaryText: "#737373",
  border: "#DBDBDB",
  muted: "#F5F5F5",
  blue: "#0095F6",
  white: "#FFFFFF",
  black: "#000000",
  placeholder: "#8E8E8E",
};

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const PAGE_LIMIT = 30;
const GRID_BLOCK_SIZE = 6;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TILE_SIZE =
  (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

const BIG_TILE_SIZE = TILE_SIZE * 2 + GRID_GAP;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getPostId(post) {
  return String(
    post?.id ??
      post?._id ??
      post?.postId ??
      post?.post?._id ??
      post?.post?.id ??
      ""
  );
}

function getUserId(user) {
  return String(
    user?.id ??
      user?._id ??
      user?.userId ??
      user?.user?._id ??
      user?.user?.id ??
      ""
  );
}

function getUsername(user) {
  return (
    user?.username ??
    user?.user?.username ??
    user?.profile?.username ??
    ""
  );
}

function getDisplayName(user) {
  return (
    user?.name ??
    user?.displayName ??
    user?.fullName ??
    user?.user?.name ??
    user?.user?.displayName ??
    getUsername(user)
  );
}

function getAvatar(user) {
  return (
    user?.avatar ??
    user?.avatarUrl ??
    user?.profilePicture ??
    user?.profilePic ??
    user?.photoURL ??
    user?.user?.avatar ??
    user?.user?.avatarUrl ??
    ""
  );
}

function isVerified(user) {
  return Boolean(
    user?.isVerified ??
      user?.verified ??
      user?.verification?.verified ??
      user?.user?.isVerified ??
      false
  );
}

function getPostMedia(post) {
  if (!post) {
    return [];
  }

  if (Array.isArray(post.media)) {
    return post.media.filter(Boolean);
  }

  if (post.media) {
    return [post.media];
  }

  if (post.image) {
    return [{ url: post.image, type: "image" }];
  }

  if (post.imageUrl) {
    return [{ url: post.imageUrl, type: "image" }];
  }

  if (post.thumbnailUrl) {
    return [{ url: post.thumbnailUrl, type: "image" }];
  }

  return [];
}

function getMediaUrl(media) {
  if (!media) {
    return "";
  }

  if (typeof media === "string") {
    return media;
  }

  return String(
    media?.url ??
      media?.secure_url ??
      media?.secureUrl ??
      media?.uri ??
      media?.thumbnailUrl ??
      media?.thumbnail ??
      ""
  );
}

function isVideoMedia(media) {
  if (!media) {
    return false;
  }

  const type = String(
    media?.type ??
      media?.resource_type ??
      media?.resourceType ??
      ""
  ).toLowerCase();

  if (
    type.includes("video") ||
    type.includes("reel")
  ) {
    return true;
  }

  const url = getMediaUrl(media);

  return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url);
}

function getMediaCount(post) {
  return getPostMedia(post).length;
}

function getFirstMedia(post) {
  const media = getPostMedia(post);

  return media[0] ?? null;
}

function getThumbnail(post) {
  const media = getFirstMedia(post);

  if (!media) {
    return "";
  }

  return String(
    media?.thumbnailUrl ??
      media?.thumbnail ??
      media?.poster ??
      media?.previewUrl ??
      getMediaUrl(media)
  );
}

function chunkPosts(posts, size) {
  const chunks = [];

  for (let i = 0; i < posts.length; i += size) {
    chunks.push(posts.slice(i, i + size));
  }

  return chunks;
}

function mergeUniquePosts(existing, incoming) {
  const result = [];
  const seen = new Set();

  [...existing, ...incoming].forEach((post) => {
    const id = getPostId(post);

    if (!id) {
      return;
    }

    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    result.push(post);
  });

  return result;
}

function getHasMore(result) {
  return Boolean(
    result?.pagination?.hasMore ??
      result?.pagination?.has_more ??
      result?.hasMore ??
      result?.has_more ??
      false
  );
}

function getResultPosts(result) {
  if (Array.isArray(result?.posts)) {
    return result.posts;
  }

  if (Array.isArray(result?.data?.posts)) {
    return result.data.posts;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
}

function getResultUsers(result) {
  if (Array.isArray(result?.users)) {
    return result.users;
  }

  if (Array.isArray(result?.data?.users)) {
    return result.data.users;
  }

  return [];
}

function getResultHashtags(result) {
  if (Array.isArray(result?.hashtags)) {
    return result.hashtags;
  }

  if (Array.isArray(result?.data?.hashtags)) {
    return result.data.hashtags;
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

function SkeletonTile({ size = TILE_SIZE }) {
  return (
    <View
      style={[
        styles.skeletonTile,
        {
          width: size,
          height: size,
        },
      ]}
    />
  );
}

function ExploreSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 12 }).map((_, index) => (
        <SkeletonTile key={index} />
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Explore tile                                                                */
/* -------------------------------------------------------------------------- */

const ExploreTile = memo(function ExploreTile({
  post,
  size = TILE_SIZE,
  onPress,
}) {
  const media = getFirstMedia(post);
  const imageUri = getThumbnail(post);
  const video = isVideoMedia(media);
  const mediaCount = getMediaCount(post);

  if (!imageUri) {
    return (
      <Pressable
        onPress={() => onPress(post)}
        style={[
          styles.tile,
          {
            width: size,
            height: size,
          },
        ]}
      >
        <View style={styles.emptyTile}>
          <Ionicons
            name="image-outline"
            size={30}
            color="#BDBDBD"
          />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(post)}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.tileImage}
        resizeMode="cover"
      />

      <View style={styles.tileOverlay}>
        {video ? (
          <Ionicons
            name="play"
            size={18}
            color={COLORS.white}
          />
        ) : null}

        {mediaCount > 1 ? (
          <Ionicons
            name="copy-outline"
            size={18}
            color={COLORS.white}
            style={video ? styles.overlaySpacing : undefined}
          />
        ) : null}
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Instagram-style grid                                                        */
/* -------------------------------------------------------------------------- */

function ExploreGridBlock({ posts, onPostPress }) {
  if (!posts.length) {
    return null;
  }

  const first = posts[0];
  const second = posts[1];
  const third = posts[2];
  const fourth = posts[3];
  const fifth = posts[4];
  const sixth = posts[5];

  return (
    <View style={styles.gridBlock}>
      <View style={styles.gridColumn}>
        {first ? (
          <ExploreTile
            post={first}
            onPress={onPostPress}
          />
        ) : null}

        {second ? (
          <ExploreTile
            post={second}
            onPress={onPostPress}
          />
        ) : null}

        {third ? (
          <ExploreTile
            post={third}
            onPress={onPostPress}
          />
        ) : null}
      </View>

      <View style={styles.gridColumn}>
        {fourth ? (
          <ExploreTile
            post={fourth}
            size={BIG_TILE_SIZE}
            onPress={onPostPress}
          />
        ) : null}
      </View>

      <View style={styles.gridColumn}>
        {fifth ? (
          <ExploreTile
            post={fifth}
            onPress={onPostPress}
          />
        ) : null}

        {sixth ? (
          <ExploreTile
            post={sixth}
            onPress={onPostPress}
          />
        ) : null}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Search user row                                                             */
/* -------------------------------------------------------------------------- */

const SearchUserRow = memo(function SearchUserRow({
  user,
  onPress,
}) {
  const username = getUsername(user);
  const displayName = getDisplayName(user);
  const avatar = getAvatar(user);
  const verified = isVerified(user);

  return (
    <Pressable
      onPress={() => onPress(user)}
      style={styles.userRow}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={styles.userAvatar}
        />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Ionicons
            name="person"
            size={22}
            color="#A0A0A0"
          />
        </View>
      )}

      <View style={styles.userTextContainer}>
        <View style={styles.usernameLine}>
          <Text
            style={styles.username}
            numberOfLines={1}
          >
            {username || displayName || "User"}
          </Text>

          {verified ? (
            <VerifiedBadge
              size={14}
              style={styles.verifiedBadge}
            />
          ) : null}
        </View>

        {displayName &&
        displayName !== username ? (
          <Text
            style={styles.displayName}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon = "search-outline",
  title,
  message,
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={icon}
          size={34}
          color={COLORS.text}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      {message ? (
        <Text style={styles.emptyMessage}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Search section title                                                        */
/* -------------------------------------------------------------------------- */

function SearchSectionTitle({
  title,
  count,
}) {
  return (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {typeof count === "number" ? (
        <Text style={styles.sectionCount}>
          {count}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main screen                                                                 */
/* -------------------------------------------------------------------------- */

export default function ExploreScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");

  const [hasMore, setHasMore] = useState(true);
  const [searchHasMore, setSearchHasMore] =
    useState(false);

  const pageRef = useRef(1);
  const searchPageRef = useRef(1);

  const mountedRef = useRef(true);

  const searchTimerRef = useRef(null);

  const exploreRequestRef = useRef(0);
  const searchRequestRef = useRef(0);

  const loadingMoreRef = useRef(false);
  const searchLoadingMoreRef = useRef(false);

  const isSearching = query.trim().length > 0;

  /* ------------------------------------------------------------------------ */
  /* Lifecycle                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Load Explore                                                              */
  /* ------------------------------------------------------------------------ */

  const loadExplore = useCallback(
    async ({
      page = 1,
      replace = false,
      refresh = false,
    } = {}) => {
      if (!mountedRef.current) {
        return;
      }

      const requestId =
        ++exploreRequestRef.current;

      if (replace) {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
      } else {
        if (loadingMoreRef.current) {
          return;
        }

        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const result = await getExplorePosts(
          page,
          PAGE_LIMIT
        );

        if (
          !mountedRef.current ||
          requestId !== exploreRequestRef.current
        ) {
          return;
        }

        const nextPosts = getResultPosts(result);

        setPosts((current) =>
          replace
            ? nextPosts
            : mergeUniquePosts(current, nextPosts)
        );

        setHasMore(getHasMore(result));

        pageRef.current = page;
      } catch (err) {
        console.error(
          "[Explore] load error:",
          err
        );

        if (
          mountedRef.current &&
          requestId === exploreRequestRef.current
        ) {
          setError(
            err?.message ||
              "Unable to load Explore right now."
          );
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === exploreRequestRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* Search                                                                    */
  /* ------------------------------------------------------------------------ */

  const executeSearch = useCallback(
    async ({
      value,
      page = 1,
      replace = true,
    }) => {
      const cleanQuery = String(
        value || ""
      ).trim();

      if (!cleanQuery) {
        return;
      }

      const requestId =
        ++searchRequestRef.current;

      if (replace) {
        setSearching(true);
      } else {
        if (searchLoadingMoreRef.current) {
          return;
        }

        searchLoadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const result = await searchExplore(
          cleanQuery,
          page,
          PAGE_LIMIT
        );

        if (
          !mountedRef.current ||
          requestId !== searchRequestRef.current
        ) {
          return;
        }

        const nextUsers =
          getResultUsers(result);

        const nextHashtags =
          getResultHashtags(result);

        const nextPosts =
          getResultPosts(result);

        setUsers((current) =>
          replace
            ? nextUsers
            : [...current, ...nextUsers]
        );

        setHashtags((current) =>
          replace
            ? nextHashtags
            : [...current, ...nextHashtags]
        );

        setSearchPosts((current) =>
          replace
            ? nextPosts
            : mergeUniquePosts(
                current,
                nextPosts
              )
        );

        setSearchHasMore(
          getHasMore(result)
        );

        searchPageRef.current = page;
      } catch (err) {
        console.error(
          "[Explore] search error:",
          err
        );

        if (
          mountedRef.current &&
          requestId === searchRequestRef.current
        ) {
          setError(
            err?.message ||
              "Search failed. Please try again."
          );
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === searchRequestRef.current
        ) {
          setSearching(false);
          setLoadingMore(false);
          searchLoadingMoreRef.current =
            false;
        }
      }
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* Search debounce                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const cleanQuery = query.trim();

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!cleanQuery) {
      searchRequestRef.current += 1;

      setUsers([]);
      setHashtags([]);
      setSearchPosts([]);
      setSearchHasMore(false);
      setSearching(false);
      setError("");

      return;
    }

    searchTimerRef.current = setTimeout(() => {
      searchPageRef.current = 1;

      executeSearch({
        value: cleanQuery,
        page: 1,
        replace: true,
      });
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [query, executeSearch]);

  /* ------------------------------------------------------------------------ */
  /* Initial load / focus                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadExplore({
      page: 1,
      replace: true,
    });
  }, [loadExplore]);

  useFocusEffect(
    useCallback(() => {
      if (!query.trim()) {
        loadExplore({
          page: 1,
          replace: true,
        });
      }
    }, [loadExplore, query])
  );

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = useCallback(() => {
    if (isSearching) {
      const cleanQuery = query.trim();

      if (!cleanQuery) {
        return;
      }

      searchPageRef.current = 1;

      executeSearch({
        value: cleanQuery,
        page: 1,
        replace: true,
      });

      return;
    }

    pageRef.current = 1;

    loadExplore({
      page: 1,
      replace: true,
      refresh: true,
    });
  }, [
    executeSearch,
    isSearching,
    loadExplore,
    query,
  ]);

  const handleLoadMore = useCallback(() => {
    if (isSearching) {
      if (
        !searchHasMore ||
        searching ||
        searchLoadingMoreRef.current
      ) {
        return;
      }

      const nextPage =
        searchPageRef.current + 1;

      executeSearch({
        value: query,
        page: nextPage,
        replace: false,
      });

      return;
    }

    if (
      !hasMore ||
      loading ||
      loadingMoreRef.current
    ) {
      return;
    }

    const nextPage = pageRef.current + 1;

    loadExplore({
      page: nextPage,
      replace: false,
    });
  }, [
    executeSearch,
    hasMore,
    isSearching,
    loadExplore,
    loading,
    query,
    searchHasMore,
    searching,
  ]);

  const clearSearch = useCallback(() => {
    Keyboard.dismiss();
    setQuery("");
  }, []);

  const handlePostPress = useCallback(
    (post) => {
      const id = getPostId(post);

      if (!id) {
        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: {
          id,
        },
      });
    },
    [router]
  );

  const handleUserPress = useCallback(
    (user) => {
      const username = getUsername(user);

      if (!username) {
        return;
      }

      router.push({
        pathname: "/profile/[username]",
        params: {
          username: String(username),
        },
      });
    },
    [router]
  );

  /* ------------------------------------------------------------------------ */
  /* Explore grid                                                              */
  /* ------------------------------------------------------------------------ */

  const gridBlocks = useMemo(
    () => chunkPosts(posts, GRID_BLOCK_SIZE),
    [posts]
  );

  const renderExploreGrid = useMemo(() => {
    return (
      <View style={styles.exploreContainer}>
        {gridBlocks.map((block, index) => (
          <ExploreGridBlock
            key={`block-${index}`}
            posts={block}
            onPostPress={handlePostPress}
          />
        ))}
      </View>
    );
  }, [gridBlocks, handlePostPress]);

  /* ------------------------------------------------------------------------ */
  /* Search results                                                            */
  /* ------------------------------------------------------------------------ */

  const renderSearchPosts = useCallback(() => {
    if (!searchPosts.length) {
      return null;
    }

    return (
      <View style={styles.searchPostsGrid}>
        {searchPosts.map((post) => (
          <ExploreTile
            key={getPostId(post)}
            post={post}
            onPress={handlePostPress}
          />
        ))}
      </View>
    );
  }, [handlePostPress, searchPosts]);

  /* ------------------------------------------------------------------------ */
  /* Footer                                                                    */
  /* ------------------------------------------------------------------------ */

  const renderFooter = useCallback(() => {
    if (!loadingMore) {
      return <View style={styles.footerSpace} />;
    }

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.secondaryText}
        />
      </View>
    );
  }, [loadingMore]);

  /* ------------------------------------------------------------------------ */
  /* Header                                                                    */
  /* ------------------------------------------------------------------------ */

  const header = (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={19}
          color={COLORS.secondaryText}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={
            COLORS.secondaryText
          }
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />

        {query.length > 0 ? (
          <Pressable
            onPress={clearSearch}
            hitSlop={10}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={19}
              color="#8E8E8E"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  /* ------------------------------------------------------------------------ */
  /* Search content                                                            */
  /* ------------------------------------------------------------------------ */

  if (isSearching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {header}

        {searching &&
        !users.length &&
        !hashtags.length &&
        !searchPosts.length ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator
              size="small"
              color={COLORS.text}
            />
          </View>
        ) : null}

        {!searching &&
        !users.length &&
        !hashtags.length &&
        !searchPosts.length ? (
          <EmptyState
            icon="search-outline"
            title="No results found"
            message={`Try searching for another username, hashtag, or post.`}
          />
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#D00"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <FlatList
          data={[{ key: "search-content" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <View>
              {users.length > 0 ? (
                <View>
                  <SearchSectionTitle
                    title="People"
                    count={users.length}
                  />

                  <View>
                    {users.map((user, index) => (
                      <SearchUserRow
                        key={
                          getUserId(user) ||
                          getUsername(user) ||
                          `user-${index}`
                        }
                        user={user}
                        onPress={
                          handleUserPress
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {hashtags.length > 0 ? (
                <View>
                  <SearchSectionTitle
                    title="Hashtags"
                    count={hashtags.length}
                  />

                  <View>
                    {hashtags.map(
                      (hashtag, index) => {
                        const value =
                          typeof hashtag ===
                          "string"
                            ? hashtag
                            : hashtag?.name ??
                              hashtag?.tag ??
                              hashtag?.hashtag ??
                              "";

                        if (!value) {
                          return null;
                        }

                        return (
                          <View
                            key={`${value}-${index}`}
                            style={
                              styles.hashtagRow
                            }
                          >
                            <View
                              style={
                                styles.hashtagIcon
                              }
                            >
                              <Ionicons
                                name="pricetag-outline"
                                size={21}
                                color={
                                  COLORS.text
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.hashtagTextContainer
                              }
                            >
                              <Text
                                style={
                                  styles.hashtagName
                                }
                              >
                                #
                                {String(
                                  value
                                ).replace(
                                  /^#/,
                                  ""
                                )}
                              </Text>

                              {hashtag?.postsCount !=
                              null ? (
                                <Text
                                  style={
                                    styles.hashtagCount
                                  }
                                >
                                  {
                                    hashtag.postsCount
                                  }{" "}
                                  posts
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>
              ) : null}

              {searchPosts.length > 0 ? (
                <View>
                  <SearchSectionTitle
                    title="Posts"
                    count={
                      searchPosts.length
                    }
                  />

                  {renderSearchPosts()}
                </View>
              ) : null}

              {searching ? (
                <View
                  style={
                    styles.searchBottomLoader
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.secondaryText
                    }
                  />
                </View>
              ) : null}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={COLORS.text}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.searchContentContainer
          }
        />
      </SafeAreaView>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Normal Explore                                                            */
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView style={styles.safeArea}>
      {header}

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color="#D00"
          />

          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading && !posts.length ? (
        <ExploreSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="Nothing to explore yet"
          message="New posts and reels will appear here."
        />
      ) : (
        <FlatList
          data={[{ key: "explore" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => renderExploreGrid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.text}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.7}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.exploreContent
          }
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },

  searchContainer: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: 16,
    color: COLORS.text,
  },

  clearButton: {
    paddingLeft: 8,
  },

  exploreContent: {
    paddingBottom: 24,
  },

  exploreContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: COLORS.background,
  },

  gridBlock: {
    flexDirection: "row",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  gridColumn: {
    flex: 1,
    gap: GRID_GAP,
  },

  tile: {
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
  },

  tileImage: {
    width: "100%",
    height: "100%",
  },

  tileOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  overlaySpacing: {
    marginLeft: 7,
  },

  emptyTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },

  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  skeletonTile: {
    backgroundColor: "#EEEEEE",
  },

  userRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEEEEE",
  },

  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
  },

  userTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  usernameLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  username: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  verifiedBadge: {
    marginLeft: 4,
  },

  displayName: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.secondaryText,
  },

  sectionTitleContainer: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  sectionCount: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },

  hashtagRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  hashtagIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
  },

  hashtagTextContainer: {
    marginLeft: 12,
  },

  hashtagName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  hashtagCount: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.secondaryText,
  },

  searchPostsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  searchLoading: {
    paddingVertical: 18,
    alignItems: "center",
  },

  searchBottomLoader: {
    paddingVertical: 24,
    alignItems: "center",
  },

  searchContentContainer: {
    paddingBottom: 30,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },

  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  errorBanner: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3F3",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#C00",
  },

  loadingMoreContainer: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  footerSpace: {
    height: 20,
  },
});