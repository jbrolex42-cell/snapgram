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
import { Ionicons } from "@expo/vector-icons";

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

const LANGUAGE_OPTIONS = [
  "English",
  "Swahili",
];

const DEFAULT_LANGUAGE = "English";

function normalizeLanguage(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "swahili") {
    return "Swahili";
  }

  return DEFAULT_LANGUAGE;
}

export default function LanguageScreen() {
  const [language, setLanguage] = useState(
    DEFAULT_LANGUAGE
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLanguage = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();

        const storedLanguage =
          data?.preferences?.language;

        setLanguage(
          normalizeLanguage(storedLanguage)
        );
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
    },
    []
  );

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

        Alert.alert(
          "Couldn't save",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [language, saving]
  );

  if (loading) {
    return (
      <Page
        title="Language"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Language"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadLanguage(true)
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <InfoCard
          icon="language-outline"
          title="Language"
          text="Choose the language Snapgram should use where translations are supported."
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadLanguage()
              }
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            APP LANGUAGE
          </Text>

          <ChoiceSettings
            options={LANGUAGE_OPTIONS}
            selected={language}
            onSelect={chooseLanguage}
          />
        </View>

        {saving ? (
          <View style={styles.saving}>
            <Ionicons
              name="sync-outline"
              size={18}
              color="#0095F6"
            />

            <Text style={styles.savingText}>
              Saving your language preference…
            </Text>
          </View>
        ) : null}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#737373"
          />

          <Text style={styles.infoText}>
            Language changes are saved to your
            Snapgram account. Translated screens
            will use your selected language.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },

  errorContainer: {
    marginTop: 12,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    marginLeft: 4,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#737373",
    letterSpacing: 0.4,
  },

  saving: {
    minHeight: 46,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F0F8FF",
    flexDirection: "row",
    alignItems: "center",
  },

  savingText: {
    marginLeft: 9,
    color: "#262626",
    fontSize: 13,
    fontWeight: "500",
  },

  infoBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    color: "#737373",
    fontSize: 13,
    lineHeight: 19,
  },
});