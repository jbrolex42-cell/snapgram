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
  InfoCard,
  Notice,
  Page,
  PageLoading,
  SettingItem,
  SwitchRow,
} from "../../../components/settings/SettingsUI";
import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to update two-factor authentication."
  );
}

export default function TwoFactorScreen() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loadSettings();

      setEnabled(Boolean(data?.preferences?.twoFactorEnabled));
    } catch (requestError) {
      console.error(
        "TWO FACTOR SETTINGS ERROR:",
        requestError?.response?.data ||
          requestError?.message ||
          requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load your two-factor authentication settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeTwoFactor(value) {
    if (updating || value === enabled) {
      return;
    }

    const previousValue = enabled;

    setEnabled(value);
    setUpdating(true);
    setError("");

    try {
      const result = await saveSettings({
        twoFactorEnabled: value,
      });

      const serverValue =
        result?.settings?.preferences?.twoFactorEnabled ??
        result?.preferences?.twoFactorEnabled ??
        result?.twoFactorEnabled;

      if (typeof serverValue === "boolean") {
        setEnabled(serverValue);
      }
    } catch (requestError) {
      console.error(
        "TWO FACTOR UPDATE ERROR:",
        requestError?.response?.data ||
          requestError?.message ||
          requestError
      );

      setEnabled(previousValue);

      const message = getErrorMessage(requestError);

      setError(message);

      Alert.alert("Update failed", message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <Page
        title="Two-factor authentication"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Two-factor authentication"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
        contentContainerStyle={styles.content}
      >
        {error ? (
          <Notice tone="error">
            {error}
          </Notice>
        ) : null}

        <InfoCard
          icon="shield-checkmark-outline"
          title="Two-factor authentication"
          text="Protect your Snapgram account with an additional verification step when signing in."
        />

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIndicator,
              enabled
                ? styles.statusEnabled
                : styles.statusDisabled,
            ]}
          />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {enabled
                ? "Two-factor authentication is on"
                : "Two-factor authentication is off"}
            </Text>

            <Text style={styles.statusSubtitle}>
              {enabled
                ? "Your account has an additional sign-in protection setting enabled."
                : "Turn this on to add another layer of protection to your account."}
            </Text>
          </View>
        </View>

        <SwitchRow
          title="Two-factor authentication"
          subtitle={
            updating
              ? "Updating your security settings..."
              : "Require additional verification during login."
          }
          value={enabled}
          onChange={changeTwoFactor}
        />

        {enabled ? (
          <>
            <SettingItem
              title="Authentication security"
              subtitle="Two-factor authentication is currently enabled for your account."
            />

            <Notice tone="success">
              Your account security setting is enabled. Additional
              verification may be required when you sign in.
            </Notice>
          </>
        ) : (
          <Notice>
            Two-factor authentication is currently disabled. You can turn it
            on at any time to strengthen your account security.
          </Notice>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            Keep your account secure
          </Text>

          <Text style={styles.infoText}>
            Use a strong password and keep your account recovery information
            up to date. Never share verification codes with anyone.
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

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#f5f7fa",
  },

  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusEnabled: {
    backgroundColor: "#22c55e",
  },

  statusDisabled: {
    backgroundColor: "#9ca3af",
  },

  statusContent: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  statusSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.62,
  },

  infoSection: {
    marginTop: 24,
    paddingHorizontal: 4,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  infoText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.6,
  },
});

