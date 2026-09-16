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
  const [tags, setTags] = useState(DEFAULT_VALUE);

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

        const tagsAndMentions =
          data?.preferences
            ?.tagsAndMentions || {};

        const savedTags =
          tagsAndMentions.tags;

        const savedMentions =
          tagsAndMentions.mentions;

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
          "TAGS & MENTIONS LOAD ERROR:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your tags and mentions settings.";

        setError(message);
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

      try {

        await saveSettings({
          tagsAndMentions: {
            [isTags
              ? "tags"
              : "mentions"]: value,
          },
        });
      } catch (err) {
        console.error(
          `TAGS & MENTIONS SAVE ERROR (${key}):`,
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
        {/* =================================================
            INTRO
        ================================================= */}

        <InfoCard
          icon="at-outline"
          title="Tags & mentions"
          text="Control who can tag or mention you on Snapgram."
        />

        {/* =================================================
            ERROR
        ================================================= */}

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

        {/* =================================================
            TAG SETTINGS
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tags
          </Text>

          <Text style={styles.sectionDescription}>
            Choose who can tag you in photos
            and videos.
          </Text>

          <ChoiceSettings
            title="Who can tag you?"
            options={OPTIONS}
            selected={tags}
            onSelect={(value) =>
              change("tags", value)
            }
          />

          {savingKey === "tags" ? (
            <Text style={styles.savingText}>
              Saving...
            </Text>
          ) : null}
        </View>

        {/* =================================================
            MENTION SETTINGS
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mentions
          </Text>

          <Text style={styles.sectionDescription}>
            Choose who can mention you in
            captions, comments, and stories.
          </Text>

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

          {savingKey === "mentions" ? (
            <Text style={styles.savingText}>
              Saving...
            </Text>
          ) : null}
        </View>

        {/* =================================================
            INFORMATION
        ================================================= */}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            About tags and mentions
          </Text>

          <Text style={styles.infoText}>
            Everyone allows any Snapgram
            account to tag or mention you.
            Following limits this to accounts
            you follow. No one prevents new
            tags and mentions from other
            accounts.
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
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    marginBottom: 10,
    paddingRight: 12,
  },

  savingText: {
    fontSize: 12,
    color: "#737373",
    marginTop: 6,
    marginLeft: 2,
  },

  infoBox: {
    marginTop: 28,
    marginHorizontal: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },
});