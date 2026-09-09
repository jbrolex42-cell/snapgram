import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function GiftsScreen() {
  return (
    <SettingsDetailScreen
      title="Gifts"
      description="Manage gifts and professional support received from your audience."
      items={[
        {
          title: "Gifts received",
          subtitle: "Review gifts you've received",
          icon: "gift-outline",
        },
        {
          title: "Gift activity",
          subtitle: "View recent gift activity",
          icon: "time-outline",
        },
        {
          title: "Gift settings",
          subtitle: "Manage how gifts work on your account",
          icon: "settings-outline",
        },
      ]}
    />
  );
}

