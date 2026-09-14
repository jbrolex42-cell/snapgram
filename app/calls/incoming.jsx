import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";

import CallAvatar from "../../components/calls/CallAvatar";

import { useAuth } from "../../context/AuthContext";

import { updateCall } from "../../services/callService";

import {
  waitForSocket,
  acceptCall as sendAcceptCall,
  rejectCall as sendRejectCall,
} from "../../services/socket";

const RING_TIMEOUT = 30000;

export default function IncomingCall() {
  const { user } = useAuth();

  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();

  const callId = String(params?.callId || "");

  const callerId = String(params?.callerId || "");

  const displayName =
    String(
      params?.callerName ||
        params?.username ||
        "Snapgram User"
    ).trim() || "Snapgram User";

  const avatar =
    String(
      params?.callerAvatar ||
        params?.avatar ||
        ""
    ).trim();

  const callType =
    String(params?.type || "voice").toLowerCase() ===
    "video"
      ? "video"
      : "voice";

  const isVideo = callType === "video";

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const [action, setAction] = useState(null);

  const [error, setError] = useState("");

  const mountedRef = useRef(true);

  const handledRef = useRef(false);

  const socketRef = useRef(null);

  const timeoutRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cleanupSocket = useCallback(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    socket.off("call:ended");
    socket.off("call:cancelled");
    socket.off("call:rejected");
    socket.off("call:missed");
    socket.off("call:accepted");

    socketRef.current = null;
  }, []);

  const leaveScreen = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    router.back();
  }, []);

  const handleRemoteEnd = useCallback(
    (data) => {
      if (
        !mountedRef.current ||
        handledRef.current
      ) {
        return;
      }

      if (
        data?.callId &&
        String(data.callId) !== callId
      ) {
        return;
      }

      handledRef.current = true;

      clearTimer();

      cleanupSocket();

      leaveScreen();
    },
    [
      callId,
      clearTimer,
      cleanupSocket,
      leaveScreen,
    ]
  );

  const handleMissedCall = useCallback(
    async () => {
      if (handledRef.current) {
        return;
      }

      handledRef.current = true;

      clearTimer();

      if (mountedRef.current) {
        setAction("missed");
        setError("");
      }

      try {
        if (callId) {
          await updateCall(
            callId,
            "missed"
          );
        }
      } catch (error) {
        console.warn(
          "MISSED CALL UPDATE ERROR:",
          error?.message || error
        );
      }

      try {
        const socket = socketRef.current;

        if (socket?.connected) {
          socket.emit("call:missed", {
            callId,
            callerId,
          });
        }
      } catch (error) {
        console.warn(
          "MISSED CALL EMIT ERROR:",
          error?.message || error
        );
      }

      cleanupSocket();

      setTimeout(() => {
        leaveScreen();
      }, 250);
    },
    [
      callId,
      callerId,
      clearTimer,
      cleanupSocket,
      leaveScreen,
    ]
  );

  const acceptIncomingCall = useCallback(
    async () => {
      if (handledRef.current) {
        return;
      }

      if (!callId) {
        setError(
          "This call is missing its call ID."
        );
        return;
      }

      if (!callerId) {
        setError(
          "The caller could not be identified."
        );
        return;
      }

      if (!currentUserId) {
        setError(
          "Your Snapgram account could not be identified."
        );
        return;
      }

      handledRef.current = true;

      clearTimer();

      setAction("accepting");

      setError("");

      try {
        const socket = await waitForSocket(
          currentUserId,
          10000
        );

        if (
          !socket ||
          !socket.connected
        ) {
          throw new Error(
            "Snapgram connection is not available."
          );
        }

        socketRef.current = socket;

        await updateCall(
          callId,
          "accepted"
        );

        await sendAcceptCall({
          callId,
          callerId,
        });

        console.log(
          "INCOMING CALL ACCEPTED:",
          callId
        );

        if (!mountedRef.current) {
          return;
        }

        router.replace({
          pathname: "/calls/[callId]",
          params: {
            callId,
            username: displayName,
            avatar,
            type: callType,
            callerId,
            otherUserId: callerId,
            isCaller: "false",
          },
        });
      } catch (error) {
        console.error(
          "ACCEPT CALL ERROR:",
          error
        );

        handledRef.current = false;

        if (mountedRef.current) {
          setAction(null);

          setError(
            error?.message ||
              "Unable to answer the call."
          );
        }
      }
    },
    [
      avatar,
      callId,
      callType,
      callerId,
      clearTimer,
      currentUserId,
      displayName,
    ]
  );

  const rejectIncomingCall = useCallback(
    async () => {
      if (handledRef.current) {
        return;
      }

      handledRef.current = true;

      clearTimer();

      setAction("rejecting");

      setError("");

      try {
        if (callId) {
          await updateCall(
            callId,
            "rejected"
          );
        }
      } catch (error) {
        console.warn(
          "REJECT CALL UPDATE ERROR:",
          error?.message || error
        );
      }

      try {
        let socket = socketRef.current;

        if (
          !socket?.connected &&
          currentUserId
        ) {
          socket = await waitForSocket(
            currentUserId,
            5000
          );

          socketRef.current = socket;
        }

        if (socket?.connected) {
          await sendRejectCall({
            callId,
            callerId,
          });
        }
      } catch (error) {
        console.warn(
          "REJECT CALL SOCKET ERROR:",
          error?.message || error
        );
      }

      cleanupSocket();

      leaveScreen();
    },
    [
      callId,
      callerId,
      cleanupSocket,
      clearTimer,
      currentUserId,
      leaveScreen,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;
    handledRef.current = false;

    if (!currentUserId) {
      setError(
        "Your Snapgram account could not be identified."
      );

      return;
    }

    if (!callId) {
      setError(
        "This incoming call is invalid."
      );

      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        const socket = await waitForSocket(
          currentUserId,
          10000
        );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        if (
          !socket ||
          !socket.connected
        ) {
          throw new Error(
            "Unable to connect to Snapgram."
          );
        }

        socketRef.current = socket;

        socket.off(
          "call:ended",
          handleRemoteEnd
        );

        socket.off(
          "call:cancelled",
          handleRemoteEnd
        );

        socket.off(
          "call:rejected",
          handleRemoteEnd
        );

        socket.off(
          "call:missed",
          handleRemoteEnd
        );

        socket.on(
          "call:ended",
          handleRemoteEnd
        );

        socket.on(
          "call:cancelled",
          handleRemoteEnd
        );

        socket.on(
          "call:rejected",
          handleRemoteEnd
        );

        socket.on(
          "call:missed",
          handleRemoteEnd
        );

        console.log(
          "INCOMING CALL SOCKET READY:",
          socket.id
        );
      } catch (error) {
        console.warn(
          "INCOMING SOCKET ERROR:",
          error?.message || error
        );

        if (mountedRef.current) {
          setError(
            "Unable to connect to Snapgram."
          );
        }
      }
    };

    setup();

    timeoutRef.current = setTimeout(() => {
      handleMissedCall();
    }, RING_TIMEOUT);

    return () => {
      cancelled = true;

      mountedRef.current = false;

      clearTimer();

      cleanupSocket();
    };
  }, [
    callId,
    currentUserId,
    clearTimer,
    cleanupSocket,
    handleMissedCall,
    handleRemoteEnd,
  ]);

  const busy =
    action === "accepting" ||
    action === "rejecting" ||
    action === "missed";

  const title = isVideo
    ? "Incoming video call"
    : "Incoming voice call";

  const subtitle = isVideo
    ? "Video call"
    : "Voice call";

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        backgroundColor="#000000"
      />

      <View
        style={[
          styles.content,
          {
            paddingTop:
              insets.top + 18,

            paddingBottom:
              insets.bottom + 24,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.topSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={
                isVideo
                  ? "video"
                  : "phone"
              }
              size={22}
              color="#ffffff"
            />
          </View>

          <Text style={styles.incomingTitle}>
            {title}
          </Text>

          <Text style={styles.ringing}>
            Ringing...
          </Text>
        </View>

        {/* CALLER */}
        <View style={styles.callerSection}>
          <View style={styles.avatarOuter}>
            <CallAvatar
              username={displayName}
              avatar={avatar}
            />
          </View>

          <Text
            numberOfLines={1}
            style={styles.callerName}
          >
            {displayName}
          </Text>

          <Text style={styles.callSubtitle}>
            {subtitle}
          </Text>

          {error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : null}
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          {/* DECLINE */}
          <View style={styles.actionWrapper}>
            <Pressable
              disabled={busy}
              onPress={rejectIncomingCall}
              accessibilityRole="button"
              accessibilityLabel="Decline call"
              style={({ pressed }) => [
                styles.actionButton,
                styles.decline,
                pressed &&
                  !busy &&
                  styles.pressed,
                busy && styles.disabled,
              ]}
            >
              {action === "rejecting" ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <MaterialCommunityIcons
                  name="phone-hangup"
                  size={31}
                  color="#ffffff"
                />
              )}
            </Pressable>

            <Text style={styles.actionLabel}>
              Decline
            </Text>
          </View>

          {/* ANSWER */}
          <View style={styles.actionWrapper}>
            <Pressable
              disabled={busy}
              onPress={acceptIncomingCall}
              accessibilityRole="button"
              accessibilityLabel="Answer call"
              style={({ pressed }) => [
                styles.actionButton,
                styles.answer,
                pressed &&
                  !busy &&
                  styles.pressed,
                busy && styles.disabled,
              ]}
            >
              {action === "accepting" ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <MaterialCommunityIcons
                  name={
                    isVideo
                      ? "video"
                      : "phone"
                  }
                  size={30}
                  color="#ffffff"
                />
              )}
            </Pressable>

            <Text style={styles.actionLabel}>
              Answer
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },

  topSection: {
    alignItems: "center",
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  incomingTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },

  ringing: {
    color: "#a8a8a8",
    fontSize: 14,
    marginTop: 5,
  },

  callerSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarOuter: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },

  callerName: {
    maxWidth: "90%",
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 24,
    letterSpacing: -0.5,
  },

  callSubtitle: {
    color: "#a8a8a8",
    fontSize: 15,
    marginTop: 7,
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: "85%",
    marginTop: 15,
  },

  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  actionWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  decline: {
    backgroundColor: "#ff3b30",
  },

  answer: {
    backgroundColor: "#30d158",
  },

  pressed: {
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  disabled: {
    opacity: 0.55,
  },

  actionLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
});