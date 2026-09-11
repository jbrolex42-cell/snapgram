import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import Colors from "../../constants/Colors";
import api from "../../services/api";

const PRIMARY_COLOR =
  Colors?.primary || "#0095F6";

export default function ResetPasswordScreen() {
  const params =
    useLocalSearchParams();

  const [token, setToken] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const receivedToken =
      Array.isArray(params.token)
        ? params.token[0]
        : params.token;

    if (receivedToken) {
      setToken(receivedToken);
    }
  }, [params.token]);

  async function handleReset() {
    if (loading) {
      return;
    }

    if (!token) {
      Alert.alert(
        "Invalid link",
        "This password reset link is invalid or incomplete."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Password required",
        "Enter your new password."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Password too short",
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "Make sure both passwords are identical."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/reset-password",
        {
          token,
          password,
        }
      );

      Alert.alert(
        "Password changed",
        "Your password has been reset successfully.",
        [
          {
            text: "Log in",
            onPress: () =>
              router.replace(
                "/(auth)/login"
              ),
          },
        ]
      );
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Reset failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>

            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color="#262626"
              />
            </Pressable>

            <Text style={styles.logo}>
              Snapgram
            </Text>

            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed-outline"
                size={34}
                color="#262626"
              />
            </View>

            <Text style={styles.title}>
              Create a new password
            </Text>

            <Text style={styles.description}>
              Your new password must contain at
              least 8 characters.
            </Text>

            <PasswordInput
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              visible={showPassword}
              onToggle={() =>
                setShowPassword(
                  value => !value
                )
              }
              disabled={loading}
            />

            <PasswordInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(
                  value => !value
                )
              }
              disabled={loading}
            />

            <Pressable
              onPress={handleReset}
              disabled={loading}
              style={[
                styles.button,
                loading &&
                  styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.buttonText}>
                  Reset password
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() =>
                router.replace(
                  "/(auth)/login"
                )
              }
              style={styles.loginButton}
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Back to login
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordInput({
  placeholder,
  value,
  onChangeText,
  visible,
  onToggle,
  disabled,
}) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E8E"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        style={styles.input}
      />

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={styles.showButton}
      >
        <Text style={styles.showText}>
          {visible ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  container: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: "center",
  },

  backButton: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.8,
    color: "#111111",
    marginBottom: 28,
  },

  iconCircle: {
    width: 78,
    height: 78,
    borderWidth: 2,
    borderColor: "#262626",
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#262626",
    textAlign: "center",
  },

  description: {
    maxWidth: 310,
    marginTop: 9,
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  inputWrapper: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 6,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#262626",
  },

  showButton: {
    paddingHorizontal: 12,
  },

  showText: {
    color: "#262626",
    fontSize: 12,
    fontWeight: "700",
  },

  button: {
    width: "100%",
    height: 44,
    borderRadius: 7,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  loginButton: {
    marginTop: 24,
  },

  loginText: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "700",
  },
});