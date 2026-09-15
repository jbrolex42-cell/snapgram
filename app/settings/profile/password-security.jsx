import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Notice } from "../../../components/settings/SettingsUI";

function SecurityRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      <View
        style={[
          styles.rowIcon,
          danger && styles.dangerIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#d93025" : "#111"}
        />
      </View>

      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowTitle,
            danger && styles.dangerText,
          ]}
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.rowSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#999"
      />
    </TouchableOpacity>
  );
}

function SectionTitle({ children }) {
  return (
    <Text style={styles.sectionTitle}>
      {children}
    </Text>
  );
}

export default function PasswordSecurityScreen() {
  function openChangePassword() {
    router.push("/settings/change-password");
  }

  function openTwoFactor() {
    router.push(
      "/settings/profile/two-factor"
    );
  }

  function openLoginActivity() {
    router.push(
      "/settings/profile/login-activity"
    );
  }

  function openSavedLogin() {
    router.push(
      "/settings/profile/saved-login"
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Password & security
        </Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Security intro */}

        <View style={styles.intro}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={34}
              color="#111"
            />
          </View>

          <Text style={styles.title}>
            Password & security
          </Text>

          <Text style={styles.subtitle}>
            Manage how you sign in and protect
            your Snapgram account.
          </Text>
        </View>

        {/* Security status */}

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="checkmark"
              size={22}
              color="#fff"
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Security settings
            </Text>

            <Text style={styles.statusText}>
              Review your password, login sessions
              and additional sign-in protection.
            </Text>
          </View>
        </View>

        {/* Login */}

        <SectionTitle>
          Login & recovery
        </SectionTitle>

        <View style={styles.sectionCard}>
          <SecurityRow
            icon="key-outline"
            title="Change password"
            subtitle="Update your Snapgram account password."
            onPress={
              openChangePassword
            }
          />

          <View style={styles.divider} />

          <SecurityRow
            icon="shield-checkmark-outline"
            title="Two-factor authentication"
            subtitle="Add an extra security step when signing in."
            onPress={openTwoFactor}
          />

          <View style={styles.divider} />

          <SecurityRow
            icon="phone-portrait-outline"
            title="Login activity"
            subtitle="Review devices and sessions that have accessed your account."
            onPress={openLoginActivity}
          />
        </View>

        {/* Saved login */}

        <SectionTitle>
          Login information
        </SectionTitle>

        <View style={styles.sectionCard}>
          <SecurityRow
            icon="save-outline"
            title="Saved login"
            subtitle="Control whether this device remembers your login information."
            onPress={openSavedLogin}
          />
        </View>

        {/* Recommended security */}

        <SectionTitle>
          Recommended
        </SectionTitle>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationIcon}>
            <Ionicons
              name="shield-outline"
              size={24}
              color="#111"
            />
          </View>

          <Text style={styles.recommendationTitle}>
            Protect your account
          </Text>

          <Text style={styles.recommendationText}>
            Use a strong, unique password and
            enable two-factor authentication to
            make unauthorized access harder.
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openTwoFactor}
            style={styles.recommendationButton}
          >
            <Text
              style={
                styles.recommendationButtonText
              }
            >
              Set up two-factor authentication
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        {/* Security warning */}

        <View style={styles.warningCard}>
          <Ionicons
            name="warning-outline"
            size={21}
            color="#b45309"
          />

          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>
              Don't recognize a login?
            </Text>

            <Text style={styles.warningText}>
              Check your login activity and sign
              out of any device you don't recognize.
              Then change your password.
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openLoginActivity}
            >
              <Text style={styles.warningLink}>
                Review login activity
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Notice tone="info">
          Snapgram will never ask you to share
          your password or security codes with
          another person.
        </Notice>

        <Text style={styles.footer}>
          Snapgram security
        </Text>
      </ScrollView>
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

  headerButton: {
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

  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 45,
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 24,
  },

  securityIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
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

  subtitle: {
    marginTop: 6,
    maxWidth: 340,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
    textAlign: "center",
  },

  statusCard: {
    minHeight: 76,
    marginBottom: 26,
    padding: 14,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
  },

  statusContent: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  statusText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  sectionTitle: {
    marginBottom: 9,
    marginLeft: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  sectionCard: {
    marginBottom: 24,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dedede",
    backgroundColor: "#fff",
  },

  row: {
    minHeight: 78,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  rowIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  dangerIcon: {
    backgroundColor: "#fff1f0",
  },

  rowContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  rowTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#111",
  },

  rowSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  dangerText: {
    color: "#d93025",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 55,
    backgroundColor: "#e5e5e5",
  },

  recommendationCard: {
    marginBottom: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  recommendationIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9e9",
    marginBottom: 12,
  },

  recommendationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  recommendationText: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  recommendationButton: {
    minHeight: 43,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recommendationButtonText: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  warningCard: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff7ed",
  },

  warningContent: {
    flex: 1,
    marginLeft: 10,
  },

  warningTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#92400e",
  },

  warningText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#a16207",
  },

  warningLink: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 11.5,
    color: "#aaa",
  },
});