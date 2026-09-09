import React, {
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
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getExplorePosts,
  searchExplore,
} from "../../../services/exploreService";

import VerifiedBadge from "../../../components/common/VerifiedBadge";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  text: "#262626",
  secondary: "#737373",
  border: "#DBDBDB",
  background: "#FFFFFF",
  placeholder: "#8E8E8E",
  surface: "#F2F2F2",
  danger: "#ED4956",
  placeholderImage: "#EFEFEF",
};

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const PAGE_LIMIT = 30;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// One small square tile's side length across 3 columns with 2 gaps.
const TILE_SIZE =
  (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

// A "big" tile spans 2 columns + the gap between them.
const BIG_TILE_SIZE = TILE_SIZE * 2 + GRID_GAP;

// Instagram's explore grid repeats in groups of 6 posts:
// 2 stacked small tiles + 1 big tile, then a plain row of 3.
const GRID_BLOCK_SIZE = 6;

const chunkPostsForGrid = (items) => {
  const blocks = [];

  for (
    let i = 0;
    i < items.length;
    i += GRID_BLOCK_SIZE
  ) {
    blocks.push(
      items.slice(i, i + GRID_BLOCK_SIZE)
    );
  }

  return blocks;
};

const getPostId = (post, index = 0) =>
  String(
    post?._id ||
      post?.id ||
      post?.postId ||
      `explore-post-${index}`
  );

const getPostMedia = (post) => {
  if (!post) {
    return null;
  }

  const media =
    post?.media ||
    post?.images ||
    post?.photos ||
    post?.attachments ||
    [];

  let item = null;

  if (Array.isArray(media)) {
    item = media[0];
  } else if (typeof media === "string") {
    item = media;
  }

  if (!item) {
    item =
      post?.image ||
      post?.imageUrl ||
      post?.thumbnail ||
      post?.thumbnailUrl ||
      post?.coverImage ||
      null;
  }

  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    return {
      url: item,
      type: "image",
      thumbnail: item,
    };
  }

  if (typeof item === "object") {
    const url =
      item?.url ||
      item?.secure_url ||
      item?.secureUrl ||
      item?.uri ||
      item?.src ||
      item?.imageUrl ||
      item?.thumbnailUrl ||
      null;

    if (!url) {
      return null;
    }

    return {
      url,
      type:
        item?.type ||
        item?.resource_type ||
        item?.mediaType ||
        "image",
      thumbnail:
        item?.thumbnail ||
        item?.thumbnailUrl ||
        item?.secure_url ||
        item?.secureUrl ||
        item?.url ||
        null,
    };
  }

  return null;
};

const isVideoMedia = (media) => {
  if (!media) {
    return false;
  }

  const type = String(media.type || "").toLowerCase();

  if (
    type.includes("video") ||
    type.includes("reel") ||
    type.includes("mp4")
  ) {
    return true;
  }

  return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(
    media.url || ""
  );
};

const getAvatar = (user) =>
  user?.avatar ||
  user?.avatarUrl ||
  user?.profilePicture ||
  user?.profileImage ||
  user?.photoURL ||
  user?.photoUrl ||
  user?.image ||
  null;

const getDisplayName = (user) =>
  user?.name ||
  user?.displayName ||
  user?.fullName ||
  user?.username ||
  user?.handle ||
  "User";

const getUsername = (user) =>
  user?.username ||
  user?.handle ||
  null;

const getUserId = (user) =>
  user?._id ||
  user?.id ||
  user?.userId ||
  user?.uid ||
  null;

const isUserVerified = (user) =>
  Boolean(
    user?.isVerified ??
      user?.verified ??
      user?.verification?.isVerified
  );

function ExploreSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 15 }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={styles.skeletonTile}
        />
      ))}
    </View>
  );
}

function ExploreTile({ post, onPress, size, style }) {
  const media = getPostMedia(post);
  const tileStyle = size
    ? { width: size, height: size }
    : styles.gridTile;

  if (!media?.url) {
    return (
      <Pressable
        style={[tileStyle, style]}
        onPress={() => onPress?.(post)}
      >
        <View style={styles.emptyTile}>
          <Ionicons
            name="image-outline"
            size={28}
            color="#A0A0A0"
          />
        </View>
      </Pressable>
    );
  }

  const video = isVideoMedia(media);

  const hasMultipleMedia =
    Array.isArray(post?.media) &&
    post.media.length > 1;

  return (
    <Pressable
      style={[tileStyle, style]}
      onPress={() => onPress?.(post)}
      android_ripple={{
        color: "rgba(255,255,255,0.15)",
      }}
    >
      <Image
        source={{
          uri: media.thumbnail || media.url,
        }}
        style={styles.gridImage}
        resizeMode="cover"
      />

      {video && (
        <View style={styles.mediaBadge}>
          <Ionicons
            name="play"
            size={14}
            color={COLORS.white}
          />
        </View>
      )}

      {!video && hasMultipleMedia && (
        <View style={styles.mediaBadge}>
          <Ionicons
            name="copy-outline"
            size={15}
            color={COLORS.white}
          />
        </View>
      )}
    </Pressable>
  );
}

function ExploreGridBlock({
  items,
  blockIndex,
  onPress,
}) {
  if (items.length < GRID_BLOCK_SIZE) {
    return (
      <View style={styles.plainRow}>
        {items.map((post, index) => (
          <ExploreTile
            key={getPostId(post, index)}
            post={post}
            onPress={onPress}
            size={TILE_SIZE}
            style={
              index < items.length - 1
                ? styles.tileSpacing
                : null
            }
          />
        ))}
      </View>
    );
  }

  const [a, b, big, c, d, e] = items;
  const bigOnRight = blockIndex % 2 === 0;

  return (
    <View style={styles.blockContainer}>
      <View style={styles.mixedRow}>
        {bigOnRight ? (
          <>
            <View
              style={[
                styles.stackColumn,
                styles.tileSpacing,
              ]}
            >
              <ExploreTile
                post={a}
                onPress={onPress}
                size={TILE_SIZE}
                style={styles.stackTileSpacing}
              />
              <ExploreTile
                post={b}
                onPress={onPress}
                size={TILE_SIZE}
              />
            </View>

            <ExploreTile
              post={big}
              onPress={onPress}
              size={BIG_TILE_SIZE}
            />
          </>
        ) : (
          <>
            <ExploreTile
              post={big}
              onPress={onPress}
              size={BIG_TILE_SIZE}
              style={styles.tileSpacing}
            />

            <View style={styles.stackColumn}>
              <ExploreTile
                post={a}
                onPress={onPress}
                size={TILE_SIZE}
                style={styles.stackTileSpacing}
              />
              <ExploreTile
                post={b}
                onPress={onPress}
                size={TILE_SIZE}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.plainRow}>
        <ExploreTile
          post={c}
          onPress={onPress}
          size={TILE_SIZE}
          style={styles.tileSpacing}
        />
        <ExploreTile
          post={d}
          onPress={onPress}
          size={TILE_SIZE}
          style={styles.tileSpacing}
        />
        <ExploreTile
          post={e}
          onPress={onPress}
          size={TILE_SIZE}
        />
      </View>
    </View>
  );
}

function SearchUserRow({ user, onPress }) {
  const avatar = getAvatar(user);
  const displayName = getDisplayName(user);
  const username = getUsername(user);
  const verified = isUserVerified(user);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.userRow,
        pressed && styles.pressedRow,
      ]}
      onPress={() => onPress?.(user)}
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
            size={25}
            color={COLORS.secondary}
          />
        </View>
      )}

      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {verified && (
            <VerifiedBadge
              size={17}
              style={styles.verifiedBadge}
            />
          )}
        </View>

        <Text
          style={styles.username}
          numberOfLines={1}
        >
          @{username || "user"}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={COLORS.secondary}
      />
    </Pressable>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function EmptyState({
  icon = "search-outline",
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={icon}
          size={32}
          color={COLORS.text}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      {!!message && (
        <Text style={styles.emptyMessage}>
          {message}
        </Text>
      )}

      {!!actionLabel && (
        <Pressable
          style={({ pressed }) => [
            styles.emptyAction,
            pressed && styles.emptyActionPressed,
          ]}
          onPress={onAction}
        >
          <Text style={styles.emptyActionText}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);

  const [hasMore, setHasMore] = useState(false);
  const [searchHasMore, setSearchHasMore] =
    useState(false);

  const searchTimeoutRef = useRef(null);
  const pageRef = useRef(1);
  const searchPageRef = useRef(1);

  const loadingMoreRef = useRef(false);
  const searchLoadingMoreRef = useRef(false);

  const mountedRef = useRef(true);

  const isSearching =
    query.trim().length > 0;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const normalizePosts = useCallback(
    (items) => {
      if (!Array.isArray(items)) {
        return [];
      }

      return items.filter(Boolean);
    },
    []
  );

  const loadExplore = useCallback(
    async (
      requestedPage = 1,
      append = false
    ) => {
      if (
        append &&
        loadingMoreRef.current
      ) {
        return;
      }

      try {
        if (append) {
          loadingMoreRef.current = true;
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError("");
        }

        const result =
          await getExplorePosts(
            requestedPage,
            PAGE_LIMIT
          );

        if (!mountedRef.current) {
          return;
        }

        const nextPosts =
          normalizePosts(result?.posts);

        const pagination =
          result?.pagination || {};

        const nextHasMore = Boolean(
          pagination?.hasMore ??
            pagination?.has_more ??
            false
        );

        setPosts((current) =>
          append
            ? [...current, ...nextPosts]
            : nextPosts
        );

        setHasMore(nextHasMore);

        pageRef.current =
          requestedPage;

        setPage(requestedPage);
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        console.error(
          "EXPLORE LOAD ERROR:",
          err?.response?.data || err
        );

        if (!append) {
          setPosts([]);

          setError(
            err?.response?.data?.message ||
              "Unable to load Explore right now."
          );
        }
      } finally {
        if (!mountedRef.current) {
          return;
        }

        setLoading(false);
        setLoadingMore(false);

        loadingMoreRef.current =
          false;
      }
    },
    [normalizePosts]
  );

  const executeSearch = useCallback(
    async (
      value,
      requestedPage = 1,
      append = false
    ) => {
      const cleanQuery = String(
        value || ""
      ).trim();

      if (!cleanQuery) {
        setUsers([]);
        setHashtags([]);
        setSearchPosts([]);
        setSearching(false);
        setSearchHasMore(false);
        return;
      }

      if (
        append &&
        searchLoadingMoreRef.current
      ) {
        return;
      }

      try {
        if (append) {
          searchLoadingMoreRef.current =
            true;

          setLoadingMore(true);
        } else {
          setSearching(true);
          setError("");

          setUsers([]);
          setHashtags([]);
          setSearchPosts([]);
        }

        const result =
          await searchExplore(
            cleanQuery,
            requestedPage,
            PAGE_LIMIT
          );

        if (!mountedRef.current) {
          return;
        }

        const nextUsers =
          Array.isArray(result?.users)
            ? result.users
            : [];

        const nextHashtags =
          Array.isArray(result?.hashtags)
            ? result.hashtags
            : [];

        const nextPosts =
          normalizePosts(result?.posts);

        const pagination =
          result?.pagination || {};

        const nextHasMore = Boolean(
          pagination?.hasMore ??
            pagination?.has_more ??
            false
        );

        setUsers((current) =>
          append
            ? [...current, ...nextUsers]
            : nextUsers
        );

        setHashtags((current) =>
          append
            ? [
                ...current,
                ...nextHashtags,
              ]
            : nextHashtags
        );

        setSearchPosts((current) =>
          append
            ? [
                ...current,
                ...nextPosts,
              ]
            : nextPosts
        );

        setSearchHasMore(
          nextHasMore
        );

        searchPageRef.current =
          requestedPage;

        setSearchPage(
          requestedPage
        );
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        console.error(
          "EXPLORE SEARCH ERROR:",
          err?.response?.data || err
        );

        if (!append) {
          setUsers([]);
          setHashtags([]);
          setSearchPosts([]);

          setError(
            err?.response?.data?.message ||
              "Search failed. Please try again."
          );
        }
      } finally {
        if (!mountedRef.current) {
          return;
        }

        setSearching(false);
        setLoadingMore(false);

        searchLoadingMoreRef.current =
          false;
      }
    },
    [normalizePosts]
  );

  const handleQueryChange =
    useCallback(
      (value) => {
        setQuery(value);
        setError("");

        if (searchTimeoutRef.current) {
          clearTimeout(
            searchTimeoutRef.current
          );
        }

        const cleanValue =
          value.trim();

        if (!cleanValue) {
          setUsers([]);
          setHashtags([]);
          setSearchPosts([]);
          setSearchHasMore(false);
          setSearching(false);

          searchPageRef.current = 1;
          setSearchPage(1);

          return;
        }

        searchTimeoutRef.current =
          setTimeout(() => {
            searchPageRef.current = 1;
            setSearchPage(1);

            executeSearch(
              cleanValue,
              1,
              false
            );
          }, 350);
      },
      [executeSearch]
    );

  const handleSubmitSearch =
    useCallback(() => {
      const cleanQuery =
        query.trim();

      if (!cleanQuery) {
        return;
      }

      if (searchTimeoutRef.current) {
        clearTimeout(
          searchTimeoutRef.current
        );
      }

      searchPageRef.current = 1;
      setSearchPage(1);

      executeSearch(
        cleanQuery,
        1,
        false
      );
    }, [
      executeSearch,
      query,
    ]);

  const handleClearSearch =
    useCallback(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(
          searchTimeoutRef.current
        );
      }

      setQuery("");
      setUsers([]);
      setHashtags([]);
      setSearchPosts([]);
      setSearchHasMore(false);
      setSearching(false);
      setError("");

      searchPageRef.current = 1;
      setSearchPage(1);
    }, []);

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      try {
        if (isSearching) {
          searchPageRef.current = 1;
          setSearchPage(1);

          await executeSearch(
            query.trim(),
            1,
            false
          );
        } else {
          pageRef.current = 1;
          setPage(1);

          await loadExplore(
            1,
            false
          );
        }
      } finally {
        if (mountedRef.current) {
          setRefreshing(false);
        }
      }
    }, [
      executeSearch,
      isSearching,
      loadExplore,
      query,
    ]);

  const loadMore = useCallback(() => {
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

      executeSearch(
        query.trim(),
        nextPage,
        true
      );

      return;
    }

    if (
      !hasMore ||
      loading ||
      loadingMoreRef.current
    ) {
      return;
    }

    const nextPage =
      pageRef.current + 1;

    loadExplore(
      nextPage,
      true
    );
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

  useFocusEffect(
    useCallback(() => {
      if (
        !isSearching &&
        posts.length === 0
      ) {
        pageRef.current = 1;
        setPage(1);

        loadExplore(
          1,
          false
        );
      }
    }, [
      isSearching,
      loadExplore,
      posts.length,
    ])
  );

  const handlePostPress =
    useCallback(
      (post) => {
        const postId =
          getPostId(post);

        console.log(
          "Explore post selected:",
          postId
        );

        if (
          !postId ||
          postId.startsWith(
            "explore-post-"
          )
        ) {
          console.warn(
            "Cannot open post: missing real post ID.",
            post
          );

          return;
        }

        router.push({
          pathname: "/post/[id]",
          params: {
            id: postId,
          },
        });
      },
      [router]
    );

  const handleUserPress =
    useCallback(
      (user) => {
        const username =
          getUsername(user);

        const userId =
          getUserId(user);

        console.log(
          "Explore user selected:",
          {
            username,
            userId,
          }
        );

        if (!username) {
          console.warn(
            "Cannot open profile: selected user has no username.",
            user
          );

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

  const handleHashtagPress =
    useCallback(
      (hashtag) => {
        const value =
          typeof hashtag === "string"
            ? hashtag
            : hashtag?.name ||
              hashtag?.tag ||
              hashtag?.hashtag ||
              "";

        if (!value) {
          return;
        }

        const normalized =
          value.startsWith("#")
            ? value
            : `#${value}`;

        handleQueryChange(
          normalized
        );
      },
      [handleQueryChange]
    );

  const exploreBlocks = useMemo(
    () => chunkPostsForGrid(posts),
    [posts]
  );

  const renderExploreBlock = useCallback(
    ({ item, index }) => (
      <ExploreGridBlock
        items={item}
        blockIndex={index}
        onPress={handlePostPress}
      />
    ),
    [handlePostPress]
  );

  const renderSearchPost =
    useCallback(
      ({ item }) => (
        <ExploreTile
          post={item}
          onPress={
            handlePostPress
          }
        />
      ),
      [handlePostPress]
    );

  const searchHeader = useMemo(() => {
    const hasResults =
      users.length > 0 ||
      hashtags.length > 0 ||
      searchPosts.length > 0;

    if (
      searching &&
      !hasResults
    ) {
      return (
        <View
          style={
            styles.searchLoading
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.text}
          />

          <Text
            style={
              styles.searchLoadingText
            }
          >
            Searching...
          </Text>
        </View>
      );
    }

    if (
      !searching &&
      !hasResults &&
      query.trim()
    ) {
      return (
        <EmptyState
          icon="search-outline"
          title="No results found"
          message={`We couldn't find anything for "${query.trim()}".`}
          actionLabel="Clear search"
          onAction={
            handleClearSearch
          }
        />
      );
    }

    return (
      <View>
        {users.length > 0 && (
          <View>
            <SectionHeader
              title="People"
            />

            {users.map(
              (user, index) => (
                <SearchUserRow
                  key={
                    user?._id ||
                    user?.id ||
                    user?.username ||
                    `user-${index}`
                  }
                  user={user}
                  onPress={
                    handleUserPress
                  }
                />
              )
            )}
          </View>
        )}

        {hashtags.length > 0 && (
          <View>
            <SectionHeader
              title="Hashtags"
            />

            {hashtags.map(
              (hashtag, index) => {
                const value =
                  typeof hashtag ===
                  "string"
                    ? hashtag
                    : hashtag?.name ||
                      hashtag?.tag ||
                      hashtag?.hashtag ||
                      "";

                if (!value) {
                  return null;
                }

                const displayValue =
                  value.startsWith("#")
                    ? value
                    : `#${value}`;

                const count =
                  hashtag?.count ??
                  hashtag?.postsCount ??
                  hashtag?.postCount ??
                  null;

                return (
                  <Pressable
                    key={`${value}-${index}`}
                    style={({ pressed }) => [
                      styles.hashtagRow,
                      pressed &&
                        styles.pressedRow,
                    ]}
                    onPress={() =>
                      handleHashtagPress(
                        hashtag
                      )
                    }
                  >
                    <View
                      style={
                        styles.hashtagIcon
                      }
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={20}
                        color={
                          COLORS.text
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.hashtagInfo
                      }
                    >
                      <Text
                        style={
                          styles.hashtagName
                        }
                      >
                        {displayValue}
                      </Text>

                      {count !== null && (
                        <Text
                          style={
                            styles.hashtagCount
                          }
                        >
                          {count}{" "}
                          {count === 1
                            ? "post"
                            : "posts"}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={
                        COLORS.secondary
                      }
                    />
                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {searchPosts.length > 0 && (
          <SectionHeader
            title="Posts"
          />
        )}
      </View>
    );
  }, [
    handleClearSearch,
    handleHashtagPress,
    handleUserPress,
    hashtags,
    query,
    searchPosts.length,
    searching,
    users,
  ]);

  const listFooter = useMemo(() => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View
        style={
          styles.footerLoader
        }
      >
        <ActivityIndicator
          size="small"
          color={COLORS.secondary}
        />
      </View>
    );
  }, [loadingMore]);

  if (
    loading &&
    !isSearching
  ) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <View style={styles.header}>
          <Text
            style={styles.headerTitle}
          >
            Explore
          </Text>
        </View>

        <View
          style={
            styles.searchContainer
          }
        >
          <View
            style={styles.searchBox}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.secondary}
            />

            <TextInput
              value={query}
              onChangeText={
                handleQueryChange
              }
              onSubmitEditing={
                handleSubmitSearch
              }
              placeholder="Search"
              placeholderTextColor={
                COLORS.placeholder
              }
              style={
                styles.searchInput
              }
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <ExploreSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text
          style={styles.headerTitle}
        >
          Explore
        </Text>
      </View>

      <View
        style={
          styles.searchContainer
        }
      >
        <View
          style={styles.searchBox}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.secondary}
          />

          <TextInput
            value={query}
            onChangeText={
              handleQueryChange
            }
            onSubmitEditing={
              handleSubmitSearch
            }
            placeholder="Search"
            placeholderTextColor={
              COLORS.placeholder
            }
            style={
              styles.searchInput
            }
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {!!query && (
            <Pressable
              onPress={
                handleClearSearch
              }
              hitSlop={10}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={
                  COLORS.secondary
                }
              />
            </Pressable>
          )}
        </View>
      </View>

      {!!error && (
        <View
          style={styles.errorBanner}
        >
          <Ionicons
            name="alert-circle-outline"
            size={19}
            color={COLORS.danger}
          />

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            onPress={() =>
              isSearching
                ? executeSearch(
                    query.trim(),
                    1,
                    false
                  )
                : loadExplore(
                    1,
                    false
                  )
            }
          >
            <Text
              style={styles.retryText}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {isSearching ? (
        <FlatList
          key="search-list"
          data={searchPosts}
          renderItem={
            renderSearchPost
          }
          keyExtractor={(
            item,
            index
          ) =>
            getPostId(
              item,
              index
            )
          }
          ListHeaderComponent={
            searchHeader
          }
          ListFooterComponent={
            listFooter
          }
          contentContainerStyle={[
            styles.searchListContent,
            searchPosts.length === 0 &&
              styles.searchListEmptyContent,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
            />
          }
          onEndReached={
            loadMore
          }
          onEndReachedThreshold={
            0.6
          }
        />
      ) : (
        <FlatList
          key="explore-grid"
          data={
            exploreBlocks
          }
          renderItem={
            renderExploreBlock
          }
          keyExtractor={(
            block,
            index
          ) =>
            `explore-block-${index}-${getPostId(
              block?.[0],
              index
            )}`
          }
          ListFooterComponent={
            listFooter
          }
          contentContainerStyle={
            posts.length === 0
              ? styles.exploreEmptyContent
              : styles.exploreListContent
          }
          showsVerticalScrollIndicator={
            false
          }
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
            />
          }
          onEndReached={
            loadMore
          }
          onEndReachedThreshold={
            0.7
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="images-outline"
                title="No posts yet"
                message="Explore posts will appear here."
                actionLabel="Refresh"
                onAction={() =>
                  loadExplore(
                    1,
                    false
                  )
                }
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    height: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      COLORS.border,
    backgroundColor:
      COLORS.white,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor:
      COLORS.white,
  },

  searchBox: {
    height: 38,
    borderRadius: 10,
    backgroundColor:
      COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    paddingVertical: 0,
    fontSize: 16,
    color: COLORS.text,
  },

  errorBanner: {
    minHeight: 46,
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFF2F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },

  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  exploreListContent: {
    paddingBottom: 20,
  },

  exploreEmptyContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  blockContainer: {
    width: "100%",
  },

  mixedRow: {
    flexDirection: "row",
  },

  stackColumn: {
    justifyContent: "space-between",
  },

  plainRow: {
    flexDirection: "row",
    marginTop: GRID_GAP,
  },

  tileSpacing: {
    marginRight: GRID_GAP,
  },

  stackTileSpacing: {
    marginBottom: GRID_GAP,
  },

  gridTile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor:
      COLORS.placeholderImage,
    overflow: "hidden",
  },

  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor:
      COLORS.placeholderImage,
  },

  emptyTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.placeholderImage,
  },

  mediaBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchListContent: {
    paddingBottom: 30,
  },

  searchListEmptyContent: {
    flexGrow: 1,
  },

  searchLoading: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  searchLoadingText: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  sectionHeader: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor:
      COLORS.white,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  userRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.white,
  },

  pressedRow: {
    opacity: 0.7,
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      COLORS.placeholderImage,
  },

  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      COLORS.placeholderImage,
    alignItems: "center",
    justifyContent: "center",
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 5,
  },

  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  verifiedBadge: {
    flexShrink: 0,
  },

  username: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.secondary,
  },

  hashtagRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.white,
  },

  hashtagIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  hashtagInfo: {
    flex: 1,
    marginLeft: 12,
  },

  hashtagName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  hashtagCount: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.secondary,
  },

  emptyState: {
    flex: 1,
    minHeight: 300,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor:
      COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyMessage: {
    marginTop: 8,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.secondary,
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 18,
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 8,
    backgroundColor:
      COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyActionPressed: {
    opacity: 0.7,
  },

  emptyActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  footerLoader: {
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    backgroundColor:
      COLORS.white,
  },

  skeletonTile: {
    width: "32.9%",
    aspectRatio: 1,
    backgroundColor:
      "#EEEEEE",
  },
});