import React from "react";
import { router } from "expo-router";
import {
  Page,
  InfoCard,
  SettingItem,
} from "../../../components/settings/SettingsUI";

export default function ActivityScreen() {
  return (
    <Page
      title="Your activity"
      onBack={() => router.back()}
    >
      {/* Header */}
      <InfoCard
        icon="pulse-outline"
        title="Your activity"
        text="Manage and review your activity, content, and interactions on Snapgram."
      />

      {/* Your content */}
      <SettingItem
        icon="bookmark-outline"
        title="Saved"
        subtitle="View posts, reels and other content you've saved."
        onPress={() => router.push("/settings/activity/saved")}
      />

      <SettingItem
        icon="archive-outline"
        title="Archived"
        subtitle="View posts and stories you've archived."
        onPress={() => router.push("/settings/activity/archived")}
      />

      <SettingItem
        icon="images-outline"
        title="Your posts"
        subtitle="Review and manage the posts you've shared."
        onPress={() => router.push("/settings/activity/your-posts")}
      />

      <SettingItem
        icon="play-circle-outline"
        title="Reels"
        subtitle="Manage reels you've created or shared."
        onPress={() => router.push("/settings/activity/reels")}
      />

      <SettingItem
        icon="camera-outline"
        title="Stories"
        subtitle="Review your active, archived and saved stories."
        onPress={() => router.push("/settings/activity/your-stories")}
      />

      {/* Interactions */}
      <InfoCard
        icon="people-outline"
        title="Interactions"
        text="Keep track of how you interact with people and content."
      />

      <SettingItem
        icon="heart-outline"
        title="Likes"
        subtitle="Review posts and reels you've liked."
        onPress={() => router.push("/settings/activity/likes")}
      />

      <SettingItem
        icon="chatbubble-ellipses-outline"
        title="Comments"
        subtitle="Review comments you've made."
        onPress={() => router.push("/settings/activity/comments")}
      />

      <SettingItem
        icon="at-outline"
        title="Mentions"
        subtitle="See posts and comments where you've been mentioned."
        onPress={() => router.push("/settings/activity/mentions")}
      />

      {/* Account activity */}
      <InfoCard
        icon="time-outline"
        title="Account activity"
        text="Understand how you use Snapgram and manage your activity history."
      />

      <SettingItem
        icon="timer-outline"
        title="Time spent"
        subtitle="See how much time you spend on Snapgram and set reminders."
        onPress={() => router.push("/settings/activity/time-spent")}
      />

      <SettingItem
        icon="search-outline"
        title="Recent searches"
        subtitle="View and manage your recent searches."
        onPress={() => router.push("/settings/activity/recent-searches")}
      />

      <SettingItem
        icon="link-outline"
        title="Links you've visited"
        subtitle="Review links you've recently opened on Snapgram."
        onPress={() => router.push("/settings/activity/links")}
      />

      {/* Recently deleted */}
      <InfoCard
        icon="trash-outline"
        title="Recently deleted"
        text="Content you've deleted is kept here temporarily before permanent deletion."
      />

      <SettingItem
        icon="trash-bin-outline"
        title="Recently deleted"
        subtitle="Restore or permanently delete recently removed content."
        onPress={() => router.push("/settings/activity/recently-deleted")}
      />
    </Page>
  );
}

