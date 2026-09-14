import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  SwitchRow,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";
import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULTS = {
  allowAudio: true,
  allowVideo: true,
  notifications: true,
};

export default function CallsScreen() {
  const [allowAudio, setAllowAudio] = useState(
    DEFAULTS.allowAudio
  );

  const [allowVideo, setAllowVideo] = useState(
    DEFAULTS.allowVideo
  );

  const [notifications, setNotifications] = useState(
    DEFAULTS.notifications
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCallSettings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();
      const settings = data?.preferences?.calls || {};

      setAllowAudio(
        typeof settings.allowAudio === "boolean"
          ? settings.allowAudio
          : DEFAULTS.allowAudio
      );

      setAllowVideo(
        typeof settings.allowVideo === "boolean"
          ? settings.allowVideo
          : DEFAULTS.allowVideo
      );

      setNotifications(
        typeof settings.notifications === "boolean"
          ? settings.notifications
          : DEFAULTS.notifications
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your call settings.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCallSettings();
  }, [loadCallSettings]);

  const updateCallSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      const validKeys = [
        "allowAudio",
        "allowVideo",
        "notifications",
      ];

      if (!validKeys.includes(key) || typeof value !== "boolean") {
        return;
      }

      let previousValue;
      let setter;

      switch (key) {
        case "allowAudio":
          previousValue = allowAudio;
          setter = setAllowAudio;
          break;

        case "allowVideo":
          previousValue = allowVideo;
          setter = setAllowVideo;
          break;

        case "notifications":
          previousValue = notifications;
          setter = setNotifications;
          break;

        default:
          return;
      }

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          calls: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your call preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [
      allowAudio,
      allowVideo,
      notifications,
      saving,
    ]
  );

  if (loading) {
    return (
      <Page title="Calls" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Calls" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCallSettings(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="call-outline"
          title="Calls"
          text="Manage voice calls, video calls, and call notifications."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadCallSettings()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <SwitchRow
            title="Voice calls"
            subtitle="Allow other people to make incoming voice calls to you."
            value={allowAudio}
            onChange={(value) =>
              updateCallSetting("allowAudio", value)
            }
          />

          <SwitchRow
            title="Video calls"
            subtitle="Allow other people to make incoming video calls to you."
            value={allowVideo}
            onChange={(value) =>
              updateCallSetting("allowVideo", value)
            }
          />

          <SwitchRow
            title="Call notifications"
            subtitle="Receive notifications when someone calls you."
            value={notifications}
            onChange={(value) =>
              updateCallSetting("notifications", value)
            }
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your call preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}