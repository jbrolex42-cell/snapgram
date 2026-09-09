import React, {
  useCallback,
  useMemo,
} from "react";

import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH =
  Dimensions.get("window").width;

const GAP = 2;
const COLUMN_COUNT = 3;

const ITEM_SIZE =
  (SCREEN_WIDTH -
    GAP * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;

export default function ProfileGrid({
  posts = [],
  onPostPress,
  emptyMessage = "No posts yet",
}) {
  
  const normalizedPosts = useMemo(
    () =>
      Array.isArray(posts)
        ? posts.filter(Boolean)
        : [],
    [posts]
  );

  const getImage = useCallback(
    (item) => {
      const media =
        Array.isArray(item?.media)
          ? item.media
          : [];

      const firstMedia =
        media[0];

      return (
        firstMedia?.url ||
        firstMedia?.secure_url ||
        firstMedia?.uri ||
        firstMedia?.thumbnail ||
        item?.image ||
        item?.imageUrl ||
        item?.mediaUrl ||
        item?.thumbnail ||
        null
      );
    },
    []
  );

  const isVideo = useCallback(
    (item) => {
      const media =
        Array.isArray(item?.media)
          ? item.media
          : [];

      const firstMedia =
        media[0];

      const type =
        firstMedia?.type ||
        firstMedia?.mediaType ||
        item?.mediaType ||
        item?.type ||
        "";

      const mimeType =
        firstMedia?.mimeType ||
        firstMedia?.mime ||
        "";

      return (
        type === "video" ||
        type === "reel" ||
        mimeType.startsWith(
          "video/"
        ) ||
        item?.isVideo === true ||
        item?.isReel === true
      );
    },
    []
  );

  const isCarousel = useCallback(
    (item) => {
      const media =
        Array.isArray(item?.media)
          ? item.media
          : [];

      return (
        media.length > 1 ||
        Number(item?.mediaCount) > 1 ||
        Number(item?.imagesCount) > 1 ||
        Number(item?.slideCount) > 1
      );
    },
    []
  );

  const handlePostPress =
    useCallback(
      (item, index) => {
        if (
          typeof onPostPress ===
          "function"
        ) {
          onPostPress(
            item,
            index
          );
        }
      },
      [onPostPress]
    );

  const renderItem =
    useCallback(
      ({ item, index }) => {
        const image =
          getImage(item);

        const video =
          isVideo(item);

        const carousel =
          isCarousel(item);

        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              handlePostPress(
                item,
                index
              )
            }
            style={
              styles.item
            }
          >
            {image ? (
              <Image
                source={{
                  uri: image,
                }}
                resizeMode="cover"
                style={
                  styles.image
                }
              />
            ) : (
              <View
                style={
                  styles.placeholder
                }
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color="#8E8E8E"
                />
              </View>
            )}

            {carousel ? (
              <View
                style={
                  styles.badge
                }
              >
                <Ionicons
                  name="copy-outline"
                  size={19}
                  color="#FFFFFF"
                />
              </View>
            ) : video ? (
              <View
                style={
                  styles.badge
                }
              >
                <Ionicons
                  name="play"
                  size={17}
                  color="#FFFFFF"
                />
              </View>
            ) : null}
          </TouchableOpacity>
        );
      },
      [
        getImage,
        isVideo,
        isCarousel,
        handlePostPress,
      ]
    );

  const keyExtractor =
    useCallback(
      (item, index) =>
        String(
          item?._id ||
            item?.id ||
            item?.postId ||
            `post-${index}`
        ),
      []
    );

  if (!normalizedPosts.length) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <View
          style={
            styles.emptyIcon
          }
        >
          <Ionicons
            name="camera-outline"
            size={34}
            color="#111111"
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          No Posts Yet
        </Text>

        <Text
          style={
            styles.emptyMessage
          }
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={
        normalizedPosts
      }
      keyExtractor={
        keyExtractor
      }
      renderItem={
        renderItem
      }
      numColumns={
        COLUMN_COUNT
      }
      scrollEnabled={false}
      showsVerticalScrollIndicator={
        false
      }
      columnWrapperStyle={
        styles.row
      }
      removeClippedSubviews={
        true
      }
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
    />
  );
}

const styles =
  StyleSheet.create({
    row: {
      gap: GAP,
    },

    item: {
      width:
        ITEM_SIZE,
      height:
        ITEM_SIZE,

      position:
        "relative",

      overflow:
        "hidden",

      backgroundColor:
        "#EFEFEF",
    },

    image: {
      width:
        "100%",

      height:
        "100%",
    },

    placeholder: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#EFEFEF",
    },

    badge: {
      position:
        "absolute",

      top: 8,
      right: 8,

      width: 26,
      height: 26,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.35)",

      borderRadius: 13,
    },

    emptyContainer: {
      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        30,

      paddingVertical:
        55,
    },

    emptyIcon: {
      width: 68,
      height: 68,

      borderWidth: 2,

      borderColor:
        "#111111",

      borderRadius: 34,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 16,
    },

    emptyTitle: {
      fontSize: 20,

      lineHeight: 24,

      fontWeight:
        "700",

      color:
        "#111111",

      textAlign:
        "center",
    },

    emptyMessage: {
      marginTop: 7,

      fontSize: 14,

      lineHeight: 20,

      color:
        "#737373",

      textAlign:
        "center",

      maxWidth: 300,
    },
  });