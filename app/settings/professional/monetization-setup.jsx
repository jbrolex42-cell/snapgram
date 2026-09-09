import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function MonetizationSetupScreen() {
  return (
    <SettingsDetailScreen
      title="Monetization setup"
      description="Set up your account to use available professional monetization features."
      items={[
        {
          title: "Get started",
          subtitle: "Begin setting up monetization",
          icon: "rocket-outline",
        },
        {
          title: "Payment information",
          subtitle: "Add or update your payout information",
          icon: "card-outline",
        },
        {
          title: "Tax information",
          subtitle: "Manage information required for payouts",
          icon: "document-text-outline",
        },
        {
          title: "Monetization preferences",
          subtitle: "Manage your professional monetization settings",
          icon: "options-outline",
        },
      ]}
    />
  );
}