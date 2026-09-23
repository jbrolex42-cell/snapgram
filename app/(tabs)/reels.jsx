import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import ReelItem from "../../components/reels/ReelItem";
import { getReels } from "../../services/reelService";

const { width, height } = Dimensions.get("window");

const PAGE_SIZE = 10;

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 80,
};

function getId(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (value?._id) {
    return String(value._id);
  }

  if (value?.id) {
    return String(value.id);
  }

  return null;
}

function normalizeReels(result) {
  if (Array.isArray(result)) {
    return result.filter(Boolean);
  }

  if (Array.isArray(result?.reels)) {
    return result.reels.filter(Boolean);
  }

  if (Array.isArray(result?.data)) {
    return result.data.filter(Boolean);
  }

  if (Array.isArray(result?.posts)) {
    return result.posts.filter(Boolean);
  }

  return [];
}

function getPagination(result, requestedPage, itemCount) {
  const pagination =
    result?.pagination ||
    result?.meta ||
    {};

  const currentPage = Number(
    pagination.page ??
      pagination.currentPage ??
      requestedPage
  );

  const totalPages = Number(
    pagination.pages ??
      pagination.totalPages ??
      0
  );

  let hasMore;

  if (typeof pagination.hasMore === "boolean") {
    hasMore = pagination.hasMore;
  } else if (
    typeof pagination.has_more === "boolean"
  ) {
    hasMore = pagination.has_more;
  } else if (totalPages > 0) {
    hasMore = currentPage < totalPages;
  } else {
    hasMore = itemCount >= PAGE_SIZE;
  }

  return {
    page: currentPage,
    hasMore,
  };
}

export default function ReelsScreen() {
  const listRef = useRef(null);

  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const initialLoadedRef = useRef(false);

  const [reels, setReels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [muted, setMuted] = useState(false);

  const [error, setError] = useState("");

  /*
   * These are UI states for optimistic interaction.
   *
   * Your backend should eventually be called from
   * handleLike / handleSave / handleFollow.
   */
  const [likedIds, setLikedIds] = useState(
    () => new Set()
  );

  const [savedIds, setSavedIds] = useState(
    () => new Set()
  );

  const [followingIds, setFollowingIds] =
    useState(() => new Set());

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
   * Load a page of Reels.
   */
  const loadReels = useCallback(
    async ({
      refresh = false,
      requestedPage = 1,
    } = {}) => {
      if (
        requestedPage > 1 &&
        loadingMoreRef.current
      ) {
        return;
      }

      try {
        if (requestedPage > 1) {
          loadingMoreRef.current = true;
          setLoadingMore(true);
        } else if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result = await getReels(
          requestedPage,
          PAGE_SIZE
        );

        if (!mountedRef.current) {
          return;
        }

        const incoming =
          normalizeReels(result);

        /*
         * FIRST PAGE
         */
        if (requestedPage === 1) {
          setReels(incoming);
          setPage(1);
          setActiveIndex(0);

          /*
           * Initialize interaction state from
           * backend response.
           */
          const initialLiked = new Set();
          const initialSaved = new Set();
          const initialFollowing = new Set();

          incoming.forEach((reel) => {
            const reelId = getId(reel);

            if (
              reelId &&
              (
                reel?.isLiked ||
                reel?.liked
              )
            ) {
              initialLiked.add(reelId);
            }

            if (
              reelId &&
              (
                reel?.isSaved ||
                reel?.saved
              )
            ) {
              initialSaved.add(reelId);
            }

            const user =
              reel?.user ||
              reel?.author ||
              {};

            const userId = getId(user);

            if (
              userId &&
              (
                user?.isFollowing ||
                user?.following
              )
            ) {
              initialFollowing.add(userId);
            }
          });

          setLikedIds(initialLiked);
          setSavedIds(initialSaved);
          setFollowingIds(
            initialFollowing
          );
        }

        /*
         * NEXT PAGE
         */
        else {
          setReels((previous) => {
            const existingIds = new Set(
              previous
                .map(getId)
                .filter(Boolean)
            );

            const unique =
              incoming.filter((item) => {
                const id = getId(item);

                /*
                 * If there is no ID, retain it.
                 * Normally every MongoDB Reel should
                 * have an _id.
                 */
                if (!id) {
                  return true;
                }

                if (existingIds.has(id)) {
                  return false;
                }

                existingIds.add(id);

                return true;
              });

            return [
              ...previous,
              ...unique,
            ];
          });

          setPage(requestedPage);
        }

        const pagination =
          getPagination(
            result,
            requestedPage,
            incoming.length
          );

        setHasMore(
          pagination.hasMore
        );

        initialLoadedRef.current = true;
      } catch (err) {
        console.error(
          "[REELS] Load error:",
          err
        );

        if (!mountedRef.current) {
          return;
        }

        if (requestedPage === 1) {
          setReels([]);
          setError(
            "Couldn't load Reels. Please try again."
          );
        }
      } finally {
        if (!mountedRef.current) {
          return;
        }

        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);

        loadingMoreRef.current = false;
      }
    },
    []
  );

  /*
   * Initial load.
   *
   * Do not repeatedly reload the entire Reel feed
   * every time the tab receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      if (!initialLoadedRef.current) {
        loadReels({
          requestedPage: 1,
        });
      }

      return undefined;
    }, [loadReels])
  );

  /*
   * Pull to refresh.
   */
  const handleRefresh = useCallback(() => {
    if (
      refreshing ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadReels({
      refresh: true,
      requestedPage: 1,
    });
  }, [loadReels, refreshing]);

  /*
   * Infinite scroll.
   */
  const handleEndReached = useCallback(() => {
    if (
      loading ||
      refreshing ||
      loadingMore ||
      loadingMoreRef.current ||
      !hasMore ||
      reels.length === 0
    ) {
      return;
    }

    loadReels({
      requestedPage: page + 1,
    });
  }, [
    hasMore,
    loadReels,
    loading,
    loadingMore,
    page,
    reels.length,
    refreshing,
  ]);

  /*
   * Detect the Reel currently occupying
   * the screen.
   */
  const handleViewableItemsChanged =
    useRef(
      ({ viewableItems }) => {
        const visible =
          viewableItems?.find(
            (item) =>
              item?.isViewable
          ) ||
          viewableItems?.[0];

        const index =
          visible?.index;

        if (
          typeof index === "number"
        ) {
          setActiveIndex(index);
        }
      }
    ).current;

  /*
   * LIKE
   */
  const handleLike = useCallback(
    (reelId) => {
      const id = getId(reelId);

      if (!id) {
        return;
      }

      setLikedIds((previous) => {
        const next =
          new Set(previous);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    },
    []
  );

  /*
   * SAVE
   */
  const handleSave = useCallback(
    (reelId) => {
      const id = getId(reelId);

      if (!id) {
        return;
      }

      setSavedIds((previous) => {
        const next =
          new Set(previous);

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    },
    []
  );

  /*
   * FOLLOW
   */
  const handleFollow = useCallback(
    (userId) => {
      const id = getId(userId);

      if (!id) {
        return;
      }

      setFollowingIds(
        (previous) => {
          const next =
            new Set(previous);

          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }

          return next;
        }
      );
    },
    []
  );

  /*
   * Double tap = like.
   */
  const handleDoubleTap =
    useCallback((reel) => {
      const reelId = getId(reel);

      if (!reelId) {
        return;
      }

      setLikedIds((previous) => {
        const next =
          new Set(previous);

        next.add(reelId);

        return next;
      });
    }, []);

  /*
   * COMMENTS
   */
  const openComments =
    useCallback((reel) => {
      const id = getId(reel);

      if (!id) {
        return;
      }

      router.push({
        pathname: "/reels/comments",
        params: {
          reelId: id,
        },
      });
    }, []);

  /*
   * SHARE
   */
  const handleShare =
    useCallback((reel) => {
      const id = getId(reel);

      if (!id) {
        return;
      }

      router.push({
        pathname: "/share",
        params: {
          type: "reel",
          id,
        },
      });
    }, []);

  /*
   * PROFILE
   */
  const openProfile =
    useCallback((user) => {
      const userId = getId(user);

      if (!userId) {
        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: userId,
        },
      });
    }, []);

  /*
   * MUTE
   */
  const toggleMute =
    useCallback(() => {
      setMuted(
        (previous) => !previous
      );
    }, []);

  /*
   * HEADER
   */
  const renderHeader =
    useCallback(() => {
      return (
        <View
          pointerEvents="box-none"
          style={styles.header}
        >
          <Text
            style={styles.headerTitle}
          >
            Reels
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/create/reel"
              )
            }
            hitSlop={12}
            style={styles.headerButton}
          >
            <Ionicons
              name="camera-outline"
              size={28}
              color="#fff"
            />
          </Pressable>
        </View>
      );
    }, []);

  /*
   * REEL ITEM
   */
  const renderItem = useCallback(
    ({ item, index }) => {
      const reelId =
        getId(item);

      const user =
        item?.user ||
        item?.author ||
        {};

      const authorId =
        getId(user);

      const isLiked =
        reelId
          ? likedIds.has(reelId)
          : Boolean(
              item?.isLiked
            );

      const isSaved =
        reelId
          ? savedIds.has(reelId)
          : Boolean(
              item?.isSaved
            );

      const isFollowing =
        authorId
          ? followingIds.has(
              authorId
            )
          : Boolean(
              user?.isFollowing
            );

      return (
        <View
          style={styles.reelPage}
        >
          <ReelItem
            reel={item}

            /*
             * ONLY THE CURRENTLY VISIBLE
             * REEL SHOULD PLAY.
             */
            active={
              index === activeIndex
            }

            muted={muted}

            isLiked={isLiked}
            isSaved={isSaved}
            isFollowing={
              isFollowing
            }

            onLike={() =>
              handleLike(
                reelId
              )
            }

            onSave={() =>
              handleSave(
                reelId
              )
            }

            onFollow={() =>
              handleFollow(
                authorId
              )
            }

            onComment={() =>
              openComments(item)
            }

            onShare={() =>
              handleShare(item)
            }

            onProfile={() =>
              openProfile(user)
            }

            onDoubleTap={() =>
              handleDoubleTap(
                item
              )
            }
          />
        </View>
      );
    },
    [
      activeIndex,
      followingIds,
      handleDoubleTap,
      handleFollow,
      handleLike,
      handleSave,
      handleShare,
      likedIds,
      muted,
      openComments,
      openProfile,
      savedIds,
    ]
  );

  /*
   * LOAD MORE FOOTER
   */
  const renderFooter =
    useCallback(() => {
      if (!loadingMore) {
        return null;
      }

      return (
        <View
          style={styles.loadingMore}
        >
          <ActivityIndicator
            size="small"
            color="#fff"
          />
        </View>
      );
    }, [loadingMore]);

  /*
   * INITIAL LOADING
   */
  if (
    loading &&
    !reels.length
  ) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
          color="#fff"
        />
      </View>
    );
  }

  /*
   * EMPTY
   */
  if (!reels.length) {
    return (
      <View
        style={styles.emptyScreen}
      >
        <View
          style={styles.emptyIcon}
        >
          <Ionicons
            name="film-outline"
            size={42}
            color="#fff"
          />
        </View>

        <Text
          style={styles.emptyTitle}
        >
          {error
            ? "Couldn't load Reels"
            : "No Reels yet"}
        </Text>

        <Text
          style={
            styles.emptyDescription
          }
        >
          {error ||
            "Be the first to share a Reel on Snapgram."}
        </Text>

        <Pressable
          onPress={() => {
            if (error) {
              loadReels({
                requestedPage: 1,
              });
            } else {
              router.push(
                "/create/reel"
              );
            }
          }}
          style={
            styles.createButton
          }
        >
          <Ionicons
            name={
              error
                ? "refresh"
                : "add"
            }
            size={19}
            color="#000"
          />

          <Text
            style={
              styles.createButtonText
            }
          >
            {error
              ? "Try again"
              : "Create a Reel"}
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * REELS
   */
  return (
    <View
      style={styles.container}
    >
      <FlatList
        ref={listRef}
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          const id = getId(item);

          return id
            ? `reel-${id}`
            : `reel-${index}`;
        }}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        removeClippedSubviews
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        getItemLayout={(_, index) => ({
          length: height,
          offset:
            height * index,
          index,
        })}
        onViewableItemsChanged={
          handleViewableItemsChanged
        }
        viewabilityConfig={
          VIEWABILITY_CONFIG
        }
        onEndReached={
          handleEndReached
        }
        onEndReachedThreshold={0.75}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            tintColor="#fff"
            colors={["#fff"]}
            progressBackgroundColor="#000"
          />
        }
        showsVerticalScrollIndicator={
          false
        }
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContent
        }
        ListFooterComponent={
          renderFooter
        }
      />

      {/* TOP GRADIENT/SCRIM */}
      <View
        pointerEvents="none"
        style={styles.topScrim}
      />

      {/* BOTTOM GRADIENT/SCRIM */}
      <View
        pointerEvents="none"
        style={styles.bottomScrim}
      />

      {renderHeader()}

      {/* GLOBAL MUTE BUTTON */}
      <Pressable
        onPress={toggleMute}
        hitSlop={10}
        style={styles.soundButton}
      >
        <View
          style={
            styles.soundButtonBackground
          }
        >
          <Ionicons
            name={
              muted
                ? "volume-mute"
                : "volume-high"
            }
            size={17}
            color="#fff"
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  reelPage: {
    width,
    height,
    backgroundColor: "#000",
  },

  listContent: {
    padding: 0,
    margin: 0,
  },

  header: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 92,

    paddingTop: 42,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    zIndex: 100,
  },

  headerTitle: {
    color: "#fff",

    fontSize: 20,
    fontWeight: "700",

    letterSpacing: -0.3,
  },

  headerButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  soundButton: {
    position: "absolute",

    right: 15,
    bottom: 105,

    zIndex: 80,

    width: 34,
    height: 34,

    alignItems: "center",
    justifyContent: "center",
  },

  soundButtonBackground: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor:
      "rgba(0,0,0,0.48)",

    alignItems: "center",
    justifyContent: "center",
  },

  topScrim: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 125,

    zIndex: 20,

    backgroundColor:
      "rgba(0,0,0,0.18)",
  },

  bottomScrim: {
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    height: 270,

    zIndex: 20,

    backgroundColor:
      "rgba(0,0,0,0.16)",
  },

  loadingScreen: {
    flex: 1,

    backgroundColor: "#000",

    alignItems: "center",
    justifyContent: "center",
  },

  loadingMore: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 20,

    height: 35,

    alignItems: "center",
    justifyContent: "center",
  },

  emptyScreen: {
    flex: 1,

    backgroundColor: "#000",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 82,
    height: 82,

    borderRadius: 41,

    borderWidth: 1.5,
    borderColor:
      "rgba(255,255,255,0.30)",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 20,
  },

  emptyTitle: {
    color: "#fff",

    fontSize: 20,
    fontWeight: "700",

    textAlign: "center",
  },

  emptyDescription: {
    color:
      "rgba(255,255,255,0.62)",

    fontSize: 14,
    lineHeight: 20,

    textAlign: "center",

    marginTop: 9,

    maxWidth: 300,
  },

  createButton: {
    minHeight: 44,

    marginTop: 24,

    paddingHorizontal: 22,

    borderRadius: 22,

    backgroundColor: "#fff",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  createButtonText: {
    color: "#000",

    fontSize: 14,
    fontWeight: "700",
  },
});