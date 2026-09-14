import React from "react";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../../constants/Colors";

export default function StoryBubble({
  story,
  hasStory = true,
  onPress,
  isOwn = false,
}) {
  const username =
    story?.user?.username ||
    "You";

  const avatar =
    story?.user?.avatar ||
    story?.user?.profilePicture ||
    null;

  if (isOwn) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.ring,
            styles.ownRing,
          ]}
        >
          {avatar ? (
            <Image
              source={{
                uri: avatar,
              }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={
                styles.placeholder
              }
            >
              <Text
                style={
                  styles.placeholderText
                }
              >
                You
              </Text>
            </View>
          )}

          <View
            style={styles.plus}
          >
            <Text
              style={styles.plusText}
            >
              +
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={1}
          style={styles.username}
        >
          Your story
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.ring,
          !hasStory &&
            styles.noRing,
        ]}
      >
        {avatar ? (
          <Image
            source={{
              uri: avatar,
            }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={
              styles.placeholder
            }
          >
            <Text
              style={
                styles.placeholderText
              }
            >
              {username
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={styles.username}
      >
        {username}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width: 78,
      alignItems: "center",
      marginHorizontal: 3,
    },

    ring: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 3,
      borderColor:
        "#e1306c",
      alignItems:
        "center",
      justifyContent:
        "center",
      position:
        "relative",
    },

    ownRing: {
      borderColor:
        "#0095F6",
    },

    noRing: {
      borderColor:
        "#ddd",
    },

    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
    },

    placeholder: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        "#eee",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    placeholderText: {
      fontSize: 14,
      fontWeight:
        "800",
      color: "#777",
    },

    plus: {
      position:
        "absolute",
      right: -2,
      bottom: -2,
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor:
        "#0095F6",
      borderWidth: 2,
      borderColor:
        "#fff",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    plusText: {
      color: "#fff",
      fontSize: 18,
      lineHeight: 19,
      fontWeight:
        "800",
    },

    username: {
      marginTop: 5,
      fontSize: 11,
      color: "#222",
      maxWidth: 72,
    },
  });