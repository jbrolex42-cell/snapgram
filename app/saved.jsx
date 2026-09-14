import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import Colors from "../constants/Colors";
import api from "../services/api";


export default function SavedScreen() {
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  const loadSaved = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get(
            "/users/saved"
          );

        const savedPosts =
          response?.data?.posts ??
          response?.data?.savedPosts ??
          response?.data ??
          [];

        setPosts(
          Array.isArray(savedPosts)
            ? savedPosts
            : []
        );
      } catch (error) {
        console.error(
          "SAVED POSTS ERROR:",
          error
        );

        setError(
          error?.response?.data?.message ||
          "Unable to load your saved posts."
        );

        if (showLoader) {
          setPosts([]);
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadSaved(true);
    }, [loadSaved])
  );


  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      await loadSaved(false);
    }, [loadSaved]);


  const openPost =
    useCallback((post) => {
      const postId =
        post?._id ||
        post?.id;

      if (!postId) {
        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: {
          id: String(postId),
        },
      });
    }, []);


  const getPostImage =
    useCallback((post) => {
      
      if (
        typeof post?.image === "string" &&
        post.image.length > 0
      ) {
        return post.image;
      }

      if (
        typeof post?.imageUrl === "string" &&
        post.imageUrl.length > 0
      ) {
        return post.imageUrl;
      }

      if (
        typeof post?.media?.url === "string" &&
        post.media.url.length > 0
      ) {
        return post.media.url;
      }

      if (
        Array.isArray(post?.media) &&
        post.media.length > 0
      ) {
        const firstMedia =
          post.media[0];

        if (
          typeof firstMedia === "string"
        ) {
          return firstMedia;
        }

        if (
          typeof firstMedia?.url ===
          "string"
        ) {
          return firstMedia.url;
        }
      }

      return null;
    }, []);


  const isVideoPost =
    useCallback((post) => {
      const type =
        String(
          post?.type ||
          post?.mediaType ||
          post?.media?.type ||
          ""
        ).toLowerCase();

      return (
        type === "video" ||
        type === "reel"
      );
    }, []);


  const renderPost =
    useCallback(
      ({ item }) => {
        const image =
          getPostImage(item);

        const video =
          isVideoPost(item);

        return (
          <Pressable
            style={({ pressed }) => [
              styles.gridItem,
              pressed &&
                styles.gridItemPressed,
            ]}
            onPress={() =>
              openPost(item)
            }
          >
            {image ? (
              <Image
                source={{
                  uri: image,
                }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View
                style={
                  styles.noImage
                }
              >
                <Ionicons
                  name={
                    video
                      ? "videocam"
                      : "image-outline"
                  }
                  size={32}
                  color="#FFFFFF"
                />
              </View>
            )}

            {video ? (
              <View
                style={
                  styles.videoIndicator
                }
              >
                <Ionicons
                  name="play"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
            ) : null}
          </Pressable>
        );
      },
      [
        getPostImage,
        isVideoPost,
        openPost,
      ]
    );


  const renderEmpty =
    useCallback(() => {
      if (error) {
        return (
          <View
            style={styles.emptyContainer}
          >
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="alert-circle-outline"
                size={38}
                color="#111111"
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              Couldn't load saved posts
            </Text>

            <Text
              style={styles.emptyText}
            >
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() =>
                loadSaved(true)
              }
            >
              <Text
                style={styles.retryText}
              >
                Try again
              </Text>
            </Pressable>
          </View>
        );
      }

      return (
        <View
          style={styles.emptyContainer}
        >
          <View
            style={styles.emptyIcon}
          >
            <Ionicons
              name="bookmark-outline"
              size={38}
              color="#111111"
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No saved posts
          </Text>

          <Text
            style={styles.emptyText}
          >
            Save posts you want to see again.
            They'll appear here.
          </Text>

          <Pressable
            style={styles.browseButton}
            onPress={() =>
              router.replace(
                "/(tabs)"
              )
            }
          >
            <Text
              style={
                styles.browseButtonText
              }
            >
              Browse posts
            </Text>
          </Pressable>
        </View>
      );
    }, [
      error,
      loadSaved,
    ]);


  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
        edges={[
          "top",
          "bottom",
        ]}
      >
        <ActivityIndicator
          size="small"
          color="#111111"
        />
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={12}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111111"
          />
        </Pressable>

        <Text style={styles.title}>
          Saved
        </Text>

        <View
          style={styles.headerButton}
        />
      </View>

      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={(item, index) =>
          String(
            item?._id ||
            item?.id ||
            index
          )
        }
        renderItem={renderPost}
        showsVerticalScrollIndicator={
          false
        }
        removeClippedSubviews
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
            colors={["#111111"]}
          />
        }
        ListEmptyComponent={
          renderEmpty
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#DBDBDB",
    backgroundColor: "#FFFFFF",
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },

  gridItem: {
    width: "33.333333%",
    aspectRatio: 1,
    padding: 1,
    backgroundColor: "#F2F2F2",
  },

  gridItemPressed: {
    opacity: 0.7,
  },

  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F2F2F2",
  },

  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },

  videoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.55)",
  },

  emptyContainer: {
    flex: 1,
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E8E",
    textAlign: "center",
  },

  browseButton: {
    marginTop: 22,
    minWidth: 140,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#0095F6",
    alignItems: "center",
    justifyContent: "center",
  },

  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  retryButton: {
    marginTop: 20,
    minWidth: 120,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});