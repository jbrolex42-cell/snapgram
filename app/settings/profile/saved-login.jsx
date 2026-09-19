import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import { router } from "expo-router";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

export default function SavedLoginScreen() {
  const [enabled, setEnabled] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const getSavedLoginValue = useCallback(
    (settings) => {
      const value =
        settings?.preferences
          ?.savedLoginInformation ??
        settings?.savedLoginInformation;

      return value === true;
    },
    []
  );

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const settings =
          await loadSettings();

        setEnabled(
          getSavedLoginValue(settings)
        );
      } catch (err) {
        console.error(
          "SAVED LOGIN SETTINGS ERROR:",
          err?.response?.data ||
            err?.message ||
            err
        );

        const message =
          err?.response?.data?.message ||
          "Unable to load saved login settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getSavedLoginValue]
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  const change = useCallback(
    async (value) => {
      if (saving) {
        return;
      }

      const previousValue = enabled;

      setEnabled(value);
      setSaving(true);
      setError("");

      try {
        const response =
          await saveSettings({
            savedLoginInformation:
              value,
          });

        const returnedSettings =
          response?.settings ||
          response;

        const serverValue =
          returnedSettings?.preferences
            ?.savedLoginInformation ??
          returnedSettings?.savedLoginInformation;

        if (
          typeof serverValue ===
          "boolean"
        ) {
          setEnabled(serverValue);
        } else {
          setEnabled(value);
        }
      } catch (err) {
        console.error(
          "UPDATE SAVED LOGIN ERROR:",
          err?.response?.data ||
            err?.message ||
            err
        );

        setEnabled(previousValue);

        const message =
          err?.response?.data?.message ||
          "Unable to update saved login settings.";

        setError(message);

        Alert.alert(
          "Couldn't update setting",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [enabled, saving]
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header />

        <View style={styles.loading}>
          <ActivityIndicator
            size="small"
            color="#111"
          />

          <Text style={styles.loadingText}>
            Loading saved login...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >

        <View style={styles.intro}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="phone-portrait-outline"
              size={32}
              color="#111"
            />
          </View>

          <Text style={styles.title}>
            Saved login
          </Text>

          <Text style={styles.subtitle}>
            Save your login information on this
            device so you can sign in more easily
            next time.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#c62828"
            />

            <View
              style={
                styles.errorContent
              }
            >
              <Text style={styles.errorTitle}>
                Couldn't update settings
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                onPress={() => load()}
                style={styles.retryButton}
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          Login
        </Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons
                name={
                  enabled
                    ? "checkmark-circle-outline"
                    : "close-circle-outline"
                }
                size={24}
                color={
                  enabled
                    ? "#2e7d32"
                    : "#777"
                }
              />
            </View>

            <View
              style={styles.settingContent}
            >
              <Text style={styles.settingTitle}>
                Save login information
              </Text>

              <Text
                style={
                  styles.settingSubtitle
                }
              >
                {saving
                  ? "Saving your preference..."
                  : enabled
                  ? "This device can be remembered for faster sign-in."
                  : "This device won't remember your login information."}
              </Text>
            </View>

            {saving ? (
              <ActivityIndicator
                size="small"
                color="#999"
              />
            ) : (
              <Switch
                value={enabled}
                onValueChange={change}
                disabled={saving}
                trackColor={{
                  false: "#d9d9d9",
                  true: "#111",
                }}
                thumbColor="#fff"
                ios_backgroundColor="#d9d9d9"
              />
            )}
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={
                enabled
                  ? "shield-checkmark-outline"
                  : "shield-outline"
              }
              size={24}
              color="#111"
            />
          </View>

          <View
            style={styles.statusContent}
          >
            <Text style={styles.statusTitle}>
              {enabled
                ? "Saved login is on"
                : "Saved login is off"}
            </Text>

            <Text style={styles.statusText}>
              {enabled
                ? "You can sign in more quickly on this trusted device."
                : "You'll need to enter your login details when signing in again."}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          About saved login
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="lock-closed-outline"
            title="Your password"
            text="Your password should never be displayed or shared through this setting."
          />

          <View style={styles.divider} />

          <InfoRow
            icon="phone-portrait-outline"
            title="This device"
            text="Saved login is intended for a device that you personally trust."
          />

          <View style={styles.divider} />

          <InfoRow
            icon="shield-checkmark-outline"
            title="Stay secure"
            text="Use a strong password and two-factor authentication to protect your account."
          />
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Ionicons
              name="warning-outline"
              size={21}
              color="#b45309"
            />
          </View>

          <View
            style={styles.warningContent}
          >
            <Text style={styles.warningTitle}>
              Using a shared device?
            </Text>

            <Text style={styles.warningText}>
              Turn saved login off if this is a
              public, borrowed, work, or shared
              device.
            </Text>

            {enabled ? (
              <Pressable
                onPress={() => change(false)}
                disabled={saving}
                style={
                  styles.warningButton
                }
              >
                <Text
                  style={
                    styles.warningButtonText
                  }
                >
                  Turn off saved login
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push(
              "/settings/profile/login-activity"
            )
          }
          style={styles.securityLink}
        >
          <View
            style={styles.securityLinkIcon}
          >
            <Ionicons
              name="shield-outline"
              size={21}
              color="#111"
            />
          </View>

          <View
            style={styles.securityLinkContent}
          >
            <Text
              style={
                styles.securityLinkTitle
              }
            >
              Review login activity
            </Text>

            <Text
              style={
                styles.securityLinkSubtitle
              }
            >
              Check which devices have accessed
              your account.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </Pressable>

        <Text style={styles.footer}>
          Snapgram security settings
        </Text>
      </ScrollView>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={8}
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color="#111"
        />
      </Pressable>

      <Text style={styles.headerTitle}>
        Saved login
      </Text>

      <View style={styles.headerSpacer} />
    </View>
  );
}

function InfoRow({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#111"
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>
          {title}
        </Text>

        <Text style={styles.infoText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  headerSpacer: {
    width: 44,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 45,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#777",
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 28,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 14,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  errorBox: {
    marginBottom: 22,
    padding: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff1f0",
  },

  errorContent: {
    flex: 1,
    marginLeft: 9,
  },

  errorTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#c62828",
  },

  errorText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#c62828",
  },

  retryButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },

  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c62828",
  },

  sectionTitle: {
    marginBottom: 9,
    marginLeft: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  card: {
    marginBottom: 22,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  settingRow: {
    minHeight: 82,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  settingContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },

  settingTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#111",
  },

  settingSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  statusCard: {
    marginBottom: 25,
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  statusText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  infoCard: {
    marginBottom: 24,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },

  infoRow: {
    minHeight: 82,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  infoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
    backgroundColor: "#e5e5e5",
  },

  warningCard: {
    marginBottom: 22,
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff7ed",
  },

  warningIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffedd5",
  },

  warningContent: {
    flex: 1,
    marginLeft: 10,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },

  warningText: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#a16207",
  },

  warningButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },

  warningButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },

  securityLink: {
    minHeight: 72,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },

  securityLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  securityLinkContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  securityLinkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  securityLinkSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  footer: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11.5,
    color: "#aaa",
  },
});