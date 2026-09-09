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
import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const LANGUAGE_OPTIONS = ["English", "Swahili"];
const DEFAULT_LANGUAGE = "English";

function normalizeLanguage(value) {
  if (LANGUAGE_OPTIONS.includes(value)) {
    return value;
  }

  return DEFAULT_LANGUAGE;
}

export default function LanguageScreen() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLanguage = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();

      const storedLanguage = data?.preferences?.language;

      setLanguage(normalizeLanguage(storedLanguage));
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your language settings.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const chooseLanguage = useCallback(
    async (value) => {
      if (
        !LANGUAGE_OPTIONS.includes(value) ||
        saving ||
        value === language
      ) {
        return;
      }

      const previousLanguage = language;

      setLanguage(value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          language: value,
        });
      } catch (err) {
        setLanguage(previousLanguage);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your language preference.";

        setError(message);

        Alert.alert("Unable to save", message);
      } finally {
        setSaving(false);
      }
    },
    [language, saving]
  );

  if (loading) {
    return (
      <Page title="Language" onBack={() => router.back()}>
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page title="Language" onBack={() => router.back()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLanguage(true)}
          />
        }
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <InfoCard
          icon="language-outline"
          title="Language"
          text="Choose the language Snapgram should use where translations are supported."
        />

        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadLanguage()}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <ChoiceSettings
            options={LANGUAGE_OPTIONS}
            selected={language}
            onSelect={chooseLanguage}
          />
        </View>

        {saving ? (
          <View style={{ marginTop: 12 }}>
            <Notice
              type="info"
              title="Saving"
              text="Updating your language preference…"
            />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

