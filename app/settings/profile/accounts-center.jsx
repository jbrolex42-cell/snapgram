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

import { useAuth } from "../../../context/AuthContext";

function AccountRow({
  icon,
  title,
  subtitle,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={23}
          color="#111"
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>
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
        color="#8e8e8e"
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

export default function AccountsCenterScreen() {
  const { user } = useAuth();

  const username =
    user?.username ||
    "Your Snapgram account";

  const displayName =
    user?.fullName ||
    user?.name ||
    username;

  const avatar =
    user?.avatar ||
    user?.profilePicture ||
    null;

  function openPersonalInformation() {
    router.push(
      "/settings/profile/personal-info"
    );
  }

  function openPasswordSecurity() {
    router.push(
      "/settings/profile/password-security"
    );
  }

  function openAccountSwitching() {
    router.push(
      "/settings/profile/account-switching"
    );
  }

  function openAccountStatus() {
    router.push(
      "/settings/profile/account-status"
    );
  }

  function openDeactivateDelete() {
    router.push(
      "/settings/profile/deactivate-delete"
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Accounts Center
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Intro */}

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons
              name="people-outline"
              size={34}
              color="#111"
            />
          </View>

          <Text style={styles.introTitle}>
            Accounts Center
          </Text>

          <Text style={styles.introText}>
            Manage your Snapgram account
            information, security, and account
            switching from one place.
          </Text>
        </View>

        {/* Current account */}

        <SectionTitle>
          Accounts
        </SectionTitle>

        <View style={styles.accountCard}>
          {avatar ? (
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {String(displayName)
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {String(displayName)
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.accountInfo}>
            <Text
              style={styles.accountName}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <Text
              style={styles.accountUsername}
              numberOfLines={1}
            >
              @{username}
            </Text>

            <Text style={styles.accountLabel}>
              Current Snapgram account
            </Text>
          </View>

          <View style={styles.activeDot} />
        </View>

        {/* Account information */}

        <SectionTitle>
          Account settings
        </SectionTitle>

        <View style={styles.sectionCard}>
          <AccountRow
            icon="person-circle-outline"
            title="Personal information"
            subtitle="Manage your email, phone number, birthday, and other personal details."
            onPress={
              openPersonalInformation
            }
          />

          <View style={styles.divider} />

          <AccountRow
            icon="lock-closed-outline"
            title="Password & security"
            subtitle="Manage your password, two-factor authentication, and login sessions."
            onPress={
              openPasswordSecurity
            }
          />

          <View style={styles.divider} />

          <AccountRow
            icon="swap-horizontal-outline"
            title="Account switching"
            subtitle="Manage accounts saved on this device and switch between them."
            onPress={
              openAccountSwitching
            }
          />
        </View>

        {/* Account status */}

        <SectionTitle>
          Account information
        </SectionTitle>

        <View style={styles.sectionCard}>
          <AccountRow
            icon="shield-checkmark-outline"
            title="Account status"
            subtitle="Check restrictions, removed content, and recommendation eligibility."
            onPress={openAccountStatus}
          />
        </View>

        {/* Account ownership */}

        <SectionTitle>
          Account ownership and control
        </SectionTitle>

        <View style={styles.sectionCard}>
          <AccountRow
            icon="pause-circle-outline"
            title="Deactivate or delete account"
            subtitle="Temporarily deactivate or permanently delete your Snapgram account."
            onPress={
              openDeactivateDelete
            }
          />
        </View>

        {/* Information */}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#737373"
          />

          <Text style={styles.infoText}>
            Accounts Center lets you manage
            important account information and
            security controls. Changes are saved
            through your Snapgram account services.
          </Text>
        </View>

        <Text style={styles.footer}>
          Snapgram Accounts Center
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

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 50,
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  introIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 11,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  introText: {
    maxWidth: 350,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },

  sectionTitle: {
    marginBottom: 10,
    marginLeft: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  accountCard: {
    minHeight: 82,
    padding: 14,
    marginBottom: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dedede",
  },

  avatarText: {
    fontSize: 21,
    fontWeight: "700",
    color: "#555",
  },

  accountInfo: {
    flex: 1,
    marginLeft: 13,
  },

  accountName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  accountUsername: {
    marginTop: 2,
    fontSize: 13,
    color: "#666",
  },

  accountLabel: {
    marginTop: 5,
    fontSize: 11.5,
    color: "#0095f6",
    fontWeight: "600",
  },

  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#0095f6",
    marginLeft: 8,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  rowContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 12,
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

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
    backgroundColor: "#e5e5e5",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    color: "#999",
  },
});