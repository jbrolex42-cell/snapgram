
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

const screenWidth =
  Dimensions.get("window").width;

const gap = 2;

const itemWidth =
  (screenWidth - gap * 2) / 3;

export default function ExploreGrid({
  posts = [],
}) {
  function openPost(post) {
    router.push(
      `/post/${post._id}`
    );
  }

  function renderItem({ item }) {
    const media =
      item.media?.[0];

    if (!media?.url) {
      return (
        <View style={styles.item} />
      );
    }

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          openPost(item)
        }
      >
        <Image
          source={{
            uri: media.url,
          }}
          style={styles.image}
        />

        {media.type === "video" && (
          <View style={styles.video}>
            <View style={styles.play} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) =>
        item._id
      }
      renderItem={renderItem}
      columnWrapperStyle={
        styles.column
      }
      showsVerticalScrollIndicator={
        false
      }
    />
  );
}

const styles = StyleSheet.create({
  column: {
    gap,
  },

  item: {
    width: itemWidth,
    height: itemWidth,
    marginBottom: gap,
    backgroundColor: "#eee",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  video: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  play: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 9,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },
});