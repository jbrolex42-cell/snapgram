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

const QUALITY_OPTIONS = ["Standard", "High"];

const DEFAULTS = {
  quality: "Standard",
  uploadAtHighestQuality: false,
};

function normalizeQuality(value) {
  return QUALITY_OPTIONS.includes(value)
    ? value
    : DEFAULTS.quality;
}

export default function MediaQualityScreen() {
  const [quality, setQuality] = useState(DEFAULTS.quality);
  const [uploadAtHighestQuality, setUploadAtHighestQuality] = useState(
    DEFAULTS.uploadAtHighestQuality
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMediaQuality = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();
      const settings = data?.preferences?.mediaQuality || {};

      setQuality(normalizeQuality(settings.quality));

      setUploadAtHighestQuality(
        typeof settings.uploadAtHighestQuality === "boolean"
          ? settings.uploadAtHighestQuality
          : DEFAULTS.uploadAtHighestQuality
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your media quality settings.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMediaQuality();
  }, [loadMediaQuality]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      if (key !== "quality" && key !== "uploadAtHighestQuality") {
        return;
      }

      if (
        key === "quality" &&
        !QUALITY_OPTIONS.includes(value)
      ) {
        return;
      }

      if (
        key === "uploadAtHighestQuality" &&
        typeof value !== "boolean"
      ) {
        return;
      }

      const isQuality = key === "quality";

      const previousValue = isQuality
        ? quality
        : uploadAtHighestQuality;

      const setter = isQuality
        ? setQuality
        : setUploadAtHighestQuality;

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          mediaQuality: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your media quality preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [quality, uploadAtHighestQuality, saving]
  );

  if (loading) {
    return (
      <Page title="Media quality" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Media quality" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMediaQuality(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="image-outline"
          title="Media quality"
          text="Choose how Snapgram handles the quality of photos and videos you upload."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadMediaQuality()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <ChoiceSettings
            title="Upload quality"
            options={QUALITY_OPTIONS}
            selected={quality}
            onSelect={(value) =>
              updateSetting("quality", value)
            }
          />

          <SwitchRow
            title="Upload at highest quality"
            subtitle="Use the highest available quality when supported. Higher quality may use more data and storage."
            value={uploadAtHighestQuality}
            onChange={(value) =>
              updateSetting(
                "uploadAtHighestQuality",
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
              text="Updating your media quality preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}