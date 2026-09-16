import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Page,
  InfoCard,
  SwitchRow,
  ErrorText,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getSettings,
  updateSettings,
} from "../../../services/settingsApi";

const DEFAULT_VALUE = true;

export default function MessageNotificationsScreen() {
  const { theme } = useSettingsTheme();

  const [enabled, setEnabled] = useState(DEFAULT_VALUE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSettings();

      const notifications =
        data?.preferences?.notifications ||
        data?.notifications ||
        {};

      setEnabled(
        typeof notifications.messages === "boolean"
          ? notifications.messages
          : DEFAULT_VALUE
      );
    } catch (err) {
      console.error(
        "[MESSAGE NOTIFICATIONS] LOAD ERROR:",
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load message notification settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = useCallback(
    async (value) => {
      if (saving) return;

      const previousValue = enabled;

      setEnabled(value);
      setSaving(true);
      setError("");

      try {
        await updateSettings({
          notifications: {
            messages: value,
          },
        });
      } catch (err) {
        console.error(
          "[MESSAGE NOTIFICATIONS] UPDATE ERROR:",
          err?.response?.data || err?.message || err
        );

        setEnabled(previousValue);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update message notifications."
        );
      } finally {
        setSaving(false);
      }
    },
    [enabled, saving]
  );

  if (loading) {
    return (
      <Page
        title="Message notifications"
        onBack={() => router.back()}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={theme.primary}
          />

          <Text
            style={[
              styles.loadingText,
              { color: theme.secondaryText },
            ]}
          >
            Loading notification settings...
          </Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      title="Message notifications"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSettings(true)}
            tintColor={theme.primary}
          />
        }
      >
        <InfoCard
          icon="chatbubble-ellipses-outline"
          title="Message notifications"
          text="Control notifications you receive when someone sends you a message."
        />

        {error ? (
          <View style={styles.errorWrapper}>
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
            MESSAGES
          </Text>

          <SwitchRow
            icon="chatbubble-outline"
            title="Message notifications"
            subtitle={
              enabled
                ? "You'll receive notifications for new messages."
                : "Message notifications are turned off."
            }
            value={enabled}
            onValueChange={handleToggle}
            disabled={saving}
          />
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.secondaryText },
            ]}
          >
            OTHER MESSAGE ACTIVITY
          </Text>

          <View
            style={[
              styles.infoRow,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={theme.text}
              />
            </View>

            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoTitle,
                  { color: theme.text },
                ]}
              >
                Requests and story replies
              </Text>

              <Text
                style={[
                  styles.infoText,
                  { color: theme.secondaryText },
                ]}
              >
                Additional notification controls can be managed
                from your main notification settings.
              </Text>
            </View>
          </View>

          <View style={styles.settingsLink}>
            <SwitchRow
              icon="notifications-outline"
              title="All notification settings"
              subtitle="Manage likes, comments, follows, stories and other notifications."
              value={false}
              onValueChange={() =>
                router.push(
                  "/settings/notifications/notifications"
                )
              }
              showSwitch={false}
            />
          </View>
        </View>

        {saving ? (
          <View style={styles.savingRow}>
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

  loadingContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
  },

  errorWrapper: {
    marginTop: 12,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },

  settingsLink: {
    marginTop: 8,
  },

  savingRow: {
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