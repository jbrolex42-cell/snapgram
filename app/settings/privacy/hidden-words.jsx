import React, {
  useCallback,
  useEffect,
  useMemo,
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
const MAX_WORDS = 200;
const MAX_WORD_LENGTH = 100;

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

function cleanUniqueWords(value) {
  const words = normalizeWords(value);
  const seen = new Set();
  const result = [];

  for (const word of words) {
    const cleaned = word
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      continue;
    }

    if (cleaned.length > MAX_WORD_LENGTH) {
      continue;
    }

    const key = cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);
  }

  return result.slice(0, MAX_WORDS);
}

function wordsToText(words) {
  return cleanUniqueWords(words).join(", ");
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function HiddenWordsScreen() {
  const [enabled, setEnabled] =
    useState(DEFAULT_ENABLED);

  const [words, setWords] =
    useState("");

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

  const wordCount = useMemo(() => {
    return cleanUniqueWords(words).length;
  }, [words]);

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
            preferences.hiddenWords || []
          )
        );
      } catch (err) {
        console.error(
          "HIDDEN WORDS LOAD ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load hidden words settings."
          )
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

  const handleToggle =
    useCallback(
      async (value) => {
        const nextValue =
          Boolean(value);

        const previousValue =
          enabled;

        setEnabled(nextValue);
        setToggling(true);
        setError("");

        try {
          await saveSettings({
            hiddenWordsEnabled:
              nextValue,
          });
        } catch (err) {
          console.error(
            "HIDDEN WORDS TOGGLE ERROR:",
            err
          );

          setEnabled(previousValue);

          const message =
            getErrorMessage(
              err,
              "Unable to update hidden words settings."
            );

          setError(message);

          Alert.alert(
            "Couldn't update",
            message
          );
        } finally {
          setToggling(false);
        }
      },
      [enabled]
    );

  const handleSave =
    useCallback(async () => {
      const cleanedWords =
        cleanUniqueWords(words);

      const rawWords =
        normalizeWords(words);

      const uniqueRawWords =
        new Set(
          rawWords.map((word) =>
            word
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase()
          )
        );

      if (
        uniqueRawWords.size >
        MAX_WORDS
      ) {
        Alert.alert(
          "Too many words",
          `You can add up to ${MAX_WORDS} hidden words or phrases.`
        );

        return;
      }

      const tooLong =
        rawWords.find(
          (word) =>
            String(word).trim().length >
            MAX_WORD_LENGTH
        );

      if (tooLong) {
        Alert.alert(
          "Word or phrase too long",
          `Each hidden word or phrase can contain up to ${MAX_WORD_LENGTH} characters.`
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        await saveSettings({
          hiddenWordsEnabled:
            enabled,

          hiddenWords:
            cleanedWords,
        });

        setWords(
          wordsToText(cleanedWords)
        );

        Alert.alert(
          "Saved",
          "Your hidden words settings have been updated."
        );
      } catch (err) {
        console.error(
          "HIDDEN WORDS SAVE ERROR:",
          err
        );

        const message =
          getErrorMessage(
            err,
            "Unable to save hidden words settings."
          );

        setError(message);

        Alert.alert(
          "Couldn't save",
          message
        );
      } finally {
        setSaving(false);
      }
    }, [enabled, words]);

  const handleClear =
    useCallback(() => {
      if (!words.trim()) {
        return;
      }

      Alert.alert(
        "Clear hidden words?",
        "This will remove all words and phrases from your hidden-word list.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => {
              setWords("");
            },
          },
        ]
      );
    }, [words]);

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
        keyboardShouldPersistTaps="handled"
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
        {/* =================================================
            INTRO
        ================================================= */}

        <InfoCard
          icon="eye-off-outline"
          title="Hidden words"
          text="Hide comments and message requests that contain words, phrases or emojis you don't want to see."
        />

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <View
            style={
              styles.errorContainer
            }
          >
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

        {/* =================================================
            MAIN TOGGLE
        ================================================= */}

        <SwitchRow
          title="Hide unwanted words"
          subtitle={
            enabled
              ? "Comments and interactions containing your hidden words will be filtered."
              : "Hidden words filtering is currently turned off."
          }
          value={enabled}
          onChange={handleToggle}
          disabled={
            saving ||
            toggling
          }
        />

        {/* =================================================
            WORD LIST
        ================================================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Custom words and phrases
          </Text>

          <Text
            style={
              styles.sectionDescription
            }
          >
            Add words, phrases or emojis
            separated by commas.
          </Text>
        </View>

        <TextField
          label="Words or phrases"
          value={words}
          onChangeText={setWords}
          placeholder="spam, scam, unwanted phrase"
          editable={!saving}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        {/* =================================================
            WORD COUNT
        ================================================= */}

        <View
          style={
            styles.countRow
          }
        >
          <Text
            style={
              styles.countText
            }
          >
            {wordCount}{" "}
            {wordCount === 1
              ? "word or phrase"
              : "words or phrases"}
          </Text>

          {words.trim() ? (
            <Text
              style={
                styles.limitText
              }
            >
              {MAX_WORDS} max
            </Text>
          ) : null}
        </View>

        {/* =================================================
            INFO
        ================================================= */}

        <Notice>
          Separate each word or phrase with
          commas. Matching is case-insensitive.
          Your hidden-word list is saved to
          your Snapgram account.
        </Notice>

        {/* =================================================
            CLEAR BUTTON
        ================================================= */}

        {words.trim() ? (
          <View
            style={
              styles.clearContainer
            }
          >
            <PrimaryButton
              text="Clear all"
              title="Clear all"
              onPress={handleClear}
              disabled={
                saving ||
                toggling
              }
            />
          </View>
        ) : null}

        {/* =================================================
            SAVE
        ================================================= */}

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

        {/* =================================================
            FOOTER INFO
        ================================================= */}

        <View
          style={
            styles.footer
          }
        >
          <Text
            style={
              styles.footerText
            }
          >
            Hidden words are applied to
            interactions using your account
            settings.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  errorContainer: {
    marginTop: 12,
    marginBottom: 8,
  },

  section: {
    marginTop: 22,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.6,
  },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },

  countText: {
    fontSize: 13,
    opacity: 0.6,
  },

  limitText: {
    fontSize: 12,
    opacity: 0.45,
  },

  clearContainer: {
    marginBottom: 10,
  },

  footer: {
    marginTop: 20,
    paddingHorizontal: 8,
  },

  footerText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.45,
  },
});