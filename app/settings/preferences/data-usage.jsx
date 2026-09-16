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
  SwitchRow,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULTS = {
  dataSaver: false,
  autoplay: true,
};

export default function DataUsageScreen() {
  const [dataSaver, setDataSaver] = useState(
    DEFAULTS.dataSaver
  );

  const [autoplay, setAutoplay] = useState(
    DEFAULTS.autoplay
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  const loadDataUsage = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();

        const preferences =
          data?.preferences || {};

        setDataSaver(
          typeof preferences.dataSaver ===
            "boolean"
            ? preferences.dataSaver
            : DEFAULTS.dataSaver
        );

        setAutoplay(
          typeof preferences.autoplay ===
            "boolean"
            ? preferences.autoplay
            : DEFAULTS.autoplay
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your data usage settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDataUsage();
  }, [loadDataUsage]);

  const updateSetting = useCallback(
    async (key, value) => {
      if (savingKey) {
        return;
      }

      if (
        key !== "dataSaver" &&
        key !== "autoplay"
      ) {
        return;
      }

      const previousValue =
        key === "dataSaver"
          ? dataSaver
          : autoplay;

      const setter =
        key === "dataSaver"
          ? setDataSaver
          : setAutoplay;

      setter(value);
      setSavingKey(key);
      setError("");

      try {
        await saveSettings({
          [key]: Boolean(value),
        });
      } catch (err) {

        setter(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your data usage preference.";

        setError(message);

        Alert.alert(
          "Couldn't save",
          message
        );
      } finally {
        setSavingKey("");
      }
    },
    [
      autoplay,
      dataSaver,
      savingKey,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Data usage"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Data usage"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadDataUsage(true)
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <InfoCard
          icon="cellular-outline"
          title="Data usage"
          text="Manage how Snapgram uses mobile data and plays media."
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() =>
                loadDataUsage()
              }
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            MEDIA
          </Text>

          <View style={styles.card}>
            <SwitchRow
              title="Data saver"
              subtitle="Use less mobile data by reducing data usage for supported photos and videos."
              value={dataSaver}
              onChange={(value) =>
                updateSetting(
                  "dataSaver",
                  value
                )
              }
              disabled={
                Boolean(savingKey) &&
                savingKey !== "dataSaver"
              }
            />

            <SwitchRow
              title="Autoplay media"
              subtitle="Automatically play supported videos and media while browsing Snapgram."
              value={autoplay}
              onChange={(value) =>
                updateSetting(
                  "autoplay",
                  value
                )
              }
              disabled={
                Boolean(savingKey) &&
                savingKey !== "autoplay"
              }
            />
          </View>
        </View>

        {savingKey ? (
          <View style={styles.saving}>
            <Ionicons
              name="sync-outline"
              size={18}
              color="#0095F6"
            />

            <Text style={styles.savingText}>
              Saving your preference…
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
            Data saver reduces network usage
            where supported. Autoplay controls
            whether supported media starts
            playing automatically.
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#DBDBDB",
    overflow: "hidden",
    paddingHorizontal: 15,
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