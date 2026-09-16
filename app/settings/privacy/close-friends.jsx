import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Page,
  Notice,
  PageLoading,
} from "../../../components/settings/SettingsUI";

import { loadSettings } from "../../../services/settingsApi";

import {
  removeRelationship,
} from "../../../services/settingsService";

function getUserId(user) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return String(user);
  }

  return String(
    user?._id ||
      user?.id ||
      user?.userId ||
      ""
  );
}

function getUsername(user) {
  if (!user || typeof user === "string") {
    return "";
  }

  return (
    user?.username ||
    user?.userName ||
    ""
  );
}

function getFullName(user) {
  if (!user || typeof user === "string") {
    return "";
  }

  return (
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Snapgram user"
  );
}

function getAvatar(user) {
  if (!user || typeof user === "string") {
    return "";
  }

  return (
    user?.avatar ||
    user?.profilePicture ||
    user?.profileImage ||
    ""
  );
}

function normalizeCloseFriends(data) {
  const users =
    data?.closeFriends;

  if (!Array.isArray(users)) {
    return [];
  }

  return users.filter(
    (user) => Boolean(getUserId(user))
  );
}

export default function CloseFriendsScreen() {
  const [closeFriends, setCloseFriends] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [removingId, setRemovingId] =
    useState(null);

  const loadCloseFriends =
    useCallback(
      async ({
        refresh = false,
      } = {}) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const settings =
            await loadSettings();

          const users =
            normalizeCloseFriends(
              settings
            );

          setCloseFriends(users);
        } catch (requestError) {
          console.error(
            "LOAD CLOSE FRIENDS ERROR:",
            requestError?.response?.data ||
              requestError?.message ||
              requestError
          );

          setError(
            requestError?.response?.data
              ?.message ||
              requestError?.message ||
              "Unable to load your close friends."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadCloseFriends();
  }, [loadCloseFriends]);

  const handleRefresh =
    useCallback(() => {
      loadCloseFriends({
        refresh: true,
      });
    }, [loadCloseFriends]);

  const openProfile =
    useCallback((user) => {
      const userId =
        getUserId(user);

      if (!userId) {
        Alert.alert(
          "Profile unavailable",
          "This user's profile could not be opened."
        );

        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: userId,
        },
      });
    }, []);

  const removeCloseFriend =
    useCallback(
      async (user) => {
        const userId =
          getUserId(user);

        if (!userId) {
          Alert.alert(
            "Unable to remove",
            "This account does not have a valid user ID."
          );

          return;
        }

        if (removingId) {
          return;
        }

        try {
          setRemovingId(userId);
          setError("");

          await removeRelationship(
            userId,
            "closeFriends"
          );

          setCloseFriends(
            (current) =>
              current.filter(
                (item) =>
                  getUserId(item) !==
                  userId
              )
          );
        } catch (requestError) {
          console.error(
            "REMOVE CLOSE FRIEND ERROR:",
            requestError?.response?.data ||
              requestError?.message ||
              requestError
          );

          Alert.alert(
            "Couldn't remove",
            requestError?.response?.data
              ?.message ||
              requestError?.message ||
              "The account could not be removed from close friends."
          );
        } finally {
          setRemovingId(null);
        }
      },
      [removingId]
    );

  const confirmRemove =
    useCallback(
      (user) => {
        const username =
          getUsername(user);

        const name =
          getFullName(user);

        const displayName =
          username
            ? `@${username}`
            : name;

        Alert.alert(
          "Remove from Close Friends?",
          `${displayName} won't be able to see content you share only with your close friends.`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Remove",
              style: "destructive",
              onPress: () =>
                removeCloseFriend(user),
            },
          ]
        );
      },
      [removeCloseFriend]
    );

  const renderUser =
    useCallback(
      ({ item }) => {
        const userId =
          getUserId(item);

        const username =
          getUsername(item);

        const fullName =
          getFullName(item);

        const avatar =
          getAvatar(item);

        const isRemoving =
          removingId === userId;

        return (
          <View style={styles.userRow}>
            <Pressable
              style={styles.profileButton}
              onPress={() =>
                openProfile(item)
              }
              disabled={isRemoving}
              android_ripple={{
                color: "#eeeeee",
              }}
            >
              <View
                style={styles.avatarWrapper}
              >
                {avatar ? (
                  <Image
                    source={{
                      uri: avatar,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={
                      styles.avatarPlaceholder
                    }
                  >
                    <Ionicons
                      name="person"
                      size={24}
                      color="#8e8e8e"
                    />
                  </View>
                )}
              </View>

              <View
                style={styles.userInfo}
              >
                <Text
                  style={
                    styles.username
                  }
                  numberOfLines={1}
                >
                  {username ||
                    fullName}
                </Text>

                {username &&
                fullName &&
                fullName !==
                  username ? (
                  <Text
                    style={
                      styles.fullName
                    }
                    numberOfLines={1}
                  >
                    {fullName}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.removeButton,
                isRemoving &&
                  styles.removeButtonDisabled,
              ]}
              onPress={() =>
                confirmRemove(item)
              }
              disabled={
                isRemoving ||
                Boolean(removingId)
              }
            >
              {isRemoving ? (
                <ActivityIndicator
                  size="small"
                  color="#262626"
                />
              ) : (
                <Text
                  style={
                    styles.removeText
                  }
                >
                  Remove
                </Text>
              )}
            </Pressable>
          </View>
        );
      },
      [
        removingId,
        openProfile,
        confirmRemove,
      ]
    );

  const renderEmpty =
    useCallback(() => {
      if (error) {
        return null;
      }

      return (
        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={styles.emptyIcon}
          >
            <Ionicons
              name="people-outline"
              size={38}
              color="#262626"
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No close friends yet
          </Text>

          <Text
            style={styles.emptyText}
          >
            When you add people to your
            Close Friends list, they'll
            appear here.
          </Text>
        </View>
      );
    }, [error]);

  if (loading) {
    return (
      <Page
        title="Close Friends"
        onBack={() =>
          router.back()
        }
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Close Friends"
      onBack={() =>
        router.back()
      }
    >
      <FlatList
        data={closeFriends}
        keyExtractor={(item, index) =>
          getUserId(item) ||
          `close-friend-${index}`
        }
        renderItem={renderUser}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#262626"
          />
        }
        contentContainerStyle={[
          styles.listContent,
          closeFriends.length ===
            0 &&
            styles.emptyList,
        ]}
        ListHeaderComponent={
          <View
            style={styles.header}
          >
            <View
              style={styles.headerIcon}
            >
              <Ionicons
                name="people-outline"
                size={28}
                color="#262626"
              />
            </View>

            <Text
              style={styles.headerTitle}
            >
              Close Friends
            </Text>

            <Text
              style={styles.description}
            >
              Share stories, posts and
              other content with a smaller
              group of people.
            </Text>

            {closeFriends.length >
              0 ? (
              <Text
                style={styles.count}
              >
                {closeFriends.length}{" "}
                {closeFriends.length ===
                1
                  ? "person"
                  : "people"}
              </Text>
            ) : null}

            {error ? (
              <View
                style={styles.errorContainer}
              >
                <Notice tone="danger">
                  {error}
                </Notice>

                <Pressable
                  style={
                    styles.retryButton
                  }
                  onPress={() =>
                    loadCloseFriends()
                  }
                >
                  <Text
                    style={
                      styles.retryText
                    }
                  >
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          renderEmpty
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },

  emptyList: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    alignItems: "center",
  },

  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#262626",
    textAlign: "center",
  },

  description: {
    marginTop: 8,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    textAlign: "center",
  },

  count: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },

  userRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },

  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#efefef",
  },

  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  username: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#262626",
  },

  fullName: {
    marginTop: 1,
    fontSize: 14,
    lineHeight: 19,
    color: "#737373",
  },

  removeButton: {
    minWidth: 76,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  removeButtonDisabled: {
    opacity: 0.6,
  },

  removeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },

  emptyContainer: {
    flex: 1,
    minHeight: 280,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#262626",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    textAlign: "center",
  },

  errorContainer: {
    width: "100%",
    marginTop: 14,
  },

  retryButton: {
    alignSelf: "center",
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },
});