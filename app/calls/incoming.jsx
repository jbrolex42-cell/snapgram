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

import {
  waitForSocket,
  acceptCall,
  rejectCall,
  missedCall,
} from "../../services/socket";

const RING_TIMEOUT = 90000;

export default function IncomingCall() {
  const { user } = useAuth();

  const insets =
    useSafeAreaInsets();

  const params =
    useLocalSearchParams();

  const callId = String(
    params?.callId || ""
  );

  const callerId = String(
    params?.callerId || ""
  );

  const callerName =
    String(
      params?.callerName ||
        params?.username ||
        "Snapgram User"
    ).trim() ||
    "Snapgram User";

  const callerAvatar =
    String(
      params?.callerAvatar ||
        params?.avatar ||
        ""
    ).trim();

  const callType =
    String(
      params?.type || "voice"
    ).toLowerCase() === "video"
      ? "video"
      : "voice";

  const isVideo =
    callType === "video";

  const currentUserId =
    String(
      user?._id ||
        user?.id ||
        ""
    );

  const [action, setAction] =
    useState(null);

  const [error, setError] =
    useState("");

  const mountedRef =
    useRef(true);

  const handledRef =
    useRef(false);

  const socketRef =
    useRef(null);

  const timeoutRef =
    useRef(null);

  const clearTimer =
    useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current
        );

        timeoutRef.current = null;
      }
    }, []);

  const cleanupSocket =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (!socket) {
        return;
      }

      socket.off(
        "call:cancelled"
      );

      socket.off(
        "call:rejected"
      );

      socket.off(
        "call:ended"
      );

      socket.off(
        "call:missed"
      );

      socketRef.current = null;
    }, []);

  const leaveScreen =
    useCallback(() => {
      if (
        mountedRef.current
      ) {
        router.back();
      }
    }, []);

  const handleRemoteEnd =
    useCallback(
      (data) => {
        if (
          !mountedRef.current ||
          handledRef.current
        ) {
          return;
        }

        if (
          data?.callId &&
          String(data.callId) !==
            callId
        ) {
          return;
        }

        handledRef.current =
          true;

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

  const handleMissed =
    useCallback(() => {
      if (
        handledRef.current
      ) {
        return;
      }

      handledRef.current =
        true;

      clearTimer();

      setAction("missed");

      try {
        if (
          socketRef.current?.connected
        ) {
          missedCall({
            callId,
          });
        }
      } catch (error) {
        console.warn(
          "[CALL] Missed call:",
          error?.message || error
        );
      }

      cleanupSocket();

      setTimeout(() => {
        leaveScreen();
      }, 300);
    }, [
      callId,
      clearTimer,
      cleanupSocket,
      leaveScreen,
    ]);

  const handleAccept =
    useCallback(async () => {
      if (
        handledRef.current
      ) {
        return;
      }

      if (!callId) {
        setError(
          "This call is invalid."
        );
        return;
      }

      if (!currentUserId) {
        setError(
          "Your account could not be identified."
        );
        return;
      }

      handledRef.current =
        true;

      clearTimer();

      setAction("accepting");
      setError("");

      try {
        const socket =
          await waitForSocket(
            currentUserId,
            10000
          );

        if (
          !socket?.connected
        ) {
          throw new Error(
            "Snapgram connection is unavailable."
          );
        }

        socketRef.current =
          socket;

        acceptCall({
          callId,
        });

        router.replace({
          pathname:
            "/calls/[callId]",
          params: {
            callId,
            username:
              callerName,
            avatar:
              callerAvatar,
            type:
              callType,
            callerId,
            otherUserId:
              callerId,
            isCaller:
              "false",
          },
        });
      } catch (error) {
        console.error(
          "[CALL] Accept error:",
          error
        );

        handledRef.current =
          false;

        if (
          mountedRef.current
        ) {
          setAction(null);

          setError(
            error?.message ||
              "Unable to answer the call."
          );
        }
      }
    }, [
      callId,
      callType,
      callerAvatar,
      callerId,
      callerName,
      clearTimer,
      currentUserId,
    ]);

  const handleReject =
    useCallback(async () => {
      if (
        handledRef.current
      ) {
        return;
      }

      handledRef.current =
        true;

      clearTimer();

      setAction("rejecting");
      setError("");

      try {
        const socket =
          await waitForSocket(
            currentUserId,
            5000
          );

        socketRef.current =
          socket;

        rejectCall({
          callId,
        });
      } catch (error) {
        console.warn(
          "[CALL] Reject error:",
          error?.message || error
        );
      }

      cleanupSocket();
      leaveScreen();
    }, [
      callId,
      cleanupSocket,
      clearTimer,
      currentUserId,
      leaveScreen,
    ]);

  useEffect(() => {
    mountedRef.current =
      true;

    handledRef.current =
      false;

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

    async function setup() {
      try {
        const socket =
          await waitForSocket(
            currentUserId,
            10000
          );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        socketRef.current =
          socket;

        socket.on(
          "call:cancelled",
          handleRemoteEnd
        );

        socket.on(
          "call:rejected",
          handleRemoteEnd
        );

        socket.on(
          "call:ended",
          handleRemoteEnd
        );

        socket.on(
          "call:missed",
          handleRemoteEnd
        );
      } catch (error) {
        if (
          mountedRef.current
        ) {
          setError(
            "Unable to connect to Snapgram."
          );
        }
      }
    }

    setup();

    timeoutRef.current =
      setTimeout(
        handleMissed,
        RING_TIMEOUT
      );

    return () => {
      cancelled = true;
      mountedRef.current =
        false;

      clearTimer();
      cleanupSocket();
    };
  }, [
    callId,
    currentUserId,
    clearTimer,
    cleanupSocket,
    handleMissed,
    handleRemoteEnd,
  ]);

  const busy =
    action === "accepting" ||
    action === "rejecting" ||
    action === "missed";

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        backgroundColor="#000"
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
        <View
          style={styles.topSection}
        >
          <View
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons
              name={
                isVideo
                  ? "video"
                  : "phone"
              }
              size={22}
              color="#fff"
            />
          </View>

          <Text
            style={styles.title}
          >
            {isVideo
              ? "Incoming video call"
              : "Incoming voice call"}
          </Text>

          <Text
            style={styles.ringing}
          >
            Ringing...
          </Text>
        </View>

        <View
          style={
            styles.callerSection
          }
        >
          <View
            style={styles.avatarOuter}
          >
            <CallAvatar
              username={callerName}
              avatar={callerAvatar}
            />
          </View>

          <Text
            numberOfLines={1}
            style={styles.callerName}
          >
            {callerName}
          </Text>

          <Text
            style={styles.subtitle}
          >
            {isVideo
              ? "Video call"
              : "Voice call"}
          </Text>

          {error ? (
            <Text
              style={styles.error}
            >
              {error}
            </Text>
          ) : null}
        </View>

        <View
          style={styles.actions}
        >
          <View
            style={
              styles.actionWrapper
            }
          >
            <Pressable
              disabled={busy}
              onPress={
                handleReject
              }
              style={[
                styles.button,
                styles.decline,
                busy &&
                  styles.disabled,
              ]}
            >
              {action ===
              "rejecting" ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <MaterialCommunityIcons
                  name="phone-hangup"
                  size={31}
                  color="#fff"
                />
              )}
            </Pressable>

            <Text
              style={styles.label}
            >
              Decline
            </Text>
          </View>

          <View
            style={
              styles.actionWrapper
            }
          >
            <Pressable
              disabled={busy}
              onPress={
                handleAccept
              }
              style={[
                styles.button,
                styles.answer,
                busy &&
                  styles.disabled,
              ]}
            >
              {action ===
              "accepting" ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <MaterialCommunityIcons
                  name={
                    isVideo
                      ? "video"
                      : "phone"
                  }
                  size={30}
                  color="#fff"
                />
              )}
            </Pressable>

            <Text
              style={styles.label}
            >
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
    backgroundColor: "#000",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent:
      "space-between",
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

  title: {
    color: "#fff",
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
  },

  avatarOuter: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },

  callerName: {
    maxWidth: "90%",
    color: "#fff",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 24,
  },

  subtitle: {
    color: "#a8a8a8",
    fontSize: 15,
    marginTop: 7,
  },

  error: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 15,
    maxWidth: "85%",
  },

  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent:
      "space-evenly",
  },

  actionWrapper: {
    alignItems: "center",
  },

  button: {
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

  disabled: {
    opacity: 0.55,
  },

  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
});