import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  Page,
  InfoCard,
  ChoiceSettings,
  SwitchRow,
  PageLoading,
  Notice,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const COMMENTING_OPTIONS = [
  "Everyone",
  "Following",
  "No one",
];

function normalizeCommentingFrom(value) {
  if (
    COMMENTING_OPTIONS.includes(value)
  ) {
    return value;
  }

  return "Everyone";
}

function normalizeCommentFilter(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return true;
}

export default function CommentsScreen() {
  const [who, setWho] =
    useState("Everyone");

  const [filter, setFilter] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async ({
      showLoader = true,
    } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const data =
          await loadSettings();

        const comments =
          data?.preferences
            ?.comments ||
          data?.comments ||
          {};

        const commentingFrom =
          comments?.commentingFrom;

        const commentFilterEnabled =
          comments?.commentFilterEnabled;

        setWho(
          normalizeCommentingFrom(
            commentingFrom
          )
        );

        setFilter(
          normalizeCommentFilter(
            commentFilterEnabled
          )
        );
      } catch (requestError) {
        console.error(
          "LOAD COMMENT SETTINGS ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        setError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "Unable to load your comment settings."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);

        await load({
          showLoader: false,
        });
      } finally {
        setRefreshing(false);
      }
    }, [load]);

  const updateComments =
    useCallback(
      async ({
        commentingFrom = who,
        commentFilterEnabled = filter,
      }) => {
        if (saving) {
          return;
        }

        const previousWho = who;
        const previousFilter = filter;

        const nextWho =
          normalizeCommentingFrom(
            commentingFrom
          );

        const nextFilter =
          normalizeCommentFilter(
            commentFilterEnabled
          );

        setWho(nextWho);
        setFilter(nextFilter);
        setSaving(true);
        setError("");

        try {

          await saveSettings({
            comments: {
              commentingFrom: nextWho,
              commentFilterEnabled:
                nextFilter,
            },
          });
        } catch (requestError) {
          console.error(
            "SAVE COMMENT SETTINGS ERROR:",
            requestError?.response?.data ||
              requestError?.message ||
              requestError
          );

          setWho(previousWho);
          setFilter(previousFilter);

          const message =
            requestError?.response?.data
              ?.message ||
            requestError?.message ||
            "Your comment settings could not be saved.";

          setError(message);

          Alert.alert(
            "Couldn't save setting",
            message
          );
        } finally {
          setSaving(false);
        }
      },
      [who, filter, saving]
    );

  const handleWhoChange =
    useCallback(
      (value) => {
        if (saving) {
          return;
        }

        if (
          !COMMENTING_OPTIONS.includes(
            value
          )
        ) {
          return;
        }

        updateComments({
          commentingFrom: value,
          commentFilterEnabled: filter,
        });
      },
      [filter, saving, updateComments]
    );

  const handleFilterChange =
    useCallback(
      (value) => {
        if (saving) {
          return;
        }

        updateComments({
          commentingFrom: who,
          commentFilterEnabled:
            Boolean(value),
        });
      },
      [who, saving, updateComments]
    );

  if (loading) {
    return (
      <Page
        title="Comments"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Comments"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#262626"
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <InfoCard
          icon="chatbubble-outline"
          title="Comments"
          text="Control who can comment on your posts and filter unwanted comments."
        />

        {/* ---------------------------------------------------------------- */}
        {/* Error                                                             */}
        {/* ---------------------------------------------------------------- */}

        {error ? (
          <View
            style={styles.noticeContainer}
          >
            <Notice tone="danger">
              {error}
            </Notice>

            <PrimaryButton
              text="Reload settings"
              onPress={() => load()}
              disabled={saving}
            />
          </View>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* Who can comment                                                   */}
        {/* ---------------------------------------------------------------- */}

        <ChoiceSettings
          title="Who can comment?"
          options={COMMENTING_OPTIONS}
          selected={who}
          onSelect={handleWhoChange}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Comment filtering                                                 */}
        {/* ---------------------------------------------------------------- */}

        <SwitchRow
          title="Filter unwanted comments"
          subtitle="Automatically filter potentially unwanted or offensive comments."
          value={filter}
          onChange={handleFilterChange}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Status                                                             */}
        {/* ---------------------------------------------------------------- */}

        {saving ? (
          <View
            style={styles.savingContainer}
          >
            <Text
              style={styles.savingText}
            >
              Saving changes...
            </Text>
          </View>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* Explanation                                                       */}
        {/* ---------------------------------------------------------------- */}

        <View
          style={styles.infoSection}
        >
          <Text
            style={styles.infoTitle}
          >
            About comments
          </Text>

          <Text
            style={styles.infoText}
          >
            Your comment controls apply to
            new comments on your content.
            You can also manage individual
            comments directly from your posts.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },

  noticeContainer: {
    marginTop: 12,
    marginBottom: 8,
  },

  savingContainer: {
    marginTop: 18,
    alignItems: "center",
  },

  savingText: {
    fontSize: 13,
    color: "#737373",
  },

  infoSection: {
    marginTop: 28,
    paddingHorizontal: 4,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },
});