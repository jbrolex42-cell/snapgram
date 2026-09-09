import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function MonetizationEarningsScreen() {
  return (
    <SettingsDetailScreen
      title="Earnings"
      description="Track your professional earnings and monetization activity."
      items={[
        {
          title: "Total earnings",
          subtitle: "View your total monetization earnings",
          icon: "cash-outline",
        },
        {
          title: "Earnings history",
          subtitle: "Review previous earnings",
          icon: "receipt-outline",
        },
        {
          title: "Earnings activity",
          subtitle: "See recent monetization activity",
          icon: "analytics-outline",
        },
      ]}
    />
  );
}