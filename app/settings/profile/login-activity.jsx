import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Notice,
  Page,
  PageLoading,
} from "../../../components/settings/SettingsUI";

import api from "../../../services/api";

const SESSIONS_ENDPOINT = "/auth/sessions";

function getSessionId(session) {
  return (
    session?._id ||
    session?.id ||
    session?.sessionId ||
    null
  );
}

function getDeviceName(session, index) {
  return (
    session?.deviceName ||
    session?.device ||
    session?.name ||
    session?.platform ||
    `Device ${index + 1}`
  );
}

function getLocation(session) {
  if (typeof session?.location === "string") {
    return session.location;
  }

  if (
    session?.location &&
    typeof session.location === "object"
  ) {
    return (
      session.location.city ||
      session.location.country ||
      "Unknown location"
    );
  }

  if (session?.city && session?.country) {
    return `${session.city}, ${session.country}`;
  }

  return (
    session?.city ||
    session?.country ||
    "Location unavailable"
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

function getPlatform(session) {
  return String(
    session?.platform ||
      session?.deviceType ||
      session?.device ||
      session?.userAgent ||
      ""
  ).toLowerCase();
}

function getDeviceIcon(session) {
  const platform = getPlatform(session);

  if (
    platform.includes("iphone") ||
    platform.includes("ios")
  ) {
    return "phone-portrait-outline";
  }

  if (
    platform.includes("android") ||
    platform.includes("phone")
  ) {
    return "phone-portrait-outline";
  }

  if (
    platform.includes("ipad") ||
    platform.includes("tablet")
  ) {
    return "tablet-portrait-outline";
  }

  if (
    platform.includes("windows") ||
    platform.includes("mac") ||
    platform.includes("linux") ||
    platform.includes("desktop") ||
    platform.includes("computer")
  ) {
    return "laptop-outline";
  }

  return "phone-portrait-outline";
}

function getSessionDate(session) {
  return (
    session?.lastSeen ||
    session?.lastActive ||
    session?.updatedAt ||
    session?.createdAt
  );
}

function SessionRow({
  session,
  index,
  revokingId,
  onRevoke,
}) {
  const id = getSessionId(session);

  const current = isCurrentSession(session);

  const revoking =
    id && String(revokingId) === String(id);

  const device = getDeviceName(
    session,
    index
  );

  const location = getLocation(session);

  const lastSeen = formatLastSeen(
    getSessionDate(session)
  );

  const icon = getDeviceIcon(session);

  return (
    <View style={styles.sessionRow}>
      <View style={styles.deviceIcon}>
        <Ionicons
          name={icon}
          size={25}
          color="#111"
        />
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.deviceHeader}>
          <Text
            style={styles.deviceName}
            numberOfLines={2}
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

        <Text
          style={styles.location}
          numberOfLines={1}
        >
          {location}
        </Text>

        <Text style={styles.lastSeen}>
          Last active {lastSeen}
        </Text>

        {!current ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={revoking || !id}
            onPress={() =>
              onRevoke(session)
            }
            style={styles.logoutButton}
          >
            {revoking ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text style={styles.logoutText}>
                Log out
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.currentText}>
            You're currently using this device
          </Text>
        )}
      </View>

      {!current ? (
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color="#8e8e8e"
          style={styles.moreIcon}
        />
      ) : null}
    </View>
  );
}

export default function LoginActivityScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [revokingId, setRevokingId] =
    useState(null);
  const [error, setError] = useState("");

  const loadSessions = useCallback(
    async ({ initial = false } = {}) => {
      try {
        if (initial) {
          setLoading(true);
        }

        setError("");

        const response = await api.get(
          SESSIONS_ENDPOINT
        );

        const data = response?.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
          ? data.sessions
          : Array.isArray(
              data?.data?.sessions
            )
          ? data.data.sessions
          : [];

        setSessions(list);
      } catch (err) {
        console.error(
          "LOGIN ACTIVITY ERROR:",
          err?.response?.data ||
            err?.message ||
            err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load your login activity.";

        setError(message);

        if (initial) {
          setSessions([]);
        }
      } finally {
        if (initial) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSessions({
      initial: true,
    });
  }, [loadSessions]);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    await loadSessions();
  }, [loadSessions]);

  const revokeSession = useCallback(
    (session) => {
      const id = getSessionId(session);

      if (!id) {
        Alert.alert(
          "Unable to log out",
          "This session does not have a valid session identifier."
        );
        return;
      }

      if (isCurrentSession(session)) {
        Alert.alert(
          "This is your current device",
          "You cannot remotely log out of the device you're currently using."
        );
        return;
      }

      if (revokingId) {
        return;
      }

      const deviceName =
        getDeviceName(session, 0);

      Alert.alert(
        "Log out of this device?",
        `You'll need to sign in again on ${deviceName}.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log out",
            style: "destructive",
            onPress: async () => {
              try {
                setRevokingId(id);

                await api.delete(
                  `${SESSIONS_ENDPOINT}/${encodeURIComponent(
                    id
                  )}`
                );

                setSessions((previous) =>
                  previous.filter(
                    (item) =>
                      String(
                        getSessionId(item)
                      ) !== String(id)
                  )
                );

                Alert.alert(
                  "Logged out",
                  `${deviceName} has been logged out of your account.`
                );
              } catch (err) {
                console.error(
                  "REVOKE SESSION ERROR:",
                  err?.response?.data ||
                    err?.message ||
                    err
                );

                const message =
                  err?.response?.data?.message ||
                  err?.message ||
                  "Unable to log out this device.";

                Alert.alert(
                  "Unable to log out",
                  message
                );
              } finally {
                setRevokingId(null);
              }
            },
          },
        ]
      );
    },
    [revokingId]
  );

  const currentSessions = sessions.filter(
    (session) =>
      isCurrentSession(session)
  );

  const otherSessions = sessions.filter(
    (session) =>
      !isCurrentSession(session)
  );

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
        contentContainerStyle={
          styles.content
        }
      >

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons
              name="phone-portrait-outline"
              size={30}
              color="#111"
            />
          </View>

          <Text style={styles.introTitle}>
            Where you're logged in
          </Text>

          <Text style={styles.introText}>
            See where your Snapgram account is
            currently signed in. If you don't
            recognize a device, log it out.
          </Text>
        </View>

        {error ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              loadSessions({
                initial: false,
              })
            }
            style={styles.errorBox}
          >
            <Ionicons
              name="warning-outline"
              size={20}
              color="#b45309"
            />

            <View
              style={styles.errorContent}
            >
              <Text style={styles.errorTitle}>
                Couldn't load login activity
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Text style={styles.retryText}>
                Tap to try again
              </Text>
            </View>

            <Ionicons
              name="refresh-outline"
              size={19}
              color="#b45309"
            />
          </TouchableOpacity>
        ) : null}

        {currentSessions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Currently logged in
            </Text>

            <View style={styles.card}>
              {currentSessions.map(
                (session, index) => (
                  <SessionRow
                    key={
                      getSessionId(
                        session
                      ) ||
                      `current-${index}`
                    }
                    session={session}
                    index={index}
                    revokingId={
                      revokingId
                    }
                    onRevoke={
                      revokeSession
                    }
                  />
                )
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Other devices
          </Text>

          {otherSessions.length > 0 ? (
            <View style={styles.card}>
              {otherSessions.map(
                (session, index) => (
                  <React.Fragment
                    key={
                      getSessionId(
                        session
                      ) ||
                      `session-${index}`
                    }
                  >
                    <SessionRow
                      session={session}
                      index={index}
                      revokingId={
                        revokingId
                      }
                      onRevoke={
                        revokeSession
                      }
                    />

                    {index <
                    otherSessions.length - 1 ? (
                      <View
                        style={styles.divider}
                      />
                    ) : null}
                  </React.Fragment>
                )
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={28}
                  color="#111"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No other devices
              </Text>

              <Text style={styles.emptyText}>
                Your account isn't currently
                signed in on any other
                recognized device.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color="#111"
            />
          </View>

          <Text style={styles.securityTitle}>
            Keep your account secure
          </Text>

          <Text style={styles.securityText}>
            If you see a device or location you
            don't recognize, log it out and
            change your password.
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/settings/change-password"
              )
            }
            style={styles.securityAction}
          >
            <Text
              style={
                styles.securityActionText
              }
            >
              Change password
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#111"
            />
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/settings/profile/two-factor"
              )
            }
            style={styles.securityAction}
          >
            <Text
              style={
                styles.securityActionText
              }
            >
              Two-factor authentication
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        <Notice>
          Login locations may be approximate.
          They can be based on network
          information rather than your exact
          physical location.
        </Notice>

        <Text style={styles.footer}>
          Snapgram login activity
        </Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 45,
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },

  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 13,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  introText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  errorBox: {
    minHeight: 64,
    marginBottom: 18,
    padding: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
  },

  errorContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },

  errorText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#a16207",
  },

  retryText: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: "600",
    color: "#92400e",
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    marginBottom: 9,
    marginLeft: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  card: {
    overflow: "hidden",
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dedede",
    backgroundColor: "#fff",
  },

  sessionRow: {
    minHeight: 108,
    paddingHorizontal: 13,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
    marginRight: 12,
  },

  sessionInfo: {
    flex: 1,
    minWidth: 0,
  },

  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingRight: 5,
  },

  deviceName: {
    flexShrink: 1,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: "700",
    color: "#111",
  },

  currentBadge: {
    marginLeft: 7,
    marginTop: 2,
    paddingHorizontal: 7,
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
    fontSize: 12.5,
    color: "#555",
  },

  lastSeen: {
    marginTop: 3,
    fontSize: 11.5,
    color: "#8a8a8a",
  },

  logoutButton: {
    alignSelf: "flex-start",
    minWidth: 76,
    minHeight: 32,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
  },

  logoutText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111",
  },

  currentText: {
    marginTop: 9,
    fontSize: 11.5,
    fontWeight: "500",
    color: "#737373",
  },

  moreIcon: {
    marginTop: 4,
    marginLeft: 7,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 73,
    backgroundColor: "#e5e5e5",
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 28,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dedede",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
    marginBottom: 11,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    color: "#777",
  },

  securityCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  securityIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
    marginBottom: 12,
  },

  securityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  securityText: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  securityAction: {
    minHeight: 43,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  securityActionText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111",
  },

  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#dedede",
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 11.5,
    color: "#aaa",
  },
});