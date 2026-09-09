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
  SwitchRow,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULT_REDUCE_TRANSPARENCY = false;
const DEFAULT_SCREEN_READER = false;

export default function AccessibilityScreen() {
  const [reduceTransparency, setReduceTransparency] =
    useState(DEFAULT_REDUCE_TRANSPARENCY);

  const [screenReaderOptimizations, setScreenReaderOptimizations] =
    useState(DEFAULT_SCREEN_READER);

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

        const accessibility =
          data?.preferences?.accessibility ||
          {};

        setReduceTransparency(
          typeof accessibility.reduceTransparency ===
            "boolean"
            ? accessibility.reduceTransparency
            : DEFAULT_REDUCE_TRANSPARENCY
        );

        setScreenReaderOptimizations(
          typeof accessibility.screenReaderOptimizations ===
            "boolean"
            ? accessibility.screenReaderOptimizations
            : DEFAULT_SCREEN_READER
        );
      } catch (err) {
        console.error(
          "Failed to load accessibility settings:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your accessibility settings."
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

  const changeSetting = useCallback(
    async (key, value) => {
      const nextValue = Boolean(value);

      let previousValue;

      if (key === "reduceTransparency") {
        previousValue =
          reduceTransparency;

        setReduceTransparency(
          nextValue
        );
      } else {
        previousValue =
          screenReaderOptimizations;

        setScreenReaderOptimizations(
          nextValue
        );
      }

      setSavingKey(key);
      setError("");

      try {
        await saveSettings({
          accessibility: {
            [key]: nextValue,
          },
        });
      } catch (err) {
        console.error(
          `Failed to save accessibility setting ${key}:`,
          err
        );

        if (
          key ===
          "reduceTransparency"
        ) {
          setReduceTransparency(
            previousValue
          );
        } else {
          setScreenReaderOptimizations(
            previousValue
          );
        }

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save this accessibility setting.";

        setError(message);

        Alert.alert(
          "Update failed",
          message
        );
      } finally {
        setSavingKey(null);
      }
    },
    [
      reduceTransparency,
      screenReaderOptimizations,
    ]
  );

  if (loading) {
    return (
      <Page
        title="Accessibility"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Accessibility"
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
          icon="accessibility-outline"
          title="Accessibility"
          text="Adjust Snapgram to make supported features easier to use and more accessible."
        />

        {error ? (
          <View
            style={styles.errorContainer}
          >
            <Notice
              type="error"
              title="Accessibility settings issue"
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

        <SwitchRow
          title="Reduce transparency"
          subtitle="Reduce translucent interface elements to improve visibility and readability."
          value={reduceTransparency}
          onChange={(value) =>
            changeSetting(
              "reduceTransparency",
              value
            )
          }
          disabled={Boolean(
            savingKey
          )}
        />

        <SwitchRow
          title="Screen reader optimizations"
          subtitle="Optimize supported Snapgram interfaces for screen readers and assistive technologies."
          value={
            screenReaderOptimizations
          }
          onChange={(value) =>
            changeSetting(
              "screenReaderOptimizations",
              value
            )
          }
          disabled={Boolean(
            savingKey
          )}
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

