import React, { useCallback, useEffect, useState } from "react";
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
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

export default function SavedLoginScreen() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const settings = await loadSettings();

      const savedLogin =
        settings?.preferences?.savedLoginInformation ??
        settings?.savedLoginInformation;

      setEnabled(savedLogin === true);
    } catch (err) {
      console.error(
        "SAVED LOGIN SETTINGS ERROR:",
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load saved login settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  async function change(value) {
    if (saving) {
      return;
    }

    const previousValue = enabled;

    setEnabled(value);
    setSaving(true);
    setError("");

    try {
      const response = await saveSettings({
        savedLoginInformation: value,
      });

      const returnedSettings =
        response?.settings || response;

      const serverValue =
        returnedSettings?.preferences?.savedLoginInformation ??
        returnedSettings?.savedLoginInformation;

      if (typeof serverValue === "boolean") {
        setEnabled(serverValue);
      }
    } catch (err) {
      console.error(
        "UPDATE SAVED LOGIN ERROR:",
        err?.response?.data || err?.message || err
      );

      setEnabled(previousValue);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update saved login information.";

      setError(message);

      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Page
        title="Saved login"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Saved login"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.content}
      >
        <InfoCard
          icon="save-outline"
          title="Saved login"
          text="Choose whether Snapgram should remember this device for easier sign-in."
        />

        {error ? (
          <Notice tone="error">
            {error}
          </Notice>
        ) : null}

        <View style={styles.settingCard}>
          <SwitchRow
            title="Save login information"
            subtitle={
              saving
                ? "Saving your preference..."
                : "Keep this device available for faster sign-in."
            }
            value={enabled}
            onChange={change}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Your password is not stored here
          </Text>

          <Text style={styles.infoText}>
            This setting controls whether the device can be remembered for
            easier sign-in. Your password and authentication credentials
            should remain protected by Snapgram's authentication and secure
            device-storage systems.
          </Text>
        </View>

        <Notice>
          Turn this off if you are using a shared, public, or borrowed device.
        </Notice>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  settingCard: {
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
  },

  infoBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 7,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
});

