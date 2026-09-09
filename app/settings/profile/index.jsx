import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Notice,
  Page,
  SectionHeading,
  SettingItem,
} from "../../../components/settings/SettingsUI";

const sections = [
  {
    title: "Account",
    items: [
      {
        title: "Edit profile",
        subtitle:
          "Edit your profile, username, bio and profile photo.",
        icon: "person-outline",
        route: "/settings/profile/edit-profile",
      },
      {
        title: "Personal information",
        subtitle:
          "Manage your email, phone, birthday and personal details.",
        icon: "person-circle-outline",
        route: "/settings/profile/personal-info",
      },
      {
        title: "Password & security",
        subtitle:
          "Manage your password and account security.",
        icon: "key-outline",
        route: "/settings/profile/password-security",
      },
      {
        title: "Two-factor authentication",
        subtitle:
          "Add an extra sign-in protection step.",
        icon: "shield-checkmark-outline",
        route: "/settings/profile/two-factor",
      },
      {
        title: "Login activity",
        subtitle:
          "Review recent devices and sign-ins.",
        icon: "phone-portrait-outline",
        route: "/settings/profile/login-activity",
      },
      {
        title: "Verification",
        subtitle:
          "Apply for verification or review your status.",
        icon: "checkmark-circle-outline",
        route: "/settings/profile/verification",
      },
      {
        title: "Account status",
        subtitle:
          "Review account restrictions and recommendations.",
        icon: "shield-outline",
        route: "/settings/profile/account-status",
      },
      {
        title: "Add account",
        subtitle:
          "Sign in to another Snapgram account.",
        icon: "person-add-outline",
        route: "/settings/profile/add-account",
      },
      {
        title: "Account switching",
        subtitle:
          "Manage and switch between saved accounts.",
        icon: "swap-horizontal-outline",
        route: "/settings/profile/account-switching",
      },
      {
        title: "Deactivate or delete account",
        subtitle:
          "Start account deactivation or deletion.",
        icon: "trash-outline",
        route: "/settings/profile/account-actions",
        danger: true,
      },
    ],
  },

  {
    title: "Privacy",
    items: [
      {
        title: "Privacy",
        subtitle:
          "Choose whether your account is private and manage privacy.",
        icon: "lock-closed-outline",
        route: "/settings/privacy/privacy",
      },
      {
        title: "Blocked users",
        subtitle:
          "Manage accounts you have blocked.",
        icon: "ban-outline",
        route: "/settings/privacy/blocked",
      },
      {
        title: "Muted accounts",
        subtitle:
          "Manage accounts and content you have muted.",
        icon: "volume-mute-outline",
        route: "/settings/privacy/muted",
      },
      {
        title: "Restricted accounts",
        subtitle:
          "Manage accounts you have restricted.",
        icon: "remove-circle-outline",
        route: "/settings/privacy/restricted",
      },
      {
        title: "Close friends",
        subtitle:
          "Manage the people in your close friends list.",
        icon: "people-outline",
        route: "/settings/privacy/close-friends",
      },
      {
        title: "Hidden words",
        subtitle:
          "Filter unwanted words, comments and message requests.",
        icon: "eye-off-outline",
        route: "/settings/privacy/hidden-words",
      },
      {
        title: "Tags & mentions",
        subtitle:
          "Control who can tag or mention you.",
        icon: "at-outline",
        route: "/settings/privacy/tags-mentions",
      },
      {
        title: "Comments",
        subtitle:
          "Control who can comment and interact with your content.",
        icon: "chatbubble-outline",
        route: "/settings/privacy/comments",
      },
    ],
  },

  {
    title: "Messaging",
    items: [
      {
        title: "Messages",
        subtitle:
          "Control who can message and contact you.",
        icon: "paper-plane-outline",
        route: "/settings/messaging/messages",
      },
      {
        title: "Message requests",
        subtitle:
          "Choose how new message requests are handled.",
        icon: "mail-unread-outline",
        route: "/settings/messaging/message-requests",
      },
      {
        title: "Calls",
        subtitle:
          "Manage voice and video call availability.",
        icon: "call-outline",
        route: "/settings/messaging/calls",
      },
      {
        title: "Sharing & reuse",
        subtitle:
          "Control sharing and reuse of your content.",
        icon: "share-outline",
        route: "/settings/messaging/sharing",
      },
    ],
  },

  {
    title: "Activity",
    items: [
      {
        title: "Your activity",
        subtitle:
          "Review your posts, stories, reels and interactions.",
        icon: "heart-outline",
        route: "/settings/activity/activity",
      },
      {
        title: "Time spent",
        subtitle:
          "Review the time you spend on Snapgram.",
        icon: "time-outline",
        route: "/settings/activity/time-spent",
      },
      {
        title: "Saved",
        subtitle:
          "View and manage saved content.",
        icon: "bookmark-outline",
        route: "/settings/activity/saved",
      },
      {
        title: "Archived",
        subtitle:
          "View and manage archived content.",
        icon: "archive-outline",
        route: "/settings/activity/archived",
      },
      {
        title: "Posts",
        subtitle:
          "Manage your posts.",
        icon: "images-outline",
        route: "/settings/activity/your-posts",
      },
      {
        title: "Reels",
        subtitle:
          "Manage your reels.",
        icon: "play-circle-outline",
        route: "/settings/activity/reels",
      },
      {
        title: "Stories",
        subtitle:
          "Manage your stories.",
        icon: "camera-outline",
        route: "/settings/activity/your-stories",
      },
    ],
  },

  {
    title: "Preferences",
    items: [
      {
        title: "Appearance",
        subtitle:
          "Choose light, dark or system appearance.",
        icon: "contrast-outline",
        route: "/settings/preferences/appearance",
      },
      {
        title: "Language",
        subtitle:
          "Choose your preferred app language.",
        icon: "language-outline",
        route: "/settings/preferences/language",
      },
      {
        title: "Accessibility",
        subtitle:
          "Manage accessibility and assistive options.",
        icon: "accessibility-outline",
        route: "/settings/preferences/accessibility",
      },
      {
        title: "Media quality",
        subtitle:
          "Control upload and playback quality.",
        icon: "image-outline",
        route: "/settings/preferences/media-quality",
      },
      {
        title: "Data usage",
        subtitle:
          "Manage mobile data usage.",
        icon: "cellular-outline",
        route: "/settings/preferences/data-usage",
      },
      {
        title: "Motion",
        subtitle:
          "Control animations and motion effects.",
        icon: "flash-outline",
        route: "/settings/preferences/motion",
      },
    ],
  },

  {
    title: "Professional",
    items: [
      {
        title: "Professional dashboard",
        subtitle:
          "Access insights and professional tools.",
        icon: "analytics-outline",
        route: "/settings/professional/professional-dashboard",
      },
      {
        title: "Subscription",
        subtitle:
          "Manage your subscription status.",
        icon: "card-outline",
        route: "/settings/professional/subscription",
      },
      {
        title: "Monetization",
        subtitle:
          "Review available monetization tools.",
        icon: "cash-outline",
        route: "/settings/professional/monetization",
      },
      {
        title: "Gifts",
        subtitle:
          "Manage gifts and creator support features.",
        icon: "gift-outline",
        route: "/settings/professional/gifts",
      },
    ],
  },

  {
    title: "Notifications",
    items: [
      {
        title: "Notifications",
        subtitle:
          "Manage push notifications and activity alerts.",
        icon: "notifications-outline",
        route: "/settings/notifications/notifications",
      },
      {
        title: "Notification messages",
        subtitle:
          "Control message notification preferences.",
        icon: "chatbubble-ellipses-outline",
        route: "/settings/notifications/messages",
      },
    ],
  },

  {
    title: "Support",
    items: [
      {
        title: "Help",
        subtitle:
          "Get help with Snapgram features and your account.",
        icon: "help-circle-outline",
        route: "/settings/support/help",
      },
      {
        title: "Report a problem",
        subtitle:
          "Send a problem report to Snapgram.",
        icon: "flag-outline",
        route: "/settings/support/report-problem",
      },
      {
        title: "Privacy information",
        subtitle:
          "Read Snapgram's privacy information.",
        icon: "document-text-outline",
        route: "/settings/support/privacy-info",
      },
      {
        title: "Terms",
        subtitle:
          "Read Snapgram's terms and conditions.",
        icon: "newspaper-outline",
        route: "/settings/support/terms",
      },
      {
        title: "About",
        subtitle:
          "View Snapgram information and app details.",
        icon: "information-circle-outline",
        route: "/settings/support/about",
      },
    ],
  },

  {
    title: "Account actions",
    items: [
      {
        title: "Log out",
        subtitle:
          "Sign out of this Snapgram account.",
        icon: "log-out-outline",
        route: "/settings/logout",
        danger: true,
      },
    ],
  },
];

export default function SettingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return sections;
    }

    return sections
      .map((section) => {
        const sectionMatches = section.title
          .toLowerCase()
          .includes(query);

        const matchingItems = section.items.filter(
          (item) => {
            const title = item.title
              .toLowerCase();

            const subtitle = item.subtitle
              .toLowerCase();

            return (
              sectionMatches ||
              title.includes(query) ||
              subtitle.includes(query)
            );
          }
        );

        return {
          ...section,
          items: matchingItems,
        };
      })
      .filter(
        (section) =>
          section.items.length > 0
      );
  }, [searchQuery]);

  const openRoute = useCallback((route) => {
    if (!route) {
      return;
    }

    router.push(route);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const hasSearchQuery =
    searchQuery.trim().length > 0;

  const hasResults =
    filteredSections.length > 0;

  return (
    <Page
      title="Settings"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.content}
      >
        <Notice>
          Manage your Snapgram account, privacy,
          security and app preferences.
        </Notice>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#737373"
          />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search settings"
            placeholderTextColor="#737373"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />

          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear settings search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#8A8A8A"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {hasSearchQuery && !hasResults ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="search-outline"
                size={30}
                color="#777777"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No settings found
            </Text>

            <Text style={styles.emptyText}>
              Try searching for privacy, password,
              messages, notifications or subscription.
            </Text>
          </View>
        ) : null}

        {filteredSections.map((section) => (
          <View
            key={section.title}
            style={styles.section}
          >
            <SectionHeading>
              {section.title}
            </SectionHeading>

            {section.items.map((item) => (
              <SettingItem
                key={item.route}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                danger={item.danger === true}
                onPress={() =>
                  openRoute(item.route)
                }
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },

  searchContainer: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F1F1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginTop: 14,
    marginBottom: 20,
  },

  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#111111",
    marginLeft: 9,
    paddingVertical: 0,
  },

  clearButton: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    marginBottom: 18,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 45,
    paddingBottom: 55,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#777777",
    textAlign: "center",
  },
});