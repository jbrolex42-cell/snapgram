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

import { SafeAreaView } from
  "react-native-safe-area-context";

import Colors from "../../constants/Colors";

import {
  getFollowers,
} from "../../services/followService";

import UserRow from
  "../../components/users/UserRow";

export default function FollowersScreen() {
  const params =
    useLocalSearchParams();

  const userId =
    Array.isArray(params.userId)
      ? params.userId[0]
      : params.userId;

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [nextCursor, setNextCursor] =
    useState(null);

  const [hasMore, setHasMore] =
    useState(false);

  const loadFollowers =
    useCallback(
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
          setLoading(false);

          return;
        }

        try {
          if (refresh) {
            setRefreshing(true);
          } else if (append) {
            setLoadingMore(true);
          } else {
            setLoading(true);
          }

          const result =
            await getFollowers(
              userId,
              {
                cursor,
                limit: 30,
              }
            );

          const newUsers =
            Array.isArray(
              result?.users
            )
              ? result.users
              : [];

          if (append) {
            setUsers(
              (previous) => {
                const existingIds =
                  new Set(
                    previous
                      .filter(
                        (item) =>
                          item?._id
                      )
                      .map(
                        (item) =>
                          String(
                            item._id
                          )
                      )
                  );

                const uniqueUsers =
                  newUsers.filter(
                    (item) =>
                      item?._id &&
                      !existingIds.has(
                        String(
                          item._id
                        )
                      )
                  );

                return [
                  ...previous,
                  ...uniqueUsers,
                ];
              }
            );
          } else {
            setUsers(
              newUsers
            );
          }

          setNextCursor(
            result?.nextCursor ||
              null
          );

          setHasMore(
            Boolean(
              result?.hasMore
            )
          );
        } catch (error) {
          console.error(
            "FOLLOWERS LOAD ERROR:",
            error?.response
              ?.data ||
              error?.message ||
              error
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
      [userId]
    );

  useEffect(() => {
    loadFollowers();
  }, [loadFollowers]);

  const handleRefresh =
    useCallback(() => {
      loadFollowers({
        refresh: true,
      });
    }, [loadFollowers]);

  const handleLoadMore =
    useCallback(() => {
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

  if (
    loading &&
    users.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text
            style={styles.title}
          >
            Followers
          </Text>

          <View
            style={
              styles.headerSpace
            }
          />
        </View>

        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={
              Colors.primary
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={Colors.black}
          />
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          Followers
        </Text>

        <View
          style={
            styles.headerSpace
          }
        />
      </View>

      <FlatList
        data={users}
        keyExtractor={(
          item,
          index
        ) =>
          item?._id
            ? String(
                item._id
              )
            : `follower-${index}`
        }
        renderItem={({
          item,
        }) => (
          <UserRow
            user={item}
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
              Colors.primary
            }
          />
        }
        onEndReached={
          handleLoadMore
        }
        onEndReachedThreshold={
          0.5
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          users.length === 0
            ? styles.emptyList
            : styles.listContent
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Ionicons
              name="people-outline"
              size={52}
              color={
                Colors.secondaryText
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No followers yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              People who follow
              this account will
              appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View
              style={
                styles.footerLoader
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  Colors.primary
                }
              />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        Colors.white,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    header: {
      height: 55,
      paddingHorizontal: 15,
      borderBottomWidth: 0.5,
      borderBottomColor:
        Colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 35,
      height: 40,
      justifyContent:
        "center",
    },

    title: {
      fontSize: 17,
      fontWeight: "800",
      color: Colors.black,
    },

    headerSpace: {
      width: 35,
    },

    listContent: {
      paddingBottom: 20,
    },

    emptyList: {
      flexGrow: 1,
    },

    empty: {
      flex: 1,
      paddingHorizontal: 30,
      alignItems: "center",
      justifyContent:
        "center",
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 18,
      fontWeight: "800",
      color: Colors.black,
    },

    emptyText: {
      marginTop: 8,
      color:
        Colors.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },

    footerLoader: {
      paddingVertical: 20,
      alignItems: "center",
    },
  });