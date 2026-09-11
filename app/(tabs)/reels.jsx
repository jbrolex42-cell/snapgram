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

export default function ReelsScreen() {
  const listRef = useRef(null);
  const mountedRef = useRef(true);

  const [reels, setReels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [muted, setMuted] = useState(false);

  const [error, setError] = useState("");

  const [likedIds, setLikedIds] = useState(
    () => new Set()
  );

  const [savedIds, setSavedIds] = useState(
    () => new Set()
  );

  const [followingIds, setFollowingIds] = useState(
    () => new Set()
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadReels = useCallback(
    async ({
      refresh = false,
      requestedPage = 1,
    } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else if (requestedPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError("");

        const result = await getReels(
          requestedPage,
          PAGE_SIZE
        );

        const incoming = Array.isArray(result)
          ? result
          : result?.reels ||
            result?.data ||
            [];

        const normalized = Array.isArray(incoming)
          ? incoming.filter(Boolean)
          : [];

        if (!mountedRef.current) {
          return;
        }

        if (requestedPage === 1) {
          setReels(normalized);
          setActiveIndex(0);
          setPage(1);
        }

        else {
          setReels((previous) => {
            const existingIds = new Set(
              previous
                .map((item) =>
                  item?._id
                    ? item._id.toString()
                    : null
                )
                .filter(Boolean)
            );

            const unique = normalized.filter(
              (item) => {
                const id = item?._id
                  ? item._id.toString()
                  : null;

                if (!id) {
                  return true;
                }

                if (existingIds.has(id)) {
                  return false;
                }

                existingIds.add(id);

                return true;
              }
            );

            return [
              ...previous,
              ...unique,
            ];
          });

          setPage(requestedPage);
        }

        const pagination =
          result?.pagination ||
          result?.meta;

        if (pagination) {
          const current = Number(
            pagination.page ??
              pagination.currentPage ??
              requestedPage
          );

          const total = Number(
            pagination.pages ??
              pagination.totalPages ??
              0
          );

          if (total > 0) {
            setHasMore(current < total);
          } else {
            setHasMore(
              normalized.length >= PAGE_SIZE
            );
          }
        } else {
          setHasMore(
            normalized.length >= PAGE_SIZE
          );
        }
      } catch (err) {
        console.error(
          "Reels loading error:",
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
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      if (!reels.length) {
        loadReels({
          requestedPage: 1,
        });
      }

      return undefined;
    }, [loadReels, reels.length])
  );

  const handleRefresh = useCallback(() => {
    loadReels({
      refresh: true,
      requestedPage: 1,
    });
  }, [loadReels]);

  const handleEndReached = useCallback(() => {
    if (
      loading ||
      loadingMore ||
      refreshing ||
      !hasMore ||
      !reels.length
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
    refreshing,
    reels.length,
  ]);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }) => {
      const visibleItem =
        viewableItems?.find(
          (item) => item?.isViewable
        ) ||
        viewableItems?.[0];

      const index = visibleItem?.index;

      if (typeof index === "number") {
        setActiveIndex(index);
      }
    }
  ).current;

  const handleLike = useCallback(
    (reelId) => {
      if (!reelId) {
        return;
      }

      const id = reelId.toString();

      setLikedIds((previous) => {
        const next = new Set(previous);

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

  const handleSave = useCallback(
    (reelId) => {
      if (!reelId) {
        return;
      }

      const id = reelId.toString();

      setSavedIds((previous) => {
        const next = new Set(previous);

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

  const handleFollow = useCallback(
    (userId) => {
      if (!userId) {
        return;
      }

      const id = userId.toString();

      setFollowingIds((previous) => {
        const next = new Set(previous);

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

  const handleDoubleTap = useCallback(
    (reel) => {
      const id = reel?._id;

      if (!id) {
        return;
      }

      const normalizedId = id.toString();

      setLikedIds((previous) => {
        const next = new Set(previous);

        next.add(normalizedId);

        return next;
      });
    },
    []
  );

  const openComments = useCallback(
    (reel) => {
      const id = reel?._id;

      if (!id) {
        return;
      }

      router.push({
        pathname: "/reels/comments",
        params: {
          reelId: id.toString(),
        },
      });
    },
    []
  );

  const handleShare = useCallback(
    (reel) => {
      const id = reel?._id;

      if (!id) {
        return;
      }

      router.push({
        pathname: "/share",
        params: {
          type: "reel",
          id: id.toString(),
        },
      });
    },
    []
  );

  const openProfile = useCallback(
    (user) => {
      const userId =
        user?._id ||
        user?.id;

      if (!userId) {
        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: userId.toString(),
        },
      });
    },
    []
  );

  const toggleMute = useCallback(() => {
    setMuted((previous) => !previous);
  }, []);

  const renderHeader = () => {
    return (
      <View
        pointerEvents="box-none"
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            Reels
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() =>
              router.push("/create/reel")
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
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const reelId = item?._id
        ? item._id.toString()
        : null;

      const user =
        item?.user ||
        item?.author ||
        {};

      const authorId =
        user?._id ||
        user?.id;

      const isLiked = reelId
        ? likedIds.has(reelId)
        : Boolean(item?.isLiked);

      const isSaved = reelId
        ? savedIds.has(reelId)
        : Boolean(item?.isSaved);

      const isFollowing = authorId
        ? followingIds.has(
            authorId.toString()
          )
        : Boolean(user?.isFollowing);

      return (
        <View style={styles.reelPage}>
          <ReelItem
            reel={item}
            active={
              index === activeIndex
            }
            muted={muted}
            isLiked={isLiked}
            isSaved={isSaved}
            isFollowing={isFollowing}
            onLike={() =>
              handleLike(reelId)
            }
            onSave={() =>
              handleSave(reelId)
            }
            onFollow={() =>
              handleFollow(authorId)
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
              handleDoubleTap(item)
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

  const renderFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator
          size="small"
          color="#fff"
        />
      </View>
    );
  }, [loadingMore]);

  if (loading && !reels.length) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#fff"
        />
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View style={styles.emptyScreen}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="film-outline"
            size={42}
            color="#fff"
          />
        </View>

        <Text style={styles.emptyTitle}>
          {error
            ? "Couldn't load Reels"
            : "No Reels yet"}
        </Text>

        <Text style={styles.emptyDescription}>
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
          style={styles.createButton}
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

          <Text style={styles.createButtonText}>
            {error
              ? "Try again"
              : "Create a Reel"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?._id
            ? item._id.toString()
            : `reel-${index}`
        }

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
          offset: height * index,
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
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={["#fff"]}
            progressBackgroundColor="#000"
          />
        }

        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}

        contentContainerStyle={
          styles.listContent
        }

        ListFooterComponent={
          renderFooter
        }
      />

      <View
        pointerEvents="none"
        style={styles.topScrim}
      />

      <View
        pointerEvents="none"
        style={styles.bottomScrim}
      />

      {renderHeader()}

      <Pressable
        onPress={toggleMute}
        hitSlop={10}
        style={styles.soundButton}
      >
        <View style={styles.soundButtonBackground}>
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

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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