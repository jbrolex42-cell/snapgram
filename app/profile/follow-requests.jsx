import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  acceptFollowRequest,
  getPendingRequests,
  rejectFollowRequest,
} from "../../services/followService";

import VerifiedBadge from "../../components/common/VerifiedBadge";

export default function FollowRequests() {
  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadRequests =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const result =
            await getPendingRequests();

          setRequests(
            Array.isArray(
              result
            )
              ? result
              : []
          );
        } catch (error) {
          console.error(
            "REQUESTS ERROR:",
            error
          );

          setRequests([]);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [
      loadRequests,
    ])
  );

  async function refreshRequests() {
    try {
      setRefreshing(true);

      const result =
        await getPendingRequests();

      setRequests(
        Array.isArray(
          result
        )
          ? result
          : []
      );
    } catch (error) {
      console.error(
        "REFRESH REQUESTS ERROR:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function accept(
    requestId
  ) {
    try {
      await acceptFollowRequest(
        requestId
      );

      setRequests(
        current =>
          current.filter(
            item =>
              item._id !==
              requestId
          )
      );
    } catch (error) {
      console.error(
        "ACCEPT REQUEST ERROR:",
        error
      );
    }
  }

  async function reject(
    requestId
  ) {
    try {
      await rejectFollowRequest(
        requestId
      );

      setRequests(
        current =>
          current.filter(
            item =>
              item._id !==
              requestId
          )
      );
    } catch (error) {
      console.error(
        "REJECT REQUEST ERROR:",
        error
      );
    }
  }

  function openProfile(
    user
  ) {
    if (!user?.username) {
      return;
    }

    router.push(
      `/profile/${user.username}`
    );
  }

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111"
          />
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          Follow Requests
        </Text>

        <View
          style={
            styles.headerButton
          }
        />
      </View>

      <FlatList
        data={requests}
        keyExtractor={
          item =>
            String(
              item._id
            )
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refreshRequests
            }
          />
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              👥
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No follow requests
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              When someone requests to follow you, you'll see them here.
            </Text>
          </View>
        }
        renderItem={({
          item,
        }) => {
          const user =
            item?.follower ||
            {};

          const fullName =
            user?.name ||
            user?.fullName ||
            user?.username ||
            "User";

          const isVerified =
            Boolean(
              user?.isVerified
            );

          return (
            <View
              style={
                styles.request
              }
            >
              <TouchableOpacity
                onPress={() =>
                  openProfile(
                    user
                  )
                }
                activeOpacity={0.7}
              >
                {user?.avatar ? (
                  <Image
                    source={{
                      uri:
                        user.avatar,
                    }}
                    style={
                      styles.avatar
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.placeholder
                    }
                  >
                    <Text>
                      {fullName
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.userInfo
                }
                onPress={() =>
                  openProfile(
                    user
                  )
                }
                activeOpacity={0.7}
              >
                <View
                  style={
                    styles.nameRow
                  }
                >
                  <Text
                    style={
                      styles.fullName
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {fullName}
                  </Text>

                  {isVerified && (
                    <VerifiedBadge
                      size={14}
                    />
                  )}
                </View>

                <Text
                  style={
                    styles.username
                  }
                >
                  @{user?.username ||
                    "user"}
                </Text>
              </TouchableOpacity>

              <View
                style={
                  styles.buttons
                }
              >
                <TouchableOpacity
                  style={
                    styles.confirmButton
                  }
                  onPress={() =>
                    accept(
                      item._id
                    )
                  }
                >
                  <Text
                    style={
                      styles.confirmText
                    }
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.deleteButton
                  }
                  onPress={() =>
                    reject(
                      item._id
                    )
                  }
                >
                  <Text
                    style={
                      styles.deleteText
                    }
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    header: {
      height: 60,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#eee",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 10,
    },

    headerButton: {
      width: 42,
      height: 42,
      justifyContent:
        "center",
    },

    title: {
      fontSize: 19,
      fontWeight:
        "800",
    },

    request: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 15,
      paddingVertical: 12,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },

    placeholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor:
        "#eee",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    userInfo: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    fullName: {
      fontWeight:
        "800",
      fontSize: 14,
      flexShrink: 1,
    },

    username: {
      color:
        "#777",
      fontSize: 12,
      marginTop: 2,
    },

    buttons: {
      flexDirection:
        "row",
      gap: 7,
      marginLeft: 8,
    },

    confirmButton: {
      backgroundColor:
        "#0095F6",
      borderRadius: 7,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    confirmText: {
      color: "#fff",
      fontWeight:
        "800",
      fontSize: 12,
    },

    deleteButton: {
      backgroundColor:
        "#eee",
      borderRadius: 7,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    deleteText: {
      color: "#000",
      fontWeight:
        "800",
      fontSize: 12,
    },

    empty: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 40,
      paddingTop: 100,
    },

    emptyIcon: {
      fontSize: 50,
      marginBottom: 15,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyText: {
      textAlign:
        "center",
      color: "#777",
      marginTop: 8,
      lineHeight: 20,
    },
  });