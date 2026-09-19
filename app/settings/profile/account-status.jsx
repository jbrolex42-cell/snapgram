import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { loadSettings } from "../../../services/settingsApi";

function StatusRow({
  icon,
  title,
  description,
  status,
  statusTone = "neutral",
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={22}
          color="#111"
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowDescription}>
          {description}
        </Text>

        {status ? (
          <View
            style={[
              styles.statusBadge,
              statusTone === "success" &&
                styles.successBadge,
              statusTone === "danger" &&
                styles.dangerBadge,
              statusTone === "warning" &&
                styles.warningBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                statusTone === "success" &&
                  styles.successDot,
                statusTone === "danger" &&
                  styles.dangerDot,
                statusTone === "warning" &&
                  styles.warningDot,
              ]}
            />

            <Text
              style={[
                styles.statusBadgeText,
                statusTone === "success" &&
                  styles.successText,
                statusTone === "danger" &&
                  styles.dangerText,
                statusTone === "warning" &&
                  styles.warningText,
              ]}
            >
              {status}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function AccountStatusScreen() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAccountStatus = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();

        setSettings(data || {});
      } catch (error) {
        console.error(
          "ACCOUNT STATUS LOAD ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load your account status."
        );

        setSettings({});
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAccountStatus();
  }, [loadAccountStatus]);

  const refresh = useCallback(() => {
    loadAccountStatus(true);
  }, [loadAccountStatus]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color="#111"
        />
      </View>
    );
  }

  const accountStatus =
    settings?.accountStatus || "Active";

  const normalizedStatus = String(
    accountStatus
  )
    .trim()
    .toLowerCase();

  const isActive =
    normalizedStatus === "active";

  const isRestricted =
    normalizedStatus === "restricted" ||
    normalizedStatus === "suspended" ||
    normalizedStatus === "disabled";

  const accountStanding =
    settings?.accountStanding ||
    "No current restrictions are shown on your account.";

  const recommendationEligibility =
    settings?.recommendationEligibility ||
    "Recommendation eligibility information is not currently available.";

  const removedContent =
    settings?.removedContentSummary ||
    "No removed-content information is currently available.";

  const statusTone = isActive
    ? "success"
    : isRestricted
      ? "danger"
      : "warning";

  const statusLabel = isActive
    ? "Account is active"
    : isRestricted
      ? "Action may be required"
      : "Status unavailable";

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Account status
        </Text>

        <View style={styles.headerSpacer} />
      </View>

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

        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              isActive
                ? styles.heroIconSuccess
                : styles.heroIconDanger,
            ]}
          >
            <Ionicons
              name={
                isActive
                  ? "shield-checkmark-outline"
                  : "warning-outline"
              }
              size={38}
              color={
                isActive
                  ? "#1a9b55"
                  : "#ed4956"
              }
            />
          </View>

          <Text style={styles.heroTitle}>
            Account status
          </Text>

          <Text style={styles.heroText}>
            Review the current standing of your
            Snapgram account and see whether any
            restrictions may affect your experience.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#d93025"
            />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Unable to refresh status
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  loadAccountStatus()
                }
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          Current status
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.largeStatusIcon,
                statusTone === "success" &&
                  styles.successCircle,
                statusTone === "danger" &&
                  styles.dangerCircle,
                statusTone === "warning" &&
                  styles.warningCircle,
              ]}
            >
              <Ionicons
                name={
                  statusTone === "success"
                    ? "checkmark"
                    : statusTone === "danger"
                      ? "close"
                      : "help-outline"
                }
                size={25}
                color={
                  statusTone === "success"
                    ? "#1a9b55"
                    : statusTone === "danger"
                      ? "#ed4956"
                      : "#b26a00"
                }
              />
            </View>

            <View style={styles.statusHeaderText}>
              <Text style={styles.currentStatusLabel}>
                {accountStatus}
              </Text>

              <Text
                style={styles.currentStatusDescription}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Account information
        </Text>

        <View style={styles.card}>
          <StatusRow
            icon="shield-checkmark-outline"
            title="Account standing"
            description={accountStanding}
            status={
              isActive
                ? "Good standing"
                : accountStatus
            }
            statusTone={statusTone}
          />

          <View style={styles.divider} />

          <StatusRow
            icon="sparkles-outline"
            title="Recommendation eligibility"
            description={
              recommendationEligibility
            }
          />

          <View style={styles.divider} />

          <StatusRow
            icon="document-text-outline"
            title="Removed content"
            description={removedContent}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#555"
          />

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              About account status
            </Text>

            <Text style={styles.infoText}>
              Account status information is loaded
              directly from your Snapgram account.
              If your account has a restriction, the
              details provided by the server will be
              displayed here.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Pull down to refresh your account status.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  headerButton: {
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
    paddingTop: 22,
    paddingBottom: 50,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 18,
  },

  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  heroIconSuccess: {
    backgroundColor: "#eaf8f0",
  },

  heroIconDanger: {
    backgroundColor: "#fff1f2",
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  heroText: {
    maxWidth: 350,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff2f2",
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    marginBottom: 3,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#d93025",
  },

  errorText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#b3261e",
  },

  retryText: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "700",
    color: "#0095f6",
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  statusCard: {
    padding: 16,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  largeStatusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  successCircle: {
    backgroundColor: "#eaf8f0",
  },

  dangerCircle: {
    backgroundColor: "#fff1f2",
  },

  warningCircle: {
    backgroundColor: "#fff7e8",
  },

  statusHeaderText: {
    flex: 1,
  },

  currentStatusLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  currentStatusDescription: {
    marginTop: 3,
    fontSize: 13,
    color: "#737373",
  },

  card: {
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },

  row: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  rowIcon: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    paddingRight: 8,
  },

  rowTitle: {
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  rowDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
  },

  successBadge: {
    backgroundColor: "#eaf8f0",
  },

  dangerBadge: {
    backgroundColor: "#fff1f2",
  },

  warningBadge: {
    backgroundColor: "#fff7e8",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#777",
  },

  successDot: {
    backgroundColor: "#1a9b55",
  },

  dangerDot: {
    backgroundColor: "#ed4956",
  },

  warningDot: {
    backgroundColor: "#b26a00",
  },

  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#666",
  },

  successText: {
    color: "#18794e",
  },

  dangerText: {
    color: "#d93025",
  },

  warningText: {
    color: "#9a5b00",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    backgroundColor: "#e5e5e5",
  },

  infoBox: {
    flexDirection: "row",
    gap: 12,
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  infoText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  footerText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#8a8a8a",
  },
});