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
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";

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
  searchBackground: "#EFEFEF",
  placeholder: "#8E8E8E",
  tileBackground: "#EFEFEF",
  danger: "#ED4956",
};

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const PAGE_LIMIT = 30;
const GRID_BLOCK_SIZE = 6;

const { width: SCREEN_WIDTH } =
  Dimensions.get("window");

const TILE_SIZE =
  (SCREEN_WIDTH -
    GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

const BIG_TILE_SIZE =
  TILE_SIZE * 2 + GRID_GAP;

function getPostId(post, fallback = "") {
  return String(
    post?._id ||
      post?.id ||
      post?.postId ||
      fallback
  );
}

function getUserId(user) {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.uid ||
    null
  );
}

function getUsername(user) {
  return (
    user?.username ||
    user?.handle ||
    null
  );
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.displayName ||
    user?.fullName ||
    user?.username ||
    user?.handle ||
    "User"
  );
}

function getAvatar(user) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.profileImage ||
    user?.photoURL ||
    user?.photoUrl ||
    user?.image ||
    null
  );
}

function isVerified(user) {
  return Boolean(
    user?.isVerified ??
      user?.verified ??
      user?.verification?.isVerified
  );
}

function getPostMedia(post) {
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
      thumbnail: item,
      type: "image",
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
      thumbnail:
        item?.thumbnail ||
        item?.thumbnailUrl ||
        item?.secure_url ||
        item?.secureUrl ||
        item?.url ||
        null,
      type:
        item?.type ||
        item?.resource_type ||
        item?.mediaType ||
        "image",
    };
  }

  return null;
}

function isVideoMedia(media) {
  if (!media) {
    return false;
  }

  const type = String(
    media?.type || ""
  ).toLowerCase();

  if (
    type.includes("video") ||
    type.includes("reel")
  ) {
    return true;
  }

  return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(
    String(media?.url || "")
  );
}

function getMediaCount(post) {
  if (Array.isArray(post?.media)) {
    return post.media.length;
  }

  if (Array.isArray(post?.images)) {
    return post.images.length;
  }

  if (Array.isArray(post?.photos)) {
    return post.photos.length;
  }

  if (Array.isArray(post?.attachments)) {
    return post.attachments.length;
  }

  return 1;
}

function chunkPosts(posts) {
  const blocks = [];

  for (
    let index = 0;
    index < posts.length;
    index += GRID_BLOCK_SIZE
  ) {
    blocks.push(
      posts.slice(
        index,
        index + GRID_BLOCK_SIZE
      )
    );
  }

  return blocks;
}

function mergeUniquePosts(
  current,
  incoming
) {
  const map = new Map();

  [...current, ...incoming].forEach(
    (post, index) => {
      const id = getPostId(
        post,
        `fallback-${index}`
      );

      if (!map.has(id)) {
        map.set(id, post);
      }
    }
  );

  return Array.from(map.values());
}

function ExploreSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 15 }).map(
        (_, index) => (
          <View
            key={`skeleton-${index}`}
            style={styles.skeletonTile}
          />
        )
      )}
    </View>
  );
}

function ExploreTile({
  post,
  size = TILE_SIZE,
  onPress,
  style,
}) {
  const media = getPostMedia(post);

  const video = isVideoMedia(media);

  const mediaCount =
    getMediaCount(post);

  return (
    <Pressable
      style={[
        styles.tile,
        {
          width: size,
          height: size,
        },
        style,
      ]}
      onPress={() => onPress?.(post)}
      android_ripple={{
        color: "rgba(255,255,255,0.15)",
      }}
    >
      {media?.url ? (
        <Image
          source={{
            uri:
              media.thumbnail ||
              media.url,
          }}
          style={styles.tileImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.emptyTile}>
          <Ionicons
            name="image-outline"
            size={27}
            color="#A0A0A0"
          />
        </View>
      )}

      {video && (
        <View style={styles.mediaIcon}>
          <Ionicons
            name="play"
            size={13}
            color={COLORS.white}
          />
        </View>
      )}

      {!video && mediaCount > 1 && (
        <View style={styles.mediaIcon}>
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
  if (items.length < 6) {
    return (
      <View style={styles.plainRow}>
        {items.map((post, index) => (
          <ExploreTile
            key={getPostId(
              post,
              `post-${index}`
            )}
            post={post}
            size={TILE_SIZE}
            onPress={onPress}
            style={
              index <
              items.length - 1
                ? styles.rightGap
                : undefined
            }
          />
        ))}
      </View>
    );
  }

  const [
    first,
    second,
    large,
    fourth,
    fifth,
    sixth,
  ] = items;

  const largeOnRight =
    blockIndex % 2 === 0;

  return (
    <View>
      <View style={styles.mixedRow}>
        {largeOnRight ? (
          <>
            <View
              style={[
                styles.stackColumn,
                styles.rightGap,
              ]}
            >
              <ExploreTile
                post={first}
                size={TILE_SIZE}
                onPress={onPress}
                style={styles.bottomGap}
              />

              <ExploreTile
                post={second}
                size={TILE_SIZE}
                onPress={onPress}
              />
            </View>

            <ExploreTile
              post={large}
              size={BIG_TILE_SIZE}
              onPress={onPress}
            />
          </>
        ) : (
          <>
            <ExploreTile
              post={large}
              size={BIG_TILE_SIZE}
              onPress={onPress}
              style={styles.rightGap}
            />

            <View style={styles.stackColumn}>
              <ExploreTile
                post={first}
                size={TILE_SIZE}
                onPress={onPress}
                style={styles.bottomGap}
              />

              <ExploreTile
                post={second}
                size={TILE_SIZE}
                onPress={onPress}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.plainRow}>
        <ExploreTile
          post={fourth}
          size={TILE_SIZE}
          onPress={onPress}
          style={styles.rightGap}
        />

        <ExploreTile
          post={fifth}
          size={TILE_SIZE}
          onPress={onPress}
          style={styles.rightGap}
        />

        <ExploreTile
          post={sixth}
          size={TILE_SIZE}
          onPress={onPress}
        />
      </View>
    </View>
  );
}

function SearchUserRow({
  user,
  onPress,
}) {
  const avatar = getAvatar(user);
  const username = getUsername(user);
  const name = getDisplayName(user);

  return (
    <Pressable
      onPress={() =>
        onPress?.(user)
      }
      style={({ pressed }) => [
        styles.userRow,
        pressed && styles.pressed,
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={styles.userAvatar}
        />
      ) : (
        <View
          style={
            styles.userAvatarFallback
          }
        >
          <Ionicons
            name="person"
            size={23}
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
            {name}
          </Text>

          {isVerified(user) && (
            <VerifiedBadge
              size={16}
              style={styles.verifiedBadge}
            />
          )}
        </View>

        {!!username && (
          <Text
            style={styles.searchUsername}
            numberOfLines={1}
          >
            @{username}
          </Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={COLORS.secondary}
      />
    </Pressable>
  );
}

function EmptyState({
  icon = "images-outline",
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.emptyState}>
      <View
        style={styles.emptyIconCircle}
      >
        <Ionicons
          name={icon}
          size={31}
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
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed &&
              styles.emptyButtonPressed,
          ]}
        >
          <Text
            style={styles.emptyButtonText}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function SearchSectionTitle({
  children,
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {children}
      </Text>
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();

  const [query, setQuery] =
    useState("");

  const [posts, setPosts] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [hashtags, setHashtags] =
    useState([]);

  const [searchPosts, setSearchPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [error, setError] =
    useState("");

  const [hasMore, setHasMore] =
    useState(false);

  const [searchHasMore, setSearchHasMore] =
    useState(false);

  const pageRef = useRef(1);

  const searchPageRef =
    useRef(1);

  const mountedRef =
    useRef(true);

  const searchTimerRef =
    useRef(null);

  const exploreRequestRef =
    useRef(false);

  const searchRequestRef =
    useRef(false);

  const loadingMoreRef =
    useRef(false);

  const searchLoadingMoreRef =
    useRef(false);

  const isSearching =
    query.trim().length > 0;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, []);

  const loadExplore = useCallback(
    async (
      requestedPage = 1,
      append = false
    ) => {
      if (
        exploreRequestRef.current
      ) {
        return;
      }

      if (
        append &&
        loadingMoreRef.current
      ) {
        return;
      }

      exploreRequestRef.current = true;

      if (append) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const result =
          await getExplorePosts(
            requestedPage,
            PAGE_LIMIT
          );

        if (!mountedRef.current) {
          return;
        }

        const incoming =
          Array.isArray(
            result?.posts
          )
            ? result.posts.filter(Boolean)
            : [];

        const pagination =
          result?.pagination || {};

        const more = Boolean(
          pagination?.hasMore ??
            pagination?.has_more ??
            false
        );

        setPosts((current) =>
          append
            ? mergeUniquePosts(
                current,
                incoming
              )
            : incoming
        );

        setHasMore(more);

        pageRef.current =
          requestedPage;
      } catch (err) {
        console.error(
          "[EXPLORE] LOAD ERROR:",
          err?.response?.data ||
            err
        );

        if (
          mountedRef.current &&
          !append
        ) {
          setPosts([]);

          setError(
            err?.response?.data
              ?.message ||
              "Unable to load Explore right now."
          );
        }
      } finally {
        exploreRequestRef.current =
          false;

        loadingMoreRef.current =
          false;

        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  const executeSearch =
    useCallback(
      async (
        value,
        requestedPage = 1,
        append = false
      ) => {
        const cleanQuery =
          String(value || "").trim();

        if (!cleanQuery) {
          setUsers([]);
          setHashtags([]);
          setSearchPosts([]);
          setSearchHasMore(false);
          setSearching(false);
          return;
        }

        if (
          searchRequestRef.current
        ) {
          return;
        }

        if (
          append &&
          searchLoadingMoreRef.current
        ) {
          return;
        }

        searchRequestRef.current =
          true;

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

        try {
          const result =
            await searchExplore(
              cleanQuery,
              requestedPage,
              PAGE_LIMIT
            );

          if (!mountedRef.current) {
            return;
          }

          const incomingUsers =
            Array.isArray(
              result?.users
            )
              ? result.users
              : [];

          const incomingHashtags =
            Array.isArray(
              result?.hashtags
            )
              ? result.hashtags
              : [];

          const incomingPosts =
            Array.isArray(
              result?.posts
            )
              ? result.posts.filter(Boolean)
              : [];

          const pagination =
            result?.pagination || {};

          const more = Boolean(
            pagination?.hasMore ??
              pagination?.has_more ??
              false
          );

          setUsers((current) =>
            append
              ? [
                  ...current,
                  ...incomingUsers,
                ]
              : incomingUsers
          );

          setHashtags((current) =>
            append
              ? [
                  ...current,
                  ...incomingHashtags,
                ]
              : incomingHashtags
          );

          setSearchPosts((current) =>
            append
              ? mergeUniquePosts(
                  current,
                  incomingPosts
                )
              : incomingPosts
          );

          setSearchHasMore(more);

          searchPageRef.current =
            requestedPage;
        } catch (err) {
          console.error(
            "[EXPLORE] SEARCH ERROR:",
            err?.response?.data ||
              err
          );

          if (
            mountedRef.current &&
            !append
          ) {
            setUsers([]);
            setHashtags([]);
            setSearchPosts([]);

            setError(
              err?.response?.data
                ?.message ||
                "Search failed. Please try again."
            );
          }
        } finally {
          searchRequestRef.current =
            false;

          searchLoadingMoreRef.current =
            false;

          if (mountedRef.current) {
            setSearching(false);
            setLoadingMore(false);
          }
        }
      },
      []
    );

  const handleQueryChange =
    useCallback(
      (value) => {
        setQuery(value);
        setError("");

        if (searchTimerRef.current) {
          clearTimeout(
            searchTimerRef.current
          );
        }

        const clean =
          value.trim();

        if (!clean) {
          setUsers([]);
          setHashtags([]);
          setSearchPosts([]);
          setSearchHasMore(false);
          setSearching(false);

          searchPageRef.current = 1;

          return;
        }

        searchTimerRef.current =
          setTimeout(() => {
            searchPageRef.current = 1;

            executeSearch(
              clean,
              1,
              false
            );
          }, 300);
      },
      [executeSearch]
    );

  const submitSearch =
    useCallback(() => {
      const clean =
        query.trim();

      if (!clean) {
        return;
      }

      Keyboard.dismiss();

      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current
        );
      }

      searchPageRef.current = 1;

      executeSearch(
        clean,
        1,
        false
      );
    }, [
      executeSearch,
      query,
    ]);

  const clearSearch =
    useCallback(() => {
      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current
        );
      }

      Keyboard.dismiss();

      setQuery("");
      setUsers([]);
      setHashtags([]);
      setSearchPosts([]);
      setSearchHasMore(false);
      setSearching(false);
      setError("");

      searchPageRef.current = 1;
    }, []);

  const refresh =
    useCallback(async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      try {
        if (isSearching) {
          searchPageRef.current = 1;

          await executeSearch(
            query.trim(),
            1,
            false
          );
        } else {
          pageRef.current = 1;

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
      refreshing,
    ]);

  const loadMore =
    useCallback(() => {
      if (loadingMore) {
        return;
      }

      if (isSearching) {
        if (
          !searchHasMore ||
          searching ||
          searchLoadingMoreRef.current
        ) {
          return;
        }

        executeSearch(
          query.trim(),
          searchPageRef.current + 1,
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

      loadExplore(
        pageRef.current + 1,
        true
      );
    }, [
      executeSearch,
      hasMore,
      isSearching,
      loadExplore,
      loading,
      loadingMore,
      query,
      searchHasMore,
      searching,
    ]);

  useFocusEffect(
    useCallback(() => {

      if (isSearching) {
        return;
      }

      pageRef.current = 1;

      loadExplore(
        1,
        false
      );
    }, [
      isSearching,
      loadExplore,
    ])
  );

  const openPost =
    useCallback(
      (post) => {
        const id =
          getPostId(post);

        if (
          !id ||
          id.startsWith(
            "explore-post-"
          )
        ) {
          console.warn(
            "[EXPLORE] Missing real post ID:",
            post
          );

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

  const openUser =
    useCallback(
      (user) => {
        const username =
          getUsername(user);

        if (!username) {
          console.warn(
            "[EXPLORE] Missing username:",
            user
          );

          return;
        }

        router.push({
          pathname:
            "/profile/[username]",
          params: {
            username: String(
              username
            ),
          },
        });
      },
      [router]
    );

  const exploreBlocks =
    useMemo(
      () => chunkPosts(posts),
      [posts]
    );

  const renderBlock =
    useCallback(
      ({ item, index }) => (
        <ExploreGridBlock
          items={item}
          blockIndex={index}
          onPress={openPost}
        />
      ),
      [openPost]
    );

  const renderSearchPost =
    useCallback(
      ({ item }) => (
        <ExploreTile
          post={item}
          size={TILE_SIZE}
          onPress={openPost}
        />
      ),
      [openPost]
    );

  const searchHeader =
    useMemo(() => {
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
              color={
                COLORS.secondary
              }
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
            onAction={clearSearch}
          />
        );
      }

      return (
        <View>
          
          {users.length > 0 && (
            <View>
              <SearchSectionTitle>
                People
              </SearchSectionTitle>

              {users.map(
                (user, index) => (
                  <SearchUserRow
                    key={
                      getUserId(user) ||
                      getUsername(user) ||
                      `user-${index}`
                    }
                    user={user}
                    onPress={openUser}
                  />
                )
              )}
            </View>
          )}

          {hashtags.length > 0 && (
            <View>
              <SearchSectionTitle>
                Hashtags
              </SearchSectionTitle>

              {hashtags.map(
                (
                  hashtag,
                  index
                ) => {
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

                  const display =
                    value.startsWith(
                      "#"
                    )
                      ? value
                      : `#${value}`;

                  const count =
                    hashtag?.count ??
                    hashtag?.postsCount ??
                    hashtag?.postCount ??
                    null;

                  return (
                    <Pressable
                      key={`${display}-${index}`}
                      style={({
                        pressed,
                      }) => [
                        styles.hashtagRow,
                        pressed &&
                          styles.pressed,
                      ]}
                      onPress={() =>
                        handleQueryChange(
                          display
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
                          {display}
                        </Text>

                        {count !==
                          null && (
                          <Text
                            style={
                              styles.hashtagCount
                            }
                          >
                            {count}{" "}
                            {count ===
                            1
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
            <SearchSectionTitle>
              Posts
            </SearchSectionTitle>
          )}
        </View>
      );
    }, [
      clearSearch,
      handleQueryChange,
      hashtags,
      openUser,
      query,
      searchPosts.length,
      searching,
      users,
    ]);

  const footer =
    loadingMore ? (
      <View
        style={styles.footerLoader}
      >
        <ActivityIndicator
          size="small"
          color={COLORS.secondary}
        />
      </View>
    ) : null;

  const renderSearchBar = () => (
    <View
      style={styles.searchContainer}
    >
      <View style={styles.searchBox}>
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
            submitSearch
          }
          placeholder="Search"
          placeholderTextColor={
            COLORS.placeholder
          }
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {query.length > 0 && (
          <Pressable
            onPress={clearSearch}
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
  );

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

        {renderSearchBar()}

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

      {renderSearchBar()}

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
            onPress={() => {
              if (isSearching) {
                executeSearch(
                  query.trim(),
                  1,
                  false
                );
              } else {
                loadExplore(
                  1,
                  false
                );
              }
            }}
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
          key="search"
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
              `search-${index}`
            )
          }
          ListHeaderComponent={
            searchHeader
          }
          ListFooterComponent={
            footer
          }
          contentContainerStyle={[
            styles.searchListContent,
            searchPosts.length ===
              0 &&
              styles.searchListEmpty,
          ]}
          numColumns={3}
          columnWrapperStyle={
            searchPosts.length > 0
              ? styles.searchColumn
              : undefined
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={refresh}
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
        />
      ) : (
        <FlatList
          key="explore"
          data={exploreBlocks}
          renderItem={
            renderBlock
          }
          keyExtractor={(
            item,
            index
          ) =>
            `explore-block-${index}-${getPostId(
              item?.[0],
              index
            )}`
          }
          ListFooterComponent={
            footer
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
          contentContainerStyle={
            posts.length === 0
              ? styles.emptyList
              : styles.exploreList
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
              onRefresh={refresh}
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
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
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
      COLORS.searchBackground,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 16,
  },

  exploreList: {
    paddingBottom: 20,
  },

  emptyList: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  mixedRow: {
    flexDirection: "row",
  },

  stackColumn: {
    justifyContent:
      "space-between",
  },

  plainRow: {
    flexDirection: "row",
    marginTop: GRID_GAP,
  },

  rightGap: {
    marginRight: GRID_GAP,
  },

  bottomGap: {
    marginBottom: GRID_GAP,
  },

  tile: {
    backgroundColor:
      COLORS.tileBackground,
    overflow: "hidden",
  },

  tileImage: {
    width: "100%",
    height: "100%",
    backgroundColor:
      COLORS.tileBackground,
  },

  emptyTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.tileBackground,
  },

  mediaIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.58)",
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
    color: COLORS.text,
    fontSize: 13,
  },

  retryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  userRow: {
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.white,
  },

  pressed: {
    opacity: 0.65,
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      COLORS.tileBackground,
  },

  userAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.tileBackground,
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
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  verifiedBadge: {
    flexShrink: 0,
  },

  searchUsername: {
    marginTop: 3,
    color: COLORS.secondary,
    fontSize: 13,
  },

  sectionHeader: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor:
      COLORS.white,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.searchBackground,
  },

  hashtagInfo: {
    flex: 1,
    marginLeft: 12,
  },

  hashtagName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  hashtagCount: {
    marginTop: 3,
    color: COLORS.secondary,
    fontSize: 12,
  },

  searchListContent: {
    paddingBottom: 30,
  },

  searchListEmpty: {
    flexGrow: 1,
  },

  searchColumn: {
    gap: GRID_GAP,
  },

  searchLoading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  searchLoadingText: {
    color: COLORS.secondary,
    fontSize: 14,
  },

  emptyState: {
    flex: 1,
    minHeight: 320,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyMessage: {
    maxWidth: 300,
    marginTop: 8,
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  emptyButton: {
    height: 38,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.text,
  },

  emptyButtonPressed: {
    opacity: 0.7,
  },

  emptyButtonText: {
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
    width:
      (SCREEN_WIDTH -
        GRID_GAP * 2) /
      3,
    aspectRatio: 1,
    backgroundColor: "#EEEEEE",
  },
});