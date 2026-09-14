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
  animations: true,
  reduceMotion: false,
};

export default function MotionScreen() {
  const [animations, setAnimations] = useState(
    DEFAULTS.animations
  );

  const [reduceMotion, setReduceMotion] = useState(
    DEFAULTS.reduceMotion
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMotionSettings = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();
        const settings = data?.preferences?.motion || {};

        setAnimations(
          typeof settings.animations === "boolean"
            ? settings.animations
            : DEFAULTS.animations
        );

        setReduceMotion(
          typeof settings.reduceMotion === "boolean"
            ? settings.reduceMotion
            : DEFAULTS.reduceMotion
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your motion settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMotionSettings();
  }, [loadMotionSettings]);

  const updateMotionSetting = useCallback(
    async (key, value) => {
      if (saving) {
        return;
      }

      if (
        key !== "animations" &&
        key !== "reduceMotion"
      ) {
        return;
      }

      if (typeof value !== "boolean") {
        return;
      }

      const isAnimations = key === "animations";

      const previousValue = isAnimations
        ? animations
        : reduceMotion;

      const setter = isAnimations
        ? setAnimations
        : setReduceMotion;

      setter(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          motion: {
            [key]: value,
          },
        });
      } catch (err) {
        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your motion preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [animations, reduceMotion, saving]
  );

  if (loading) {
    return (
      <Page title="Motion" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Motion" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMotionSettings(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="flash-outline"
          title="Motion"
          text="Control interface animations and reduce non-essential motion effects."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadMotionSettings()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <SwitchRow
            title="Animations"
            subtitle="Enable interface animations and transitions throughout Snapgram."
            value={animations}
            onChange={(value) =>
              updateMotionSetting("animations", value)
            }
          />

          <SwitchRow
            title="Reduce motion"
            subtitle="Reduce non-essential motion effects and transitions."
            value={reduceMotion}
            onChange={(value) =>
              updateMotionSetting(
                "reduceMotion",
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
              text="Updating your motion preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}