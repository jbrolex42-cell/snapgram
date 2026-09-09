import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

export default function LiveScreen() {
  const [
    starting,
    setStarting,
  ] = useState(false);

  const handleStartLive =
    useCallback(() => {
      if (starting) {
        return;
      }

      setStarting(true);

      /*
       * Give the UI a small transition
       * before opening the camera.
       */
      setTimeout(() => {
        if (!starting) {
          setStarting(false);

          router.push({
            pathname:
              "/create/camera",
            params: {
              mode: "live",
            },
          });
        }
      }, 250);
    }, [starting]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "bottom",
      ]}
    >
      <View style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.back()
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons
              name="close"
              size={29}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Live
          </Text>

          <View
            style={styles.headerButton}
          />
        </View>

        {/* CONTENT */}

        <View style={styles.content}>
          {/* LIVE ICON */}

          <View style={styles.liveIconOuter}>
            <View
              style={styles.liveIconInner}
            >
              <Ionicons
                name="radio"
                size={43}
                color="#FFFFFF"
              />
            </View>
          </View>

          <Text style={styles.title}>
            Go Live
          </Text>

          <Text style={styles.description}>
            Share what&apos;s happening and
            connect with your followers in
            real time.
          </Text>

          {/* INFO */}

          <View style={styles.infoCard}>
            <InfoRow
              icon="people-outline"
              title="Connect with followers"
              text="Your followers can watch and interact with your live video."
            />

            <View style={styles.divider} />

            <InfoRow
              icon="chatbubble-outline"
              title="Live comments"
              text="See comments and interact with viewers while you are live."
            />

            <View style={styles.divider} />

            <InfoRow
              icon="videocam-outline"
              title="Camera and microphone"
              text="Your camera and microphone will be used during the broadcast."
            />
          </View>

          {/* START */}

          <TouchableOpacity
            style={[
              styles.startButton,
              starting &&
                styles.startButtonDisabled,
            ]}
            onPress={
              handleStartLive
            }
            disabled={starting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start live video"
          >
            {starting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="radio"
                size={20}
                color="#FFFFFF"
              />
            )}

            <Text
              style={
                styles.startButtonText
              }
            >
              {starting
                ? "Opening camera..."
                : "Start live video"}
            </Text>
          </TouchableOpacity>

          {/* PRIVACY */}

          <View style={styles.footer}>
            <Ionicons
              name="lock-closed-outline"
              size={13}
              color="#666666"
            />

            <Text
              style={styles.footerText}
            >
              You can end your live video at
              any time.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>
          {title}
        </Text>

        <Text style={styles.infoText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },

  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  /*
   * HEADER
   */

  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#262626",
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /*
   * CONTENT
   */

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 43,
  },

  /*
   * ICON
   */

  liveIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#0D0D0D",
    marginBottom: 23,
  },

  liveIconInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
  },

  /*
   * TITLE
   */

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 8,
  },

  description: {
    maxWidth: 320,
    textAlign: "center",
    color: "#A8A8A8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },

  /*
   * INFO
   */

  infoCard: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 14,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#252525",
    overflow: "hidden",
    marginBottom: 26,
  },

  infoRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222222",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    marginBottom: 3,
  },

  infoText: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 17,
  },

  divider: {
    height:
      StyleSheet.hairlineWidth,
    backgroundColor: "#282828",
    marginLeft: 70,
  },

  /*
   * BUTTON
   */

  startButton: {
    width: "100%",
    maxWidth: 390,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#0095F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  startButtonDisabled: {
    opacity: 0.55,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * FOOTER
   */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
    paddingHorizontal: 10,
  },

  footerText: {
    color: "#666666",
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 5,
    textAlign: "center",
  },
});