import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  Page,
  InfoCard,
  SwitchRow,
  PageLoading,
  ErrorText,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getSettings,
  updateSettings,
} from "../../../services/settingsApi";

const DEFAULT_NOTIFICATIONS = {
  push: true,
  likes: true,
  comments: true,
  messages: true,
  follows: true,
  stories: true,
  mentions: true,
  calls: true,
};

const NOTIFICATION_ITEMS = [
  {
    key: "push",
    title: "Push notifications",
    subtitle: "Receive Snapgram notifications on your device.",
    icon: "notifications-outline",
  },
  {
    key: "likes",
    title: "Likes",
    subtitle: "Get notified when someone likes your posts.",
    icon: "heart-outline",
  },
  {
    key: "comments",
    title: "Comments",
    subtitle: "Get notified when someone comments on your posts.",
    icon: "chatbubble-outline",
  },
  {
    key: "messages",
    title: "Messages",
    subtitle: "Get notified when you receive new messages.",
    icon: "chatbubble-ellipses-outline",
  },
  {
    key: "follows",
    title: "Followers",
    subtitle: "Get notified when someone follows you.",
    icon: "person-add-outline",
  },
  {
    key: "stories",
    title: "Stories",
    subtitle: "Get notified about story activity.",
    icon: "add-circle-outline",
  },
  {
    key: "mentions",
    title: "Mentions",
    subtitle: "Get notified when someone mentions you.",
    icon: "at-outline",
  },
  {
    key: "calls",
    title: "Calls",
    subtitle: "Get notified about incoming calls.",
    icon: "call-outline",
  },
];

export default function NotificationsScreen() {
  const { theme } = useSettingsTheme();

  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATIONS
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const loadNotificationSettings = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getSettings();

        const savedNotifications =
          data?.preferences?.notifications || {};

        setNotifications({
          push:
            typeof savedNotifications.push === "boolean"
              ? savedNotifications.push
              : true,

          likes:
            typeof savedNotifications.likes === "boolean"
              ? savedNotifications.likes
              : true,

          comments:
            typeof savedNotifications.comments === "boolean"
              ? savedNotifications.comments
              : true,

          messages:
            typeof savedNotifications.messages === "boolean"
              ? savedNotifications.messages
              : true,

          follows:
            typeof savedNotifications.follows === "boolean"
              ? savedNotifications.follows
              : true,

          stories:
            typeof savedNotifications.stories === "boolean"
              ? savedNotifications.stories
              : true,

          mentions:
            typeof savedNotifications.mentions === "boolean"
              ? savedNotifications.mentions
              : true,

          calls:
            typeof savedNotifications.calls === "boolean"
              ? savedNotifications.calls
              : true,
        });
      } catch (err) {
        console.error(
          "[NOTIFICATIONS] LOAD ERROR:",
          err?.response?.data || err?.message || err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load notification settings."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const toggleNotification = useCallback(
    async (key, value) => {
      if (savingKey) {
        return;
      }

      const previousValue = notifications[key];

      setError("");

      setNotifications((current) => ({
        ...current,
        [key]: value,
      }));

      setSavingKey(key);

      try {
        await updateSettings({
          notifications: {
            [key]: Boolean(value),
          },
        });
      } catch (err) {
        console.error(
          `[NOTIFICATIONS] UPDATE ${key} ERROR:`,
          err?.response?.data || err?.message || err
        );

        setNotifications((current) => ({
          ...current,
          [key]: previousValue,
        }));

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update notification settings."
        );
      } finally {
        setSavingKey(null);
      }
    },
    [notifications, savingKey]
  );

  if (loading) {
    return (
      <Page
        title="Notifications"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Notifications"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotificationSettings(true)}
            tintColor={theme.primary}
          />
        }
      >
        <InfoCard
          icon="notifications-outline"
          title="Notifications"
          text="Choose the notifications you want to receive from Snapgram."
        />

        {error ? (
          <View style={styles.errorContainer}>
            <ErrorText>{error}</ErrorText>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.secondaryText },
            ]}
          >
            NOTIFICATION CONTROLS
          </Text>

          {NOTIFICATION_ITEMS.map((item) => (
            <SwitchRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              value={notifications[item.key]}
              onValueChange={(value) =>
                toggleNotification(item.key, value)
              }
              disabled={
                savingKey !== null &&
                savingKey !== item.key
              }
            />
          ))}
        </View>

        {savingKey ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />

            <Text
              style={[
                styles.savingText,
                { color: theme.secondaryText },
              ]}
            >
              Saving...
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  errorContainer: {
    marginTop: 12,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },

  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },

  savingText: {
    fontSize: 13,
  },
});