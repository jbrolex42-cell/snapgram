import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function LinksScreen() {
  return (
    <SettingsDetailScreen
      title="Links"
      description="Review links you've recently visited or shared."
      items={[
        {
          title: "Recently visited",
          subtitle: "Review links you've opened",
          icon: "link-outline",
        },
        {
          title: "Shared links",
          subtitle: "View links you've shared with others",
          icon: "share-outline",
        },
      ]}
    />
  );
}

