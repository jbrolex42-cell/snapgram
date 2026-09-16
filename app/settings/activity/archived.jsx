import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
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
  PageLoading,
  Notice,
  SettingItem,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getArchivedPosts,
  restoreArchivedPost,
} from "../../../services/postsApi";

export default function ArchivedScreen() {
  const { colors } = useSettingsTheme();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState("");

  const loadArchived = useCallback(async () => {
    try {
      setError("");

      const posts = await getArchivedPosts();

      setItems(Array.isArray(posts) ? posts : []);
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
    loadArchived();
  }, [loadArchived]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadArchived();
  }, [loadArchived]);

  const getId = (item) => {
    return item?._id || item?.id || null;
  };

  const getCaption = (item) => {
    return (
      item?.caption ||
      item?.description ||
      "Archived post"
    );
  };

  const getMedia = (item) => {
    if (!Array.isArray(item?.media)) {
      return null;
    }

    return item.media[0] || null;
  };

  const getMediaUrl = (item) => {
    const media = getMedia(item);

    return (
      media?.url ||
      media?.uri ||
      item?.image ||
      item?.imageUrl ||
      null
    );
  };

  const isVideo = (item) => {
    const media = getMedia(item);

    return (
      media?.type === "video" ||
      media?.mimeType?.startsWith("video/")
    );
  };

  const formatArchivedDate = (item) => {
    const value =
      item?.archivedAt ||
      item?.updatedAt ||
      item?.createdAt;

    if (!value) {
      return "Archived";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Archived";
    }

    return `Archived ${date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  };

  const handleRestore = useCallback(
    (item) => {
      const postId = getId(item);

      if (!postId) {
        Alert.alert(
          "Unable to restore",
          "This archived post does not have a valid ID."
        );
        return;
      }

      Alert.alert(
        "Restore post?",
        "This post will become visible on your profile again.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Restore",
            onPress: async () => {
              try {
                setRestoringId(postId);
                setError("");

                await restoreArchivedPost(postId);

                setItems((current) =>
                  current.filter(
                    (post) => getId(post) !== postId
                  )
                );
              } catch (err) {
                console.error(
                  "RESTORE ARCHIVED POST ERROR:",
                  err
                );

                Alert.alert(
                  "Restore failed",
                  err?.response?.data?.message ||
                    err?.message ||
                    "Unable to restore this post."
                );
              } finally {
                setRestoringId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const openPost = useCallback((item) => {
    const postId = getId(item);

    if (!postId) {
      return;
    }

    router.push({
      pathname: "/settings/activity/archived/[id]",
      params: {
        id: String(postId),
      },
    });
  }, []);

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
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        <InfoCard
          icon="archive-outline"
          title="Your archive"
          text="Posts you archive are hidden from your profile. You can restore them whenever you want."
        />

        {error ? (
          <View style={styles.noticeSpacing}>
            <Notice>
              {error}
            </Notice>
          </View>
        ) : null}

        {!error ? (
          <View style={styles.noticeSpacing}>
            <Notice>
              {items.length > 0
                ? `${items.length} archived ${
                    items.length === 1
                      ? "post"
                      : "posts"
                  }`
                : "You don't have any archived posts yet."}
            </Notice>
          </View>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item, index) => {
              const postId = getId(item);
              const mediaUrl = getMediaUrl(item);
              const video = isVideo(item);
              const restoring =
                restoringId === postId;

              return (
                <View
                  key={
                    postId ||
                    `archived-${index}`
                  }
                  style={[
                    styles.card,
                    {
                      backgroundColor:
                        colors.card,
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <View style={styles.row}>
                    {/* MEDIA PREVIEW */}
                    <View
                      style={[
                        styles.thumbnail,
                        {
                          backgroundColor:
                            colors.background,
                        },
                      ]}
                    >
                      {mediaUrl ? (
                        <Image
                          source={{
                            uri: mediaUrl,
                          }}
                          style={styles.thumbnailImage}
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={24}
                          color={colors.muted}
                        />
                      )}

                      {video ? (
                        <View style={styles.videoBadge}>
                          <Ionicons
                            name="play"
                            size={11}
                            color="#fff"
                          />
                        </View>
                      ) : null}

                      {Array.isArray(item?.media) &&
                      item.media.length > 1 ? (
                        <View style={styles.mediaCount}>
                          <Text style={styles.mediaCountText}>
                            {item.media.length}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* CONTENT */}
                    <View style={styles.details}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.caption,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {getCaption(
                          item
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.date,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        {formatArchivedDate(
                          item
                        )}
                      </Text>

                      <View style={styles.actions}>
                        <SettingItem
                          icon="eye-outline"
                          title="View"
                          subtitle="Open archived post"
                          onPress={() =>
                            openPost(item)
                          }
                        />

                        <SettingItem
                          icon="arrow-undo-outline"
                          title={
                            restoring
                              ? "Restoring..."
                              : "Restore"
                          }
                          subtitle={
                            restoring
                              ? "Please wait"
                              : "Show on profile"
                          }
                          onPress={() => {
                            if (
                              !restoring
                            ) {
                              handleRestore(
                                item
                              );
                            }
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {restoring ? (
                    <View
                      style={[
                        styles.restoringBar,
                        {
                          borderTopColor:
                            colors.border,
                        },
                      ]}
                    >
                      <ActivityIndicator
                        size="small"
                        color={
                          colors.text
                        }
                      />

                      <Text
                        style={[
                          styles.restoringText,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        Restoring post...
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
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

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  noticeSpacing: {
    marginTop: 12,
  },

  list: {
    marginTop: 14,
    gap: 12,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    padding: 12,
  },

  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  videoBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  mediaCount: {
    position: "absolute",
    bottom: 7,
    right: 7,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  mediaCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  details: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  caption: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },

  date: {
    marginTop: 5,
    fontSize: 12,
  },

  actions: {
    marginTop: 8,
    gap: 4,
  },

  restoringBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  restoringText: {
    marginLeft: 8,
    fontSize: 12,
  },
});