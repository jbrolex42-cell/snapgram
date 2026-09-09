import React from "react";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  SettingItem,
  Notice,
} from "../../../components/settings/SettingsUI";

export default function PasswordSecurityScreen() {
  return (
    <Page
      title="Password & security"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="shield-checkmark-outline"
        title="Password & security"
        text="Manage your password, sign-in security, and devices that have access to your Snapgram account."
      />

      <SettingItem
        title="Change password"
        subtitle="Update your Snapgram account password."
        onPress={() => router.push("/settings/change-password")}
      />

      <SettingItem
        title="Two-factor authentication"
        subtitle="Add an extra security step when signing in."
        onPress={() => router.push("/settings/profile/two-factor")}
      />

      <SettingItem
        title="Login activity"
        subtitle="Review devices and sessions that have recently accessed your account."
        onPress={() => router.push("/settings/profile/login-activity")}
      />

      <SettingItem
        title="Saved login"
        subtitle="Control whether this device remembers your login information."
        onPress={() => router.push("/settings/profile/saved-login")}
      />

      <Notice tone="info">
        If you notice a device or session you don't recognize, review your
        login activity, sign out of the unfamiliar session, and change your
        password immediately.
      </Notice>
    </Page>
  );
}

