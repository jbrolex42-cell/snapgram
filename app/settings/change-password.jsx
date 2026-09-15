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

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import api from "../../services/api";

const CHANGE_PASSWORD_ENDPOINT =
  "/auth/change-password";

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  editable = true,
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          !editable && styles.inputDisabled,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          style={styles.input}
          returnKeyType="done"
        />

        <Pressable
          onPress={onToggle}
          disabled={!editable}
          hitSlop={10}
          style={styles.eyeButton}
        >
          <Ionicons
            name={
              visible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={21}
            color={
              editable ? "#555" : "#aaa"
            }
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function changePassword() {
    if (saving) {
      return;
    }

    setError("");

    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!current) {
      setError(
        "Enter your current password."
      );
      return;
    }

    if (!next) {
      setError(
        "Enter a new password."
      );
      return;
    }

    if (next.length < 8) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (next === current) {
      setError(
        "Your new password must be different from your current password."
      );
      return;
    }

    if (!confirm) {
      setError(
        "Confirm your new password."
      );
      return;
    }

    if (next !== confirm) {
      setError(
        "Your new password and confirmation password don't match."
      );
      return;
    }

    try {
      setSaving(true);

      await api.patch(
        CHANGE_PASSWORD_ENDPOINT,
        {
          currentPassword: current,
          newPassword: next,
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password changed",
        "Your password has been changed successfully.",
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err?.response?.data ||
          err?.message ||
          err
      );

      const status =
        err?.response?.status;

      let message =
        err?.response?.data?.message ||
        "Unable to change your password. Please try again.";

      if (status === 401) {
        message =
          err?.response?.data?.message ||
          "Your current password is incorrect or your session has expired.";
      }

      if (status === 400) {
        message =
          err?.response?.data?.message ||
          "Please check your password details and try again.";
      }

      setError(message);

      Alert.alert(
        "Password change failed",
        message
      );
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    !saving;

  return (
    <View style={styles.screen}>
      {/* Header */}

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Change password
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          {/* Intro */}

          <View style={styles.intro}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="key-outline"
                size={31}
                color="#111"
              />
            </View>

            <Text style={styles.title}>
              Change your password
            </Text>

            <Text style={styles.description}>
              Choose a strong password that you
              don't use anywhere else.
            </Text>
          </View>

          {/* Error */}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color="#c62828"
              />

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}

          <View style={styles.form}>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={
                setCurrentPassword
              }
              placeholder="Current password"
              visible={showCurrent}
              onToggle={() =>
                setShowCurrent(
                  (value) => !value
                )
              }
              editable={!saving}
            />

            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              visible={showNew}
              onToggle={() =>
                setShowNew(
                  (value) => !value
                )
              }
              editable={!saving}
            />

            <View style={styles.passwordHint}>
              <Ionicons
                name={
                  newPassword.length >= 8
                    ? "checkmark-circle"
                    : "information-circle-outline"
                }
                size={17}
                color={
                  newPassword.length >= 8
                    ? "#2e7d32"
                    : "#777"
                }
              />

              <Text
                style={[
                  styles.passwordHintText,
                  newPassword.length >= 8 &&
                    styles.passwordValid,
                ]}
              >
                Use at least 8 characters.
                Letters, numbers and symbols are
                recommended.
              </Text>
            </View>

            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={
                setConfirmPassword
              }
              placeholder="Confirm new password"
              visible={showConfirm}
              onToggle={() =>
                setShowConfirm(
                  (value) => !value
                )
              }
              editable={!saving}
            />

            {confirmPassword.length > 0 ? (
              <View style={styles.matchRow}>
                <Ionicons
                  name={
                    newPassword ===
                    confirmPassword
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={17}
                  color={
                    newPassword ===
                    confirmPassword
                      ? "#2e7d32"
                      : "#c62828"
                  }
                />

                <Text
                  style={[
                    styles.matchText,
                    newPassword ===
                      confirmPassword &&
                      styles.passwordValid,
                  ]}
                >
                  {newPassword ===
                  confirmPassword
                    ? "Passwords match"
                    : "Passwords don't match"}
                </Text>
              </View>
            ) : null}

            {/* Submit */}

            <Pressable
              onPress={changePassword}
              disabled={!canSubmit}
              style={[
                styles.submitButton,
                (!canSubmit ||
                  saving) &&
                  styles.submitDisabled,
              ]}
            >
              {saving ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.submitText
                    }
                  >
                    Changing password...
                  </Text>
                </>
              ) : (
                <Text
                  style={styles.submitText}
                >
                  Change password
                </Text>
              )}
            </Pressable>
          </View>

          {/* Security information */}

          <View style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <View
                style={styles.securityIcon}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#111"
                />
              </View>

              <Text style={styles.securityTitle}>
                Keep your account secure
              </Text>
            </View>

            <Text style={styles.securityText}>
              Use a password that is unique to
              Snapgram and difficult for other
              people to guess.
            </Text>

            <Text style={styles.securityText}>
              Never share your password with
              anyone. Snapgram support will never
              ask you to send your password or
              authentication codes.
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  "/settings/profile/login-activity"
                )
              }
              style={styles.activityLink}
            >
              <Text style={styles.activityLinkText}>
                Review login activity
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#111"
              />
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Your password protects your Snapgram
            account and personal information.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  headerSpacer: {
    width: 44,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 50,
  },

  intro: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 14,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  description: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  errorBox: {
    marginBottom: 18,
    padding: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff1f0",
  },

  errorText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 18,
    color: "#c62828",
  },

  form: {
    marginBottom: 25,
  },

  fieldContainer: {
    marginBottom: 17,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  inputDisabled: {
    opacity: 0.55,
  },

  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
  },

  eyeButton: {
    width: 46,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordHint: {
    marginTop: -7,
    marginBottom: 18,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  passwordHintText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12,
    lineHeight: 17,
    color: "#777",
  },

  passwordValid: {
    color: "#2e7d32",
  },

  matchRow: {
    marginTop: -8,
    marginBottom: 18,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },

  matchText: {
    marginLeft: 7,
    fontSize: 12,
    color: "#c62828",
  },

  submitButton: {
    minHeight: 50,
    marginTop: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#0095f6",
  },

  submitDisabled: {
    backgroundColor: "#b2dffc",
  },

  submitText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  securityCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
  },

  securityTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  securityText: {
    marginBottom: 9,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  activityLink: {
    minHeight: 42,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activityLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  footer: {
    marginTop: 22,
    paddingHorizontal: 20,
    fontSize: 11.5,
    lineHeight: 17,
    color: "#aaa",
    textAlign: "center",
  },
});