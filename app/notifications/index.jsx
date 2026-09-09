import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

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

  const loadNotifications =
    useCallback(async () => {
      if (
        authLoading ||
        !user
      ) {
        if (!authLoading) {
          setLoading(false);
        }

        return;
      }

      try {
        console.log(
          "LOADING NOTIFICATIONS"
        );

        setLoading(true);

        const result =
          await getNotifications();

        setNotifications(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (error) {
        console.error(
          "NOTIFICATIONS ERROR:",
          error
        );

        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [
      authLoading,
      user,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
  }

  async function handleNotificationPress(
    notification
  ) {
    try {
      if (!notification?.isRead) {
        await markNotificationRead(
          notification._id
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                String(item?._id) ===
                String(notification?._id)
                  ? {
                      ...item,
                      isRead: true,
                    }
                  : item
            )
        );
      }
    } catch (error) {
      console.error(
        "MARK READ ERROR:",
        error
      );
    }

    if (
      notification?.post?._id
    ) {
      router.push({
        pathname:
          "/post/[id]",

        params: {
          id: String(
            notification.post._id
          ),
        },
      });

      return;
    }

    if (
      notification?.sender?._id
    ) {
      router.push({
        pathname:
          "/profile/[username]",

        params: {
          username:
            notification.sender.username ||
            String(
              notification.sender._id
            ),
        },
      });
    }
  }

  async function handleMarkAllRead() {
    try {
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
    }
  }

  const hasUnread =
    notifications.some(
      (item) =>
        !item?.isRead
    );

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.center}
        >
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

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.center}
        >
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
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={
              Colors.black
            }
          />
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          Notifications
        </Text>

        {hasUnread ? (
          <TouchableOpacity
            onPress={
              handleMarkAllRead
            }
            activeOpacity={0.7}
          >
            <Text
              style={
                styles.readAll
              }
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={
              styles.headerSpacer
            }
          />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(
          item,
          index
        ) =>
          item?._id
            ? String(
                item._id
              )
            : `notification-${index}`
        }
        renderItem={({
          item,
        }) => (
          <NotificationRow
            notification={item}
            onPress={
              handleNotificationPress
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
          />
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Ionicons
              name="notifications-outline"
              size={60}
              color={
                Colors.secondaryText
              }
            />

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
              When people interact with you,
              your notifications will appear here.
            </Text>
          </View>
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
        Colors.white ||
        "#fff",
    },

    header: {
      height: 58,
      paddingHorizontal: 15,
      borderBottomWidth: 0.5,
      borderBottomColor:
        Colors.border ||
        "#ddd",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 70,
      alignItems: "flex-start",
      justifyContent:
        "center",
    },

    title: {
      flex: 1,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "800",
      color:
        Colors.black,
    },

    readAll: {
      width: 70,
      textAlign: "right",
      color:
        Colors.primary ||
        "#0095F6",
      fontSize: 12,
      fontWeight: "700",
    },

    headerSpacer: {
      width: 70,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    empty: {
      paddingTop: 140,
      paddingHorizontal: 35,
      alignItems:
        "center",
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 20,
      fontWeight: "800",
      color:
        Colors.black,
    },

    emptyText: {
      marginTop: 8,
      textAlign: "center",
      color:
        Colors.secondaryText ||
        "#888",
      lineHeight: 20,
    },
  });