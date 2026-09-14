import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";

export default function LogoutScreen() {
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const loggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) {
      return;
    }

    loggingOutRef.current = true;

    if (mountedRef.current) {
      setLoading(true);
      setError("");
    }

    try {
      
      await logout();

      if (!mountedRef.current) {
        return;
      }

      router.replace("/login");
    } catch (logoutError) {
      console.error(
        "LOGOUT SCREEN ERROR:",
        logoutError?.response?.data ||
          logoutError?.message ||
          logoutError
      );

      if (!mountedRef.current) {
        return;
      }

      setLoading(false);
      setError(
        logoutError?.response?.data?.message ||
          logoutError?.message ||
          "Unable to log out. Please try again."
      );
    } finally {
      loggingOutRef.current = false;
    }
  }, [logout]);

  useEffect(() => {
    mountedRef.current = true;

    performLogout();

    return () => {
      mountedRef.current = false;
    };
  }, [performLogout]);

  function handleRetry() {
    performLogout();
  }

  function handleGoBack() {
    router.back();
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.title}>
            Logout failed
          </Text>

          <Text style={styles.message}>
            {error}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try logging out again"
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Try again
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingIcon}>
        <ActivityIndicator
          size="large"
          color="#0095F6"
        />
      </View>

      <Text style={styles.title}>
        Logging out
      </Text>

      <Text style={styles.message}>
        Please wait while we securely sign you out.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },

  loadingIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDEBEC",
    marginBottom: 18,
  },

  errorIconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ED4956",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  message: {
    maxWidth: 340,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#737373",
    textAlign: "center",
  },

  primaryButton: {
    minWidth: 150,
    minHeight: 44,
    marginTop: 24,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095F6",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondaryButton: {
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#737373",
  },

  buttonPressed: {
    opacity: 0.7,
  },
});