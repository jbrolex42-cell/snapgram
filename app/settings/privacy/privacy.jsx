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
  SettingItem,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const DEFAULT_PRIVATE_ACCOUNT = false;
const DEFAULT_ACTIVITY_STATUS = true;
const DEFAULT_READ_RECEIPTS = true;

export default function PrivacyScreen() {
  const [privateAccount, setPrivateAccount] =
    useState(DEFAULT_PRIVATE_ACCOUNT);

  const [activityStatus, setActivityStatus] =
    useState(DEFAULT_ACTIVITY_STATUS);

  const [readReceipts, setReadReceipts] =
    useState(DEFAULT_READ_RECEIPTS);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingKey, setSavingKey] =
    useState(null);

  const [error, setError] =
    useState("");

  const getErrorMessage = useCallback(
    (error, fallback) => {
      return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
      );
    },
    []
  );

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

        setActivityStatus(
          typeof preferences.showActivityStatus ===
            "boolean"
            ? preferences.showActivityStatus
            : DEFAULT_ACTIVITY_STATUS
        );

        setReadReceipts(
          typeof preferences.readReceipts ===
            "boolean"
            ? preferences.readReceipts
            : DEFAULT_READ_RECEIPTS
        );
      } catch (err) {
        console.error(
          "PRIVACY SETTINGS LOAD ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load your privacy settings."
          )
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [getErrorMessage]
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

  const changeSetting =
    useCallback(
      async (key, value) => {
        const nextValue =
          Boolean(value);

        let previousValue;

        if (key === "private") {
          previousValue =
            privateAccount;

          setPrivateAccount(
            nextValue
          );
        } else if (
          key === "activity"
        ) {
          previousValue =
            activityStatus;

          setActivityStatus(
            nextValue
          );
        } else {
          previousValue =
            readReceipts;

          setReadReceipts(
            nextValue
          );
        }

        setSavingKey(key);
        setError("");

        try {
          let payload;

          if (key === "private") {
            payload = {
              isPrivate: nextValue,
            };
          } else if (
            key === "activity"
          ) {
            payload = {
              showActivityStatus:
                nextValue,
            };
          } else {
            payload = {
              readReceipts:
                nextValue,
            };
          }

          await saveSettings(
            payload
          );
        } catch (err) {
          console.error(
            `PRIVACY SETTING UPDATE ERROR [${key}]:`,
            err
          );

          if (key === "private") {
            setPrivateAccount(
              previousValue
            );
          } else if (
            key === "activity"
          ) {
            setActivityStatus(
              previousValue
            );
          } else {
            setReadReceipts(
              previousValue
            );
          }

          const message =
            getErrorMessage(
              err,
              "Unable to save this privacy setting."
            );

          setError(message);

          Alert.alert(
            "Couldn't update",
            message
          );
        } finally {
          setSavingKey(null);
        }
      },
      [
        privateAccount,
        activityStatus,
        readReceipts,
        getErrorMessage,
      ]
    );

  const openSetting =
    useCallback((path) => {
      router.push(path);
    }, []);

  if (loading) {
    return (
      <Page
        title="Privacy"
        onBack={() =>
          router.back()
        }
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Privacy"
      onBack={() =>
        router.back()
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <InfoCard
          icon="lock-closed-outline"
          title="Privacy"
          text="Control who can see your content and how people can interact with you on Snapgram."
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
              title="Privacy settings issue"
              message={error}
            />

            <PrimaryButton
              title="Reload settings"
              text="Reload settings"
              onPress={() =>
                load()
              }
              disabled={Boolean(
                savingKey
              )}
            />
          </View>
        ) : null}

        {/* =================================================
            ACCOUNT PRIVACY
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
            Account privacy
          </Text>

          <SwitchRow
            title="Private account"
            subtitle={
              privateAccount
                ? "Only people you approve can follow you and see your posts and stories."
                : "Anyone can follow you and see content that you share publicly."
            }
            value={
              privateAccount
            }
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
        </View>

        {/* =================================================
            ACTIVITY & MESSAGES
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
            Activity and messages
          </Text>

          <SwitchRow
            title="Activity status"
            subtitle={
              activityStatus
                ? "People you follow and people you message can see when you're active."
                : "Your active status is hidden from other people."
            }
            value={
              activityStatus
            }
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
            subtitle={
              readReceipts
                ? "People can see when you've read their messages."
                : "People won't see when you've read their messages."
            }
            value={
              readReceipts
            }
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

        {/* =================================================
            INTERACTIONS
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
            Interactions
          </Text>

          <SettingItem
            title="Blocked users"
            description="Review accounts you've blocked."
            icon="ban-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/blocked"
              )
            }
          />

          <SettingItem
            title="Muted accounts"
            description="Manage accounts whose content you've muted."
            icon="volume-mute-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/muted"
              )
            }
          />

          <SettingItem
            title="Restricted accounts"
            description="Manage accounts whose interactions with you are limited."
            icon="remove-circle-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/restricted"
              )
            }
          />

          <SettingItem
            title="Close friends"
            description="Choose who can see your close-friends stories and content."
            icon="people-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/close-friends"
              )
            }
          />
        </View>

        {/* =================================================
            CONTENT CONTROLS
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
            Content controls
          </Text>

          <SettingItem
            title="Hidden words"
            description="Hide comments and interactions containing words or phrases you don't want to see."
            icon="eye-off-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/hidden-words"
              )
            }
          />

          <SettingItem
            title="Tags and mentions"
            description="Control who can tag or mention you."
            icon="at-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/tags-mentions"
              )
            }
          />

          <SettingItem
            title="Comments"
            description="Control who can comment and manage unwanted comments."
            icon="chatbubble-outline"
            onPress={() =>
              openSetting(
                "/settings/privacy/comments"
              )
            }
          />
        </View>

        {/* =================================================
            PRIVACY NOTE
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
            You can change these settings
            at any time. Some privacy
            settings may affect how other
            people can interact with you.
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
    marginBottom: 4,
  },

  section: {
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  footer: {
    marginTop: 24,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    opacity: 0.45,
  },
});