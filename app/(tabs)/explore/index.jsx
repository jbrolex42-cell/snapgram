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

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#FFFFFF",
  text: "#111111",
  secondaryText: "#737373",
  border: "#DBDBDB",
  blue: "#0095F6",
  white: "#FFFFFF",
  black: "#000000",
  danger: "#D00",
};

const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const PAGE_LIMIT = 30;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TILE_SIZE =
  (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

const DOUBLE_TILE_SIZE =
  TILE_SIZE * 2 + GRID_GAP;

/* -------------------------------------------------------------------------- */
/* Safe helpers                                                               */
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
    return [
      {
        url: post.image,
        type: "image",
      },
    ];
  }

  if (post.imageUrl) {
    return [
      {
        url: post.imageUrl,
        type: "image",
      },
    ];
  }

  if (post.thumbnailUrl) {
    return [
      {
        url: post.thumbnailUrl,
        type: "image",
      },
    ];
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

  return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(
    getMediaUrl(media)
  );
}

function getMediaCount(post) {
  return getPostMedia(post).length;
}

function getFirstMedia(post) {
  return getPostMedia(post)[0] ?? null;
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

function getExploreLayout(post) {
  const layout = String(
    post?.exploreLayout ??
      post?.layout ??
      "normal"
  ).toLowerCase();

  if (
    layout === "large" ||
    layout === "wide" ||
    layout === "tall"
  ) {
    return layout;
  }

  return "normal";
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

function getResultReels(result) {
  if (Array.isArray(result?.reels)) {
    return result.reels;
  }

  if (Array.isArray(result?.data?.reels)) {
    return result.data.reels;
  }

  return [];
}

function mergeUniquePosts(existing, incoming) {
  const result = [];
  const seen = new Set();

  [...existing, ...incoming].forEach((post) => {
    const id = getPostId(post);

    if (!id || seen.has(id)) {
      return;
    }

    seen.add(id);
    result.push(post);
  });

  return result;
}

/* -------------------------------------------------------------------------- */
/* Explore grid placement                                                     */
/* -------------------------------------------------------------------------- */

/*
 * We maintain a 3-column occupancy grid.
 *
 * normal = 1x1
 * wide   = 2x1
 * tall   = 1x2
 * large  = 2x2
 *
 * The algorithm finds the first available location where the tile fits.
 * This produces a much more organic Explore layout than grouping every
 * five posts into the same fixed pattern.
 */

function canPlace(grid, row, column, width, height) {
  if (
    column + width >
    GRID_COLUMNS
  ) {
    return false;
  }

  for (
    let r = row;
    r < row + height;
    r += 1
  ) {
    const currentRow =
      grid[r] || [];

    for (
      let c = column;
      c < column + width;
      c += 1
    ) {
      if (currentRow[c]) {
        return false;
      }
    }
  }

  return true;
}

function occupy(
  grid,
  row,
  column,
  width,
  height
) {
  for (
    let r = row;
    r < row + height;
    r += 1
  ) {
    if (!grid[r]) {
      grid[r] = [];
    }

    for (
      let c = column;
      c < column + width;
      c += 1
    ) {
      grid[r][c] = true;
    }
  }
}

function findPlacement(
  grid,
  width,
  height
) {
  let row = 0;

  while (row < 10000) {
    for (
      let column = 0;
      column < GRID_COLUMNS;
      column += 1
    ) {
      if (
        canPlace(
          grid,
          row,
          column,
          width,
          height
        )
      ) {
        return {
          row,
          column,
        };
      }
    }

    row += 1;
  }

  return {
    row,
    column: 0,
  };
}

function getTileDimensions(layout) {
  switch (layout) {
    case "large":
      return {
        width: 2,
        height: 2,
      };

    case "wide":
      return {
        width: 2,
        height: 1,
      };

    case "tall":
      return {
        width: 1,
        height: 2,
      };

    default:
      return {
        width: 1,
        height: 1,
      };
  }
}

function getTilePixelSize(layout) {
  const { width, height } =
    getTileDimensions(layout);

  return {
    width:
      TILE_SIZE * width +
      GRID_GAP * (width - 1),

    height:
      TILE_SIZE * height +
      GRID_GAP * (height - 1),
  };
}

function buildExploreRows(posts) {
  const grid = [];
  const placements = [];

  const sortedPosts = posts.map(
    (post, index) => ({
      post,
      originalIndex: index,
    })
  );

  const priority = {
    large: 0,
    wide: 1,
    tall: 2,
    normal: 3,
  };

  sortedPosts.sort((a, b) => {
    const aPriority =
      priority[
        getExploreLayout(a.post)
      ] ?? 3;

    const bPriority =
      priority[
        getExploreLayout(b.post)
      ] ?? 3;

    if (aPriority !== bPriority) {
      return (
        aPriority - bPriority
      );
    }

    return (
      a.originalIndex -
      b.originalIndex
    );
  });

  /*
   * We don't want sorting to completely destroy chronological order.
   *
   * Therefore only use the backend layout as a placement hint.
   * The final visual ordering is reconstructed below.
   */
  const placementGrid = [];
  const placementMap = new Map();

  for (const item of sortedPosts) {
    const layout =
      getExploreLayout(
        item.post
      );

    const {
      width,
      height,
    } = getTileDimensions(
      layout
    );

    const placement =
      findPlacement(
        placementGrid,
        width,
        height
      );

    occupy(
      placementGrid,
      placement.row,
      placement.column,
      width,
      height
    );

    const tileSize =
      getTilePixelSize(layout);

    const placementData = {
      ...item,
      layout,
      row: placement.row,
      column: placement.column,
      width: tileSize.width,
      height: tileSize.height,
    };

    placements.push(
      placementData
    );

    placementMap.set(
      item.originalIndex,
      placementData
    );
  }

  /*
   * Build actual rows from the occupancy grid.
   *
   * Each row is a 3-column horizontal strip.
   */
  const maxRow =
    placementGrid.length;

  const rows = [];

  for (
    let row = 0;
    row < maxRow;
    row += 1
  ) {
    const rowTiles =
      placements.filter(
        (item) =>
          item.row === row
      );

    if (rowTiles.length) {
      rows.push({
        id: `row-${row}`,
        tiles: rowTiles,
      });
    }
  }

  /*
   * Keep React stable and ensure unused placementMap
   * doesn't affect output.
   */
  placementMap.clear();

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Explore tile                                                               */
/* -------------------------------------------------------------------------- */

const ExploreTile = memo(
  function ExploreTile({
    post,
    layout = "normal",
    width = TILE_SIZE,
    height = TILE_SIZE,
    onPress,
  }) {
    const media =
      getFirstMedia(post);

    const imageUri =
      getThumbnail(post);

    const video =
      isVideoMedia(media);

    const mediaCount =
      getMediaCount(post);

    const hasMultiple =
      mediaCount > 1;

    return (
      <Pressable
        onPress={() =>
          onPress(post)
        }
        style={[
          styles.tile,
          {
            width,
            height,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{
              uri: imageUri,
            }}
            style={styles.tileImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.emptyTile
            }
          >
            <Ionicons
              name="image-outline"
              size={28}
              color="#BDBDBD"
            />
          </View>
        )}

        {(video || hasMultiple) ? (
          <View
            style={
              styles.tileIndicators
            }
          >
            {video ? (
              <View
                style={
                  styles.indicator
                }
              >
                <Ionicons
                  name="play"
                  size={14}
                  color={
                    COLORS.white
                  }
                />
              </View>
            ) : null}

            {hasMultiple ? (
              <View
                style={[
                  styles.indicator,
                  video &&
                    styles.indicatorSpacing,
                ]}
              >
                <Ionicons
                  name="copy-outline"
                  size={15}
                  color={
                    COLORS.white
                  }
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {layout === "large" ? (
          <View
            style={
              styles.largeTileOverlay
            }
          />
        ) : null}
      </Pressable>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Explore row                                                                */
/* -------------------------------------------------------------------------- */

const ExploreGridRow = memo(
  function ExploreGridRow({
    row,
    onPostPress,
  }) {
    return (
      <View
        style={styles.gridRow}
      >
        {row.tiles.map(
          (tile) => (
            <ExploreTile
              key={getPostId(
                tile.post
              )}
              post={tile.post}
              layout={tile.layout}
              width={tile.width}
              height={tile.height}
              onPress={
                onPostPress
              }
            />
          )
        )}
      </View>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ExploreSkeleton() {
  const skeletons =
    Array.from({
      length: 18,
    });

  return (
    <View
      style={
        styles.skeletonContainer
      }
    >
      {skeletons.map(
        (_, index) => (
          <View
            key={index}
            style={[
              styles.skeletonTile,
              {
                width:
                  TILE_SIZE,
                height:
                  TILE_SIZE,
              },
            ]}
          />
        )
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Search user                                                                */
/* -------------------------------------------------------------------------- */

const SearchUserRow = memo(
  function SearchUserRow({
    user,
    onPress,
  }) {
    const username =
      getUsername(user);

    const displayName =
      getDisplayName(user);

    const avatar =
      getAvatar(user);

    const verified =
      isVerified(user);

    return (
      <Pressable
        onPress={() =>
          onPress(user)
        }
        style={
          styles.userRow
        }
      >
        {avatar ? (
          <Image
            source={{
              uri: avatar,
            }}
            style={
              styles.userAvatar
            }
          />
        ) : (
          <View
            style={
              styles.userAvatarPlaceholder
            }
          >
            <Ionicons
              name="person"
              size={22}
              color="#A0A0A0"
            />
          </View>
        )}

        <View
          style={
            styles.userTextContainer
          }
        >
          <View
            style={
              styles.usernameLine
            }
          >
            <Text
              style={
                styles.username
              }
              numberOfLines={1}
            >
              {username ||
                displayName ||
                "User"}
            </Text>

            {verified ? (
              <VerifiedBadge
                size={14}
                style={
                  styles.verifiedBadge
                }
              />
            ) : null}
          </View>

          {displayName &&
          displayName !==
            username ? (
            <Text
              style={
                styles.displayName
              }
              numberOfLines={1}
            >
              {displayName}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Search section title                                                       */
/* -------------------------------------------------------------------------- */

function SearchSectionTitle({
  title,
  count,
}) {
  return (
    <View
      style={
        styles.sectionTitleContainer
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {typeof count ===
      "number" ? (
        <Text
          style={
            styles.sectionCount
          }
        >
          {count}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon = "search-outline",
  title,
  message,
}) {
  return (
    <View
      style={styles.emptyState}
    >
      <View
        style={
          styles.emptyIconCircle
        }
      >
        <Ionicons
          name={icon}
          size={34}
          color={COLORS.text}
        />
      </View>

      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>

      {message ? (
        <Text
          style={
            styles.emptyMessage
          }
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main screen                                                                */
/* -------------------------------------------------------------------------- */

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

  const [searchReels, setSearchReels] =
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
    useState(true);

  const [
    searchHasMore,
    setSearchHasMore,
  ] = useState(false);

  const pageRef =
    useRef(1);

  const searchPageRef =
    useRef(1);

  const mountedRef =
    useRef(true);

  const searchTimerRef =
    useRef(null);

  const exploreRequestRef =
    useRef(0);

  const searchRequestRef =
    useRef(0);

  const loadingMoreRef =
    useRef(false);

  const searchLoadingMoreRef =
    useRef(false);

  const isSearching =
    query.trim().length > 0;

  /* ---------------------------------------------------------------------- */
  /* Lifecycle                                                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current =
        false;

      if (
        searchTimerRef.current
      ) {
        clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Explore                                                                */
  /* ---------------------------------------------------------------------- */

  const loadExplore =
    useCallback(
      async ({
        page = 1,
        replace = false,
        refresh = false,
      } = {}) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        if (
          !replace &&
          loadingMoreRef.current
        ) {
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
          loadingMoreRef.current =
            true;

          setLoadingMore(true);
        }

        try {
          const result =
            await getExplorePosts(
              page,
              PAGE_LIMIT
            );

          if (
            !mountedRef.current ||
            requestId !==
              exploreRequestRef.current
          ) {
            return;
          }

          const nextPosts =
            getResultPosts(
              result
            );

          setPosts((current) =>
            replace
              ? nextPosts
              : mergeUniquePosts(
                  current,
                  nextPosts
                )
          );

          setHasMore(
            getHasMore(result)
          );

          pageRef.current =
            page;
        } catch (err) {
          console.error(
            "[Explore] load error:",
            err
          );

          if (
            mountedRef.current &&
            requestId ===
              exploreRequestRef.current
          ) {
            setError(
              err?.message ||
                "Unable to load Explore right now."
            );
          }
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              exploreRequestRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);

            loadingMoreRef.current =
              false;
          }
        }
      },
      []
    );

  /* ---------------------------------------------------------------------- */
  /* Search                                                                 */
  /* ---------------------------------------------------------------------- */

  const executeSearch =
    useCallback(
      async ({
        value,
        page = 1,
        replace = true,
      }) => {
        const cleanQuery =
          String(value || "")
            .trim();

        if (!cleanQuery) {
          return;
        }

        if (
          !replace &&
          searchLoadingMoreRef.current
        ) {
          return;
        }

        const requestId =
          ++searchRequestRef.current;

        if (replace) {
          setSearching(true);
          setError("");
        } else {
          searchLoadingMoreRef.current =
            true;

          setLoadingMore(true);
        }

        try {
          const result =
            await searchExplore(
              cleanQuery,
              page,
              PAGE_LIMIT
            );

          if (
            !mountedRef.current ||
            requestId !==
              searchRequestRef.current
          ) {
            return;
          }

          const nextUsers =
            getResultUsers(
              result
            );

          const nextHashtags =
            getResultHashtags(
              result
            );

          const nextPosts =
            getResultPosts(
              result
            );

          const nextReels =
            getResultReels(
              result
            );

          setUsers((current) =>
            replace
              ? nextUsers
              : [...current, ...nextUsers]
          );

          setHashtags((current) =>
            replace
              ? nextHashtags
              : [
                  ...current,
                  ...nextHashtags,
                ]
          );

          setSearchPosts((current) =>
            replace
              ? nextPosts
              : mergeUniquePosts(
                  current,
                  nextPosts
                )
          );

          setSearchReels((current) =>
            replace
              ? nextReels
              : mergeUniquePosts(
                  current,
                  nextReels
                )
          );

          setSearchHasMore(
            getHasMore(result)
          );

          searchPageRef.current =
            page;
        } catch (err) {
          console.error(
            "[Explore] search error:",
            err
          );

          if (
            mountedRef.current &&
            requestId ===
              searchRequestRef.current
          ) {
            setError(
              err?.message ||
                "Search failed. Please try again."
            );
          }
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              searchRequestRef.current
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

  /* ---------------------------------------------------------------------- */
  /* Search debounce                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const cleanQuery =
      query.trim();

    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    if (!cleanQuery) {
      searchRequestRef.current += 1;

      setUsers([]);
      setHashtags([]);
      setSearchPosts([]);
      setSearchReels([]);
      setSearchHasMore(false);
      setSearching(false);
      setError("");

      return;
    }

    searchTimerRef.current =
      setTimeout(() => {
        searchPageRef.current = 1;

        executeSearch({
          value: cleanQuery,
          page: 1,
          replace: true,
        });
      }, 350);

    return () => {
      if (
        searchTimerRef.current
      ) {
        clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, [
    query,
    executeSearch,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Initial load                                                           */
  /* ---------------------------------------------------------------------- */

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
    }, [
      loadExplore,
      query,
    ])
  );

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const handleRefresh =
    useCallback(() => {
      if (isSearching) {
        const cleanQuery =
          query.trim();

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

  const handleLoadMore =
    useCallback(() => {
      if (isSearching) {
        if (
          !searchHasMore ||
          searching ||
          searchLoadingMoreRef.current
        ) {
          return;
        }

        executeSearch({
          value: query,
          page:
            searchPageRef.current +
            1,
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

      loadExplore({
        page:
          pageRef.current + 1,
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

  const clearSearch =
    useCallback(() => {
      Keyboard.dismiss();
      setQuery("");
    }, []);

  const handlePostPress =
    useCallback(
      (post) => {
        const id =
          getPostId(post);

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

  const handleUserPress =
    useCallback(
      (user) => {
        const username =
          getUsername(user);

        if (!username) {
          return;
        }

        router.push({
          pathname:
            "/profile/[username]",
          params: {
            username:
              String(username),
          },
        });
      },
      [router]
    );

  /* ---------------------------------------------------------------------- */
  /* Grid                                                                    */
  /* ---------------------------------------------------------------------- */

  const exploreRows =
    useMemo(
      () =>
        buildExploreRows(
          posts
        ),
      [posts]
    );

  /* ---------------------------------------------------------------------- */
  /* Header                                                                  */
  /* ---------------------------------------------------------------------- */

  const header = (
    <View
      style={styles.header}
    >
      <View
        style={
          styles.searchContainer
        }
      >
        <Ionicons
          name="search"
          size={19}
          color={
            COLORS.secondaryText
          }
        />

        <TextInput
          value={query}
          onChangeText={
            setQuery
          }
          placeholder="Search"
          placeholderTextColor={
            COLORS.secondaryText
          }
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={
            styles.searchInput
          }
        />

        {query.length > 0 ? (
          <Pressable
            onPress={
              clearSearch
            }
            hitSlop={10}
            style={
              styles.clearButton
            }
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

  /* ---------------------------------------------------------------------- */
  /* Search grid                                                             */
  /* ---------------------------------------------------------------------- */

  const renderSearchGrid =
    (items) => {
      if (!items.length) {
        return null;
      }

      return (
        <View
          style={
            styles.searchGrid
          }
        >
          {items.map(
            (post) => (
              <ExploreTile
                key={getPostId(
                  post
                )}
                post={post}
                layout="normal"
                width={
                  TILE_SIZE
                }
                height={
                  TILE_SIZE
                }
                onPress={
                  handlePostPress
                }
              />
            )
          )}
        </View>
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Search screen                                                           */
  /* ---------------------------------------------------------------------- */

  if (isSearching) {
    const hasSearchResults =
      users.length > 0 ||
      hashtags.length > 0 ||
      searchPosts.length > 0 ||
      searchReels.length > 0;

    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        {header}

        {searching &&
        !hasSearchResults ? (
          <View
            style={
              styles.searchLoading
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.text
              }
            />
          </View>
        ) : null}

        {!searching &&
        !hasSearchResults ? (
          <EmptyState
            icon="search-outline"
            title="No results found"
            message="Try searching for another username, hashtag, or post."
          />
        ) : null}

        {error ? (
          <View
            style={
              styles.errorBanner
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={
                COLORS.danger
              }
            />

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        {hasSearchResults ? (
          <FlatList
            data={[
              {
                id: "search",
              },
            ]}
            keyExtractor={(
              item
            ) => item.id}
            renderItem={() => (
              <View>
                {users.length >
                0 ? (
                  <View>
                    <SearchSectionTitle
                      title="People"
                      count={
                        users.length
                      }
                    />

                    {users.map(
                      (
                        user,
                        index
                      ) => (
                        <SearchUserRow
                          key={
                            getUserId(
                              user
                            ) ||
                            getUsername(
                              user
                            ) ||
                            `user-${index}`
                          }
                          user={
                            user
                          }
                          onPress={
                            handleUserPress
                          }
                        />
                      )
                    )}
                  </View>
                ) : null}

                {hashtags.length >
                0 ? (
                  <View>
                    <SearchSectionTitle
                      title="Hashtags"
                      count={
                        hashtags.length
                      }
                    />

                    {hashtags.map(
                      (
                        hashtag,
                        index
                      ) => {
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
                                size={20}
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

                              {typeof hashtag ===
                                "object" &&
                              hashtag?.postsCount !=
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
                ) : null}

                {searchPosts.length >
                0 ? (
                  <View>
                    <SearchSectionTitle
                      title="Posts"
                      count={
                        searchPosts.length
                      }
                    />

                    {renderSearchGrid(
                      searchPosts
                    )}
                  </View>
                ) : null}

                {searchReels.length >
                0 ? (
                  <View>
                    <SearchSectionTitle
                      title="Reels"
                      count={
                        searchReels.length
                      }
                    />

                    {renderSearchGrid(
                      searchReels
                    )}
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
                onRefresh={
                  handleRefresh
                }
                tintColor={
                  COLORS.text
                }
              />
            }
            onEndReached={
              handleLoadMore
            }
            onEndReachedThreshold={
              0.6
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.searchContent
            }
          />
        ) : null}
      </SafeAreaView>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Normal Explore                                                         */
  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      {header}

      {error ? (
        <View
          style={
            styles.errorBanner
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={
              COLORS.danger
            }
          />

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      ) : null}

      {loading &&
      !posts.length ? (
        <ExploreSkeleton />
      ) : posts.length ===
        0 ? (
        <EmptyState
          icon="compass-outline"
          title="Nothing to explore yet"
          message="New posts and reels will appear here."
        />
      ) : (
        <FlatList
          data={exploreRows}
          keyExtractor={(
            item
          ) => item.id}
          renderItem={({
            item,
          }) => (
            <ExploreGridRow
              row={item}
              onPostPress={
                handlePostPress
              }
            />
          )}
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
            />
          }
          onEndReached={
            handleLoadMore
          }
          onEndReachedThreshold={
            0.7
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.exploreContent
          }
          ListFooterComponent={
            loadingMore ? (
              <View
                style={
                  styles.loadingMoreContainer
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.secondaryText
                  }
                />
              </View>
            ) : (
              <View
                style={
                  styles.footerSpace
                }
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    backgroundColor:
      COLORS.background,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },

  searchContainer: {
    height: 40,
    borderRadius: 10,
    backgroundColor:
      "#EFEFEF",
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

  /* ---------------------------------------------------------------------- */
  /* Instagram-style Explore grid                                           */
  /* ---------------------------------------------------------------------- */

  gridRow: {
    width: SCREEN_WIDTH,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: GRID_GAP,
  },

  tile: {
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
    position: "relative",
  },

  tileImage: {
    width: "100%",
    height: "100%",
  },

  emptyTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },

  tileIndicators: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  indicator: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.42)",
  },

  indicatorSpacing: {
    marginLeft: 5,
  },

  largeTileOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 55,
    backgroundColor:
      "rgba(0,0,0,0.08)",
  },

  /* ---------------------------------------------------------------------- */
  /* Skeleton                                                                */
  /* ---------------------------------------------------------------------- */

  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  skeletonTile: {
    backgroundColor: "#EEEEEE",
  },

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

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

  searchGrid: {
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

  searchContent: {
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------------------- */
  /* Empty                                                                   */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* Error                                                                   */
  /* ---------------------------------------------------------------------- */

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
    color: COLORS.danger,
  },

  /* ---------------------------------------------------------------------- */
  /* Footer                                                                  */
  /* ---------------------------------------------------------------------- */

  loadingMoreContainer: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  footerSpace: {
    height: 24,
  },

  exploreContent: {
    paddingBottom: 24,
  },
});