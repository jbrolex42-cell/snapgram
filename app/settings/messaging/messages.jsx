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
  allowRequests: true,
  allowCalls: true,
};

export default function MessagesScreen() {
  const [allowRequests, setAllowRequests] = useState(
    DEFAULTS.allowRequests
  );

  const [allowCalls, setAllowCalls] = useState(
    DEFAULTS.allowCalls
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMessageSettings = useCallback(
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
          data?.preferences?.messages || {};

        setAllowRequests(
          typeof settings.allowRequests === "boolean"
            ? settings.allowRequests
            : DEFAULTS.allowRequests
        );

        setAllowCalls(
          typeof settings.allowCalls === "boolean"
            ? settings.allowCalls
            : DEFAULTS.allowCalls
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your message privacy settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMessageSettings();
  }, [loadMessageSettings]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      if (
        key !== "allowRequests" &&
        key !== "allowCalls"
      ) {
        return;
      }

      if (typeof value !== "boolean") {
        return;
      }

      const isRequests = key === "allowRequests";

      const previousValue = isRequests
        ? allowRequests
        : allowCalls;

      const setter = isRequests
        ? setAllowRequests
        : setAllowCalls;

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          messages: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your message privacy preference.";

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
      allowRequests,
      allowCalls,
      saving,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Messages / privacy controls"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Messages / privacy controls"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadMessageSettings(true)
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="paper-plane-outline"
          title="Messages / privacy controls"
          text="Control whether new people can contact you and whether calls are allowed through messaging."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadMessageSettings()
              }
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <SwitchRow
            title="Allow message requests"
            subtitle="Allow people you do not already message to send you new message requests."
            value={allowRequests}
            onChange={(value) =>
              updateSetting(
                "allowRequests",
                value
              )
            }
          />

          <SwitchRow
            title="Allow calls"
            subtitle="Allow people to contact you through voice or video calls from messaging."
            value={allowCalls}
            onChange={(value) =>
              updateSetting(
                "allowCalls",
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
              text="Updating your message privacy settings…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}