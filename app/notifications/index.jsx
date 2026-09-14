import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
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
  SafeAreaView,
} from "react-native-safe-area-context";

import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

import NotificationRow from "../../components/notifications/NotificationRow";


export default function NotificationsScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [markingAllRead, setMarkingAllRead] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadNotifications =
    useCallback(
      async ({
        showLoader = true,
      } = {}) => {
        if (authLoading || !user) {
          if (!authLoading) {
            setLoading(false);
          }

          return;
        }

        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const result =
            await getNotifications();

          const list =
            Array.isArray(result)
              ? result
              : Array.isArray(
                  result?.notifications
                )
              ? result.notifications
              : Array.isArray(
                  result?.data
                )
              ? result.data
              : [];

          setNotifications(list);
        } catch (error) {
          console.error(
            "NOTIFICATIONS ERROR:",
            error
          );

          setError(
            error?.response?.data?.message ||
            "Unable to load notifications."
          );

          if (showLoader) {
            setNotifications([]);
          }
        } finally {
          if (showLoader) {
            setLoading(false);
          }

          setRefreshing(false);
        }
      },
      [
        authLoading,
        user,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      loadNotifications({
        showLoader: true,
      });
    }, [loadNotifications])
  );

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      await loadNotifications({
        showLoader: false,
      });
    }, [loadNotifications]);

  const getNotificationType =
    useCallback(
      (notification) => {
        return String(
          notification?.type ||
          notification?.notificationType ||
          notification?.action ||
          ""
        )
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
      },
      []
    );

  const markAsRead =
    useCallback(
      async (notification) => {
        const notificationId =
          notification?._id ||
          notification?.id;

        if (
          !notificationId ||
          notification?.isRead
        ) {
          return;
        }

        setNotifications(
          (current) =>
            current.map((item) =>
              String(
                item?._id ||
                item?.id
              ) ===
              String(notificationId)
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
            )
        );

        try {
          await markNotificationRead(
            notificationId
          );
        } catch (error) {
          console.error(
            "MARK NOTIFICATION READ ERROR:",
            error
          );

          setNotifications(
            (current) =>
              current.map((item) =>
                String(
                  item?._id ||
                  item?.id
                ) ===
                String(notificationId)
                  ? {
                      ...item,
                      isRead: false,
                    }
                  : item
              )
          );
        }
      },
      []
    );

  const getSender =
    useCallback(
      (notification) => {
        return (
          notification?.sender ||
          notification?.from ||
          notification?.user ||
          notification?.actor ||
          null
        );
      },
      []
    );

  const getPost =
    useCallback(
      (notification) => {
        return (
          notification?.post ||
          notification?.targetPost ||
          notification?.postData ||
          null
        );
      },
      []
    );

  const getUserId =
    useCallback(
      (value) => {
        if (!value) {
          return "";
        }

        if (
          typeof value === "string"
        ) {
          return value;
        }

        return String(
          value?._id ||
          value?.id ||
          ""
        );
      },
      []
    );

  const getUsername =
    useCallback(
      (value) => {
        if (!value) {
          return "";
        }

        if (
          typeof value === "string"
        ) {
          return value;
        }

        return String(
          value?.username ||
          value?.userName ||
          ""
        );
      },
      []
    );

  const openNotification =
    useCallback(
      async (notification) => {
        if (!notification) {
          return;
        }

        await markAsRead(
          notification
        );

        const type =
          getNotificationType(
            notification
          );

        const sender =
          getSender(
            notification
          );

        const post =
          getPost(
            notification
          );

        const senderId =
          getUserId(sender) ||
          getUserId(
            notification?.senderId
          ) ||
          getUserId(
            notification?.userId
          );

        const username =
          getUsername(sender) ||
          String(
            notification?.username ||
            ""
          );

        const postId =
          getUserId(post) ||
          getUserId(
            notification?.postId
          );

        if (
          type === "like" ||
          type === "liked" ||
          type === "post_like" ||
          type === "like_post"
        ) {
          if (postId) {
            router.push({
              pathname:
                "/post/[id]",

              params: {
                id: postId,
              },
            });

            return;
          }
        }

        if (
          type === "comment" ||
          type === "commented" ||
          type === "post_comment" ||
          type === "comment_post"
        ) {
          if (postId) {
            router.push({
              pathname:
                "/post/[id]/comments",

              params: {
                id: postId,
              },
            });

            return;
          }
        }

        if (
          type === "reply" ||
          type === "comment_reply" ||
          type === "replied"
        ) {
          if (postId) {
            router.push({
              pathname:
                "/post/[id]/comments",

              params: {
                id: postId,
              },
            });

            return;
          }
        }

        if (
          type === "mention" ||
          type === "mentioned" ||
          type === "post_mention"
        ) {
          if (postId) {
            router.push({
              pathname:
                "/post/[id]",

              params: {
                id: postId,
              },
            });

            return;
          }

          if (senderId) {
            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (
          type === "follow" ||
          type === "followed" ||
          type === "new_follower"
        ) {
          if (senderId) {
            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (
          type === "follow_request" ||
          type === "followrequest" ||
          type === "requested_to_follow" ||
          type === "follow_request_received"
        ) {
          if (senderId) {

            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (
          type === "follow_request_accepted" ||
          type === "follow_accepted" ||
          type === "accepted_follow_request"
        ) {
          if (senderId) {
            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (
          type === "story_like" ||
          type === "story_liked" ||
          type === "story_reaction" ||
          type === "story_reply" ||
          type === "story_replied"
        ) {
          const storyId =
            getUserId(
              notification?.story
            ) ||
            getUserId(
              notification?.storyId
            );

          if (storyId) {

            router.push({
              pathname:
                "/story/[id]",

              params: {
                id: storyId,
              },
            });

            return;
          }

          if (senderId) {
            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (
          type === "post_shared" ||
          type === "shared_post" ||
          type === "share" ||
          type === "shared"
        ) {
          if (postId) {
            router.push({
              pathname:
                "/post/[id]",

              params: {
                id: postId,
              },
            });

            return;
          }
        }

        if (
          type === "profile_visit" ||
          type === "profile_view" ||
          type === "verified" ||
          type === "verification"
        ) {
          if (senderId) {
            router.push({
              pathname:
                "/profile/[username]",

              params: {
                username:
                  username ||
                  senderId,
              },
            });

            return;
          }
        }

        if (postId) {
          router.push({
            pathname:
              "/post/[id]",

            params: {
              id: postId,
            },
          });

          return;
        }

        if (senderId) {
          router.push({
            pathname:
              "/profile/[username]",

            params: {
              username:
                username ||
                senderId,
            },
          });
        }
      },
      [
        getNotificationType,
        getPost,
        getSender,
        getUserId,
        getUsername,
        markAsRead,
      ]
    );

  const handleMarkAllRead =
    useCallback(async () => {
      if (markingAllRead) {
        return;
      }

      try {
        setMarkingAllRead(true);

        await markAllNotificationsRead();

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                isRead: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "MARK ALL READ ERROR:",
          error
        );
      } finally {
        setMarkingAllRead(false);
      }
    }, [
      markingAllRead,
    ]);


  const hasUnread =
    notifications.some(
      (item) =>
        item?.isRead !== true
    );

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="small"
            color={
              Colors.primary ||
              "#0095F6"
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.center}>
          <Ionicons
            name="lock-closed-outline"
            size={42}
            color="#111"
          />

          <Text
            style={styles.emptyTitle}
          >
            Sign in to see notifications
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="small"
            color={
              Colors.primary ||
              "#0095F6"
            }
          />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={10}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={
              Colors.black ||
              "#111"
            }
          />
        </Pressable>

        <Text style={styles.title}>
          Notifications
        </Text>

        {hasUnread ? (
          <Pressable
            onPress={
              handleMarkAllRead
            }
            disabled={
              markingAllRead
            }
            hitSlop={8}
            style={styles.markAllButton}
          >
            {markingAllRead ? (
              <ActivityIndicator
                size="small"
                color={
                  Colors.primary ||
                  "#0095F6"
                }
              />
            ) : (
              <Text
                style={styles.readAll}
              >
                Mark all
              </Text>
            )}
          </Pressable>
        ) : (
          <View
            style={styles.headerButton}
          />
        )}
      </View>

      {error &&
      notifications.length === 0 ? (
        <View
          style={styles.errorContainer}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={46}
            color="#111"
          />

          <Text
            style={styles.emptyTitle}
          >
            Couldn't load notifications
          </Text>

          <Text
            style={styles.emptyText}
          >
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() =>
              loadNotifications({
                showLoader: true,
              })
            }
          >
            <Text
              style={styles.retryText}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(
            item,
            index
          ) =>
            String(
              item?._id ||
              item?.id ||
              `notification-${index}`
            )
          }
          renderItem={({
            item,
          }) => (
            <NotificationRow
              notification={item}
              onPress={
                openNotification
              }
            />
          )}
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
              tintColor={
                Colors.primary ||
                "#0095F6"
              }
              colors={[
                Colors.primary ||
                "#0095F6",
              ]}
            />
          }
          ListEmptyComponent={
            <View
              style={styles.empty}
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={36}
                  color="#111"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No notifications yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                When people interact with
                you, their activity will
                appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.white ||
      "#FFFFFF",
  },

  header: {
    height: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      Colors.border ||
      "#DBDBDB",
    backgroundColor:
      Colors.white ||
      "#FFFFFF",
  },

  headerButton: {
    width: 72,
    height: 42,
    alignItems: "flex-start",
    justifyContent:
      "center",
  },

  markAllButton: {
    width: 72,
    height: 42,
    alignItems: "flex-end",
    justifyContent:
      "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color:
      Colors.black ||
      "#111111",
  },

  readAll: {
    color:
      Colors.primary ||
      "#0095F6",
    fontSize: 13,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
    paddingHorizontal: 35,
  },

  empty: {
    minHeight: 500,
    paddingHorizontal: 35,
    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent:
      "center",
    marginBottom: 18,
  },

  emptyTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    color:
      Colors.black ||
      "#111111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color:
      Colors.secondaryText ||
      "#8E8E8E",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent:
      "center",
    paddingHorizontal: 40,
  },

  retryButton: {
    marginTop: 20,
    minWidth: 110,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent:
      "center",
    backgroundColor:
      Colors.black ||
      "#111111",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});