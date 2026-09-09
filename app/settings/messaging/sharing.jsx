import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
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
  allowStorySharing: true,
  allowPostSharing: true,
  allowReuse: true,
};

export default function SharingScreen() {
  const [allowStorySharing, setAllowStorySharing] = useState(
    DEFAULTS.allowStorySharing
  );

  const [allowPostSharing, setAllowPostSharing] = useState(
    DEFAULTS.allowPostSharing
  );

  const [allowReuse, setAllowReuse] = useState(
    DEFAULTS.allowReuse
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSharingSettings = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();
        const settings =
          data?.preferences?.sharing || {};

        setAllowStorySharing(
          typeof settings.allowStorySharing === "boolean"
            ? settings.allowStorySharing
            : DEFAULTS.allowStorySharing
        );

        setAllowPostSharing(
          typeof settings.allowPostSharing === "boolean"
            ? settings.allowPostSharing
            : DEFAULTS.allowPostSharing
        );

        setAllowReuse(
          typeof settings.allowReuse === "boolean"
            ? settings.allowReuse
            : DEFAULTS.allowReuse
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your sharing and reuse settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSharingSettings();
  }, [loadSharingSettings]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      const validKeys = [
        "allowStorySharing",
        "allowPostSharing",
        "allowReuse",
      ];

      if (!validKeys.includes(key)) {
        return;
      }

      if (typeof value !== "boolean") {
        return;
      }

      let previousValue;
      let setter;

      switch (key) {
        case "allowStorySharing":
          previousValue = allowStorySharing;
          setter = setAllowStorySharing;
          break;

        case "allowPostSharing":
          previousValue = allowPostSharing;
          setter = setAllowPostSharing;
          break;

        case "allowReuse":
          previousValue = allowReuse;
          setter = setAllowReuse;
          break;

        default:
          return;
      }

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          sharing: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your sharing preference.";

        setError(message);

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [
      allowStorySharing,
      allowPostSharing,
      allowReuse,
      saving,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Sharing & reuse"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Sharing & reuse"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadSharingSettings(true)
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="share-outline"
          title="Sharing & reuse"
          text="Control whether other people can share your content or use supported reuse features."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadSharingSettings()
              }
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <SwitchRow
            title="Allow story sharing"
            subtitle="Allow other people to share your stories when supported."
            value={allowStorySharing}
            onChange={(value) =>
              updateSetting(
                "allowStorySharing",
                value
              )
            }
          />

          <SwitchRow
            title="Allow post sharing"
            subtitle="Allow other people to share your posts through supported sharing features."
            value={allowPostSharing}
            onChange={(value) =>
              updateSetting(
                "allowPostSharing",
                value
              )
            }
          />

          <SwitchRow
            title="Allow reuse"
            subtitle="Allow supported features to reuse your content, such as remixes or other content-based interactions."
            value={allowReuse}
            onChange={(value) =>
              updateSetting(
                "allowReuse",
                value
              )
            }
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your sharing preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

