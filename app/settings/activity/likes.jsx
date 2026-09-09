import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function LikesScreen() {
  return (
    <SettingsDetailScreen
      title="Likes"
      description="Review posts and content you've liked."
      items={[
        {
          title: "Liked posts",
          subtitle: "View posts you've liked",
          icon: "heart-outline",
        },
        {
          title: "Recent likes",
          subtitle: "See your latest likes",
          icon: "time-outline",
        },
      ]}
    />
  );
}

