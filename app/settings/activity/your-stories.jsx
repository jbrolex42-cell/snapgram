import React, { useCallback, useEffect, useState } from "react";
import {
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
  PageLoading,
  SettingItem,
  Notice,
} from "../../../components/settings/SettingsUI";

import { loadSettings } from "../../../services/settingsApi";

export default function StoriesScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await loadSettings();

      const stories = Array.isArray(data?.stories)
        ? data.stories
        : [];

      setItems(stories);
    } catch (err) {
      console.error("STORIES LOAD ERROR:", err);

      setItems([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your stories."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  function getStoryId(item, index) {
    return (
      item?._id ||
      item?.id ||
      item?.storyId ||
      `story-${index}`
    );
  }

  function getTitle(item, index) {
    if (item?.title?.trim()) {
      return item.title.trim();
    }

    if (item?.caption?.trim()) {
      return item.caption.trim();
    }

    if (item?.text?.trim()) {
      return item.text.trim();
    }

    return `Story ${index + 1}`;
  }

  function getDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function formatDate(value) {
    const date = getDate(value);

    if (!date) {
      return "Story";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStoryStatus(item) {
    const expiresAt = getDate(
      item?.expiresAt
    );

    if (expiresAt) {
      return expiresAt.getTime() > Date.now()
        ? `Active • Expires ${formatDate(
            item.expiresAt
          )}`
        : `Expired • ${formatDate(
            item.expiresAt
          )}`;
    }

    if (item?.archived === true) {
      return "Archived";
    }

    return `Posted ${formatDate(
      item?.createdAt
    )}`;
  }

  function getViewCount(item) {
    return Number(
      item?.viewsCount ??
        item?.viewCount ??
        item?.views?.length ??
        0
    );
  }

  function openStory(item) {
    const id =
      item?._id ||
      item?.id ||
      item?.storyId;

    if (!id) return;

    router.push({
      pathname: "/settings/activity/your-stories/[id]",
      params: {
        id: String(id),
      },
    });
  }

  if (loading) {
    return (
      <Page
        title="Stories"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Stories"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >

        <InfoCard
          icon="camera-outline"
          title="Your stories"
          text="Manage stories you've shared, view their activity, and access archived stories."
        />

        {error ? (
          <Notice>
            {error}
          </Notice>
        ) : null}

        {!error ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {items.length}
              </Text>

              <Text style={styles.summaryLabel}>
                {items.length === 1
                  ? "Story"
                  : "Stories"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {items.filter(
                  (item) =>
                    getDate(item?.expiresAt)?.getTime() >
                    Date.now()
                ).length}
              </Text>

              <Text style={styles.summaryLabel}>
                Active
              </Text>
            </View>
          </View>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item, index) => {
              const views = getViewCount(item);

              return (
                <SettingItem
                  key={getStoryId(
                    item,
                    index
                  )}
                  icon="camera-outline"
                  title={getTitle(
                    item,
                    index
                  )}
                  subtitle={`${getStoryStatus(
                    item
                  )} • ${views} ${
                    views === 1
                      ? "view"
                      : "views"
                  }`}
                  onPress={() =>
                    openStory(item)
                  }
                />
              );
            })}
          </View>
        ) : !error ? (
          <View style={styles.empty}>
            <InfoCard
              icon="camera-outline"
              title="No stories yet"
              text="Stories you share on Snapgram will appear here so you can manage them."
            />
          </View>
        ) : null}

        {items.length > 0 ? (
          <Notice>
            Tap a story to view its details, activity, and management options.
          </Notice>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },

  summaryCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#f7f7f7",
    flexDirection: "row",
    alignItems: "center",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryNumber: {
    fontSize: 26,
    fontWeight: "800",
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.55,
  },

  divider: {
    width: StyleSheet.hairlineWidth,
    height: 42,
    backgroundColor: "#ccc",
  },

  list: {
    marginTop: 10,
  },

  empty: {
    marginTop: 10,
  },
});