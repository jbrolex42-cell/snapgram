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
  dataSaver: false,
  autoplay: true,
};

export default function DataUsageScreen() {
  const [dataSaver, setDataSaver] = useState(DEFAULTS.dataSaver);
  const [autoplay, setAutoplay] = useState(DEFAULTS.autoplay);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDataUsage = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();
      const preferences = data?.preferences || {};
      const settings = preferences?.dataUsage || {};

      setDataSaver(
        typeof settings.dataSaver === "boolean"
          ? settings.dataSaver
          : DEFAULTS.dataSaver
      );

      setAutoplay(
        typeof settings.autoplay === "boolean"
          ? settings.autoplay
          : DEFAULTS.autoplay
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your data usage settings.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDataUsage();
  }, [loadDataUsage]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      const isDataSaver = key === "dataSaver";

      if (!isDataSaver && key !== "autoplay") {
        return;
      }

      const previousValue = isDataSaver ? dataSaver : autoplay;
      const setter = isDataSaver ? setDataSaver : setAutoplay;

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          dataUsage: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your data usage preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [autoplay, dataSaver, saving]
  );

  if (loading) {
    return (
      <Page title="Data usage" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Data usage" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDataUsage(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="cellular-outline"
          title="Data usage"
          text="Control how Snapgram uses mobile data and media playback."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadDataUsage()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <SwitchRow
            title="Data saver"
            subtitle="Reduce data usage for supported photos, videos, and other media."
            value={dataSaver}
            onChange={(value) => updateSetting("dataSaver", value)}
          />

          <SwitchRow
            title="Autoplay media"
            subtitle="Allow supported videos and other media to start playing automatically."
            value={autoplay}
            onChange={(value) => updateSetting("autoplay", value)}
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your data usage preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

