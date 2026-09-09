import React, { useMemo } from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileStats({
  posts = 0,
  followers = 0,
  following = 0,

  onPostsPress,
  onFollowersPress,
  onFollowingPress,
}) {
  const items = useMemo(
    () => [
      {
        key: "posts",
        label: "Posts",
        value: posts,
        onPress: onPostsPress,
      },
      {
        key: "followers",
        label: "Followers",
        value: followers,
        onPress: onFollowersPress,
      },
      {
        key: "following",
        label: "Following",
        value: following,
        onPress: onFollowingPress,
      },
    ],
    [
      posts,
      followers,
      following,
      onPostsPress,
      onFollowersPress,
      onFollowingPress,
    ]
  );

  const formatCount = (value) => {
    const count = Number(value) || 0;

    if (count >= 1000000) {
      return `${(count / 1000000)
        .toFixed(count % 1000000 === 0 ? 0 : 1)
        .replace(".0", "")}M`;
    }

    if (count >= 1000) {
      return `${(count / 1000)
        .toFixed(count % 1000 === 0 ? 0 : 1)
        .replace(".0", "")}K`;
    }

    return String(count);
  };

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const content = (
          <>
            <Text
              style={styles.value}
              numberOfLines={1}
            >
              {formatCount(item.value)}
            </Text>

            <Text
              style={styles.label}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </>
        );

        if (
          typeof item.onPress ===
          "function"
        ) {
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel={`${formatCount(
                item.value
              )} ${item.label}`}
            >
              {content}
            </TouchableOpacity>
          );
        }

        return (
          <View
            key={item.key}
            style={styles.item}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingVertical: 12,

    backgroundColor: "#FFFFFF",
  },

  item: {
    flex: 1,

    minHeight: 44,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 8,
  },

  value: {
    fontSize: 16,
    lineHeight: 20,

    fontWeight: "700",

    color: "#111111",

    textAlign: "center",
  },

  label: {
    marginTop: 3,

    fontSize: 13,
    lineHeight: 17,

    fontWeight: "400",

    color: "#555555",

    textAlign: "center",
  },
});