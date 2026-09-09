import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  SettingItem,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import api from "../../../services/api";

const SESSIONS_ENDPOINT = "/auth/sessions";

function getSessionId(session) {
  return session?._id || session?.id || session?.sessionId || null;
}

function getDeviceName(session, index) {
  return (
    session?.deviceName ||
    session?.device ||
    session?.deviceName ||
    session?.platform ||
    session?.userAgent ||
    `Device ${index + 1}`
  );
}

function getLocation(session) {
  return (
    session?.location ||
    session?.city ||
    session?.country ||
    "Unknown location"
  );
}

function formatLastSeen(value) {
  if (!value) {
    return "Activity unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isCurrentSession(session) {
  return (
    session?.current === true ||
    session?.isCurrent === true ||
    session?.currentSession === true
  );
}

function getDeviceIcon(session) {
  const platform = String(
    session?.platform ||
      session?.deviceType ||
      session?.device ||
      session?.userAgent ||
      ""
  ).toLowerCase();

  if (
    platform.includes("iphone") ||
    platform.includes("ios")
  ) {
    return "iPhone";
  }

  if (
    platform.includes("android") ||
    platform.includes("phone")
  ) {
    return "Android";
  }

  if (
    platform.includes("windows") ||
    platform.includes("mac") ||
    platform.includes("linux") ||
    platform.includes("desktop")
  ) {
    return "Computer";
  }

  return "Device";
}

export default function LoginActivityScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setError("");

      const response = await api.get(SESSIONS_ENDPOINT);

      const data = response?.data;

      const list =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
          ? data.sessions
          : Array.isArray(data?.data?.sessions)
          ? data.data.sessions
          : [];

      setSessions(list);
    } catch (err) {
      console.error(
        "LOGIN ACTIVITY ERROR:",
        err?.response?.data || err?.message || err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your login activity.";

      setError(message);
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  async function revokeSession(session) {
    const id = getSessionId(session);

    if (!id) {
      Alert.alert(
        "Unable to sign out",
        "This session does not have a valid session identifier."
      );
      return;
    }

    if (isCurrentSession(session)) {
      Alert.alert(
        "This is your current session",
        "You cannot remotely sign out of the device you are currently using from this screen."
      );
      return;
    }

    if (revokingId) {
      return;
    }

    Alert.alert(
      "Sign out this device?",
      `You'll need to sign in again on ${getDeviceName(
        session,
        0
      )}.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            try {
              setRevokingId(id);

              await api.delete(`${SESSIONS_ENDPOINT}/${id}`);

              setSessions((previous) =>
                previous.filter(
                  (item) => getSessionId(item) !== id
                )
              );

              Alert.alert(
                "Device signed out",
                "The selected session has been signed out."
              );
            } catch (err) {
              console.error(
                "REVOKE SESSION ERROR:",
                err?.response?.data || err?.message || err
              );

              const message =
                err?.response?.data?.message ||
                err?.message ||
                "Unable to sign out this session.";

              Alert.alert("Unable to sign out", message);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <Page
        title="Login activity"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Login activity"
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
          icon="phone-portrait-outline"
          title="Where you're logged in"
          text="Review the devices and locations where your Snapgram account is currently signed in."
        />

        {error ? (
          <Notice tone="error">
            {error}
          </Notice>
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {sessions.length === 1
              ? "1 active session"
              : `${sessions.length} active sessions`}
          </Text>

          <Text style={styles.summaryText}>
            If you don't recognize a device, sign it out and change your
            password immediately.
          </Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>

            <Text style={styles.emptyTitle}>
              No sessions found
            </Text>

            <Text style={styles.emptyText}>
              Snapgram could not find any active login sessions for your
              account.
            </Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {sessions.map((session, index) => {
              const id = getSessionId(session);
              const current = isCurrentSession(session);
              const revoking = revokingId === id;

              const device = getDeviceName(
                session,
                index
              );

              const deviceType = getDeviceIcon(
                session
              );

              const location = getLocation(
                session
              );

              const lastSeen = formatLastSeen(
                session?.lastSeen ||
                  session?.lastActive ||
                  session?.updatedAt ||
                  session?.createdAt
              );

              return (
                <View
                  key={id || `session-${index}`}
                  style={styles.sessionCard}
                >
                  <View style={styles.deviceIcon}>
                    <Text style={styles.deviceIconText}>
                      {deviceType === "Computer"
                        ? "▣"
                        : "▯"}
                    </Text>
                  </View>

                  <View style={styles.sessionContent}>
                    <View style={styles.titleRow}>
                      <Text
                        style={styles.deviceTitle}
                        numberOfLines={1}
                      >
                        {device}
                      </Text>

                      {current ? (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>
                            This device
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.location}>
                      {location}
                    </Text>

                    <Text style={styles.lastSeen}>
                      Last active: {lastSeen}
                    </Text>

                    {!current && id ? (
                      <SettingItem
                        title={
                          revoking
                            ? "Signing out..."
                            : "Sign out"
                        }
                        subtitle="Remove access from this device."
                        onPress={() =>
                          revokeSession(session)
                        }
                      />
                    ) : null}

                    {revoking ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.securityBox}>
          <Text style={styles.securityTitle}>
            Don't recognize a device?
          </Text>

          <Text style={styles.securityText}>
            Sign out of the unfamiliar session, then change your password
            and enable two-factor authentication for additional protection.
          </Text>

          <Text
            style={styles.securityLink}
            onPress={() =>
              router.push("/settings/change-password")
            }
          >
            Change password
          </Text>

          <Text
            style={styles.securityLink}
            onPress={() =>
              router.push("/settings/profile/two-factor")
            }
          >
            Two-factor authentication
          </Text>
        </View>

        <Notice>
          Login locations may be approximate because they can be based on
          network information rather than your exact physical location.
        </Notice>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },

  summary: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },

  summaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },

  sessionList: {
    marginTop: 10,
  },

  sessionCard: {
    flexDirection: "row",
    marginTop: 8,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
    marginRight: 13,
  },

  deviceIconText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },

  sessionContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  deviceTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  currentBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },

  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2e7d32",
  },

  location: {
    marginTop: 5,
    fontSize: 13,
    color: "#555",
  },

  lastSeen: {
    marginTop: 3,
    fontSize: 12,
    color: "#888",
  },

  loadingRow: {
    marginTop: 6,
    alignItems: "flex-start",
  },

  empty: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 25,
    paddingVertical: 30,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 25,
    fontWeight: "700",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#777",
  },

  securityBox: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 7,
  },

  securityText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
    marginBottom: 12,
  },

  securityLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginTop: 8,
  },
});

