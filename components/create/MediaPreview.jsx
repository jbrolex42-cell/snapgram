import React from "react";

import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const width =
  Dimensions.get("window").width;

function getFilterOverlay(
  filter
) {
  switch (filter) {
    case "Clarendon":
      return {
        backgroundColor:
          "rgba(255,255,255,0.10)",
      };

    case "Gingham":
      return {
        backgroundColor:
          "rgba(120,80,120,0.10)",
      };

    case "Moon":
      return {
        backgroundColor:
          "rgba(40,40,40,0.30)",
      };

    case "Lark":
      return {
        backgroundColor:
          "rgba(255,240,210,0.10)",
      };

    case "Juno":
      return {
        backgroundColor:
          "rgba(255,180,120,0.10)",
      };

    case "Valencia":
      return {
        backgroundColor:
          "rgba(240,190,150,0.12)",
      };

    default:
      return null;
  }
}

export default function MediaPreview({
  media,
  currentIndex = 0,
  onIndexChange,
  filter = "Normal",
}) {
  const filterOverlay =
    getFilterOverlay(filter);

  return (
    <FlatList
      data={media}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={
        false
      }
      initialScrollIndex={
        currentIndex
      }
      keyExtractor={(
        item,
        index
      ) =>
        item?.assetId ||
        item?.uri ||
        String(index)
      }
      onMomentumScrollEnd={(
        event
      ) => {
        const offsetX =
          event.nativeEvent
            .contentOffset.x;

        const index =
          Math.round(
            offsetX / width
          );

        onIndexChange?.(
          index
        );
      }}
      renderItem={({
        item,
      }) => (
        <View
          style={styles.slide}
        >
          <Image
            source={{
              uri: item?.uri,
            }}
            style={
              styles.image
            }
            resizeMode="contain"
          />

          {filterOverlay && (
            <View
              pointerEvents="none"
              style={[
                styles.filterOverlay,
                filterOverlay,
              ]}
            />
          )}

          {item?.type ===
            "video" && (
            <View
              style={
                styles.videoBadge
              }
            >
              <Text
                style={
                  styles.videoText
                }
              >
                VIDEO
              </Text>
            </View>
          )}

          {filter !==
            "Normal" && (
            <View
              style={
                styles.filterBadge
              }
            >
              <Text
                style={
                  styles.filterText
                }
              >
                {filter}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles =
  StyleSheet.create({
    slide: {
      width,
      height: width,
      backgroundColor:
        "#111",
      justifyContent:
        "center",
      alignItems:
        "center",
      position:
        "relative",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    filterOverlay: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },

    videoBadge: {
      position:
        "absolute",
      top: 15,
      right: 15,
      backgroundColor:
        "rgba(0,0,0,0.7)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },

    videoText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },

    filterBadge: {
      position:
        "absolute",
      left: 15,
      bottom: 15,
      backgroundColor:
        "rgba(0,0,0,0.65)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },

    filterText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
  });