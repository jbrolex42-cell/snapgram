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

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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

function getTwoFactorValue(settings) {
  return Boolean(
    settings?.preferences?.twoFactorEnabled ??
      settings?.twoFactorEnabled
  );
}

export default function TwoFactorScreen() {
  const [enabled, setEnabled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

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
          getTwoFactorValue(settings)
        );
      } catch (requestError) {
        console.error(
          "TWO FACTOR SETTINGS ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const changeTwoFactor = useCallback(
    async (value) => {
      if (
        updating ||
        value === enabled
      ) {
        return;
      }

      const previousValue = enabled;

      setError("");
      setEnabled(value);
      setUpdating(true);

      try {
        const result =
          await saveSettings({
            twoFactorEnabled: value,
          });

        const returnedSettings =
          result?.settings ||
          result;

        const serverValue =
          returnedSettings?.preferences
            ?.twoFactorEnabled ??
          returnedSettings?.twoFactorEnabled;

        if (
          typeof serverValue ===
          "boolean"
        ) {
          setEnabled(serverValue);
        } else {
          setEnabled(value);
        }
      } catch (requestError) {
        console.error(
          "TWO FACTOR UPDATE ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        setEnabled(previousValue);

        const message =
          getErrorMessage(requestError);

        setError(message);

        Alert.alert(
          "Couldn't update setting",
          message
        );
      } finally {
        setUpdating(false);
      }
    },
    [enabled, updating]
  );

  const handleToggle = useCallback(
    (value) => {
      if (updating) {
        return;
      }

      if (value) {
        Alert.alert(
          "Turn on two-factor authentication?",
          "This will save two-factor authentication as enabled for your account.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Turn on",
              onPress: () =>
                changeTwoFactor(true),
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Turn off two-factor authentication?",
        "Turning this off reduces the protection on your account.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Turn off",
            style: "destructive",
            onPress: () =>
              changeTwoFactor(false),
          },
        ]
      );
    },
    [changeTwoFactor, updating]
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
            Loading security settings...
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
            onRefresh={() => load(true)}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* Header */}

        <View style={styles.intro}>
          <View
            style={[
              styles.iconCircle,
              enabled &&
                styles.iconCircleEnabled,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={34}
              color={
                enabled
                  ? "#2e7d32"
                  : "#111"
              }
            />
          </View>

          <Text style={styles.title}>
            Two-factor authentication
          </Text>

          <Text style={styles.subtitle}>
            Add an extra layer of protection
            to your Snapgram account when
            signing in.
          </Text>
        </View>

        {/* Error */}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#c62828"
            />

            <View
              style={styles.errorContent}
            >
              <Text style={styles.errorTitle}>
                Security setting couldn't
                be updated
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                onPress={() => load()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Main setting */}

        <Text style={styles.sectionTitle}>
          Security
        </Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIcon,
                enabled &&
                  styles.settingIconEnabled,
              ]}
            >
              <Ionicons
                name={
                  enabled
                    ? "lock-closed"
                    : "lock-open-outline"
                }
                size={21}
                color={
                  enabled
                    ? "#2e7d32"
                    : "#111"
                }
              />
            </View>

            <View
              style={styles.settingContent}
            >
              <Text style={styles.settingTitle}>
                Two-factor authentication
              </Text>

              <Text
                style={
                  styles.settingSubtitle
                }
              >
                {updating
                  ? "Updating your security setting..."
                  : enabled
                  ? "Additional sign-in protection is enabled."
                  : "Add another security step when signing in."}
              </Text>
            </View>

            {updating ? (
              <ActivityIndicator
                size="small"
                color="#999"
              />
            ) : (
              <Switch
                value={enabled}
                onValueChange={
                  handleToggle
                }
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

        {/* Current status */}

        <View
          style={[
            styles.statusCard,
            enabled &&
              styles.statusCardEnabled,
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              enabled &&
                styles.statusIconEnabled,
            ]}
          >
            <Ionicons
              name={
                enabled
                  ? "checkmark"
                  : "shield-outline"
              }
              size={21}
              color={
                enabled
                  ? "#fff"
                  : "#111"
              }
            />
          </View>

          <View
            style={styles.statusContent}
          >
            <Text style={styles.statusTitle}>
              {enabled
                ? "Two-factor authentication is on"
                : "Two-factor authentication is off"}
            </Text>

            <Text style={styles.statusText}>
              {enabled
                ? "Your account has this security setting enabled."
                : "Your account currently relies on your password for sign-in protection."}
            </Text>
          </View>
        </View>

        {/* How it works */}

        <Text style={styles.sectionTitle}>
          How it helps
        </Text>

        <View style={styles.infoCard}>
          <SecurityRow
            icon="key-outline"
            title="Your password"
            text="Keep your Snapgram password private and use a unique password."
          />

          <View style={styles.divider} />

          <SecurityRow
            icon="shield-checkmark-outline"
            title="Additional verification"
            text="A real two-factor implementation should require another verification method during sign-in."
          />

          <View style={styles.divider} />

          <SecurityRow
            icon="warning-outline"
            title="Never share security codes"
            text="Never give authentication or recovery codes to another person."
          />
        </View>

        {/* Enabled state */}

        {enabled ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#2e7d32"
              />
            </View>

            <View
              style={styles.successContent}
            >
              <Text style={styles.successTitle}>
                Security setting enabled
              </Text>

              <Text style={styles.successText}>
                Keep your recovery information
                secure and make sure you can
                access your verification method
                when signing in.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Login activity */}

        <Pressable
          onPress={() =>
            router.push(
              "/settings/profile/login-activity"
            )
          }
          style={styles.activityRow}
        >
          <View
            style={styles.activityIcon}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={21}
              color="#111"
            />
          </View>

          <View
            style={styles.activityContent}
          >
            <Text
              style={styles.activityTitle}
            >
              Login activity
            </Text>

            <Text
              style={
                styles.activitySubtitle
              }
            >
              Review devices that have recently
              accessed your account.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </Pressable>

        {/* Important notice */}

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#666"
          />

          <Text style={styles.noticeText}>
            Make sure your password is strong
            and never share verification codes
            with anyone.
          </Text>
        </View>

        <Text style={styles.footer}>
          Snapgram security
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
        Two-factor authentication
      </Text>

      <View style={styles.headerSpacer} />
    </View>
  );
}

function SecurityRow({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.securityRow}>
      <View style={styles.securityIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#111"
        />
      </View>

      <View
        style={styles.securityContent}
      >
        <Text style={styles.securityTitle}>
          {title}
        </Text>

        <Text style={styles.securityText}>
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
    paddingTop: 25,
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
    paddingHorizontal: 20,
    marginBottom: 27,
  },

  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 14,
  },

  iconCircleEnabled: {
    backgroundColor: "#edf7ee",
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
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

  settingCard: {
    marginBottom: 22,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#ddd",
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

  settingIconEnabled: {
    backgroundColor: "#edf7ee",
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

  statusCardEnabled: {
    backgroundColor: "#f1f8f2",
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
  },

  statusIconEnabled: {
    backgroundColor: "#2e7d32",
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

  securityRow: {
    minHeight: 82,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  securityContent: {
    flex: 1,
    marginLeft: 12,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  securityText: {
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

  successCard: {
    marginBottom: 22,
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f1f8f2",
  },

  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dff0e1",
  },

  successContent: {
    flex: 1,
    marginLeft: 10,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#205c27",
  },

  successText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#47704b",
  },

  activityRow: {
    minHeight: 74,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },

  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  activityContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  activitySubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  noticeCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f7f7f7",
  },

  noticeText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: "#666",
  },

  footer: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11.5,
    color: "#aaa",
  },
});