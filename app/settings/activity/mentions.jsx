import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function MentionsScreen() {
  return (
    <SettingsDetailScreen
      title="Mentions"
      description="Review activity involving mentions of your account."
      items={[
        {
          title: "Mentions",
          subtitle: "See posts and comments where you're mentioned",
          icon: "at-outline",
        },
        {
          title: "Recent mentions",
          subtitle: "Review your latest mentions",
          icon: "time-outline",
        },
      ]}
    />
  );
}

