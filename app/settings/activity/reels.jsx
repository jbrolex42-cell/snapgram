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

export default function ReelsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await loadSettings();

      const reels = Array.isArray(data?.reels)
        ? data.reels
        : [];

      setItems(reels);
    } catch (err) {
      console.error("REELS ERROR:", err);

      setItems([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your reels."
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
    if (!value) return "Reel";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return `Created ${date.toLocaleDateString(undefined, {
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
      `Reel ${index + 1}`
    );
  }

  function getId(item, index) {
    return (
      item?._id ||
      item?.id ||
      `reel-${index}`
    );
  }

  function openReel(item) {
    const id = item?._id || item?.id;

    if (!id) return;

    router.push({
      pathname: "/settings/activity/reels/[id]",
      params: {
        id: String(id),
      },
    });
  }

  if (loading) {
    return (
      <Page
        title="Reels"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Reels"
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

        <InfoCard
          icon="play-circle-outline"
          title="Your reels"
          text="Manage the reels you've created and shared on Snapgram."
        />

        {error ? (
          <Notice>
            {error}
          </Notice>
        ) : null}

        {!error ? (
          <Notice>
            {items.length
              ? `${items.length} ${
                  items.length === 1 ? "reel" : "reels"
                }`
              : "You haven't created any reels yet."}
          </Notice>
        ) : null}

        {items.length > 0 ? (
          <View>
            {items.map((item, index) => (
              <SettingItem
                key={getId(item, index)}
                icon="play-circle-outline"
                title={getTitle(item, index)}
                subtitle={formatDate(item?.createdAt)}
                onPress={() => openReel(item)}
              />
            ))}
          </View>
        ) : !error ? (
          <InfoCard
            icon="videocam-outline"
            title="No reels yet"
            text="When you create a reel, it will appear here so you can manage it."
          />
        ) : null}
      </ScrollView>
    </Page>
  );
}