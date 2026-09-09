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
} from "../../../components/settings/SettingsUI";

import api from "../../../services/api";

export default function ReportProblemScreen() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const remainingCharacters = 3000 - message.length;

  async function submitReport() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      Alert.alert(
        "Description required",
        "Please describe the problem before sending your report."
      );
      return;
    }

    if (trimmedMessage.length < 10) {
      Alert.alert(
        "Description too short",
        "Please provide a little more detail so we can understand the problem."
      );
      return;
    }

    if (sending) {
      return;
    }

    try {
      setSending(true);

      await api.post("/reports/problem", {
        message: trimmedMessage,
      });

      setMessage("");

      Alert.alert(
        "Report submitted",
        "Thank you. Your report has been sent to Snapgram Support."
      );
    } catch (error) {
      console.error(
        "REPORT PROBLEM ERROR:",
        error?.response?.data || error?.message || error
      );

      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;

      if (status === 401) {
        Alert.alert(
          "Session expired",
          "Please log in again before submitting a report."
        );
        return;
      }

      Alert.alert(
        "Report failed",
        serverMessage ||
          error?.message ||
          "Unable to submit your report right now. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Page
      title="Report a problem"
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
            icon="flag-outline"
            title="Report a problem"
            text="Tell us what is not working correctly. Include as much useful detail as possible so the Snapgram team can investigate."
          />

          <View style={styles.form}>
            <TextField
              label="Description"
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the problem, what you were doing, and what happened..."
              multiline
              maxLength={3000}
              editable={!sending}
            />

            <Text style={styles.counter}>
              {remainingCharacters.toLocaleString()} characters remaining
            </Text>

            <PrimaryButton
              text={sending ? "Sending..." : "Send report"}
              disabled={sending || !message.trim()}
              onPress={submitReport}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Before submitting
            </Text>

            <Text style={styles.infoText}>
              Please avoid including your password, authentication codes,
              payment card details, or other sensitive information in your
              report.
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
    paddingBottom: 32,
  },

  form: {
    marginTop: 8,
  },

  counter: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 14,
    fontSize: 12,
    color: "#888",
  },

  infoBox: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
});

