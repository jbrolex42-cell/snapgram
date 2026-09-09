import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  SettingItem,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";
import api from "../../../services/api";

export default function AccountActionsScreen() {
  const [running, setRunning] = useState(false);

  async function executeAccountAction(type) {
    if (running) {
      return;
    }

    const isDelete = type === "delete";

    Alert.alert(
      isDelete
        ? "Delete account"
        : "Deactivate account",
      isDelete
        ? "This action may permanently remove your account and its data. Continue only if you are sure."
        : "Deactivating your account may temporarily disable access to your account. Continue only if you are sure.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            submitAccountAction(type),
        },
      ]
    );
  }

  async function submitAccountAction(type) {
    try {
      setRunning(true);

      const endpoint =
        type === "delete"
          ? "/users/me"
          : "/users/me/deactivate";

      const method =
        type === "delete"
          ? "delete"
          : "patch";

      const response =
        await api.request({
          method,
          url: endpoint,
        });

      const message =
        response?.data?.message ||
        (type === "delete"
          ? "Your account deletion request was completed."
          : "Your account has been deactivated.");

      Alert.alert(
        "Request completed",
        message,
        [
          {
            text: "OK",
            onPress: () => {
              if (type === "delete") {
                router.replace("/login");
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error) {
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
          "Action unavailable",
          "The current backend does not expose this account action yet. No account change was made."
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
    <Page
      title="Deactivate or delete account"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="warning-outline"
        title="Account actions"
        text="Use these options only when you understand how they affect your account and data."
      />

      <Notice tone="danger">
        Account changes are only confirmed after the
        backend successfully processes the request.
        The app will never display a successful result
        when no change was made.
      </Notice>

      <SettingItem
        title="Deactivate account"
        subtitle="Temporarily disable your account when this feature is supported by the backend."
        onPress={() =>
          executeAccountAction("deactivate")
        }
        danger
        disabled={running}
      />

      <SettingItem
        title="Delete account"
        subtitle="Permanently delete your account when this feature is supported by the backend."
        onPress={() =>
          executeAccountAction("delete")
        }
        danger
        disabled={running}
      />

      {running ? (
        <View
          style={{
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <ActivityIndicator />
        </View>
      ) : null}

      <PrimaryButton
        text="Back"
        disabled={running}
        onPress={() => router.back()}
      />
    </Page>
  );
}

