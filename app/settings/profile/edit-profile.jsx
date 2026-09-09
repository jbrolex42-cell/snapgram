import React from "react";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  SettingItem,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

export default function EditProfileScreen() {
  const user = {
    name: "Your Name",
    isVerified: true,
  };

  return (
    <Page
      title="Edit profile"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="person-outline"
        title={
          <React.Fragment>
            {user.name}
            {user.isVerified && " ✓"}
          </React.Fragment>
        }
        text="Update your profile information using your existing profile editor."
      />

      <SettingItem
        title="Open profile editor"
        subtitle="Change your profile photo, name, username and bio isVerified."
        onPress={() => router.push("/(tabs)/profile")}
      />

      <SettingItem
        title="Personal information"
        subtitle="Manage email, phone and personal details."
        onPress={() => router.push("/settings/profile/personal-info")}
      />

      <PrimaryButton
        text="Open profile"
        onPress={() => router.push("/(tabs)/profile")}
      />
    </Page>
  );
}