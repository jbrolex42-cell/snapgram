import React, {
  useCallback,
  useMemo,
} from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

const getAvatar = (user) =>
  user?.avatar ||
  user?.avatarUrl ||
  user?.profilePicture ||
  user?.profileImage ||
  user?.photoURL ||
  user?.photoUrl ||
  user?.image ||
  null;

const getUsername = (user) =>
  user?.username ||
  user?.handle ||
  "user";

const getName = (user) =>
  user?.name ||
  user?.displayName ||
  user?.fullName ||
  getUsername(user);

export default function Stories({
  stories = [],
  currentUser = null,
  onStoryPress,
  onCreateStory,
}) {
  const safeStories = useMemo(
    () =>
      Array.isArray(stories)
        ? stories
        : [],
    [stories]
  );

  const handleCreateStory =
    useCallback(() => {
      if (
        typeof onCreateStory ===
        "function"
      ) {
        onCreateStory();
      }
    }, [onCreateStory]);

  const handleStoryPress =
    useCallback(
      (story) => {
        if (
          typeof onStoryPress ===
          "function"
        ) {
          onStoryPress(story);
        }
      },
      [onStoryPress]
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.container
      }
    >

      <Pressable
        onPress={handleCreateStory}
        style={({ pressed }) => [
          styles.story,
          pressed &&
            styles.storyPressed,
        ]}
      >
        <View style={styles.yourAvatar}>
          {getAvatar(currentUser) ? (
            <Image
              source={{
                uri: getAvatar(
                  currentUser
                ),
              }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={
                styles.placeholderAvatar
              }
            >
              <Ionicons
                name="person"
                size={28}
                color="#777"
              />
            </View>
          )}

          <View style={styles.addButton}>
            <Ionicons
              name="add"
              size={16}
              color="#fff"
            />
          </View>
        </View>

        <Text
          numberOfLines={1}
          style={styles.storyName}
        >
          Your story
        </Text>
      </Pressable>

      {safeStories.map(
        (story, index) => {
          const user =
            story?.user ||
            story?.user ||
            story;

          const avatar =
            getAvatar(user);

          const storyId =
            story?._id ||
            story?.id ||
            story?.storyId ||
            `${getUsername(
              user
            )}-${index}`;

          return (
            <Pressable
              key={String(storyId)}
              onPress={() =>
                handleStoryPress(
                  story
                )
              }
              style={({ pressed }) => [
                styles.story,
                pressed &&
                  styles.storyPressed,
              ]}
            >
              <View
                style={styles.storyRing}
              >
                <View
                  style={
                    styles.avatarWrapper
                  }
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
                        styles.placeholderAvatar
                      }
                    >
                      <Ionicons
                        name="person"
                        size={28}
                        color="#777"
                      />
                    </View>
                  )}
                </View>
              </View>

              <Text
                numberOfLines={1}
                style={styles.storyName}
              >
                {getName(user)}
              </Text>
            </Pressable>
          );
        }
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  story: {
    width: 76,
    marginRight: 10,
    alignItems: "center",
  },

  storyPressed: {
    opacity: 0.65,
  },

  yourAvatar: {
    width: 66,
    height: 66,
    position: "relative",
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },

  storyRing: {
    width: 66,
    height: 66,
    padding: 2,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },

  placeholderAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },

  addButton: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
    borderWidth: 2,
    borderColor: "#fff",
  },

  storyName: {
    width: 72,
    marginTop: 5,
    textAlign: "center",
    fontSize: 11,
    color: "#222",
  },
});