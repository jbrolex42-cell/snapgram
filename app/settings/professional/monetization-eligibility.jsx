import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function MonetizationEligibilityScreen() {
  return (
    <SettingsDetailScreen
      title="Monetization eligibility"
      description="Check whether your account meets the requirements for professional monetization features."
      items={[
        {
          title: "Account eligibility",
          subtitle: "Check your account's current eligibility",
          icon: "checkmark-circle-outline",
        },
        {
          title: "Requirements",
          subtitle: "Review monetization requirements",
          icon: "list-outline",
        },
        {
          title: "Policy status",
          subtitle: "Review your account's policy status",
          icon: "shield-checkmark-outline",
        },
      ]}
    />
  );
}