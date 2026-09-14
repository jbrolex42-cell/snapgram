import React from "react";
import SettingsDetailScreen from "../../../components/settings/SettingsDetailScreen";

export default function RecentlyDeletedScreen() {
  return (
    <SettingsDetailScreen
      title="Recently deleted"
      description="Content you've deleted may remain here temporarily before being permanently removed."
      items={[
        {
          title: "Recently deleted posts",
          subtitle: "View posts you've deleted",
          icon: "trash-outline",
        },
        {
          title: "Recently deleted stories",
          subtitle: "View stories you've deleted",
          icon: "images-outline",
        },
        {
          title: "Recently deleted reels",
          subtitle: "View reels you've deleted",
          icon: "play-circle-outline",
        },
      ]}
    />
  );
}