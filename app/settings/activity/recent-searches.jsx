import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function RecentSearchesScreen() {
  return (
    <SettingsDetailScreen
      title="Recent searches"
      description="Review your recent searches."
      items={[
        {
          title: "Search history",
          subtitle: "View accounts and content you've searched for",
          icon: "search-outline",
        },
        {
          title: "Clear search history",
          subtitle: "Remove your recent searches",
          icon: "trash-outline",
        },
      ]}
    />
  );
}

