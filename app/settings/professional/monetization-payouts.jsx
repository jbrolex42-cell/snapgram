import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function MonetizationPayoutsScreen() {
  return (
    <SettingsDetailScreen
      title="Payouts"
      description="Manage your payout information and review payout activity."
      items={[
        {
          title: "Payout method",
          subtitle: "Manage how you receive your earnings",
          icon: "card-outline",
        },
        {
          title: "Payout history",
          subtitle: "Review completed and pending payouts",
          icon: "receipt-outline",
        },
        {
          title: "Payout status",
          subtitle: "Check the status of your latest payouts",
          icon: "time-outline",
        },
      ]}
    />
  );
}