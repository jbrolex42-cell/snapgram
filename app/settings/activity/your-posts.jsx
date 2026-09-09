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

export default function PostsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const data = await loadSettings();

      const posts = Array.isArray(data?.posts)
        ? data.posts
        : [];

      setItems(posts);
    } catch (err) {
      console.error("POSTS LOAD ERROR:", err);

      setItems([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your posts."
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

  function getPostId(item, index) {
    return (
      item?._id ||
      item?.id ||
      item?.postId ||
      `post-${index}`
    );
  }

  function getTitle(item, index) {
    if (item?.title?.trim()) {
      return item.title.trim();
    }

    if (item?.caption?.trim()) {
      return item.caption.trim();
    }

    if (item?.description?.trim()) {
      return item.description.trim();
    }

    return `Post ${index + 1}`;
  }

  function formatDate(value) {
    if (!value) {
      return "Post";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStats(item) {
    const likes = Number(
      item?.likesCount ??
        item?.likes?.length ??
        item?.likeCount ??
        0
    );

    const comments = Number(
      item?.commentsCount ??
        item?.comments?.length ??
        item?.commentCount ??
        0
    );

    return {
      likes,
      comments,
    };
  }

  function openPost(item, index) {
    const id = item?._id || item?.id || item?.postId;

    if (!id) {
      return;
    }

    router.push({
      pathname: "/settings/activity/your-posts/[id]",
      params: {
        id: String(id),
      },
    });
  }

  if (loading) {
    return (
      <Page
        title="Posts"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Posts"
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
        {/* Header */}
        <InfoCard
          icon="images-outline"
          title="Your posts"
          text="View and manage the posts you've shared on Snapgram."
        />

        {/* Error */}
        {error ? (
          <Notice>
            {error}
          </Notice>
        ) : null}

        {/* Post count */}
        {!error ? (
          <View style={styles.countCard}>
            <Text style={styles.countNumber}>
              {items.length}
            </Text>

            <View style={styles.countTextContainer}>
              <Text style={styles.countTitle}>
                {items.length === 1
                  ? "Post"
                  : "Posts"}
              </Text>

              <Text style={styles.countSubtitle}>
                {items.length
                  ? "Shared on your profile"
                  : "Nothing shared yet"}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Posts */}
        {items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item, index) => {
              const stats = getStats(item);

              return (
                <SettingItem
                  key={getPostId(item, index)}
                  icon="image-outline"
                  title={getTitle(item, index)}
                  subtitle={`${formatDate(
                    item?.createdAt
                  )} • ${stats.likes} ${
                    stats.likes === 1
                      ? "like"
                      : "likes"
                  } • ${stats.comments} ${
                    stats.comments === 1
                      ? "comment"
                      : "comments"
                  }`}
                  onPress={() =>
                    openPost(item, index)
                  }
                />
              );
            })}
          </View>
        ) : !error ? (
          <View style={styles.empty}>
            <InfoCard
              icon="images-outline"
              title="No posts yet"
              text="When you share a post on Snapgram, it will appear here so you can manage it."
            />
          </View>
        ) : null}

        {/* Information */}
        {items.length > 0 ? (
          <Notice>
            Tap a post to view its details and manage its settings.
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

  countCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#f7f7f7",
    flexDirection: "row",
    alignItems: "center",
  },

  countNumber: {
    fontSize: 32,
    fontWeight: "800",
  },

  countTextContainer: {
    marginLeft: 14,
  },

  countTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  countSubtitle: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.55,
  },

  list: {
    marginTop: 10,
  },

  empty: {
    marginTop: 10,
  },
});

