import React, { useEffect } from "react";

import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
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
  getSocket,
} from "../services/socket";

function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <Text style={styles.loadingLogo}>
        Snapgram
      </Text>

      <ActivityIndicator
        size="small"
      />
    </View>
  );
}

function RootNavigator() {
  const {
    user,
    loading,
  } = useAuth();

  const navigationState =
    useRootNavigationState();

  const segments =
    useSegments();

  useEffect(() => {
    if (
      loading ||
      !navigationState?.key
    ) {
      return;
    }

    const firstSegment =
      segments?.[0];

    const inAuthGroup =
      firstSegment === "(auth)";

    const inAppGroup =
      firstSegment === "(tabs)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace(
          "/(auth)/login"
        );
      }

      return;
    }

    if (
      inAuthGroup ||
      !firstSegment
    ) {
      router.replace(
        "/(tabs)"
      );

      return;
    }

    if (
      inAppGroup ||
      firstSegment
    ) {
      return;
    }
  }, [
    user,
    loading,
    navigationState?.key,
    segments,
  ]);

  useEffect(() => {
    if (
      loading ||
      !user
    ) {
      return;
    }

    const socket =
      getSocket();

    if (!socket) {
      return;
    }

    const handleIncomingCall =
      (call) => {
        if (!call) {
          return;
        }

        router.push({
          pathname:
            "/calls/incoming",

          params: {
            callId:
              call?.callId ||
              "",

            username:
              call?.caller
                ?.username ||
              "",

            avatar:
              call?.caller
                ?.avatar ||
              "",

            type:
              call?.type ||
              "voice",

            callerId:
              call?.caller
                ?._id ||
              "",
          },
        });
      };

    socket.on(
      "call:incoming",
      handleIncomingCall
    );

    return () => {
      socket.off(
        "call:incoming",
        handleIncomingCall
      );
    };
  }, [
    user,
    loading,
  ]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
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
  loadingScreen: {
    flex: 1,

    backgroundColor:
      "#FFFFFF",

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
  },
});