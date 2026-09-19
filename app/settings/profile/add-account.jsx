import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "../../../context/AuthContext";

export default function AddAccountScreen() {
  const { user } = useAuth();

  const username =
    user?.username ||
    user?.email ||
    "Your account";

  function handleLoginAnotherAccount() {
    router.push("/login");
  }

  function handleAccountSwitching() {
    router.push(
      "/settings/profile/account-switching"
    );
  }

  return (
    <View style={styles.screen}>

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
          Add account
        </Text>

        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>

        <View style={styles.iconCircle}>
          <Ionicons
            name="person-add-outline"
            size={38}
            color="#111"
          />
        </View>

        <Text style={styles.title}>
          Add an account
        </Text>

        <Text style={styles.description}>
          Add another Snapgram account to this
          device so you can quickly switch between
          your accounts without logging out.
        </Text>

        <View style={styles.currentAccount}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {String(username)
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>
              Currently logged in as
            </Text>

            <Text
              style={styles.accountUsername}
              numberOfLines={1}
            >
              {username}
            </Text>
          </View>

          <View style={styles.checkCircle}>
            <Ionicons
              name="checkmark"
              size={15}
              color="#fff"
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLoginAnotherAccount}
          style={styles.primaryButton}
        >
          <Ionicons
            name="log-in-outline"
            size={20}
            color="#fff"
          />

          <Text style={styles.primaryButtonText}>
            Log into another account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleAccountSwitching}
          style={styles.switchRow}
        >
          <View style={styles.switchIcon}>
            <Ionicons
              name="swap-horizontal-outline"
              size={22}
              color="#111"
            />
          </View>

          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>
              Account switching
            </Text>

            <Text style={styles.switchSubtitle}>
              View and switch between accounts
              already saved on this device.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8e8e8e"
          />
        </TouchableOpacity>

        <View style={styles.securityBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color="#737373"
          />

          <Text style={styles.securityText}>
            Your accounts remain separate. Adding
            another account does not merge profiles,
            posts, messages, or account settings.
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Snapgram
      </Text>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 42,
  },

  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 18,
  },

  title: {
    textAlign: "center",
    fontSize: 23,
    fontWeight: "700",
    color: "#111",
  },

  description: {
    maxWidth: 350,
    alignSelf: "center",
    marginTop: 9,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
  },

  currentAccount: {
    minHeight: 74,
    marginTop: 30,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dedede",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },

  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },

  accountLabel: {
    fontSize: 11.5,
    color: "#737373",
    marginBottom: 3,
  },

  accountUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  primaryButton: {
    height: 48,
    marginTop: 18,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  primaryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  switchRow: {
    minHeight: 78,
    marginTop: 14,
    paddingVertical: 13,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },

  switchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  switchContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  switchTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#111",
  },

  switchSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  securityBox: {
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f7f7f7",
  },

  securityText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: "#737373",
  },

  footer: {
    paddingBottom: 28,
    textAlign: "center",
    fontSize: 12,
    color: "#999",
  },
});