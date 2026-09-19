import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  SectionHeading,
  SettingItem,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
} from "../../../services/settingsApi";

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState("");

  const loadSettingsData = useCallback(async () => {
    try {
      setLoadError("");

      const data = await loadSettings();

      setSettings(data || {});
    } catch (error) {
      console.error(
        "SETTINGS LOAD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setLoadError(
        "Some account settings could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await loadSettingsData();
    } finally {
      setRefreshing(false);
    }
  }, [loadSettingsData]);

  const filteredSections = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return sections;
    }

    return sections
      .map((section) => {
        const sectionMatches =
          section.title
            .toLowerCase()
            .includes(query);

        const matchingItems =
          section.items.filter((item) => {
            const title =
              item.title.toLowerCase();

            const subtitle =
              item.subtitle.toLowerCase();

            return (
              sectionMatches ||
              title.includes(query) ||
              subtitle.includes(query)
            );
          });

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

  const hasSearch =
    searchQuery.trim().length > 0;

  const hasResults =
    filteredSections.length > 0;

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Settings
        </Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >

        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            Settings and activity
          </Text>

          <Text style={styles.introSubtitle}>
            Manage your account, privacy,
            security and Snapgram preferences.
          </Text>
        </View>

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
          />

          {hasSearch ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={clearSearch}
              hitSlop={10}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#8a8a8a"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {!!loadError && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={loadSettingsData}
            style={styles.warning}
          >
            <Ionicons
              name="warning-outline"
              size={19}
              color="#b45309"
            />

            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Settings unavailable
              </Text>

              <Text style={styles.warningText}>
                Some settings could not be loaded.
                Tap to try again.
              </Text>
            </View>

            <Ionicons
              name="refresh-outline"
              size={19}
              color="#b45309"
            />
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="small"
            />

            <Text style={styles.loadingText}>
              Loading settings...
            </Text>
          </View>
        ) : null}

        {!loading &&
        hasSearch &&
        !hasResults ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="search-outline"
                size={30}
                color="#777"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No settings found
            </Text>

            <Text style={styles.emptyText}>
              Try searching for privacy,
              password, messages,
              notifications or account.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={clearSearch}
              style={styles.clearSearchButton}
            >
              <Text
                style={
                  styles.clearSearchButtonText
                }
              >
                Clear search
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading &&
          filteredSections.map(
            (section) => (
              <View
                key={section.title}
                style={styles.section}
              >
                <SectionHeading>
                  {section.title}
                </SectionHeading>

                <View
                  style={styles.sectionCard}
                >
                  {section.items.map(
                    (item, index) => (
                      <React.Fragment
                        key={item.route}
                      >
                        <SettingItem
                          title={item.title}
                          subtitle={
                            item.subtitle
                          }
                          icon={item.icon}
                          danger={
                            item.danger === true
                          }
                          onPress={() =>
                            openRoute(
                              item.route
                            )
                          }
                        />

                        {index <
                          section.items.length -
                            1 && (
                          <View
                            style={
                              styles.divider
                            }
                          />
                        )}
                      </React.Fragment>
                    )
                  )}
                </View>
              </View>
            )
          )}

        {!loading && !hasSearch ? (
          <View style={styles.footer}>
            <View style={styles.footerIcon}>
              <Ionicons
                name="settings-outline"
                size={20}
                color="#999"
              />
            </View>

            <Text style={styles.footerTitle}>
              Snapgram
            </Text>

            <Text style={styles.footerText}>
              Settings and activity
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 45,
  },

  intro: {
    marginBottom: 15,
  },

  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },

  introSubtitle: {
    marginTop: 5,
    fontSize: 13.5,
    lineHeight: 19,
    color: "#737373",
  },

  searchContainer: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f1f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 9,
    paddingVertical: 0,
    fontSize: 15,
    color: "#111",
  },

  clearButton: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  warning: {
    minHeight: 58,
    marginBottom: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
  },

  warningContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },

  warningText: {
    marginTop: 2,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#a16207",
  },

  loading: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#777",
  },

  section: {
    marginBottom: 22,
  },

  sectionCard: {
    overflow: "hidden",
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#dedede",
    backgroundColor: "#fff",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    backgroundColor: "#e5e5e5",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
    textAlign: "center",
  },

  clearSearchButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#0095f6",
  },

  clearSearchButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  footer: {
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 15,
  },

  footerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  footerTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },

  footerText: {
    marginTop: 2,
    fontSize: 11,
    color: "#b0b0b0",
  },
});