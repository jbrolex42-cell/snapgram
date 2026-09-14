import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  Notice,
  PageLoading,
  SettingItem,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import { loadSettings } from "../../../services/settingsApi";
import {
  removeRelationship,
} from "../../../services/settingsService";

export default function Screen() {
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const getUserId = useCallback((user) => {
    if (!user) {
      return null;
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user._id ||
      user.id ||
      user.userId ||
      null
    );
  }, []);

  const getUserName = useCallback((user) => {
    if (!user) {
      return "Unknown user";
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user.username ||
      user.userName ||
      user.name ||
      user.fullName ||
      "Snapgram user"
    );
  }, []);

  const getUserSubtitle = useCallback((user) => {
    if (!user || typeof user === "string") {
      return "";
    }

    if (user.username) {
      return `@${user.username}`;
    }

    if (user.email) {
      return user.email;
    }

    return "";
  }, []);

  const loadMutedUsers = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const settings =
          await loadSettings();

        const users = Array.isArray(
          settings?.mutedUsers
        )
          ? settings.mutedUsers
          : [];

        setMutedUsers(users);
      } catch (err) {
        console.error(
          "Failed to load muted accounts:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load muted accounts."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadMutedUsers();
  }, [loadMutedUsers]);

  const handleRefresh = useCallback(
    async () => {
      try {
        setRefreshing(true);
        await loadMutedUsers(false);
      } finally {
        setRefreshing(false);
      }
    },
    [loadMutedUsers]
  );

  const openProfile = useCallback(
    (user) => {
      const userId = getUserId(user);

      if (!userId) {
        Alert.alert(
          "Profile unavailable",
          "This account does not have a valid profile ID."
        );
        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: String(userId),
        },
      });
    },
    [getUserId]
  );

  const unmuteUser = useCallback(
    async (user) => {
      const userId = getUserId(user);

      if (!userId) {
        Alert.alert(
          "Unable to unmute",
          "This account does not have a valid user ID."
        );
        return;
      }

      const username =
        getUserName(user);

      Alert.alert(
        "Unmute account?",
        `${username}'s content will no longer be muted.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Unmute",
            onPress: async () => {
              try {
                setRemovingId(
                  String(userId)
                );
                setError("");

                await removeRelationship(
                  userId,
                  "muted"
                );

                setMutedUsers(
                  (current) =>
                    current.filter(
                      (item) =>
                        String(
                          getUserId(item)
                        ) !==
                        String(userId)
                    )
                );
              } catch (err) {
                console.error(
                  "Failed to unmute account:",
                  err
                );

                Alert.alert(
                  "Couldn't unmute",
                  err?.response?.data
                    ?.message ||
                    err?.message ||
                    "The account could not be unmuted."
                );
              } finally {
                setRemovingId(null);
              }
            },
          },
        ]
      );
    },
    [getUserId, getUserName]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const userId =
        getUserId(item);

      const username =
        getUserName(item);

      const subtitle =
        getUserSubtitle(item);

      const isRemoving =
        removingId &&
        userId &&
        String(removingId) ===
          String(userId);

      return (
        <SettingItem
          title={username}
          description={subtitle}
          icon="person-outline"
          onPress={() =>
            openProfile(item)
          }
          right={
            <PrimaryButton
              title={
                isRemoving
                  ? "Unmuting..."
                  : "Unmute"
              }
              text={
                isRemoving
                  ? "Unmuting..."
                  : "Unmute"
              }
              compact
              disabled={Boolean(
                isRemoving
              )}
              onPress={() =>
                unmuteUser(item)
              }
            />
          }
        />
      );
    },
    [
      getUserId,
      getUserName,
      getUserSubtitle,
      openProfile,
      removingId,
      unmuteUser,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Muted accounts"
        icon="volume-mute-outline"
      >
        <PageLoading />
      </Page>
    );
  }

  if (
    error &&
    mutedUsers.length === 0
  ) {
    return (
      <Page
        title="Muted accounts"
        icon="volume-mute-outline"
      >
        <Notice
          type="error"
          title="Couldn't load muted accounts"
          message={error}
        />

        <PrimaryButton
          title="Try again"
          text="Try again"
          onPress={() =>
            loadMutedUsers()
          }
        />
      </Page>
    );
  }

  return (
    <Page
      title="Muted accounts"
      icon="volume-mute-outline"
    >
      <FlatList
        data={mutedUsers}
        keyExtractor={(item, index) => {
          const id =
            getUserId(item);

          return id
            ? String(id)
            : `muted-user-${index}`;
        }}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          mutedUsers.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        ListHeaderComponent={
          <View>
            <InfoCard
              title="Muted accounts"
              description="Manage accounts whose posts and other content you have muted."
            />

            {error ? (
              <Notice
                type="error"
                title="Refresh issue"
                message={error}
              />
            ) : null}

            {mutedUsers.length >
            0 ? (
              <Text
                style={styles.count}
              >
                {mutedUsers.length}{" "}
                {mutedUsers.length ===
                1
                  ? "account"
                  : "accounts"}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Text
              style={styles.emptyIcon}
            >
              🔇
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No muted accounts
            </Text>

            <Text
              style={styles.emptyText}
            >
              Accounts you mute will
              appear here. You can
              unmute them at any time.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={
          false
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },

  emptyContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  count: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.65,
  },

  empty: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    opacity: 0.65,
  },
});