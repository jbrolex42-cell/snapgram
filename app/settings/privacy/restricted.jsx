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
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
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

const RELATIONSHIP_TYPE = "restrictedUsers";

export default function RestrictedAccountsScreen() {
  const [restrictedUsers, setRestrictedUsers] = useState([]);

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

  const getUsername = useCallback((user) => {
    if (!user) {
      return "Snapgram user";
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user.username ||
      user.userName ||
      "Snapgram user"
    );
  }, []);

  const getFullName = useCallback((user) => {
    if (!user || typeof user === "string") {
      return "";
    }

    return (
      user.fullName ||
      user.name ||
      ""
    );
  }, []);

  const getAvatar = useCallback((user) => {
    if (!user || typeof user === "string") {
      return null;
    }

    return (
      user.avatar?.url ||
      user.avatar ||
      user.profilePicture ||
      user.photo ||
      null
    );
  }, []);

  const getInitial = useCallback(
    (user) => {
      const username = getUsername(user);

      return (
        username?.charAt(0)?.toUpperCase() ||
        "S"
      );
    },
    [getUsername]
  );

  const loadRestrictedUsers = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const settings = await loadSettings();

        const users = Array.isArray(
          settings?.restrictedUsers
        )
          ? settings.restrictedUsers
          : [];

        setRestrictedUsers(users);
      } catch (err) {
        console.error(
          "RESTRICTED ACCOUNTS LOAD ERROR:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load restricted accounts.";

        setError(message);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadRestrictedUsers();
  }, [loadRestrictedUsers]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await loadRestrictedUsers(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadRestrictedUsers]);

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

  const unrestrictUser = useCallback(
    (user) => {
      const userId = getUserId(user);

      if (!userId) {
        Alert.alert(
          "Unable to remove restriction",
          "This account does not have a valid user ID."
        );

        return;
      }

      const username = getUsername(user);

      Alert.alert(
        "Remove restriction?",
        `Remove the restriction from ${username}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Remove",
            style: "destructive",

            onPress: async () => {
              try {
                const id = String(userId);

                setRemovingId(id);

                setError("");

                await removeRelationship(
                  userId,
                  RELATIONSHIP_TYPE
                );

                setRestrictedUsers((current) =>
                  current.filter(
                    (item) =>
                      String(
                        getUserId(item)
                      ) !== id
                  )
                );
              } catch (err) {
                console.error(
                  "REMOVE RESTRICTION ERROR:",
                  err
                );

                Alert.alert(
                  "Couldn't remove restriction",
                  err?.response?.data?.message ||
                    err?.message ||
                    "The restriction could not be removed."
                );
              } finally {
                setRemovingId(null);
              }
            },
          },
        ]
      );
    },
    [getUserId, getUsername]
  );

  const renderUser = useCallback(
    ({ item }) => {
      const userId = getUserId(item);

      const username = getUsername(item);

      const fullName = getFullName(item);

      const avatar = getAvatar(item);

      const isRemoving =
        Boolean(userId) &&
        String(removingId) ===
          String(userId);

      return (
        <View style={styles.userRow}>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.userInfo}
            onPress={() =>
              openProfile(item)
            }
            disabled={isRemoving}
          >

            <View style={styles.avatar}>
              {avatar ? (
                <View style={styles.avatarImageWrapper}>
                  <View
                    style={[
                      styles.avatarImage,
                      {
                        backgroundColor:
                          "transparent",
                      },
                    ]}
                  >
                    <ImageWithFallback
                      uri={avatar}
                      initial={getInitial(item)}
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.avatarText}>
                  {getInitial(item)}
                </Text>
              )}
            </View>

            <View style={styles.userDetails}>
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {username}
              </Text>

              {fullName ? (
                <Text
                  style={styles.fullName}
                  numberOfLines={1}
                >
                  {fullName}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[
              styles.removeButton,
              isRemoving &&
                styles.removeButtonDisabled,
            ]}
            onPress={() =>
              unrestrictUser(item)
            }
            disabled={isRemoving}
          >
            <Text
              style={styles.removeButtonText}
            >
              {isRemoving
                ? "Removing..."
                : "Remove"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [
      getUserId,
      getUsername,
      getFullName,
      getAvatar,
      getInitial,
      openProfile,
      removingId,
      unrestrictUser,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Restricted accounts"
        icon="person-remove-outline"
      >
        <PageLoading />
      </Page>
    );
  }

  if (
    error &&
    restrictedUsers.length === 0
  ) {
    return (
      <Page
        title="Restricted accounts"
        icon="person-remove-outline"
      >
        <Notice
          type="error"
          title="Couldn't load restricted accounts"
          message={error}
        />

        <PrimaryButton
          title="Try again"
          text="Try again"
          onPress={() =>
            loadRestrictedUsers()
          }
        />
      </Page>
    );
  }

  return (
    <Page
      title="Restricted accounts"
      icon="person-remove-outline"
    >
      <FlatList
        data={restrictedUsers}
        keyExtractor={(item, index) => {
          const id = getUserId(item);

          return id
            ? String(id)
            : `restricted-${index}`;
        }}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          restrictedUsers.length === 0
            ? styles.emptyList
            : styles.list
        }
        ListHeaderComponent={
          <View>

            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Ionicons
                  name="person-remove-outline"
                  size={24}
                  color="#000"
                />
              </View>

              <Text style={styles.introTitle}>
                Restricted accounts
              </Text>

              <Text style={styles.introText}>
                When you restrict someone, they
                won't be notified. They can still
                see your posts, but their comments
                on your posts are only visible to
                them until you approve them.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorWrapper}>
                <Notice
                  type="error"
                  title="Couldn't refresh"
                  message={error}
                />
              </View>
            ) : null}

            {restrictedUsers.length > 0 ? (
              <Text style={styles.sectionTitle}>
                {restrictedUsers.length}{" "}
                {restrictedUsers.length === 1
                  ? "account"
                  : "accounts"}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons
                name="person-remove-outline"
                size={34}
                color="#000"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No restricted accounts
            </Text>

            <Text style={styles.emptyText}>
              Accounts you restrict will appear
              here. You can remove a restriction
              at any time.
            </Text>
          </View>
        }
      />
    </Page>
  );
}

function ImageWithFallback({
  uri,
  initial,
}) {
  const [failed, setFailed] =
    useState(false);

  if (!uri || failed) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarText}>
          {initial}
        </Text>
      </View>
    );
  }

  const {
    Image,
  } = require("react-native");

  return (
    <Image
      source={{ uri }}
      style={styles.avatarImage}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 40,
  },

  emptyList: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },

  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  introText: {
    maxWidth: 340,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  errorWrapper: {
    marginBottom: 8,
  },

  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#737373",
  },

  userRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },

  avatarImageWrapper: {
    width: "100%",
    height: "100%",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },

  userDetails: {
    flex: 1,
    minWidth: 0,
  },

  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 3,
  },

  fullName: {
    fontSize: 13,
    color: "#737373",
  },

  removeButton: {
    minWidth: 82,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonDisabled: {
    opacity: 0.5,
  },

  removeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },

  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 35,
  },

  emptyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyText: {
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    textAlign: "center",
  },
});