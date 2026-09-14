import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  ChoiceSettings,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const OPTIONS = [
  "Everyone",
  "Following",
  "No one",
];

const DEFAULT_VALUE = "Everyone";

export default function TagsMentionsScreen() {
  const [tags, setTags] =
    useState(DEFAULT_VALUE);

  const [mentions, setMentions] =
    useState(DEFAULT_VALUE);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingKey, setSavingKey] =
    useState(null);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data =
          await loadSettings();

        const preferences =
          data?.preferences || {};

        const savedTags =
          preferences.tagsFrom;

        const savedMentions =
          preferences.mentionsFrom;

        setTags(
          OPTIONS.includes(savedTags)
            ? savedTags
            : DEFAULT_VALUE
        );

        setMentions(
          OPTIONS.includes(
            savedMentions
          )
            ? savedMentions
            : DEFAULT_VALUE
        );
      } catch (err) {
        console.error(
          "Failed to load tags and mentions settings:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your tags and mentions settings."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);
        await load(false);
      } finally {
        setRefreshing(false);
      }
    }, [load]);

  const change = useCallback(
    async (key, value) => {
      if (!OPTIONS.includes(value)) {
        return;
      }

      const isTags =
        key === "tags";

      const previousValue = isTags
        ? tags
        : mentions;

      if (isTags) {
        setTags(value);
      } else {
        setMentions(value);
      }

      setSavingKey(key);
      setError("");

      const preferenceKey = isTags
        ? "tagsFrom"
        : "mentionsFrom";

      try {
        await saveSettings({
          [preferenceKey]: value,
        });
      } catch (err) {
        console.error(
          `Failed to save ${preferenceKey}:`,
          err
        );

        if (isTags) {
          setTags(previousValue);
        } else {
          setMentions(previousValue);
        }

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save this setting.";

        setError(message);

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setSavingKey(null);
      }
    },
    [tags, mentions]
  );

  if (loading) {
    return (
      <Page
        title="Tags & mentions"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Tags & mentions"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <InfoCard
          icon="at-outline"
          title="Tags & mentions"
          text="Control who can tag or mention you on Snapgram."
        />

        {error ? (
          <View
            style={styles.errorContainer}
          >
            <Notice
              type="error"
              title="Settings issue"
              message={error}
            />

            <PrimaryButton
              title="Reload settings"
              text="Reload settings"
              onPress={() => load()}
              disabled={Boolean(
                savingKey
              )}
            />
          </View>
        ) : null}

        <ChoiceSettings
          title="Who can tag you?"
          options={OPTIONS}
          selected={tags}
          onSelect={(value) =>
            change("tags", value)
          }
        />

        <ChoiceSettings
          title="Who can mention you?"
          options={OPTIONS}
          selected={mentions}
          onSelect={(value) =>
            change(
              "mentions",
              value
            )
          }
        />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  errorContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
});