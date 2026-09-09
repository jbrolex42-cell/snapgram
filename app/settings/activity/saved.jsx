import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
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

export default function SavedScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await loadSettings();

      const savedPosts = Array.isArray(data?.savedPosts)
        ? data.savedPosts
        : [];

      setItems(savedPosts);
    } catch (err) {
      console.error("SAVED CONTENT ERROR:", err);

      setItems([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your saved content."
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
    if (!value) return "Saved";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return `Saved ${date.toLocaleDateString(undefined, {
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
      `Saved post ${index + 1}`
    );
  }

  function getId(item, index) {
    return (
      item?._id ||
      item?.id ||
      `saved-${index}`
    );
  }

  function openSavedPost(item) {
    const id = item?._id || item?.id;

    if (!id) return;

    router.push({
      pathname: "/settings/activity/saved/[id]",
      params: {
        id: String(id),
      },
    });
  }

  if (loading) {
    return (
      <Page
        title="Saved"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Saved"
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
          icon="bookmark-outline"
          title="Saved"
          text="Keep track of posts, reels and other content you want to come back to later."
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
              ? `${items.length} ${
                  items.length === 1 ? "saved item" : "saved items"
                }`
              : "You haven't saved anything yet."}
          </Notice>
        ) : null}

        {/* Saved content */}
        {items.length > 0 ? (
          <View>
            {items.map((item, index) => (
              <SettingItem
                key={getId(item, index)}
                icon="bookmark-outline"
                title={getTitle(item, index)}
                subtitle={formatDate(item?.createdAt)}
                onPress={() => openSavedPost(item)}
              />
            ))}
          </View>
        ) : !error ? (
          <InfoCard
            icon="bookmark-outline"
            title="Nothing saved"
            text="When you save a post or reel, it will appear here so you can easily find it later."
          />
        ) : null}
      </ScrollView>
    </Page>
  );
}

