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
  SettingItem,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULT_ACTIVITY_STATUS = true;
const DEFAULT_READ_RECEIPTS = true;
const DEFAULT_PRIVATE_ACCOUNT = false;

export default function PrivacyScreen() {
  const [privateAccount, setPrivateAccount] =
    useState(DEFAULT_PRIVATE_ACCOUNT);

  const [activity, setActivity] = useState(
    DEFAULT_ACTIVITY_STATUS
  );

  const [receipts, setReceipts] = useState(
    DEFAULT_READ_RECEIPTS
  );

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

        setPrivateAccount(
          typeof data?.isPrivate ===
            "boolean"
            ? data.isPrivate
            : DEFAULT_PRIVATE_ACCOUNT
        );

        setActivity(
          typeof preferences.showActivityStatus ===
            "boolean"
            ? preferences.showActivityStatus
            : DEFAULT_ACTIVITY_STATUS
        );

        setReceipts(
          typeof preferences.readReceipts ===
            "boolean"
            ? preferences.readReceipts
            : DEFAULT_READ_RECEIPTS
        );
      } catch (err) {
        console.error(
          "Failed to load privacy settings:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your privacy settings."
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

  const changeSetting = useCallback(
    async (key, value) => {
      const nextValue = Boolean(value);

      let previousValue;

      if (key === "private") {
        previousValue = privateAccount;
        setPrivateAccount(nextValue);
      } else if (key === "activity") {
        previousValue = activity;
        setActivity(nextValue);
      } else {
        previousValue = receipts;
        setReceipts(nextValue);
      }

      setSavingKey(key);
      setError("");

      try {
        let payload;

        if (key === "private") {
          payload = {
            isPrivate: nextValue,
          };
        } else if (key === "activity") {
          payload = {
            showActivityStatus:
              nextValue,
          };
        } else {
          payload = {
            readReceipts: nextValue,
          };
        }

        await saveSettings(payload);
      } catch (err) {
        console.error(
          `Failed to save privacy setting ${key}:`,
          err
        );

        if (key === "private") {
          setPrivateAccount(previousValue);
        } else if (key === "activity") {
          setActivity(previousValue);
        } else {
          setReceipts(previousValue);
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
    [
      privateAccount,
      activity,
      receipts,
    ]
  );

  const openSetting = useCallback(
    (path) => {
      router.push(path);
    },
    []
  );

  if (loading) {
    return (
      <Page
        title="Privacy"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Privacy"
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
          icon="lock-closed-outline"
          title="Privacy"
          text="Control who can see your content and how people interact with you."
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Notice
              type="error"
              title="Privacy settings issue"
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

        <View style={styles.section}>
          <SwitchRow
            title="Private account"
            subtitle="Only followers you approve can see your posts and stories."
            value={privateAccount}
            onChange={(value) =>
              changeSetting(
                "private",
                value
              )
            }
            disabled={Boolean(
              savingKey
            )}
          />

          <SwitchRow
            title="Activity status"
            subtitle="Let people see when you are active."
            value={activity}
            onChange={(value) =>
              changeSetting(
                "activity",
                value
              )
            }
            disabled={Boolean(
              savingKey
            )}
          />

          <SwitchRow
            title="Read receipts"
            subtitle="Show when you have read messages."
            value={receipts}
            onChange={(value) =>
              changeSetting(
                "receipts",
                value
              )
            }
            disabled={Boolean(
              savingKey
            )}
          />
        </View>

        <View style={styles.section}>
          <SettingItem
            title="Blocked users"
            description="Manage accounts you have blocked."
            icon="ban-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/blocked"
              )
            }
          />

          <SettingItem
            title="Muted accounts"
            description="Manage accounts whose content you have muted."
            icon="volume-mute-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/muted"
              )
            }
          />

          <SettingItem
            title="Restricted accounts"
            description="Manage accounts with limited interaction access."
            icon="remove-circle-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/restricted"
              )
            }
          />

          <SettingItem
            title="Close friends"
            description="Choose who can see your close-friends content."
            icon="people-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/close-friends"
              )
            }
          />

          <SettingItem
            title="Hidden words"
            description="Filter unwanted words and phrases."
            icon="eye-off-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/hidden-words"
              )
            }
          />

          <SettingItem
            title="Tags & mentions"
            description="Control who can tag or mention you."
            icon="at-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/tags-mentions"
              )
            }
          />

          <SettingItem
            title="Comments controls"
            description="Control who can comment and filter unwanted comments."
            icon="chatbubble-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/comments"
              )
            }
          />
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  section: {
    marginTop: 12,
  },

  errorContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
});

