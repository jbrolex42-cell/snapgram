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
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Page,
  InfoCard,
  Notice,
  PageLoading,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import { loadSettings } from "../../../services/settingsApi";
import {
  removeRelationship,
} from "../../../services/settingsService";

function getUserId(user) {
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
}

function getUsername(user) {
  if (!user) {
    return "Snapgram user";
  }

  if (typeof user === "string") {
    return "Snapgram user";
  }

  return (
    user.username ||
    user.userName ||
    "Snapgram user"
  );
}

function getFullName(user) {
  if (!user || typeof user === "string") {
    return "";
  }

  return (
    user.fullName ||
    user.name ||
    ""
  );
}

function getAvatar(user) {
  if (!user || typeof user === "string") {
    return null;
  }

  return (
    user.avatar?.url ||
    user.avatar ||
    user.profilePicture ||
    user.profileImage ||
    null
  );
}

function getInitial(username) {
  if (!username) {
    return "S";
  }

  return String(username)
    .charAt(0)
    .toUpperCase();
}

export default function MutedAccountsScreen() {
  const [mutedUsers, setMutedUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [removingId, setRemovingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadMutedUsers =
    useCallback(
      async (showLoader = true) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const settings =
            await loadSettings();

          const users =
            Array.isArray(
              settings?.mutedUsers
            )
              ? settings.mutedUsers
              : [];

          setMutedUsers(users);
        } catch (err) {
          console.error(
            "MUTED ACCOUNTS LOAD ERROR:",
            err
          );

          setError(
            err?.response?.data
              ?.message ||
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

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);

        await loadMutedUsers(false);
      } finally {
        setRefreshing(false);
      }
    }, [loadMutedUsers]);

  const openProfile =
    useCallback((user) => {
      const userId =
        getUserId(user);

      if (!userId) {
        Alert.alert(
          "Profile unavailable",
          "This account does not have a valid profile."
        );

        return;
      }

      router.push({
        pathname: "/profile/[id]",
        params: {
          id: String(userId),
        },
      });
    }, []);

  const handleUnmute =
    useCallback((user) => {
      const userId =
        getUserId(user);

      if (!userId) {
        Alert.alert(
          "Unable to unmute",
          "This account does not have a valid user ID."
        );

        return;
      }

      const username =
        getUsername(user);

      Alert.alert(
        "Unmute account?",
        `You will start seeing ${username}'s content again.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Unmute",
            onPress: async () => {
              try {
                const id =
                  String(userId);

                setRemovingId(id);
                setError("");

                await removeRelationship(
                  userId,
                  "mutedUsers"
                );

                setMutedUsers(
                  (current) =>
                    current.filter(
                      (item) =>
                        String(
                          getUserId(item)
                        ) !== id
                    )
                );
              } catch (err) {
                console.error(
                  "UNMUTE ACCOUNT ERROR:",
                  err
                );

                const message =
                  err?.response?.data
                    ?.message ||
                  err?.message ||
                  "The account could not be unmuted.";

                setError(message);

                Alert.alert(
                  "Couldn't unmute",
                  message
                );
              } finally {
                setRemovingId(null);
              }
            },
          },
        ]
      );
    }, []);

  const renderItem =
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

        const id =
          userId
            ? String(userId)
            : null;

        const isRemoving =
          id &&
          removingId === id;

        return (
          <View
            style={
              styles.userRow
            }
          >
            {/* PROFILE AREA */}

            <TouchableOpacity
              activeOpacity={0.7}
              style={
                styles.profileButton
              }
              onPress={() =>
                openProfile(item)
              }
              disabled={Boolean(
                isRemoving
              )}
            >
              {/* AVATAR */}

              {avatar ? (
                <Image
                  source={{
                    uri: avatar,
                  }}
                  style={
                    styles.avatar
                  }
                />
              ) : (
                <View
                  style={
                    styles.avatarPlaceholder
                  }
                >
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {getInitial(
                      username
                    )}
                  </Text>
                </View>
              )}

              {/* USER INFO */}

              <View
                style={
                  styles.userInfo
                }
              >
                <Text
                  style={
                    styles.username
                  }
                  numberOfLines={1}
                >
                  {username}
                </Text>

                {fullName ? (
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
            </TouchableOpacity>

            {/* UNMUTE BUTTON */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.unmuteButton,
                isRemoving &&
                  styles.unmuteButtonDisabled,
              ]}
              onPress={() =>
                handleUnmute(item)
              }
              disabled={
                Boolean(isRemoving)
              }
            >
              {isRemoving ? (
                <Text
                  style={
                    styles.unmuteText
                  }
                >
                  ...
                </Text>
              ) : (
                <Text
                  style={
                    styles.unmuteText
                  }
                >
                  Unmute
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      },
      [
        handleUnmute,
        openProfile,
        removingId,
      ]
    );

  if (loading) {
    return (
      <Page
        title="Muted accounts"
        icon="volume-mute-outline"
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
      title="Muted accounts"
      icon="volume-mute-outline"
      onBack={() =>
        router.back()
      }
    >
      <FlatList
        data={mutedUsers}
        keyExtractor={(item, index) => {
          const id =
            getUserId(item);

          return id
            ? String(id)
            : `muted-${index}`;
        }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
          />
        }
        contentContainerStyle={[
          styles.listContent,
          mutedUsers.length ===
            0 &&
            styles.emptyList,
        ]}
        ListHeaderComponent={
          <View>
            <InfoCard
              icon="volume-mute-outline"
              title="Muted accounts"
              text="When you mute someone, their posts and other content won't appear in places like your feed. They won't be notified that you've muted them."
            />

            {error ? (
              <View
                style={
                  styles.errorContainer
                }
              >
                <Notice
                  type="error"
                  title="Settings issue"
                  message={error}
                />

                <PrimaryButton
                  title="Try again"
                  text="Try again"
                  onPress={() =>
                    loadMutedUsers()
                  }
                  disabled={
                    refreshing ||
                    Boolean(
                      removingId
                    )
                  }
                />
              </View>
            ) : null}

            {mutedUsers.length >
            0 ? (
              <View
                style={
                  styles.headerRow
                }
              >
                <Text
                  style={
                    styles.count
                  }
                >
                  {mutedUsers.length}{" "}
                  {mutedUsers.length ===
                  1
                    ? "account"
                    : "accounts"}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <View
              style={
                styles.emptyIconContainer
              }
            >
              <Ionicons
                name="volume-mute-outline"
                size={34}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No muted accounts
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Accounts you mute will
              appear here. They won't
              be notified when you mute
              them.
            </Text>
          </View>
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

  errorContainer: {
    marginTop: 12,
  },

  headerRow: {
    marginTop: 18,
    marginBottom: 8,
  },

  count: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.6,
  },

  userRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor:
      "rgba(128,128,128,0.22)",
  },

  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor:
      "#e9e9e9",
  },

  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "#e5e5e5",
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "700",
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  username: {
    fontSize: 15,
    fontWeight: "700",
  },

  fullName: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.55,
  },

  unmuteButton: {
    minWidth: 82,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "#efefef",
  },

  unmuteButtonDisabled: {
    opacity: 0.5,
  },

  unmuteText: {
    fontSize: 13,
    fontWeight: "700",
  },

  empty: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor:
      "#efefef",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyText: {
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    opacity: 0.6,
  },
});