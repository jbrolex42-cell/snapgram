import {
    useRef,
} from "react";

import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    View,
} from "react-native";

const width =
  Dimensions.get("window").width;

export default function CarouselPreview({
  media,
  onIndexChange,
}) {
  const listRef =
    useRef(null);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) =>
          item.assetId ||
          item.uri ||
          String(index)
        }
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x /
              width
          );

          onIndexChange?.(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={{
                uri: item.uri,
              }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#111",
  },

  slide: {
    width,
    height: width,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },
});