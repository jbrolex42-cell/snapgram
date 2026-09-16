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

import {
  loadSettings,
} from "../../../services/settingsApi";

import {
  removeRelationship,
} from "../../../services/settingsService";

function getUserId(user) {
  return String(
    user?._id ||
      user?.id ||
      ""
  );
}

function getDisplayName(user) {
  return (
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Snapgram user"
  );
}

function getUsername(user) {
  if (!user?.username) {
    return "";
  }

  return `@${user.username}`;
}

function getAvatar(user) {
  return (
    user?.avatar ||
    user?.profilePicture ||
    user?.profileImage ||
    ""
  );
}

function normalizeBlockedUsers(data) {
  const users =
    data?.blockedUsers;

  if (!Array.isArray(users)) {
    return [];
  }

  return users.filter(
    (user) =>
      user &&
      getUserId(user)
  );
}

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const loadBlockedUsers = useCallback(
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

        const data = await loadSettings();

        const blockedUsers =
          normalizeBlockedUsers(data);

        setUsers(blockedUsers);
      } catch (requestError) {
        console.error(
          "LOAD BLOCKED USERS ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load your blocked accounts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const unblockUser = useCallback(
    async (user) => {
      const userId = getUserId(user);

      if (!userId) {
        Alert.alert(
          "Unable to unblock",
          "This account does not have a valid user ID."
        );
        return;
      }

      if (removingId) {
        return;
      }

      try {
        setRemovingId(userId);

        await removeRelationship(
          userId,
          "blockedUsers"
        );

        setUsers((currentUsers) =>
          currentUsers.filter(
            (item) =>
              getUserId(item) !== userId
          )
        );
      } catch (requestError) {
        console.error(
          "UNBLOCK USER ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        Alert.alert(
          "Couldn't unblock",
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Something went wrong while unblocking this account."
        );
      } finally {
        setRemovingId(null);
      }
    },
    [removingId]
  );

  const confirmUnblock = useCallback(
    (user) => {
      const name = getDisplayName(user);

      Alert.alert(
        "Unblock account?",
        `${name} will be able to interact with you again according to your privacy settings.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Unblock",
            style: "default",
            onPress: () => unblockUser(user),
          },
        ]
      );
    },
    [unblockUser]
  );

  const openProfile = useCallback(
    (user) => {
      const userId = getUserId(user);

      if (!userId) {
        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: userId,
        },
      });
    },
    []
  );

  const retry = useCallback(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const renderUser = useCallback(
    ({ item }) => {
      const userId = getUserId(item);
      const avatar = getAvatar(item);
      const fullName = getDisplayName(item);
      const username = getUsername(item);

      const isRemoving =
        removingId === userId;

      return (
        <View style={styles.userRow}>
          <Pressable
            style={styles.profileButton}
            onPress={() => openProfile(item)}
            disabled={isRemoving}
            android_ripple={{
              color: "#eeeeee",
            }}
          >
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image
                  source={{
                    uri: avatar,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={styles.avatarPlaceholder}
                >
                  <Ionicons
                    name="person"
                    size={25}
                    color="#8e8e8e"
                  />
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {item?.username ||
                  fullName}
              </Text>

              <Text
                style={styles.fullName}
                numberOfLines={1}
              >
                {fullName}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.unblockButton,
              isRemoving &&
                styles.unblockButtonDisabled,
            ]}
            onPress={() =>
              confirmUnblock(item)
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
                style={styles.unblockText}
              >
                Unblock
              </Text>
            )}
          </Pressable>
        </View>
      );
    },
    [
      removingId,
      openProfile,
      confirmUnblock,
    ]
  );

  const renderEmpty = useCallback(() => {
    if (error) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="ban-outline"
            size={38}
            color="#262626"
          />
        </View>

        <Text style={styles.emptyTitle}>
          No blocked accounts
        </Text>

        <Text style={styles.emptyText}>
          When you block someone, their
          account will appear here.
        </Text>
      </View>
    );
  }, [error]);

  if (loading) {
    return (
      <Page
        title="Blocked"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Blocked"
      onBack={() => router.back()}
    >
      <View style={styles.container}>
        <FlatList
          data={users}
          keyExtractor={(item, index) =>
            getUserId(item) ||
            `blocked-${index}`
          }
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadBlockedUsers({
                  refresh: true,
                })
              }
              tintColor="#262626"
            />
          }
          ListHeaderComponent={
            <View style={styles.headerInfo}>
              <Text style={styles.description}>
                Accounts you block can't
                interact with you on
                Snapgram.
              </Text>

              {users.length > 0 && !error ? (
                <Text style={styles.count}>
                  {users.length}{" "}
                  {users.length === 1
                    ? "account"
                    : "accounts"}
                </Text>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Notice tone="danger">
                    {error}
                  </Notice>

                  <Pressable
                    style={styles.retryButton}
                    onPress={retry}
                  >
                    <Text
                      style={styles.retryText}
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
          contentContainerStyle={[
            styles.listContent,
            users.length === 0 &&
              styles.emptyContent,
          ]}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  headerInfo: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
  },

  count: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyContent: {
    flexGrow: 1,
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
    paddingVertical: 8,
  },

  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#f2f2f2",
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

  unblockButton: {
    minWidth: 86,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
    marginLeft: 10,
  },

  unblockButtonDisabled: {
    opacity: 0.6,
  },

  unblockText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
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

  errorBox: {
    marginTop: 12,
  },

  retryButton: {
    alignSelf: "flex-start",
    height: 36,
    paddingHorizontal: 16,
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