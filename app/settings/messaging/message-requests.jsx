import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  ChoiceSettings,
  SwitchRow,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";
import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const REQUEST_SOURCES = [
  "Everyone",
  "Following",
  "No one",
];

const DEFAULTS = {
  from: "Everyone",
  filter: true,
};

function normalizeSource(value) {
  return REQUEST_SOURCES.includes(value)
    ? value
    : DEFAULTS.from;
}

export default function MessageRequestsScreen() {
  const [requestSource, setRequestSource] = useState(
    DEFAULTS.from
  );

  const [filterRequests, setFilterRequests] = useState(
    DEFAULTS.filter
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMessageRequestSettings = useCallback(
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
          data?.preferences?.messageRequests || {};

        setRequestSource(
          normalizeSource(settings.from)
        );

        setFilterRequests(
          typeof settings.filter === "boolean"
            ? settings.filter
            : DEFAULTS.filter
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your message request settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMessageRequestSettings();
  }, [loadMessageRequestSettings]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      if (key === "from") {
        if (!REQUEST_SOURCES.includes(value)) {
          return;
        }
      } else if (
        key === "filter" &&
        typeof value !== "boolean"
      ) {
        return;
      } else if (key !== "from" && key !== "filter") {
        return;
      }

      const isSource = key === "from";

      const previousValue = isSource
        ? requestSource
        : filterRequests;

      const setter = isSource
        ? setRequestSource
        : setFilterRequests;

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          messageRequests: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your message request preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [
      requestSource,
      filterRequests,
      saving,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Message requests"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Message requests"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadMessageRequestSettings(true)
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="mail-unread-outline"
          title="Message requests"
          text="Choose who can send you message requests and how potentially unwanted requests are handled."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadMessageRequestSettings()
              }
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <ChoiceSettings
            title="Requests from"
            options={REQUEST_SOURCES}
            selected={requestSource}
            onSelect={(value) =>
              updateSetting("from", value)
            }
          />

          <SwitchRow
            title="Filter unwanted requests"
            subtitle="Filter potentially unwanted or suspicious message requests before they reach your main inbox."
            value={filterRequests}
            onChange={(value) =>
              updateSetting("filter", value)
            }
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your message request preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

