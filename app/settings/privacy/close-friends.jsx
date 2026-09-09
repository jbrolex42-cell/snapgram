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
  const [closeFriends, setCloseFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadCloseFriends = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const settings = await loadSettings();

        const users = Array.isArray(settings?.closeFriends)
          ? settings.closeFriends
          : [];

        setCloseFriends(users);
      } catch (err) {
        console.error(
          "Failed to load close friends:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your close friends."
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
    loadCloseFriends();
  }, [loadCloseFriends]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadCloseFriends(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadCloseFriends]);

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

    if (user.username && user.name) {
      return `@${user.username}`;
    }

    if (user.email) {
      return user.email;
    }

    return "";
  }, []);

  const handleOpenProfile = useCallback(
    (user) => {
      const userId = getUserId(user);

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
          id: String(userId),
        },
      });
    },
    [getUserId]
  );

  const handleRemove = useCallback(
    (user) => {
      const userId = getUserId(user);

      if (!userId) {
        Alert.alert(
          "Unable to remove",
          "This close-friends entry does not contain a valid user ID."
        );
        return;
      }

      const username = getUserName(user);

      Alert.alert(
        "Remove from close friends?",
        `${username} will no longer be able to see content you share with your close friends.`,
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
                setRemovingId(String(userId));
                setError("");

                await removeRelationship(
                  userId,
                  "closeFriends"
                );

                setCloseFriends((current) =>
                  current.filter(
                    (item) =>
                      String(getUserId(item)) !==
                      String(userId)
                  )
                );
              } catch (err) {
                console.error(
                  "Failed to remove close friend:",
                  err
                );

                Alert.alert(
                  "Couldn't remove",
                  err?.response?.data?.message ||
                    err?.message ||
                    "The user could not be removed from close friends."
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
      const userId = getUserId(item);
      const username = getUserName(item);
      const subtitle = getUserSubtitle(item);
      const isRemoving =
        removingId &&
        userId &&
        String(removingId) === String(userId);

      return (
        <SettingItem
          title={username}
          description={subtitle}
          icon="person-outline"
          onPress={() => handleOpenProfile(item)}
          right={
            <PrimaryButton
              title={
                isRemoving
                  ? "Removing..."
                  : "Remove"
              }
              onPress={() => handleRemove(item)}
              disabled={Boolean(isRemoving)}
              compact
            />
          }
        />
      );
    },
    [
      getUserId,
      getUserName,
      getUserSubtitle,
      handleOpenProfile,
      handleRemove,
      removingId,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Close friends"
        icon="people-outline"
      >
        <PageLoading />
      </Page>
    );
  }

  if (error && closeFriends.length === 0) {
    return (
      <Page
        title="Close friends"
        icon="people-outline"
      >
        <Notice
          type="error"
          title="Couldn't load close friends"
          message={error}
        />

        <PrimaryButton
          title="Try again"
          onPress={() => loadCloseFriends()}
        />
      </Page>
    );
  }

  return (
    <Page
      title="Close friends"
      icon="people-outline"
    >
      <FlatList
        data={closeFriends}
        keyExtractor={(item, index) => {
          const id = getUserId(item);

          return id
            ? String(id)
            : `close-friend-${index}`;
        }}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          closeFriends.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        ListHeaderComponent={
          <View>
            <InfoCard
              title="Close friends"
              description="People on this list can see content you specifically share with your close friends."
            />

            {error ? (
              <Notice
                type="error"
                title="Refresh issue"
                message={error}
              />
            ) : null}

            {closeFriends.length > 0 ? (
              <Text style={styles.count}>
                {closeFriends.length}{" "}
                {closeFriends.length === 1
                  ? "person"
                  : "people"}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              👥
            </Text>

            <Text style={styles.emptyTitle}>
              No close friends yet
            </Text>

            <Text style={styles.emptyText}>
              Add people to your close-friends list
              when you want to share private content
              with a smaller group.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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

