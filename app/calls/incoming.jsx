import React, {
  useEffect,
} from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import CallAvatar from "../../components/calls/CallAvatar";

import {
  updateCall,
} from "../../services/callService";

import {
  getSocket,
} from "../../services/socket";

export default function IncomingCall() {
  const {
    callId,
    callerId,
    callerName,
    callerAvatar,
    username,
    avatar,
    type,
  } = useLocalSearchParams();

  const displayName =
    callerName ||
    username ||
    "Unknown user";

  const displayAvatar =
    callerAvatar ||
    avatar ||
    "";

  const callType =
    type === "video"
      ? "video"
      : "voice";

  const isVideo =
    callType === "video";

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        handleMissedCall();
      }, 30000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  async function acceptCall() {
    try {
      await updateCall(
        callId,
        "accepted"
      );

      const socket =
        getSocket();

      if (socket) {
        socket.emit(
          "call:accept",
          {
            callId,
            callerId,
          }
        );
      }

      router.replace({
        pathname:
          "/calls/[callId]",
        params: {
          callId,
          username:
            displayName,
          avatar:
            displayAvatar,
          type:
            callType,
          callerId:
            callerId || "",
          otherUserId:
            callerId || "",
          isCaller: "false",
        },
      });
    } catch (error) {
      console.error(
        "ACCEPT CALL ERROR:",
        error
      );
    }
  }

  async function rejectCall() {
    try {
      await updateCall(
        callId,
        "rejected"
      );

      const socket =
        getSocket();

      if (socket) {
        socket.emit(
          "call:reject",
          {
            callId,
            callerId,
          }
        );
      }
    } catch (error) {
      console.error(
        "REJECT CALL ERROR:",
        error
      );
    } finally {
      router.back();
    }
  }

  async function handleMissedCall() {
    try {
      await updateCall(
        callId,
        "missed"
      );

      const socket =
        getSocket();

      if (socket) {
        socket.emit(
          "call:missed",
          {
            callId,
            callerId,
          }
        );
      }
    } catch (error) {
      console.error(
        "MISSED CALL ERROR:",
        error
      );
    } finally {
      router.back();
    }
  }

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.topSection}
      >
        <Text
          style={styles.incomingLabel}
        >
          Incoming
        </Text>

        <Text
          style={styles.callType}
        >
          {isVideo
            ? "video call"
            : "voice call"}
        </Text>
      </View>

      <View
        style={styles.callerSection}
      >
        <CallAvatar
          username={
            displayName
          }
          avatar={
            displayAvatar
          }
        />

        <Text
          style={styles.username}
        >
          {displayName}
        </Text>

        <Text
          style={styles.callDescription}
        >
          {isVideo
            ? "📹 Incoming video call"
            : "📞 Incoming call"}
        </Text>
      </View>

      <View
        style={styles.actions}
      >
        <View
          style={styles.actionWrapper}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              styles.rejectButton,
            ]}
            onPress={
              rejectCall
            }
          >
            <Text
              style={styles.actionIcon}
            >
              ✕
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.actionLabel}
          >
            Decline
          </Text>
        </View>

        <View
          style={styles.actionWrapper}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              styles.acceptButton,
            ]}
            onPress={
              acceptCall
            }
          >
            <Text
              style={styles.actionIcon}
            >
              ✓
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.actionLabel}
          >
            Answer
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 70,
  },

  topSection: {
    alignItems: "center",
  },

  incomingLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#262626",
  },

  callType: {
    marginTop: 5,
    fontSize: 14,
    color: "#8E8E8E",
  },

  callerSection: {
    alignItems: "center",
    justifyContent: "center",
  },

  username: {
    marginTop: 20,
    fontSize: 25,
    fontWeight: "700",
    color: "#111111",
  },

  callDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#8E8E8E",
  },

  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 70,
  },

  actionWrapper: {
    alignItems: "center",
  },

  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  rejectButton: {
    backgroundColor: "#ED4956",
  },

  acceptButton: {
    backgroundColor: "#2DBE60",
  },

  actionIcon: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
  },

  actionLabel: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "600",
    color: "#262626",
    textTransform: "uppercase",
  },
});