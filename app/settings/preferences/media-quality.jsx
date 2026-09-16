import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

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
  ChoiceSettings,
  SwitchRow,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  getSettings,
  updateSettings,
} from "../../../services/settingsApi";

const QUALITY_OPTIONS = [
  "Standard",
  "High",
];

const DEFAULTS = {
  quality: "Standard",
  uploadAtHighestQuality: false,
};

function normalizeQuality(value) {
  if (!value) {
    return DEFAULTS.quality;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (normalized === "high") {
    return "High";
  }

  return "Standard";
}

function qualityToApiValue(value) {
  return value === "High"
    ? "high"
    : "standard";
}

export default function MediaQualityScreen() {
  const [quality, setQuality] = useState(
    DEFAULTS.quality
  );

  const [
    uploadAtHighestQuality,
    setUploadAtHighestQuality,
  ] = useState(
    DEFAULTS.uploadAtHighestQuality
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadMediaQuality = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getSettings();

        const preferences =
          data?.preferences || {};

        setQuality(
          normalizeQuality(
            preferences.mediaQuality
          )
        );

        setUploadAtHighestQuality(
          typeof preferences.uploadAtHighestQuality ===
            "boolean"
            ? preferences.uploadAtHighestQuality
            : DEFAULTS.uploadAtHighestQuality
        );
      } catch (err) {
        console.error(
          "MEDIA QUALITY LOAD ERROR:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your media quality settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMediaQuality();
  }, [loadMediaQuality]);

  const updateQuality = useCallback(
    async (value) => {
      if (saving) {
        return;
      }

      if (!QUALITY_OPTIONS.includes(value)) {
        return;
      }

      const previousValue = quality;

      setQuality(value);
      setSaving(true);
      setError("");

      try {
        await updateSettings({
          mediaQuality:
            qualityToApiValue(value),
        });
      } catch (err) {
        console.error(
          "MEDIA QUALITY SAVE ERROR:",
          err
        );

        setQuality(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your media quality preference.";

        setError(message);

        Alert.alert(
          "Unable to save",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [quality, saving]
  );

  const updateHighestQuality =
    useCallback(
      async (value) => {
        if (saving) {
          return;
        }

        if (typeof value !== "boolean") {
          return;
        }

        const previousValue =
          uploadAtHighestQuality;

        setUploadAtHighestQuality(value);
        setSaving(true);
        setError("");

        try {
          await updateSettings({
            uploadAtHighestQuality:
              value,
          });
        } catch (err) {
          console.error(
            "HIGHEST QUALITY SAVE ERROR:",
            err
          );

          setUploadAtHighestQuality(
            previousValue
          );

          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Unable to save your upload quality preference.";

          setError(message);

          Alert.alert(
            "Unable to save",
            message
          );
        } finally {
          setSaving(false);
        }
      },
      [
        uploadAtHighestQuality,
        saving,
      ]
    );

  if (loading) {
    return (
      <Page
        title="Media quality"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Media quality"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadMediaQuality(true)
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <InfoCard
          icon="image-outline"
          title="Media quality"
          text="Control the quality of photos and videos you upload to Snapgram."
        />

        {error ? (
          <View
            style={{
              marginTop: 12,
            }}
          >
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadMediaQuality()
              }
            />
          </View>
        ) : null}

        <View
          style={{
            marginTop: 12,
          }}
        >
          <ChoiceSettings
            title="Upload quality"
            options={QUALITY_OPTIONS}
            selected={quality}
            onSelect={updateQuality}
          />

          <SwitchRow
            title="Upload at highest quality"
            subtitle="Photos and videos may take longer to upload and use more mobile data."
            value={uploadAtHighestQuality}
            onChange={
              updateHighestQuality
            }
          />
        </View>

        <View
          style={{
            marginTop: 12,
          }}
        >
          <InfoCard
            icon="information-circle-outline"
            title={
              quality === "High"
                ? "High quality is enabled"
                : "Standard quality is enabled"
            }
            text={
              quality === "High"
                ? "Snapgram will prioritize higher-quality uploads. Uploads may use more data and storage."
                : "Snapgram will balance image and video quality with upload speed and data usage."
            }
          />
        </View>

        {saving ? (
          <View
            style={{
              marginTop: 12,
            }}
          >
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