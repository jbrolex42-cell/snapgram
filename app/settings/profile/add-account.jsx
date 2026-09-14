import React from "react";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  PrimaryButton,
  SettingItem,
} from "../../../components/settings/SettingsUI";

export default function AddAccountScreen() {
  function handleLoginAnotherAccount() {
    router.push("/login");
  }

  function handleAccountSwitching() {
    router.push("/settings/profile/account-switching");
  }

  return (
    <Page title="Add account" onBack={() => router.back()}>
      <InfoCard
        icon="person-add-outline"
        title="Add another account"
        text="Log into another Snapgram account and switch between accounts from this device."
      />

      <PrimaryButton
        text="Log into another account"
        onPress={handleLoginAnotherAccount}
      />

      <SettingItem
        title="Account switching"
        subtitle="Manage and switch between accounts already added to this device."
        onPress={handleAccountSwitching}
      />
    </Page>
  );
}