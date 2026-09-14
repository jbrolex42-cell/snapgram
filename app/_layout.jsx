import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  Stack,
  router,
  usePathname,
  useRootNavigationState,
} from "expo-router";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

import {
  connectSocket,
  getSocket,
} from "../services/socket";

import {
  getNotificationResponseData,
} from "../services/notificationService";

function LoadingOverlay() {
  return (
    <View
      pointerEvents="auto"
      style={styles.loadingOverlay}
    >
      <View style={styles.loadingCard}>
        <Text style={styles.loadingLogo}>
          Snapgram
        </Text>

        <ActivityIndicator
          size="small"
        />
      </View>
    </View>
  );
}

function RootNavigator() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const navigationState =
    useRootNavigationState();

  const pathname =
    usePathname();

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    "";

  const navigationReady =
    Boolean(navigationState?.key);

  const redirectingRef =
    useRef(false);

  const lastAuthRouteRef =
    useRef("");

  const handledCallIdsRef =
    useRef(new Set());

  const navigatingToCallRef =
    useRef(false);

  const isAuthRoute =
    pathname === "/login" ||
    pathname?.startsWith("/(auth)") ||
    pathname?.startsWith("/login");

  const isCallRoute =
    pathname?.startsWith("/calls");

  const isIncomingCallRoute =
    pathname === "/calls/incoming" ||
    pathname?.startsWith("/calls/incoming/");

  useEffect(() => {
    if (!navigationReady) {
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      if (isAuthRoute) {
        return;
      }

      if (
        lastAuthRouteRef.current ===
        "login"
      ) {
        return;
      }

      lastAuthRouteRef.current =
        "login";

      redirectingRef.current =
        true;

      router.replace(
        "/(auth)/login"
      );

      const timer =
        setTimeout(() => {
          redirectingRef.current =
            false;
        }, 300);

      return () =>
        clearTimeout(timer);
    }

    lastAuthRouteRef.current =
      "";

    if (isAuthRoute) {
      if (redirectingRef.current) {
        return;
      }

      redirectingRef.current =
        true;

      router.replace(
        "/(tabs)"
      );

      const timer =
        setTimeout(() => {
          redirectingRef.current =
            false;
        }, 300);

      return () =>
        clearTimeout(timer);
    }
  }, [
    user,
    authLoading,
    navigationReady,
    isAuthRoute,
  ]);

  const normalizeIncomingCall =
    useCallback((call) => {
      if (!call) {
        return null;
      }

      const callId =
        call?.callId ||
        call?._id ||
        call?.id;

      if (!callId) {
        console.warn(
          "INCOMING CALL: Missing call ID.",
          call
        );

        return null;
      }

      const caller =
        call?.caller ||
        call?.from ||
        call?.initiator ||
        {};

      const callerId =
        caller?._id ||
        caller?.id ||
        caller?.userId ||
        call?.callerId ||
        call?.fromUserId ||
        "";

      const callerName =
        caller?.username ||
        caller?.fullName ||
        caller?.name ||
        call?.callerName ||
        call?.username ||
        "Someone";

      const callerAvatar =
        caller?.avatar ||
        caller?.profilePicture ||
        caller?.profileImage ||
        call?.callerAvatar ||
        call?.avatar ||
        "";

      const rawType =
        call?.type ||
        call?.callType ||
        "voice";

      const type =
        String(rawType).toLowerCase() ===
        "video"
          ? "video"
          : "voice";

      return {
        callId: String(callId),

        callerId: String(
          callerId || ""
        ),

        callerName: String(
          callerName
        ),

        callerAvatar: String(
          callerAvatar || ""
        ),

        type,
      };
    }, []);

  const openIncomingCall =
    useCallback(
      (rawCall) => {
        if (!rawCall || !user) {
          return;
        }

        if (!navigationReady) {
          return;
        }

        const call =
          normalizeIncomingCall(
            rawCall
          );

        if (!call) {
          return;
        }

        const {
          callId,
          callerId,
          callerName,
          callerAvatar,
          type,
        } = call;

        if (
          currentUserId &&
          callerId &&
          String(callerId) ===
            String(currentUserId)
        ) {
          return;
        }

        if (
          handledCallIdsRef.current.has(
            callId
          )
        ) {
          return;
        }

        if (isCallRoute) {
          console.log(
            "INCOMING CALL IGNORED: already in call.",
            callId
          );

          return;
        }

        if (isIncomingCallRoute) {
          return;
        }

        if (
          navigatingToCallRef.current
        ) {
          return;
        }

        handledCallIdsRef.current.add(
          callId
        );

        navigatingToCallRef.current =
          true;

        console.log(
          "OPENING INCOMING CALL:",
          call
        );

        router.push({
          pathname:
            "/calls/incoming",

          params: {
            callId,
            callerId,
            callerName,
            callerAvatar,
            username: callerName,
            avatar: callerAvatar,
            type,
          },
        });

        const timer =
          setTimeout(() => {
            navigatingToCallRef.current =
              false;
          }, 700);

        return () =>
          clearTimeout(timer);
      },
      [
        user,
        navigationReady,
        currentUserId,
        normalizeIncomingCall,
        isCallRoute,
        isIncomingCallRoute,
      ]
    );

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !currentUserId ||
      !navigationReady
    ) {
      return;
    }

    let cancelled = false;

    try {
      console.log(
        "ROOT SOCKET: Connecting user:",
        currentUserId
      );

      const socket =
        connectSocket(
          String(currentUserId)
        );

      if (!socket) {
        console.warn(
          "ROOT SOCKET: connectSocket returned no socket."
        );

        return;
      }

      if (cancelled) {
        return;
      }

      console.log(
        "ROOT SOCKET: Socket ready."
      );
    } catch (error) {
      console.error(
        "ROOT SOCKET CONNECTION ERROR:",
        error
      );
    }

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    user,
    currentUserId,
    navigationReady,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !currentUserId ||
      !navigationReady
    ) {
      return;
    }

    let cancelled = false;
    let socket = null;

    const attachListener =
      () => {
        if (cancelled) {
          return;
        }

        socket =
          getSocket();

        if (!socket) {
          console.warn(
            "ROOT CALL LISTENER: Socket unavailable."
          );

          return;
        }

        socket.off(
          "call:incoming",
          openIncomingCall
        );

        socket.on(
          "call:incoming",
          openIncomingCall
        );

        console.log(
          "ROOT CALL LISTENER: attached."
        );
      };

    attachListener();

    const currentSocket =
      getSocket();

    if (currentSocket) {
      currentSocket.on(
        "connect",
        attachListener
      );
    }

    return () => {
      cancelled = true;

      if (socket) {
        socket.off(
          "call:incoming",
          openIncomingCall
        );
      }

      if (currentSocket) {
        currentSocket.off(
          "connect",
          attachListener
        );
      }
    };
  }, [
    authLoading,
    user,
    currentUserId,
    navigationReady,
    openIncomingCall,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !navigationReady
    ) {
      return;
    }

    let cancelled = false;
    let subscription = null;

    const setup =
      async () => {
        try {
          const Notifications =
            await import(
              "expo-notifications"
            );

          if (cancelled) {
            return;
          }

          const {
            addNotificationResponseReceivedListener,
          } = Notifications;

          if (
            typeof addNotificationResponseReceivedListener !==
            "function"
          ) {
            return;
          }

          subscription =
            addNotificationResponseReceivedListener(
              (response) => {
                try {
                  const data =
                    getNotificationResponseData(
                      response
                    );

                  if (!data) {
                    return;
                  }

                  if (
                    data?.type !==
                    "incoming-call"
                  ) {
                    return;
                  }

                  console.log(
                    "CALL NOTIFICATION OPENED:",
                    data
                  );

                  openIncomingCall({
                    callId:
                      data?.callId,

                    callType:
                      data?.callType ||
                      "voice",

                    callerId:
                      data?.callerId,

                    callerName:
                      data?.callerName,

                    callerAvatar:
                      data?.callerAvatar,
                  });
                } catch (error) {
                  console.error(
                    "CALL NOTIFICATION HANDLER ERROR:",
                    error
                  );
                }
              }
            );
        } catch (error) {
          console.warn(
            "NOTIFICATION LISTENER SETUP FAILED:",
            error?.message ||
              error
          );
        }
      };

    setup();

    return () => {
      cancelled = true;

      if (
        subscription &&
        typeof subscription.remove ===
          "function"
      ) {
        subscription.remove();
        subscription = null;
      }
    };
  }, [
    authLoading,
    navigationReady,
    openIncomingCall,
  ]);

  return (
    <View style={styles.root}>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "default",
        }}
      />

      {authLoading && (
        <LoadingOverlay />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      "#FFFFFF",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      "#FFFFFF",

    alignItems:
      "center",

    justifyContent:
      "center",

    zIndex: 9999,
  },

  loadingCard: {
    alignItems:
      "center",

    justifyContent:
      "center",
  },

  loadingLogo: {
    fontSize: 36,

    fontWeight:
      "900",

    color:
      "#111111",

    marginBottom:
      20,

    letterSpacing:
      -1,
  },
});