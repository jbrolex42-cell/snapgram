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
  SwitchRow,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  getSettings,
  updateSettings,
} from "../../../services/settingsApi";

const DEFAULTS = {
  animations: true,
  reduceMotion: false,
};

export default function MotionScreen() {
  const [animations, setAnimations] =
    useState(DEFAULTS.animations);

  const [reduceMotion, setReduceMotion] =
    useState(DEFAULTS.reduceMotion);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadMotionSettings = useCallback(
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

        setAnimations(
          typeof preferences.animations ===
            "boolean"
            ? preferences.animations
            : DEFAULTS.animations
        );

        setReduceMotion(
          typeof preferences.reduceMotion ===
            "boolean"
            ? preferences.reduceMotion
            : DEFAULTS.reduceMotion
        );
      } catch (err) {
        console.error(
          "MOTION SETTINGS LOAD ERROR:",
          err
        );

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

  const updateMotionSetting =
    useCallback(
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

        const previousValue =
          key === "animations"
            ? animations
            : reduceMotion;

        if (key === "animations") {
          setAnimations(value);
        } else {
          setReduceMotion(value);
        }

        setSaving(true);
        setError("");

        try {
          await updateSettings({
            [key]: value,
          });
        } catch (err) {
          console.error(
            "MOTION SETTINGS SAVE ERROR:",
            err
          );

          if (key === "animations") {
            setAnimations(previousValue);
          } else {
            setReduceMotion(previousValue);
          }

          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Unable to save your motion preference.";

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
        animations,
        reduceMotion,
        saving,
      ]
    );

  if (loading) {
    return (
      <Page
        title="Motion"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Motion"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadMotionSettings(true)
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <InfoCard
          icon="flash-outline"
          title="Motion"
          text="Choose how much movement and animation you want to see while using Snapgram."
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
                loadMotionSettings()
              }
            />
          </View>
        ) : null}

        <View
          style={{
            marginTop: 12,
          }}
        >
          <SwitchRow
            title="Animations"
            subtitle="Show interface animations and transitions throughout Snapgram."
            value={animations}
            onChange={(value) =>
              updateMotionSetting(
                "animations",
                value
              )
            }
          />

          <SwitchRow
            title="Reduce motion"
            subtitle="Reduce non-essential animations and movement throughout Snapgram."
            value={reduceMotion}
            onChange={(value) =>
              updateMotionSetting(
                "reduceMotion",
                value
              )
            }
          />
        </View>

        {reduceMotion ? (
          <View
            style={{
              marginTop: 12,
            }}
          >
            <InfoCard
              icon="accessibility-outline"
              title="Reduced motion is on"
              text="Snapgram will reduce non-essential movement where supported. Some animations may still appear when they are important for navigation or feedback."
            />
          </View>
        ) : null}

        {saving ? (
          <View
            style={{
              marginTop: 12,
            }}
          >
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