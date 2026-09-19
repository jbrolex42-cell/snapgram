import React, { memo, useCallback, useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAP = 2;
const COLUMNS = 3;
const ITEM_SIZE =
  (SCREEN_WIDTH - GAP * (COLUMNS - 1)) / COLUMNS;

function getPostId(post) {
  return String(
    post?._id ||
      post?.id ||
      post?.postId ||
      ""
  );
}

function getOriginalPost(post) {
  if (
    post?.postType === "repost" &&
    post?.repostOf
  ) {
    return post.repostOf;
  }

  return post;
}

function getMedia(post) {
  if (!post) {
    return [];
  }

  if (Array.isArray(post.media)) {
    return post.media.filter(Boolean);
  }

  if (
    post.media &&
    typeof post.media === "object"
  ) {
    return [post.media];
  }

  if (post.mediaUrl) {
    return [
      {
        url: post.mediaUrl,
        type: post.mediaType || "image",
      },
    ];
  }

  if (post.imageUrl) {
    return [
      {
        url: post.imageUrl,
        type: "image",
      },
    ];
  }

  return [];
}

function getMediaUrl(media) {
  if (!media) {
    return null;
  }

  if (typeof media === "string") {
    return media.trim() || null;
  }

  const url =
    media.url ||
    media.uri ||
    media.secure_url ||
    media.secureUrl ||
    media.mediaUrl ||
    media.imageUrl ||
    media.src ||
    media.path;

  if (
    typeof url !== "string" ||
    !url.trim()
  ) {
    return null;
  }

  return url.trim();
}

function getFirstMediaUrl(post) {
  const media = getMedia(post);

  for (const item of media) {
    const url = getMediaUrl(item);

    if (url) {
      return url;
    }
  }

  return null;
}

function isVideoMedia(media) {
  if (!media) {
    return false;
  }

  if (typeof media === "string") {
    return /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(
      media
    );
  }

  const type = String(
    media.type ||
      media.mediaType ||
      media.mimeType ||
      ""
  ).toLowerCase();

  if (type === "video") {
    return true;
  }

  if (type.startsWith("video/")) {
    return true;
  }

  const url = getMediaUrl(media);

  return /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(
    url || ""
  );
}

function hasVideo(post) {
  return getMedia(post).some(
    isVideoMedia
  );
}

function isRepost(post) {
  return (
    post?.postType === "repost" ||
    !!post?.repostOf
  );
}

const ProfileGridItem = memo(function ProfileGridItem({
  post,
  onPress,
}) {
  const originalPost = getOriginalPost(post);

  const media = getMedia(originalPost);

  const preview = getFirstMediaUrl(
    originalPost
  );

  const video = hasVideo(originalPost);

  const multiple = media.length > 1;

  const repost = isRepost(post);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && styles.itemPressed,
      ]}
      onPress={() => onPress(post)}
      android_ripple={{
        color: "rgba(0,0,0,0.12)",
      }}
    >
      {preview ? (
        <Image
          source={{ uri: preview }}
          style={styles.image}
          resizeMode="cover"
          onError={(event) => {
            console.warn(
              "[PROFILE GRID] IMAGE LOAD ERROR:",
              {
                postId: getPostId(post),
                uri: preview,
                error:
                  event?.nativeEvent?.error,
              }
            );
          }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="image-outline"
            size={34}
            color="#999"
          />

          <Text style={styles.placeholderText}>
            No media
          </Text>
        </View>
      )}

      {video && (
        <View style={styles.topRightBadge}>
          <Ionicons
            name="play"
            size={15}
            color="#fff"
          />
        </View>
      )}

      {multiple && (
        <View
          style={[
            styles.topRightBadge,
            video && styles.multiplePosition,
          ]}
        >
          <Ionicons
            name="copy-outline"
            size={16}
            color="#fff"
          />
        </View>
      )}

      {repost && (
        <View style={styles.repostBadge}>
          <Ionicons
            name="repeat"
            size={16}
            color="#fff"
          />
        </View>
      )}
    </Pressable>
  );
});

function ProfileGrid({
  posts = [],
  loading = false,
  emptyTitle = "No posts yet",
  emptyMessage = "",
  onRefresh,
}) {
  const data = useMemo(() => {
    if (!Array.isArray(posts)) {
      console.warn(
        "[PROFILE GRID] Expected array but received:",
        typeof posts,
        posts
      );

      return [];
    }

    return posts.filter(Boolean);
  }, [posts]);

  const openPost = useCallback(
    (post) => {
      const original =
        getOriginalPost(post);

      const id =
        getPostId(original) ||
        getPostId(post);

      if (!id) {
        console.warn(
          "[PROFILE GRID] Missing post ID:",
          post
        );

        return;
      }

      const postType =
        original?.postType ||
        post?.postType ||
        "post";

      console.log(
        "[PROFILE GRID] Opening:",
        {
          id,
          postType,
        }
      );

      if (postType === "reel") {
        router.push({
          pathname: "/reels/[id]",
          params: {
            id,
          },
        });

        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: {
          id,
        },
      });
    },
    []
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ProfileGridItem
        post={item}
        onPress={openPost}
      />
    ),
    [openPost]
  );

  const keyExtractor = useCallback(
    (item, index) => {
      const id = getPostId(item);

      return id
        ? `${id}-${index}`
        : `profile-post-${index}`;
    },
    []
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Ionicons
          name="images-outline"
          size={34}
          color="#777"
        />

        <Text style={styles.loadingText}>
          Loading posts...
        </Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="images-outline"
            size={36}
            color="#777"
          />
        </View>

        <Text style={styles.emptyTitle}>
          {emptyTitle}
        </Text>

        {!!emptyMessage && (
          <Text style={styles.emptyMessage}>
            {emptyMessage}
          </Text>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={COLUMNS}
      scrollEnabled={false}
      nestedScrollEnabled={false}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      refreshing={false}
      onRefresh={onRefresh}
      removeClippedSubviews={false}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
    />
  );
}

export default memo(ProfileGrid);

const styles = StyleSheet.create({
  grid: {
    paddingBottom: 30,
  },

  row: {
    gap: GAP,
  },

  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: GAP,
    backgroundColor: "#f2f2f2",
    position: "relative",
    overflow: "hidden",
  },

  itemPressed: {
    opacity: 0.82,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
  },

  placeholderText: {
    marginTop: 6,
    fontSize: 11,
    color: "#888",
  },

  topRightBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.58)",
  },

  multiplePosition: {
    right: 39,
  },

  repostBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.62)",
  },

  loading: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
  },

  empty: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: "#777",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  emptyMessage: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
    textAlign: "center",
  },
});