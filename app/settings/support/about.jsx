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

import {
  InfoCard,
  Page,
} from "../../../components/settings/SettingsUI";

const ABOUT_URL = "https://your-domain.com/about";

export default function AboutScreen() {
  const [opening, setOpening] = useState(false);

  async function openAboutPage() {
    if (opening) {
      return;
    }

    try {
      setOpening(true);

      const supported = await Linking.canOpenURL(ABOUT_URL);

      if (!supported) {
        Alert.alert(
          "Unable to open page",
          "Your device cannot open the Snapgram About page."
        );
        return;
      }

      await Linking.openURL(ABOUT_URL);
    } catch (error) {
      console.error(
        "OPEN ABOUT PAGE ERROR:",
        error?.message || error
      );

      Alert.alert(
        "Unable to open page",
        "Something went wrong while opening the Snapgram About page."
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <Page
      title="About"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="information-circle-outline"
        title="About Snapgram"
        text="Learn more about Snapgram, our features, policies, company information and the latest app details."
      />

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open Snapgram About page"
        onPress={openAboutPage}
        disabled={opening}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          opening && styles.disabled,
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🌐</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {opening ? "Opening..." : "About Snapgram"}
          </Text>

          <Text style={styles.subtitle}>
            View Snapgram information in your browser.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F7F7F7",
  },

  pressed: {
    opacity: 0.65,
  },

  disabled: {
    opacity: 0.5,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F5FF",
  },

  icon: {
    fontSize: 20,
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#737373",
  },

  arrow: {
    marginLeft: 10,
    fontSize: 27,
    fontWeight: "300",
    color: "#999999",
  },
});

