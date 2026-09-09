import React from "react";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  SettingItem,
} from "../../../components/settings/SettingsUI";

export default function AccountsCenterScreen() {
  function openPersonalInformation() {
    router.push("/settings/profile/personal-info");
  }

  function openPasswordSecurity() {
    router.push("/settings/profile/password-security");
  }

  function openAccountSwitching() {
    router.push("/settings/profile/account-switching");
  }

  return (
    <Page
      title="Accounts Center"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="people-outline"
        title="Accounts Center"
        text="Manage your personal information, security, and connected Snapgram accounts."
      />

      <SettingItem
        title="Personal information"
        subtitle="Manage your email, phone number, birthday, and other personal details."
        onPress={openPersonalInformation}
      />

      <SettingItem
        title="Password & security"
        subtitle="Manage your password, two-factor authentication, and login sessions."
        onPress={openPasswordSecurity}
      />

      <SettingItem
        title="Account switching"
        subtitle="Manage accounts saved on this device and switch between them."
        onPress={openAccountSwitching}
      />
    </Page>
  );
}

