import React from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";

export default function StoryRing({
  user,
  username,
  avatar,
  hasStory = false,
  seen = false,
  onPress,
  isOwn = false,
}) {
  const displayUsername = isOwn
    ? "Your story"
    : username || user?.username || "user";

  const displayAvatar =
    avatar || user?.avatar || user?.profilePicture || null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.ring,
          !hasStory && styles.noStory,
          seen && styles.seen,
        ]}
      >
        <View style={styles.avatar}>
          {displayAvatar ? (
            <Image
              source={{ uri: displayAvatar }}
              style={styles.image}
            />
          ) : (
            <Text style={styles.avatarText}>
              {displayUsername.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {isOwn && (
          <View style={styles.plus}>
            <Text style={styles.plusText}>+</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={styles.username}
      >
        {displayUsername}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 78,
    alignItems: "center",
    marginRight: 8,
  },

  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  noStory: {
    borderColor: Colors.border,
  },

  seen: {
    borderColor: Colors.secondaryText,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
  },

  plus: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },

  plusText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 18,
  },

  username: {
    marginTop: 5,
    fontSize: 11,
    maxWidth: 72,
  },
});