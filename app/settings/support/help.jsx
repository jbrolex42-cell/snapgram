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

const SUPPORT_EMAIL = "support@your-domain.com";
const SUPPORT_PHONE = "+254700000000";
const SUPPORT_WHATSAPP = "254700000000";

const HELP_URL = "https://your-domain.com/help";

export default function HelpScreen() {
  const [opening, setOpening] = useState(false);

  async function openURL(url, errorMessage) {
    try {
      setOpening(true);

      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Unable to open", errorMessage);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("HELP ACTION ERROR:", error);

      Alert.alert(
        "Unable to continue",
        "Something went wrong. Please try again."
      );
    } finally {
      setOpening(false);
    }
  }

  function openHelpCenter() {
    openURL(
      HELP_URL,
      "Your device cannot open the Snapgram Help Center."
    );
  }

  function contactEmail() {
    openURL(
      `mailto:${SUPPORT_EMAIL}?subject=Snapgram%20Support`,
      "No email application is available on this device."
    );
  }

  function contactPhone() {
    openURL(
      `tel:${SUPPORT_PHONE}`,
      "Your device cannot make phone calls from this app."
    );
  }

  function contactWhatsApp() {
    openURL(
      `https://wa.me/${SUPPORT_WHATSAPP}?text=Hello%20Snapgram%20Support,%20I%20need%20help.`,
      "WhatsApp is not available on this device."
    );
  }

  return (
    <Page title="Help" onBack={() => router.back()}>
      <InfoCard
        icon="help-circle-outline"
        title="Snapgram Help Center"
        text="Get help with your account, privacy, safety, messaging, reporting, and other Snapgram features."
      />

      <Pressable
        onPress={openHelpCenter}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel="Open Snapgram Help Center"
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
          opening && styles.cardDisabled,
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>↗</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {opening ? "Opening Help Center..." : "Open Help Center"}
          </Text>

          <Text style={styles.subtitle}>
            View the full Snapgram support information in your browser.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Contact Snapgram Support</Text>

      <Pressable
        onPress={contactEmail}
        disabled={opening}
        style={({ pressed }) => [
          styles.contactCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.contactIcon}>
          <Text style={styles.contactEmoji}>✉</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Email</Text>
          <Text style={styles.subtitle}>{SUPPORT_EMAIL}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        onPress={contactWhatsApp}
        disabled={opening}
        style={({ pressed }) => [
          styles.contactCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.contactIcon}>
          <Text style={styles.contactEmoji}>◉</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>WhatsApp</Text>
          <Text style={styles.subtitle}>{SUPPORT_PHONE}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        onPress={contactPhone}
        disabled={opening}
        style={({ pressed }) => [
          styles.contactCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.contactIcon}>
          <Text style={styles.contactEmoji}>☎</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Phone</Text>
          <Text style={styles.subtitle}>{SUPPORT_PHONE}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.footer}>
        For account or security issues, please include your Snapgram username
        when contacting support. Never send your password or authentication
        codes.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  cardPressed: {
    opacity: 0.65,
  },

  cardDisabled: {
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

  contactIcon: {
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

  contactEmoji: {
    fontSize: 19,
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

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777",
    marginTop: 26,
    marginBottom: 4,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});

