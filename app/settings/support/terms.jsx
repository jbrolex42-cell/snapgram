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

const TERMS_URL = "https://your-domain.com/terms";

export default function TermsScreen() {
  const [opening, setOpening] = useState(false);

  async function openTerms() {
    if (opening) {
      return;
    }

    try {
      setOpening(true);

      const supported = await Linking.canOpenURL(TERMS_URL);

      if (!supported) {
        Alert.alert(
          "Unable to open Terms",
          "Your device cannot open the Snapgram Terms of Service."
        );
        return;
      }

      await Linking.openURL(TERMS_URL);
    } catch (error) {
      console.error("OPEN TERMS ERROR:", error);

      Alert.alert(
        "Unable to open Terms",
        "Something went wrong while opening the Terms of Service. Please try again."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <Page title="Terms" onBack={() => router.back()}>
      <InfoCard
        icon="newspaper-outline"
        title="Snapgram Terms of Service"
        text="Review the terms and conditions that govern your use of Snapgram."
      />

      <Pressable
        onPress={openTerms}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel="Open Snapgram Terms of Service"
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
            {opening ? "Opening Terms..." : "Terms of Service"}
          </Text>

          <Text style={styles.subtitle}>
            Read the complete Snapgram Terms of Service in your browser.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Please read carefully</Text>

        <Text style={styles.infoText}>
          These terms explain your rights and responsibilities when using
          Snapgram, including account usage, content, safety, and platform
          rules.
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

  infoBox: {
    marginTop: 20,
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