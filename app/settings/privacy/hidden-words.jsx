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
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  SwitchRow,
  TextField,
  PrimaryButton,
  Notice,
  PageLoading,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULT_ENABLED = true;

function normalizeWords(value) {
  if (Array.isArray(value)) {
    return value
      .map((word) => String(word).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
  }

  return [];
}

function wordsToText(words) {
  return normalizeWords(words).join(", ");
}

export default function HiddenWordsScreen() {
  const [enabled, setEnabled] =
    useState(DEFAULT_ENABLED);

  const [words, setWords] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [toggling, setToggling] =
    useState(false);

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

        setEnabled(
          typeof preferences.hiddenWordsEnabled ===
            "boolean"
            ? preferences.hiddenWordsEnabled
            : DEFAULT_ENABLED
        );

        setWords(
          wordsToText(
            preferences.hiddenWords
          )
        );
      } catch (err) {
        console.error(
          "Failed to load hidden words settings:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load hidden words settings."
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

  const handleRefresh = useCallback(
    async () => {
      try {
        setRefreshing(true);
        await load(false);
      } finally {
        setRefreshing(false);
      }
    },
    [load]
  );

  const handleToggle = useCallback(
    async (value) => {
      const previousValue = enabled;

      setEnabled(Boolean(value));
      setToggling(true);
      setError("");

      try {
        await saveSettings({
          hiddenWordsEnabled:
            Boolean(value),
        });
      } catch (err) {
        console.error(
          "Failed to update hidden words status:",
          err
        );

        setEnabled(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to update hidden words settings.";

        setError(message);

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setToggling(false);
      }
    },
    [enabled]
  );

  const handleSave = useCallback(
    async () => {
      const normalizedWords =
        normalizeWords(words);

      const uniqueWords = [
        ...new Set(
          normalizedWords.map((word) =>
            word.toLowerCase()
          )
        ),
      ];

      if (
        uniqueWords.length >
        200
      ) {
        Alert.alert(
          "Too many words",
          "You can add up to 200 hidden words or phrases."
        );
        return;
      }

      const cleanedWords =
        normalizedWords.filter(
          (word, index) =>
            normalizedWords.findIndex(
              (existing) =>
                existing.toLowerCase() ===
                word.toLowerCase()
            ) === index
        );

      setSaving(true);
      setError("");

      try {
        await saveSettings({
          hiddenWordsEnabled: enabled,
          hiddenWords: cleanedWords,
        });

        setWords(
          wordsToText(cleanedWords)
        );

        Alert.alert(
          "Saved",
          "Your hidden words settings were updated."
        );
      } catch (err) {
        console.error(
          "Failed to save hidden words:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save hidden words settings.";

        setError(message);

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [enabled, words]
  );

  if (loading) {
    return (
      <Page
        title="Hidden words"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Hidden words"
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
          icon="eye-off-outline"
          title="Hidden words"
          text="Automatically hide comments and other interactions containing words or phrases you don't want to see."
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Notice
              type="error"
              title="Settings issue"
              message={error}
            />

            <PrimaryButton
              text="Reload settings"
              title="Reload settings"
              onPress={() => load()}
              disabled={
                loading ||
                saving ||
                toggling
              }
            />
          </View>
        ) : null}

        <SwitchRow
          title="Hide unwanted words"
          subtitle="Use your custom word list to filter unwanted comments and interactions."
          value={enabled}
          onChange={handleToggle}
          disabled={
            saving || toggling
          }
        />

        <TextField
          label="Words or phrases"
          value={words}
          onChangeText={setWords}
          placeholder="spam, scam, unwanted phrase"
          editable={!saving}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Notice>
          Separate words or phrases with commas. Matching is handled by the
          server using your saved hidden-word list.
        </Notice>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {normalizeWords(words).length}{" "}
            {normalizeWords(words).length === 1
              ? "word or phrase"
              : "words or phrases"}
          </Text>
        </View>

        <PrimaryButton
          text={
            saving
              ? "Saving..."
              : "Save changes"
          }
          title={
            saving
              ? "Saving..."
              : "Save changes"
          }
          disabled={
            saving ||
            toggling
          }
          onPress={handleSave}
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

  summary: {
    marginTop: 10,
    marginBottom: 14,
  },

  summaryText: {
    fontSize: 13,
    opacity: 0.6,
  },
});

