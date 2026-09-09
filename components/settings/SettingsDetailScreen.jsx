import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Page, SettingItem, SwitchRow, InfoCard } from "./SettingsUI";

const sections = {
  account: { title: "Account", items: [] },
  privacy: { title: "Privacy", items: [] },
};

export default function SettingsDetailScreen() {
  const params = useLocalSearchParams();
  const key = String(params?.section || "account");
  const section = sections[key] || sections.account;
  return (
    <Page title={section.title} onBack={() => router.back()}>
      <InfoCard title={section.title} text="Settings are managed from the Snapgram settings screens." />
      {section.items.map((item) => <SettingItem key={item[1]} title={item[0]} onPress={() => router.push(`/settings/${item[1]}`)} />)}
    </Page>
  );
}