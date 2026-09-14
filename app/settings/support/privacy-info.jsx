import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Page, InfoCard } from "../../../components/settings/SettingsUI";

const PRIVACY_URL = "https://your-domain.com/privacy";

export default function PrivacyInfoScreen() {
  const [opening, setOpening] = useState(false);

  async function openPrivacyPolicy() {
    if (opening) return;

    try {
      setOpening(true);

      const supported = await Linking.canOpenURL(PRIVACY_URL);

      if (!supported) {
        Alert.alert(
          "Unable to open Privacy Policy",
          "Your device cannot open the Snapgram Privacy Policy."
        );
        return;
      }

      await Linking.openURL(PRIVACY_URL);
    } catch (error) {
      console.error("OPEN PRIVACY POLICY ERROR:", error);

      Alert.alert(
        "Unable to open Privacy Policy",
        "Something went wrong while opening the Privacy Policy. Please try again."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <Page title="Privacy" onBack={() => router.back()}>
      <InfoCard
        icon="shield-checkmark-outline"
        title="Snapgram Privacy"
        text="Learn how Snapgram collects, uses, stores, and protects your information."
      />

      <Pressable
        onPress={openPrivacyPolicy}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel="Open Snapgram Privacy Policy"
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          opening && styles.disabled,
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>↗</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {opening ? "Opening Privacy Policy..." : "Privacy Policy"}
          </Text>

          <Text style={styles.subtitle}>
            Read the complete Snapgram Privacy Policy in your browser.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Your privacy matters</Text>

        <Text style={styles.noticeText}>
          You can manage many privacy controls directly from Snapgram,
          including account privacy, blocked accounts, muted accounts,
          restricted accounts, comments, tags, and mentions.
        </Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  pressed: {
    opacity: 0.65,
  },

  disabled: {
    opacity: 0.5,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
    marginRight: 13,
  },

  icon: {
    fontSize: 21,
    fontWeight: "600",
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666",
  },

  arrow: {
    fontSize: 28,
    fontWeight: "300",
    color: "#999",
    marginLeft: 10,
  },

  notice: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },

  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
});