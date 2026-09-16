import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Page,
  InfoCard,
  SettingItem,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

const ACTIVITY_ROUTES = {
  saved: "/settings/activity/saved",
  archived: "/settings/activity/archived",
  posts: "/settings/activity/your-posts",
  reels: "/settings/activity/reels",
  stories: "/settings/activity/your-stories",

  likes: "/settings/activity/likes",
  comments: "/settings/activity/comments",
  mentions: "/settings/activity/mentions",

  timeSpent: "/settings/activity/time-spent",
  recentSearches: "/settings/activity/recent-searches",
  links: "/settings/activity/links",

  recentlyDeleted: "/settings/activity/recently-deleted",
};

function SectionTitle({ children }) {
  const { theme } = useSettingsTheme();

  return (
    <Text
      style={[
        styles.sectionTitle,
        {
          color: theme.secondaryText,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function ActivityCard({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}) {
  const { theme } = useSettingsTheme();

  return (
    <SettingItem
      icon={icon}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      danger={danger}
    />
  );
}

function ActivitySummary() {
  const { theme } = useSettingsTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.summaryHeader}>
        <View
          style={[
            styles.summaryIcon,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <Ionicons
            name="pulse-outline"
            size={21}
            color={theme.text}
          />
        </View>

        <View style={styles.summaryText}>
          <Text
            style={[
              styles.summaryTitle,
              {
                color: theme.text,
              },
            ]}
          >
            Your activity
          </Text>

          <Text
            style={[
              styles.summarySubtitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Manage what you've shared, saved and interacted
            with on Snapgram.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const { theme } = useSettingsTheme();

  return (
    <Page
      title="Your activity"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ActivitySummary />

        {/* YOUR CONTENT */}

        <SectionTitle>YOUR CONTENT</SectionTitle>

        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityCard
            icon="bookmark-outline"
            title="Saved"
            subtitle="View posts, reels and other content you've saved."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.saved)
            }
          />

          <ActivityCard
            icon="archive-outline"
            title="Archived"
            subtitle="View posts and stories you've archived."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.archived)
            }
          />

          <ActivityCard
            icon="images-outline"
            title="Your posts"
            subtitle="Review and manage posts you've shared."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.posts)
            }
          />

          <ActivityCard
            icon="play-circle-outline"
            title="Reels"
            subtitle="Manage reels you've created or shared."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.reels)
            }
          />

          <ActivityCard
            icon="camera-outline"
            title="Stories"
            subtitle="Review your active and archived stories."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.stories)
            }
          />
        </View>

        {/* INTERACTIONS */}

        <SectionTitle>INTERACTIONS</SectionTitle>

        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityCard
            icon="heart-outline"
            title="Likes"
            subtitle="Review posts and reels you've liked."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.likes)
            }
          />

          <ActivityCard
            icon="chatbubble-ellipses-outline"
            title="Comments"
            subtitle="Review comments you've made."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.comments)
            }
          />

          <ActivityCard
            icon="at-outline"
            title="Mentions"
            subtitle="See posts and comments where you've been mentioned."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.mentions)
            }
          />
        </View>

        {/* HOW YOU USE SNAPGRAM */}

        <SectionTitle>HOW YOU USE SNAPGRAM</SectionTitle>

        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityCard
            icon="timer-outline"
            title="Time spent"
            subtitle="See how much time you spend on Snapgram and set reminders."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.timeSpent)
            }
          />

          <ActivityCard
            icon="search-outline"
            title="Recent searches"
            subtitle="View and manage your recent searches."
            onPress={() =>
              router.push(
                ACTIVITY_ROUTES.recentSearches
              )
            }
          />

          <ActivityCard
            icon="link-outline"
            title="Links you've visited"
            subtitle="Review links you've recently opened on Snapgram."
            onPress={() =>
              router.push(ACTIVITY_ROUTES.links)
            }
          />
        </View>

        {/* RECENTLY DELETED */}

        <SectionTitle>REMOVED CONTENT</SectionTitle>

        <View
          style={[
            styles.group,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <ActivityCard
            icon="trash-bin-outline"
            title="Recently deleted"
            subtitle="Restore or permanently delete recently removed content."
            danger
            onPress={() =>
              router.push(
                ACTIVITY_ROUTES.recentlyDeleted
              )
            }
          />
        </View>

        <View style={styles.bottomInfo}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={theme.secondaryText}
          />

          <Text
            style={[
              styles.bottomInfoText,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Your activity is private and can only be viewed
            from your account.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  summaryText: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  summarySubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 22,
  },

  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: "hidden",
  },

  bottomInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 24,
  },

  bottomInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});