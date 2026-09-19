import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import api from "../../../services/api";

function ActionRow({
  icon,
  title,
  description,
  danger = false,
  disabled = false,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionRow,
        disabled && styles.disabledRow,
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          danger && styles.dangerIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={danger ? "#ed4956" : "#111"}
        />
      </View>

      <View style={styles.actionContent}>
        <Text
          style={[
            styles.actionTitle,
            danger && styles.dangerText,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.actionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#a0a0a0"
      />
    </TouchableOpacity>
  );
}

export default function AccountActionsScreen() {
  const [running, setRunning] = useState(false);

  function executeAccountAction(type) {
    if (running) {
      return;
    }

    const isDelete = type === "delete";

    Alert.alert(
      isDelete
        ? "Delete account?"
        : "Deactivate account?",
      isDelete
        ? "Deleting your account may permanently remove your profile, posts, messages, and other account data. This action should only be continued if you are sure."
        : "Deactivating your account may temporarily disable access to your profile and account. You can continue only if you are sure.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isDelete
            ? "Delete"
            : "Deactivate",
          style: "destructive",
          onPress: () =>
            submitAccountAction(type),
        },
      ]
    );
  }

  async function submitAccountAction(type) {
    if (running) {
      return;
    }

    try {
      setRunning(true);

      const isDelete = type === "delete";

      const response = await api.request({
        method: isDelete
          ? "delete"
          : "patch",
        url: isDelete
          ? "/users/me"
          : "/users/me/deactivate",
      });

      const message =
        response?.data?.message ||
        (isDelete
          ? "Your account has been deleted successfully."
          : "Your account has been deactivated successfully.");

      Alert.alert(
        isDelete
          ? "Account deleted"
          : "Account deactivated",
        message,
        [
          {
            text: "OK",
            onPress: () => {
              if (isDelete) {
                router.replace("/login");
                return;
              }

              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "ACCOUNT ACTION ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const status =
        error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to complete this account action.";

      if (
        status === 404 ||
        status === 405
      ) {
        Alert.alert(
          "Feature unavailable",
          "Your current backend does not provide this account action yet. No account change was made."
        );

        return;
      }

      Alert.alert(
        "Action failed",
        message
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          disabled={running}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Deactivate or delete account
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="warning-outline"
              size={34}
              color="#ed4956"
            />
          </View>

          <Text style={styles.heroTitle}>
            Account actions
          </Text>

          <Text style={styles.heroText}>
            Choose what you want to do with your
            Snapgram account. These actions can
            affect your profile and account data.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#555"
          />

          <Text style={styles.warningText}>
            Your account is only changed after the
            Snapgram server successfully processes
            your request.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Account options
        </Text>

        <View style={styles.actionsCard}>
          <ActionRow
            icon="pause-circle-outline"
            title="Deactivate account"
            description="Temporarily disable your account. Your profile may become unavailable until the account is reactivated."
            danger
            disabled={running}
            onPress={() =>
              executeAccountAction("deactivate")
            }
          />

          <View style={styles.divider} />

          <ActionRow
            icon="trash-outline"
            title="Delete account"
            description="Permanently delete your account when this feature is supported by the backend."
            danger
            disabled={running}
            onPress={() =>
              executeAccountAction("delete")
            }
          />
        </View>

        {running ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="small"
              color="#0095f6"
            />

            <Text style={styles.loadingText}>
              Processing your request...
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={running}
          onPress={() => router.back()}
          style={[
            styles.backButton,
            running && styles.disabledButton,
          ]}
        >
          <Text style={styles.backButtonText}>
            Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          If you are having problems with your
          account, consider contacting Snapgram
          support before deleting it.
        </Text>
      </View>
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
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
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

  headerSpacer: {
    width: 44,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff1f2",
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  heroText: {
    maxWidth: 350,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  warningText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  actionsCard: {
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },

  actionRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  disabledRow: {
    opacity: 0.5,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginRight: 12,
  },

  dangerIcon: {
    backgroundColor: "#fff1f2",
  },

  actionContent: {
    flex: 1,
    paddingRight: 10,
  },

  actionTitle: {
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  dangerText: {
    color: "#ed4956",
  },

  actionDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
    backgroundColor: "#e5e5e5",
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 18,
  },

  loadingText: {
    fontSize: 13,
    color: "#737373",
  },

  backButton: {
    height: 46,
    marginTop: 20,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
  },

  disabledButton: {
    opacity: 0.5,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  footerText: {
    marginTop: 18,
    paddingHorizontal: 12,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#8a8a8a",
  },
});