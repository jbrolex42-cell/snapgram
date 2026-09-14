import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  ChoiceSettings,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";
import { loadSettings, saveSettings } from "../../../services/settingsApi";

const OPTIONS = ["System", "Light", "Dark"];

function normalizeAppearance(value) {
  switch (String(value || "").toLowerCase()) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    default:
      return "System";
  }
}

function toApiValue(value) {
  return String(value || "System").toLowerCase();
}

export default function AppearanceScreen() {
  const [selected, setSelected] = useState("System");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAppearance = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();

      const appearance = normalizeAppearance(
        data?.preferences?.appearance
      );

      setSelected(appearance);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load appearance settings.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppearance();
  }, [loadAppearance]);

  const chooseAppearance = useCallback(
    async (value) => {
      if (!OPTIONS.includes(value) || saving || value === selected) {
        return;
      }

      const previousValue = selected;

      setSelected(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          appearance: toApiValue(value),
        });
      } catch (err) {
        setSelected(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your appearance preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [saving, selected]
  );

  if (loading) {
    return (
      <Page title="Appearance" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Appearance" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAppearance(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="contrast-outline"
          title="Appearance"
          text="Choose how Snapgram looks on this device."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadAppearance()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <ChoiceSettings
            options={OPTIONS}
            selected={selected}
            onSelect={chooseAppearance}
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your appearance preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}