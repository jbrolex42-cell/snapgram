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
  useLocalSearchParams,
  router,
} from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

import {
  waitForSocket,
  onSocketEvent,
  acceptCall,
  rejectCall,
  missedCall,
} from "../../services/socket";

function normalizeId(value) {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
}

export default function IncomingCallScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const callId = normalizeId(params.callId);

  const callerId = normalizeId(
    params.callerId || params.fromUserId
  );

  const type = String(params.type || "voice");
  const isVideoCall = type === "video";

  const callerName =
    params.callerName ||
    params.fullName ||
    params.username ||
    "Snapgram user";

  const currentUserId = normalizeId(
    user?._id || user?.id
  );

  const mountedRef = useRef(true);
  const handledRef = useRef(false);
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidCall =
    Boolean(callId) &&
    Boolean(callerId) &&
    Boolean(currentUserId) &&
    callerId !== currentUserId;

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const leaveScreen = useCallback(() => {
    cleanup();

    if (mountedRef.current) {
      router.back();
    }
  }, [cleanup]);

  const handleReject = useCallback(async () => {
    if (handledRef.current) return;

    if (!isValidCall) {
      leaveScreen();
      return;
    }

    handledRef.current = true;
    setLoading(true);
    setError("");

    try {
      const socket = await waitForSocket();

      if (!socket) {
        throw new Error(
          "Socket connection is unavailable."
        );
      }

      rejectCall(callId);

      leaveScreen();
    } catch (rejectError) {
      console.error(
        "[INCOMING CALL] Reject failed:",
        rejectError
      );

      handledRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setError(
          rejectError?.message ||
            "Unable to reject the call."
        );
      }
    }
  }, [
    callId,
    isValidCall,
    leaveScreen,
  ]);

  const handleAccept = useCallback(async () => {
    if (handledRef.current) return;

    if (!isValidCall) {
      setError("This call is no longer valid.");
      return;
    }

    handledRef.current = true;
    setLoading(true);
    setError("");

    try {
      const socket = await waitForSocket();

      if (!socket) {
        throw new Error(
          "Socket connection is unavailable."
        );
      }

      acceptCall(callId);

      cleanup();

      router.replace({
        pathname: "/calls/[callId]",
        params: {
          callId,
          callerId,
          receiverId: currentUserId,
          otherUserId: callerId,
          type,
        },
      });
    } catch (acceptError) {
      console.error(
        "[INCOMING CALL] Accept failed:",
        acceptError
      );

      handledRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setError(
          acceptError?.message ||
            "Unable to accept the call."
        );
      }
    }
  }, [
    callId,
    callerId,
    cleanup,
    currentUserId,
    isValidCall,
    type,
  ]);

  const handleMissed = useCallback(() => {
    if (handledRef.current) return;
    if (!isValidCall) return;

    handledRef.current = true;

    try {
      missedCall(callId);
    } catch (missedError) {
      console.warn(
        "[INCOMING CALL] Missed call failed:",
        missedError?.message || missedError
      );
    }

    leaveScreen();
  }, [
    callId,
    isValidCall,
    leaveScreen,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isValidCall) {
      setError("Invalid incoming call.");
      return;
    }

    let cancelled = false;
    const cleanupListeners = [];

    async function initialize() {
      try {
        const socket = await waitForSocket();

        if (cancelled || !mountedRef.current) {
          return;
        }

        cleanupListeners.push(
          onSocketEvent(
            "call:cancelled",
            (data) => {
              if (
                normalizeId(data?.call?.id || data?.callId) !==
                callId
              ) {
                return;
              }

              leaveScreen();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:ended",
            (data) => {
              if (
                normalizeId(data?.call?.id || data?.callId) !==
                callId
              ) {
                return;
              }

              leaveScreen();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:rejected",
            (data) => {
              if (
                normalizeId(data?.call?.id || data?.callId) !==
                callId
              ) {
                return;
              }

              leaveScreen();
            }
          )
        );

        timeoutRef.current = setTimeout(() => {
          handleMissed();
        }, 90000);
      } catch (socketError) {
        console.error(
          "[INCOMING CALL] Socket setup failed:",
          socketError
        );

        if (mountedRef.current) {
          setError(
            socketError?.message ||
              "Unable to connect to the call."
          );
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      cleanup();

      for (const remove of cleanupListeners) {
        try {
          remove?.();
        } catch {}
      }
    };
  }, [
    callId,
    cleanup,
    handleMissed,
    isValidCall,
    leaveScreen,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.incoming}>
          Incoming {isVideoCall ? "video" : "voice"} call
        </Text>

        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name={
              isVideoCall
                ? "video-account"
                : "account"
            }
            size={64}
            color="#fff"
          />
        </View>

        <Text style={styles.name}>
          {callerName}
        </Text>

        <Text style={styles.subtitle}>
          {isVideoCall
            ? "Video call"
            : "Voice call"}
        </Text>

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.action,
              styles.reject,
            ]}
            disabled={loading}
            onPress={handleReject}
          >
            <MaterialCommunityIcons
              name="phone-hangup"
              size={30}
              color="#fff"
            />

            <Text style={styles.actionText}>
              Decline
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.action,
              styles.accept,
            ]}
            disabled={loading}
            onPress={handleAccept}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name={
                  isVideoCall
                    ? "video"
                    : "phone"
                }
                size={30}
                color="#fff"
              />
            )}

            <Text style={styles.actionText}>
              Accept
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  incoming: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 28,
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  name: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "700",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 15,
    marginTop: 8,
  },

  error: {
    color: "#ff7676",
    textAlign: "center",
    marginTop: 20,
  },

  actions: {
    position: "absolute",
    bottom: 55,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },

  action: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },

  reject: {
    backgroundColor: "#ff3b30",
  },

  accept: {
    backgroundColor: "#34c759",
  },

  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});