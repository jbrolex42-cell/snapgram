import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { getStoryGroups } from "../../services/storyService";

function getGroupStories(
  group
) {
  const items =
    group?.stories ||
    group?.items ||
    group?.storyList ||
    [];

  return Array.isArray(items)
    ? items
    : [];
}

function groupHasUnseenStory(
  stories
) {
  return stories.some(
    (story) =>
      !(
        story?.viewed ||
        story?.isViewed
      )
  );
}

export default function StoriesScreen() {
  const [groups, setGroups] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadGroups = useCallback(
    async () => {
      try {
        setLoading(true);

        const result =
          await getStoryGroups();

        const groupList =
          Array.isArray(result)
            ? result
            : result?.groups ||
              [];

        setGroups(
          Array.isArray(
            groupList
          )
            ? groupList
            : []
        );
      } catch (error) {
        console.error(
          "STORIES LIST LOAD ERROR:",
          error
        );

        setGroups([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  function openGroup(group) {
    const stories =
      getGroupStories(group);

    const firstStory =
      stories[0];

    const storyId =
      firstStory?._id ||
      firstStory?.id;

    if (!storyId) {
      return;
    }

    router.push({
      pathname:
        "/stories/[id]",
      params: {
        id: String(storyId),
      },
    });
  }

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
      >
        <ActivityIndicator
          size="large"
          color="#fff"
        />
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View
        style={
          styles.container
        }
      >
        <Text
          style={
            styles.title
          }
        >
          No active stories
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Stories from people you follow will
          appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.list
      }
    >
      {groups.map(
        (group) => {
          const stories =
            getGroupStories(
              group
            );

          const unseen =
            groupHasUnseenStory(
              stories
            );

          const groupUser =
            group?.user || {};

          const key = String(
            groupUser?._id ||
              groupUser?.id ||
              stories[0]?._id ||
              Math.random()
          );

          return (
            <TouchableOpacity
              key={key}
              style={
                styles.row
              }
              onPress={() =>
                openGroup(
                  group
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.ring,
                  unseen &&
                    styles.ringActive,
                ]}
              >
                <View
                  style={
                    styles.avatar
                  }
                >
                  {groupUser?.avatar ? (
                    <Image
                      source={{
                        uri: groupUser.avatar,
                      }}
                      style={
                        styles.avatarImage
                      }
                    />
                  ) : (
                    <Text
                      style={
                        styles.avatarInitial
                      }
                    >
                      {(
                        groupUser?.username ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={
                  styles.rowText
                }
              >
                <Text
                  style={
                    styles.username
                  }
                  numberOfLines={1}
                >
                  {groupUser?.username ||
                    "user"}
                </Text>

                <Text
                  style={
                    styles.storyCount
                  }
                >
                  {stories.length}{" "}
                  {stories.length ===
                  1
                    ? "story"
                    : "stories"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create(
  {
    container: {
      flex: 1,
      backgroundColor:
        "#000",
      alignItems: "center",
      justifyContent: "center",
    },

    list: {
      paddingVertical: 12,
    },

    title: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "800",
    },

    subtitle: {
      marginTop: 8,
      maxWidth: 260,
      textAlign: "center",
      color: "#aaa",
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    ring: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 2.5,
      borderColor:
        "#333",
      alignItems: "center",
      justifyContent: "center",
    },

    ringActive: {
      borderColor:
        "#dd2a7b",
    },

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      overflow: "hidden",
      backgroundColor:
        "#222",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#000",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarInitial: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 18,
    },

    rowText: {
      marginLeft: 12,
      flex: 1,
    },

    username: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },

    storyCount: {
      marginTop: 2,
      color: "#999",
      fontSize: 12,
    },
  }
);
