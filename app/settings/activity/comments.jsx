import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function CommentsScreen() {
  return (
    <SettingsDetailScreen
      title="Comments"
      description="Review and manage comments you've made on posts."
      items={[
        {
          title: "Your comments",
          subtitle: "View comments you've posted",
          icon: "chatbubble-outline",
        },
        {
          title: "Comment history",
          subtitle: "Review your recent comment activity",
          icon: "time-outline",
        },
      ]}
    />
  );
}