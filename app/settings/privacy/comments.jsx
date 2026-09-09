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
  SwitchRow,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const COMMENTING_OPTIONS = [
  "Everyone",
  "Following",
  "No one",
];

export default function CommentsScreen() {
  const [who, setWho] = useState("Everyone");
  const [filter, setFilter] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();
        const preferences =
          data?.preferences || {};

        const commentingFrom =
          preferences.commentingFrom;

        const commentFilterEnabled =
          preferences.commentFilterEnabled;

        setWho(
          COMMENTING_OPTIONS.includes(
            commentingFrom
          )
            ? commentingFrom
            : "Everyone"
        );

        setFilter(
          typeof commentFilterEnabled ===
            "boolean"
            ? commentFilterEnabled
            : true
        );
      } catch (err) {
        console.error(
          "Failed to load comment settings:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your comment settings."
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

  const updateSetting = useCallback(
    async (key, value) => {
      const previousWho = who;
      const previousFilter = filter;

      if (key === "commentingFrom") {
        setWho(value);
      } else if (
        key === "commentFilterEnabled"
      ) {
        setFilter(value);
      }

      setSaving(true);
      setError("");

      try {
        await saveSettings({
          [key]: value,
        });
      } catch (err) {
        console.error(
          `Failed to save ${key}:`,
          err
        );

        if (key === "commentingFrom") {
          setWho(previousWho);
        } else if (
          key === "commentFilterEnabled"
        ) {
          setFilter(previousFilter);
        }

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Your setting could not be saved.";

        setError(message);

        Alert.alert(
          "Couldn't save setting",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [who, filter]
  );

  const handleWhoChange = useCallback(
    (value) => {
      if (!COMMENTING_OPTIONS.includes(value)) {
        return;
      }

      updateSetting(
        "commentingFrom",
        value
      );
    },
    [updateSetting]
  );

  const handleFilterChange = useCallback(
    (value) => {
      updateSetting(
        "commentFilterEnabled",
        Boolean(value)
      );
    },
    [updateSetting]
  );

  if (loading) {
    return (
      <Page
        title="Comments controls"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Comments controls"
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
          icon="chatbubble-outline"
          title="Comments controls"
          text="Control who can comment on your content and reduce unwanted comments."
        />

        {error ? (
          <View style={styles.noticeContainer}>
            <Notice
              type="error"
              title="Settings issue"
              message={error}
            />

            <PrimaryButton
              title="Reload settings"
              onPress={() => load()}
              disabled={saving}
            />
          </View>
        ) : null}

        <ChoiceSettings
          title="Who can comment?"
          options={COMMENTING_OPTIONS}
          selected={who}
          onSelect={handleWhoChange}
        />

        <SwitchRow
          title="Filter unwanted comments"
          subtitle="Automatically filter potentially unwanted comments from appearing publicly."
          value={filter}
          onChange={handleFilterChange}
        />

        {saving ? (
          <Text style={styles.saving}>
            Saving changes...
          </Text>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  noticeContainer: {
    marginTop: 12,
    marginBottom: 8,
  },

  saving: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.6,
  },
});

