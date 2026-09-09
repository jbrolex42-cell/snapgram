import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
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
import { LinearGradient } from "expo-linear-gradient";

import ReelItem from "../../components/reels/ReelItem";

import {
  getReels,
} from "../../services/reelService";

const { height, width } =
  Dimensions.get("window");

const PAGE_SIZE = 10;

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 80,
};

export default function ReelsScreen() {
  const listRef = useRef(null);

  const [reels, setReels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const [muted, setMuted] =
    useState(false);

  const [error, setError] =
    useState("");

  const [likedIds, setLikedIds] =
    useState(() => new Set());

  const [savedIds, setSavedIds] =
    useState(() => new Set());

  const [followingIds, setFollowingIds] =
    useState(() => new Set());

  const mountedRef =
    useRef(true);

  useEffect(() => {
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

        const result =
          await getReels(
            requestedPage,
            PAGE_SIZE
          );

        const incoming =
          Array.isArray(result)
            ? result
            : result?.reels ||
              result?.data ||
              [];

        const normalized =
          Array.isArray(incoming)
            ? incoming.filter(Boolean)
            : [];

        if (!mountedRef.current) {
          return;
        }

        if (
          requestedPage === 1
        ) {
          setReels(normalized);
          setActiveIndex(0);
        } else {
          setReels((previous) => {
            const existingIds =
              new Set(
                previous
                  .map((item) =>
                    item?._id?.toString()
                  )
                  .filter(Boolean)
              );

            const unique =
              normalized.filter(
                (item) => {
                  const id =
                    item?._id?.toString();

                  if (!id) {
                    return true;
                  }

                  if (
                    existingIds.has(id)
                  ) {
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
        }

        const pagination =
          result?.pagination ||
          result?.meta;

        if (
          pagination
        ) {
          const current =
            Number(
              pagination.page ??
                pagination.currentPage ??
                requestedPage
            );

          const total =
            Number(
              pagination.pages ??
                pagination.totalPages ??
                0
            );

          if (
            total > 0
          ) {
            setHasMore(
              current < total
            );
          } else {
            setHasMore(
              normalized.length >=
                PAGE_SIZE
            );
          }
        } else {
          setHasMore(
            normalized.length >=
              PAGE_SIZE
          );
        }

        setPage(requestedPage);
      } catch (err) {
        console.error(
          "Load reels error:",
          err
        );

        if (
          !mountedRef.current
        ) {
          return;
        }

        if (
          requestedPage === 1
        ) {
          setReels([]);
          setError(
            "We couldn't load Reels right now."
          );
        }
      } finally {
        if (
          !mountedRef.current
        ) {
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
    }, [
      loadReels,
      reels.length,
    ])
  );

  const handleRefresh =
    useCallback(() => {
      loadReels({
        refresh: true,
        requestedPage: 1,
      });
    }, [loadReels]);

  const handleEndReached =
    useCallback(() => {
      if (
        loadingMore ||
        loading ||
        !hasMore ||
        !reels.length
      ) {
        return;
      }

      loadReels({
        requestedPage:
          page + 1,
      });
    }, [
      hasMore,
      loadReels,
      loading,
      loadingMore,
      page,
      reels.length,
    ]);

  const handleViewableItemsChanged =
    useRef(
      ({
        viewableItems,
      }) => {
        const visible =
          viewableItems?.find(
            (item) =>
              item?.isViewable
          ) ||
          viewableItems?.[0];

        const index =
          visible?.index;

        if (
          typeof index ===
          "number"
        ) {
          setActiveIndex(index);
        }
      }
    ).current;

  const handleLike =
    useCallback((reelId) => {
      if (!reelId) {
        return;
      }

      setLikedIds((previous) => {
        const next =
          new Set(previous);

        const id =
          reelId.toString();

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    }, []);

  const handleSave =
    useCallback((reelId) => {
      if (!reelId) {
        return;
      }

      setSavedIds((previous) => {
        const next =
          new Set(previous);

        const id =
          reelId.toString();

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
    }, []);

  const handleFollow =
    useCallback((userId) => {
      if (!userId) {
        return;
      }

      setFollowingIds(
        (previous) => {
          const next =
            new Set(previous);

          const id =
            userId.toString();

          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }

          return next;
        }
      );
    }, []);

  const openComments =
    useCallback((reel) => {
      const id =
        reel?._id;

      if (!id) {
        return;
      }

      router.push({
        pathname:
          "/reels/comments",
        params: {
          reelId:
            id.toString(),
        },
      });
    }, []);

  const handleShare =
    useCallback((reel) => {
      if (!reel?._id) {
        return;
      }

      router.push({
        pathname:
          "/share",
        params: {
          type: "reel",
          id:
            reel._id.toString(),
        },
      });
    }, []);

  const openProfile =
    useCallback((user) => {
      const userId =
        user?._id ||
        user?.id;

      if (!userId) {
        return;
      }

      router.push({
        pathname:
          "/profile/[id]",
        params: {
          id:
            userId.toString(),
        },
      });
    }, []);

  const toggleMute =
    useCallback(() => {
      setMuted(
        (previous) =>
          !previous
      );
    }, []);

  const handleDoubleTap =
    useCallback(
      (reel) => {
        const id =
          reel?._id;

        if (!id) {
          return;
        }

        const normalized =
          id.toString();

        setLikedIds(
          (previous) => {
            const next =
              new Set(previous);

            next.add(normalized);

            return next;
          }
        );
      },
      []
    );

  const renderHeader =
    useMemo(
      () => (
        <View
          pointerEvents="box-none"
          style={styles.header}
        >
          <Text
            style={styles.headerTitle}
          >
            Reels
          </Text>

          <View
            style={styles.headerActions}
          >
            <Pressable
              onPress={() =>
                router.push(
                  "/create/reel"
                )
              }
              hitSlop={12}
              style={
                styles.headerAction
              }
            >
              <Ionicons
                name="camera-outline"
                size={26}
                color="#fff"
              />
            </Pressable>

            <Pressable
              onPress={toggleMute}
              hitSlop={12}
              style={
                styles.headerAction
              }
            >
              <Ionicons
                name={
                  muted
                    ? "volume-mute-outline"
                    : "volume-high-outline"
                }
                size={23}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>
      ),
      [
        muted,
        toggleMute,
      ]
    );

  const renderItem =
    useCallback(
      ({
        item,
        index,
      }) => {
        const reelId =
          item?._id?.toString();

        const user =
          item?.user ||
          item?.user ||
          {};

        const authorId =
          user?._id ||
          user?.id;

        const isLiked =
          reelId
            ? likedIds.has(
                reelId
              )
            : Boolean(
                item?.isLiked
              );

        const isSaved =
          reelId
            ? savedIds.has(
                reelId
              )
            : Boolean(
                item?.isSaved
              );

        const isFollowing =
          authorId
            ? followingIds.has(
                authorId.toString()
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
                openComments(
                  item
                )
              }
              onShare={() =>
                handleShare(
                  item
                )
              }
              onProfile={() =>
                openProfile(
                  user
                )
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

  const renderFooter =
    useCallback(() => {
      if (
        !loadingMore
      ) {
        return null;
      }

      return (
        <View
          style={
            styles.loadingMore
          }
        >
          <ActivityIndicator
            size="small"
            color="#fff"
          />

          <Text
            style={
              styles.loadingMoreText
            }
          >
            Loading more
          </Text>
        </View>
      );
    }, [loadingMore]);

  if (loading && !reels.length) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color="#fff"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading Reels
        </Text>
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View
        style={styles.empty}
      >
        <View
          style={
            styles.emptyIconContainer
          }
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
          style={styles.emptyText}
        >
          {error ||
            "Be the first person to share a Reel on Snapgram."}
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
            styles.emptyButton
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
              styles.emptyButtonText
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

  return (
    <View
      style={styles.container}
    >
      {renderHeader}

      <FlatList
        ref={listRef}
        data={reels}
        keyExtractor={(
          item,
          index
        ) =>
          item?._id?.toString() ||
          `reel-${index}`
        }
        renderItem={renderItem}
        ListFooterComponent={
          renderFooter
        }
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={
          false
        }
        removeClippedSubviews
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={
          50
        }
        getItemLayout={(
          _,
          index
        ) => ({
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
        onEndReachedThreshold={0.7}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#fff"
            colors={[
              "#fff",
            ]}
            progressBackgroundColor="#111"
          />
        }
        showsHorizontalScrollIndicator={
          false
        }
      />

      {/* TOP GRADIENT OVERLAY */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0.45)",
          "transparent",
        ]}
        style={styles.topShade}
      />

      {/* BOTTOM GRADIENT OVERLAY */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "transparent",
          "rgba(0,0,0,0.75)",
        ]}
        style={styles.bottomShade}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },

    reelPage: {
      width,
      height,
      backgroundColor: "#000",
    },

    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      zIndex: 50,
      paddingHorizontal: 17,
      paddingTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    headerTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
      textShadowColor:
        "rgba(0,0,0,0.35)",
      textShadowOffset: {
        width: 0,
        height: 1,
      },
      textShadowRadius: 3,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 17,
    },

    headerAction: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
    },

    loading: {
      flex: 1,
      backgroundColor: "#000",
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color: "#aaa",
      fontSize: 13,
      fontWeight: "600",
      marginTop: 12,
    },

    loadingMore: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 20,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 9,
    },

    loadingMoreText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },

    empty: {
      flex: 1,
      backgroundColor: "#000",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 35,
    },

    emptyIconContainer: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
    },

    emptyText: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 9,
      maxWidth: 300,
    },

    emptyButton: {
      marginTop: 24,
      minHeight: 44,
      paddingHorizontal: 22,
      borderRadius: 22,
      backgroundColor: "#fff",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    emptyButtonText: {
      color: "#000",
      fontSize: 14,
      fontWeight: "700",
    },

    topShade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 110,
      zIndex: 10,
    },

    bottomShade: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 260,
      zIndex: 10,
    },
  });