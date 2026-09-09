import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  FlatList,
  Image,
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
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [removingId, setRemovingId] =
    useState(null);

  const [error, setError] =
    useState(null);

  const loadBlockedUsers =
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

          setError(null);

          const data =
            await loadSettings();

          setUsers(
            normalizeBlockedUsers(
              data
            )
          );
        } catch (requestError) {
          console.error(
            "LOAD BLOCKED USERS ERROR:",
            requestError?.response
              ?.data ||
              requestError?.message ||
              requestError
          );

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Unable to load blocked users."
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

  function confirmUnblock(user) {
    const name =
      getDisplayName(user);

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
          onPress: () =>
            unblockUser(user),
        },
      ]
    );
  }

  async function unblockUser(user) {
    const userId =
      getUserId(user);

    if (!userId) {
      Alert.alert(
        "Unable to unblock",
        "This blocked account does not have a valid user ID."
      );

      return;
    }

    if (removingId) {
      return;
    }

    try {
      setRemovingId(
        userId
      );

      await removeRelationship(
        userId,
        "blocked"
      );

      setUsers(
        (current) =>
          current.filter(
            (item) =>
              getUserId(item) !==
              userId
          )
      );

      Alert.alert(
        "Account unblocked",
        `${getDisplayName(
          user
        )} has been removed from your blocked list.`
      );
    } catch (requestError) {
      console.error(
        "UNBLOCK USER ERROR:",
        requestError?.response
          ?.data ||
          requestError?.message ||
          requestError
      );

      Alert.alert(
        "Unable to unblock",
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "The account could not be unblocked."
      );
    } finally {
      setRemovingId(null);
    }
  }

  function openProfile(user) {
    const userId =
      getUserId(user);

    if (!userId) {
      return;
    }

    router.push({
      pathname:
        "/profile/[id]",
      params: {
        id: userId,
      },
    });
  }

  function renderUser({ item }) {
    const userId =
      getUserId(item);

    const avatar =
      getAvatar(item);

    const isRemoving =
      removingId === userId;

    return (
      <View
        style={styles.userCard}
      >
        <SettingItem
          title={getDisplayName(
            item
          )}
          subtitle={
            getUsername(item) ||
            "Blocked account"
          }
          onPress={() =>
            openProfile(item)
          }
          disabled={
            isRemoving
          }
        />

        <View
          style={
            styles.actionContainer
          }
        >
          <PrimaryButton
            text={
              isRemoving
                ? "Unblocking..."
                : "Unblock"
            }
            disabled={
              isRemoving ||
              Boolean(removingId)
            }
            onPress={() =>
              confirmUnblock(
                item
              )
            }
          />
        </View>
      </View>
    );
  }

  function renderEmpty() {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Notice tone="success">
          You have not blocked any
          accounts.
        </Notice>

        <InfoCard
          icon="checkmark-circle-outline"
          title="Your blocked list is empty"
          text="Accounts you block will appear here. You can unblock them at any time."
        />
      </View>
    );
  }

  if (loading) {
    return (
      <Page
        title="Blocked users"
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
      title="Blocked users"
      onBack={() =>
        router.back()
      }
    >
      <FlatList
        data={users}
        keyExtractor={(item) =>
          getUserId(item)
        }
        renderItem={
          renderUser
        }
        ListHeaderComponent={
          <>
            <InfoCard
              icon="ban-outline"
              title="Blocked users"
              text="Accounts you block cannot interact with you according to Snapgram's blocking rules. Manage your blocked accounts below."
            />

            {error ? (
              <>
                <Notice tone="danger">
                  {error}
                </Notice>

                <PrimaryButton
                  text="Try again"
                  onPress={() =>
                    loadBlockedUsers()
                  }
                />
              </>
            ) : null}

            {!error &&
            users.length > 0 ? (
              <Notice>
                {users.length}{" "}
                {users.length ===
                1
                  ? "account"
                  : "accounts"}{" "}
                blocked.
              </Notice>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !error
            ? renderEmpty
            : null
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              loadBlockedUsers({
                refresh: true,
              })
            }
          />
        }
        contentContainerStyle={
          users.length === 0
            ? styles.emptyList
            : styles.list
        }
        showsVerticalScrollIndicator={
          false
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  emptyContainer: {
    gap: 12,
    marginTop: 12,
  },

  userCard: {
    marginBottom: 12,
  },

  actionContainer: {
    marginTop: -4,
    paddingHorizontal: 4,
  },
});

