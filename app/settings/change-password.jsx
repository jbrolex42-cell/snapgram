import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  TextField,
  PrimaryButton,
  Notice,
} from "../../components/settings/SettingsUI";

import api from "../../services/api";

const CHANGE_PASSWORD_ENDPOINT = "/auth/change-password";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function changePassword() {
    if (saving) {
      return;
    }

    setError("");

    if (!currentPassword) {
      Alert.alert(
        "Current password required",
        "Enter your current password to continue."
      );
      return;
    }

    if (!newPassword) {
      Alert.alert(
        "New password required",
        "Enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password too short",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Choose a different password",
        "Your new password must be different from your current password."
      );
      return;
    }

    if (!confirmPassword) {
      Alert.alert(
        "Confirm your password",
        "Enter your new password again."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "The new password and confirmation password must match."
      );
      return;
    }

    try {
      setSaving(true);

      await api.patch(CHANGE_PASSWORD_ENDPOINT, {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password changed",
        "Your Snapgram password has been changed successfully.",
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
        err?.response?.data || err?.message || err
      );

      const status = err?.response?.status;

      let message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to change your password. Please try again.";

      if (status === 401) {
        message =
          err?.response?.data?.message ||
          "Your current password is incorrect or your session has expired.";
      }

      setError(message);

      Alert.alert("Password change failed", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title="Change password"
      onBack={() => router.back()}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <InfoCard
            icon="key-outline"
            title="Change password"
            text="Choose a strong password that you don't use on other websites or apps."
          />

          {error ? (
            <Notice tone="error">
              {error}
            </Notice>
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter your current password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />

            <TextField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter your new password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />

            <Text style={styles.requirements}>
              Use at least 8 characters. A combination of letters, numbers,
              and symbols is recommended.
            </Text>

            <TextField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter your new password again"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />

            <PrimaryButton
              text={saving ? "Changing password..." : "Change password"}
              disabled={saving}
              onPress={changePassword}
            />
          </View>

          <View style={styles.securityBox}>
            <Text style={styles.securityTitle}>
              Keep your account secure
            </Text>

            <Text style={styles.securityText}>
              Never share your password with anyone. Snapgram support will
              never ask you to send your password or authentication codes.
            </Text>

            <Text style={styles.securityText}>
              If you think someone else knows your password, change it
              immediately and review your Login Activity.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  content: {
    paddingBottom: 36,
  },

  form: {
    marginTop: 8,
  },

  requirements: {
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
  },

  securityBox: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  securityTitle: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  securityText: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
});



