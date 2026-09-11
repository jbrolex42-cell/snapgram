import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Colors from "../../constants/Colors";
import api from "../../services/api";

const PRIMARY_COLOR =
  Colors?.primary || "#0095F6";

const TEXT_COLOR = "#262626";
const SECONDARY_TEXT = "#737373";
const BORDER_COLOR = "#DBDBDB";
const INPUT_BACKGROUND = "#FAFAFA";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const isValidEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      cleanEmail
    );

  async function handleReset() {
    if (loading) {
      return;
    }

    if (!cleanEmail) {
      Alert.alert(
        "Email required",
        "Enter the email address associated with your Snapgram account."
      );
      return;
    }

    if (!isValidEmail) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      setSent(true);
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (loading) {
      return;
    }

    router.back();
  }

  function handleLogin() {
    if (loading) {
      return;
    }

    router.replace("/(auth)/login");
  }

  function handleResend() {
    setSent(false);

  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successScreen}>

          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={TEXT_COLOR}
            />
          </Pressable>

          <Text style={styles.logo}>
            Snapgram
          </Text>

          <View style={styles.successIcon}>
            <Ionicons
              name="mail-outline"
              size={42}
              color={TEXT_COLOR}
            />
          </View>

          <Text style={styles.successTitle}>
            Check your email
          </Text>

          <Text style={styles.successDescription}>
            If a Snapgram account is associated with{" "}
            <Text style={styles.emailHighlight}>
              {cleanEmail}
            </Text>
            , we've sent instructions to reset
            your password.
          </Text>

          <Pressable
            onPress={handleLogin}
            style={styles.primaryButton}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              Back to login
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResend}
            style={styles.resendButton}
          >
            <Text style={styles.resendText}>
              Didn't receive the email?
            </Text>

            <Text style={styles.resendLink}>
              Try again
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.container}>

            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={TEXT_COLOR}
              />
            </Pressable>

            <Text style={styles.logo}>
              Snapgram
            </Text>

            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed-outline"
                size={34}
                color={TEXT_COLOR}
              />
            </View>

            <Text style={styles.title}>
              Trouble logging in?
            </Text>

            <Text style={styles.description}>
              Enter your email and we'll send you
              a link to get back into your account.
            </Text>

            <View
              style={[
                styles.inputWrapper,
                focused &&
                  styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#8E8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={handleReset}
                onFocus={() =>
                  setFocused(true)
                }
                onBlur={() =>
                  setFocused(false)
                }
                style={styles.input}
              />

              {email.length > 0 && !loading && (
                <Pressable
                  onPress={() => setEmail("")}
                  hitSlop={10}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color="#8E8E8E"
                  />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleReset}
              disabled={loading}
              style={[
                styles.primaryButton,
                loading &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Send login link
                </Text>
              )}
            </Pressable>

            <View style={styles.createAccountRow}>
              <Text style={styles.createAccountText}>
                Don't have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.replace(
                    "/(auth)/register"
                  )
                }
                disabled={loading}
              >
                <Text
                  style={styles.createAccountLink}
                >
                  Sign up
                </Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />

              <Text style={styles.orText}>
                OR
              </Text>

              <View style={styles.divider} />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                Back to login
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    zIndex: 10,
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
    borderColor: TEXT_COLOR,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_COLOR,
    textAlign: "center",
  },

  description: {
    maxWidth: 310,
    marginTop: 9,
    marginBottom: 24,
    fontSize: 13,
    lineHeight: 19,
    color: SECONDARY_TEXT,
    textAlign: "center",
  },

  inputWrapper: {
    width: "100%",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    backgroundColor: INPUT_BACKGROUND,
    marginBottom: 10,
  },

  inputWrapperFocused: {
    borderColor: "#A8A8A8",
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 13,
    color: TEXT_COLOR,
  },

  clearButton: {
    paddingHorizontal: 12,
  },

  primaryButton: {
    width: "100%",
    height: 44,
    borderRadius: 7,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  createAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
  },

  createAccountText: {
    color: SECONDARY_TEXT,
    fontSize: 13,
  },

  createAccountLink: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_COLOR,
  },

  orText: {
    marginHorizontal: 14,
    color: "#8E8E8E",
    fontSize: 11,
    fontWeight: "700",
  },

  loginButton: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  loginButtonText: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },

  successScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  successIcon: {
    width: 82,
    height: 82,
    borderWidth: 2,
    borderColor: TEXT_COLOR,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: TEXT_COLOR,
    textAlign: "center",
  },

  successDescription: {
    maxWidth: 330,
    marginTop: 12,
    marginBottom: 26,
    color: SECONDARY_TEXT,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  emailHighlight: {
    color: TEXT_COLOR,
    fontWeight: "700",
  },

  resendButton: {
    marginTop: 22,
    alignItems: "center",
  },

  resendText: {
    color: SECONDARY_TEXT,
    fontSize: 13,
  },

  resendLink: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
});