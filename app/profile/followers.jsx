import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../../constants/Colors";

import {
  getFollowers,
} from "../../services/followService";

import UserRow from "../../components/users/UserRow";

function getParamValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return String(value || "");
}


function getUserId(user) {
  if (!user) {
    return null;
  }

  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    null
  );
}

export default function FollowersScreen() {
  const params = useLocalSearchParams();

  const userId = getParamValue(
    params.userId
  ).trim();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const [nextCursor, setNextCursor] = useState(null);

  const [hasMore, setHasMore] = useState(false);

  const [error, setError] = useState(null);

  const loadFollowers = useCallback(
    async ({
      cursor = null,
      append = false,
      refresh = false,
    } = {}) => {
      if (!userId) {
        console.warn(
          "FOLLOWERS: No userId supplied"
        );

        setUsers([]);
        setNextCursor(null);
        setHasMore(false);
        setError("Invalid user ID.");
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);

        return;
      }

      if (
        append &&
        (loadingMore || refreshing || loading)
      ) {
        return;
      }

      try {
        setError(null);

        if (refresh) {
          setRefreshing(true);
        } else if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const result = await getFollowers(
          userId,
          {
            cursor,
            limit: 30,
          }
        );

        const responseUsers =
          result?.users ??
          result?.followers ??
          result?.data?.users ??
          result?.data?.followers ??
          [];

        const newUsers = Array.isArray(
          responseUsers
        )
          ? responseUsers
          : [];

        if (append) {
          setUsers((previousUsers) => {
            const existingIds = new Set(
              previousUsers
                .map(getUserId)
                .filter(Boolean)
                .map((id) => String(id))
            );

            const uniqueUsers =
              newUsers.filter((user) => {
                const id =
                  getUserId(user);

                if (!id) {
                  return false;
                }

                return !existingIds.has(
                  String(id)
                );
              });

            return [
              ...previousUsers,
              ...uniqueUsers,
            ];
          });
        }

        else {
          const uniqueUsers = [];
          const seenIds = new Set();

          for (const user of newUsers) {
            const id = getUserId(user);

            if (!id) {
              continue;
            }

            const normalizedId =
              String(id);

            if (
              seenIds.has(normalizedId)
            ) {
              continue;
            }

            seenIds.add(normalizedId);
            uniqueUsers.push(user);
          }

          setUsers(uniqueUsers);
        }

        const cursorValue =
          result?.nextCursor ??
          result?.pagination?.nextCursor ??
          result?.data?.nextCursor ??
          null;

        const moreValue =
          result?.hasMore ??
          result?.pagination?.hasMore ??
          result?.data?.hasMore ??
          Boolean(cursorValue);

        setNextCursor(
          cursorValue || null
        );

        setHasMore(
          Boolean(
            moreValue &&
            cursorValue
          )
        );
      } catch (loadError) {
        console.error(
          "FOLLOWERS LOAD ERROR:",
          loadError?.response?.data ||
            loadError?.message ||
            loadError
        );

        setError(
          loadError?.response?.data?.message ||
            "Unable to load followers."
        );

        if (!append) {
          setUsers([]);
          setNextCursor(null);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [
      userId,
      loading,
      refreshing,
      loadingMore,
    ]
  );

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const handleRefresh = useCallback(() => {
    if (refreshing) {
      return;
    }

    loadFollowers({
      refresh: true,
    });
  }, [
    loadFollowers,
    refreshing,
  ]);

  const handleLoadMore = useCallback(() => {
    if (
      loading ||
      refreshing ||
      loadingMore ||
      !hasMore ||
      !nextCursor
    ) {
      return;
    }

    loadFollowers({
      cursor: nextCursor,
      append: true,
    });
  }, [
    loading,
    refreshing,
    loadingMore,
    hasMore,
    nextCursor,
    loadFollowers,
  ]);

  const handleRetry = useCallback(() => {
    loadFollowers();
  }, [
    loadFollowers,
  ]);

  const keyExtractor = useCallback(
    (item, index) => {
      const id = getUserId(item);

      return id
        ? String(id)
        : `follower-${index}`;
    },
    []
  );

  const renderUser = useCallback(
    ({ item }) => (
      <UserRow user={item} />
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View
        style={styles.footerLoader}
      >
        <ActivityIndicator
          size="small"
          color={Colors.primary}
        />
      </View>
    );
  }, [
    loadingMore,
  ]);

  const renderEmpty = useCallback(() => {

    if (loading) {
      return null;
    }

    if (error) {
      return (
        <View
          style={styles.empty}
        >
          <View
            style={styles.emptyIcon}
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color={
                Colors.secondaryText
              }
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            Unable to load followers
          </Text>

          <Text
            style={styles.emptyText}
          >
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text
              style={styles.retryText}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={styles.empty}
      >
        <View
          style={styles.emptyIcon}
        >
          <Ionicons
            name="people-outline"
            size={34}
            color={
              Colors.secondaryText
            }
          />
        </View>

        <Text
          style={styles.emptyTitle}
        >
          No followers yet
        </Text>

        <Text
          style={styles.emptyText}
        >
          People who follow this account
          will appear here.
        </Text>
      </View>
    );
  }, [
    loading,
    error,
    handleRetry,
  ]);

  if (
    loading &&
    users.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={[
          "top",
          "left",
          "right",
        ]}
      >
        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.back()
            }
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={Colors.text}
            />
          </TouchableOpacity>

          <Text
            style={styles.title}
          >
            Followers
          </Text>

          <View
            style={styles.headerButton}
          />
        </View>

        <View
          style={styles.center}
        >
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            router.back()
          }
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={Colors.text}
          />
        </TouchableOpacity>

        <Text
          style={styles.title}
          numberOfLines={1}
        >
          Followers
        </Text>

        <View
          style={styles.headerButton}
        />
      </View>

      <FlatList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderUser}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={
              Colors.primary
            }
          />
        }

        onEndReached={
          handleLoadMore
        }

        onEndReachedThreshold={0.5}

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={
          users.length === 0
            ? styles.emptyList
            : styles.listContent
        }

        ListEmptyComponent={
          renderEmpty
        }

        ListFooterComponent={
          renderFooter
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background ||
      Colors.white ||
      "#FFFFFF",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    height: 55,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      Colors.border ||
      "#DBDBDB",
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color:
      Colors.text ||
      Colors.black ||
      "#000000",
  },

  listContent: {
    paddingBottom: 24,
  },

  emptyList: {
    flexGrow: 1,
  },

  empty: {
    flex: 1,
    minHeight: 420,
    paddingHorizontal: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      Colors.border ||
      "#DBDBDB",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color:
      Colors.text ||
      Colors.black ||
      "#000000",
  },

  emptyText: {
    marginTop: 7,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color:
      Colors.secondaryText ||
      "#737373",
  },

  retryButton: {
    marginTop: 18,
    minWidth: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Colors.primary ||
      "#0095F6",
  },

  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});