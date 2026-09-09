import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  PageLoading,
  SettingItem,
  Notice,
} from "../../../components/settings/SettingsUI";

import { loadSettings } from "../../../services/settingsApi";

export default function ArchivedScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await loadSettings();

      const archivedPosts = Array.isArray(data?.archivedPosts)
        ? data.archivedPosts
        : [];

      setItems(archivedPosts);
    } catch (err) {
      console.error("ARCHIVED CONTENT ERROR:", err);

      setItems([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load archived content."
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

  function formatDate(value) {
    if (!value) return "Archived";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return `Archived ${date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }

  function getTitle(item, index) {
    return (
      item?.title ||
      item?.caption ||
      item?.description ||
      `Archived post ${index + 1}`
    );
  }

  function getId(item, index) {
    return item?._id || item?.id || `archived-${index}`;
  }

  if (loading) {
    return (
      <Page
        title="Archived"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Archived"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header */}
        <InfoCard
          icon="archive-outline"
          title="Archived"
          text="Posts and stories you archive are hidden from your profile while keeping their likes, comments and other information."
        />

        {/* Error */}
        {error ? (
          <Notice>
            {error}
          </Notice>
        ) : null}

        {/* Count */}
        {!error ? (
          <Notice>
            {items.length
              ? `${items.length} archived ${
                  items.length === 1 ? "item" : "items"
                }`
              : "You don't have any archived posts yet."}
          </Notice>
        ) : null}

        {/* Archived content */}
        {items.length > 0 ? (
          <View>
            {items.map((item, index) => (
              <SettingItem
                key={getId(item, index)}
                icon="document-text-outline"
                title={getTitle(item, index)}
                subtitle={formatDate(item?.createdAt)}
                onPress={() => {
                  if (item?._id || item?.id) {
                    router.push({
                      pathname: "/settings/activity/archived/[id]",
                      params: {
                        id: String(item._id || item.id),
                      },
                    });
                  }
                }}
              />
            ))}
          </View>
        ) : !error ? (
          <InfoCard
            icon="archive-outline"
            title="Nothing archived"
            text="When you archive a post, it will appear here instead of being visible on your profile."
          />
        ) : null}
      </ScrollView>
    </Page>
  );
}

