import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { getStoryGroups } from "../../services/storyService";

function getGroupStories(group) {
  const stories =
    group?.stories ||
    group?.items ||
    group?.storyList ||
    [];

  return Array.isArray(stories)
    ? stories
    : [];
}

function getGroupOwnerId(group) {
  return (
    group?.user?._id ||
    group?.user?.id ||
    group?.userId ||
    null
  );
}

function groupHasUnseenStory(stories) {
  return stories.some(
    (story) =>
      !(
        story?.viewed ||
        story?.isViewed
      )
  );
}

export default function StoryTray() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [groups, setGroups] = useState([]);

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const loadGroups = useCallback(async () => {

    if (authLoading || !user) {
      return;
    }

    try {
      const result =
        await getStoryGroups();

      const groupList =
        Array.isArray(result)
          ? result
          : result?.groups || [];

      setGroups(
        Array.isArray(groupList)
          ? groupList
          : []
      );
    } catch (error) {
      console.error(
        "STORY TRAY LOAD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setGroups([]);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    loadGroups();
  }, [
    authLoading,
    user,
    loadGroups,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !user) {
        return;
      }

      loadGroups();
    }, [
      authLoading,
      user,
      loadGroups,
    ])
  );

  const myGroup = groups.find((group) => {
    const ownerId =
      getGroupOwnerId(group);

    return (
      ownerId &&
      String(ownerId) ===
        currentUserId
    );
  });

  const otherGroups = groups.filter(
    (group) => group !== myGroup
  );

  const myStories = myGroup
    ? getGroupStories(myGroup)
    : [];

  const hasMyStory =
    myStories.length > 0;

  const openStory = useCallback(
    (storyId) => {
      if (!storyId) {
        return;
      }

      router.push({
        pathname: "/stories/[id]",
        params: {
          id: String(storyId),
        },
      });
    },
    []
  );

  const goToCreateStory =
    useCallback(() => {
      router.push({
        pathname: "/(tabs)/create",
        params: {
          mode: "story",
        },
      });
    }, []);

  const handleYourStoryPress =
    useCallback(() => {
      if (hasMyStory) {
        const firstStory =
          myStories[0];

        openStory(
          firstStory?._id ||
            firstStory?.id
        );

        return;
      }

      goToCreateStory();
    }, [
      hasMyStory,
      myStories,
      openStory,
      goToCreateStory,
    ]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.container
      }
    >

      <TouchableOpacity
        style={styles.item}
        onPress={handleYourStoryPress}
        activeOpacity={0.85}
      >
        <View
          style={styles.avatarWrapper}
        >
          <View
            style={[
              styles.ring,
              hasMyStory
                ? styles.ringActive
                : styles.ringEmpty,
            ]}
          >
            <View
              style={styles.avatar}
            >
              {user?.avatar ? (
                <Image
                  source={{
                    uri: user.avatar,
                  }}
                  style={
                    styles.avatarImage
                  }
                />
              ) : (
                <Ionicons
                  name="person"
                  size={26}
                  color="#999"
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={goToCreateStory}
            style={styles.plusBadge}
            hitSlop={8}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#0095F6"
            />
          </TouchableOpacity>
        </View>

        <Text
          style={styles.label}
          numberOfLines={1}
        >
          Your story
        </Text>
      </TouchableOpacity>

      {otherGroups.map((group) => {
        const stories =
          getGroupStories(group);

        const firstStory =
          stories[0];

        if (!firstStory) {
          return null;
        }

        const unseen =
          groupHasUnseenStory(
            stories
          );

        const groupUser =
          group?.user || {};

        const ownerId =
          getGroupOwnerId(group);

        const storyId =
          firstStory?._id ||
          firstStory?.id;

        const key = String(
          ownerId ||
            storyId
        );

        return (
          <TouchableOpacity
            key={key}
            style={styles.item}
            onPress={() =>
              openStory(storyId)
            }
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.ring,
                unseen
                  ? styles.ringActive
                  : styles.ringSeen,
              ]}
            >
              <View
                style={styles.avatar}
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

            <Text
              style={styles.label}
              numberOfLines={1}
            >
              {groupUser?.username ||
                "user"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const RING_SIZE = 66;
const AVATAR_SIZE = 58;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 14,
  },

  item: {
    width: 74,
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
  },

  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },

  ringActive: {
    borderColor: "#06f5f5",
  },

  ringSeen: {
    borderColor: "#dbdbdb",
  },

  ringEmpty: {
    borderColor: "transparent",
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontWeight: "800",
    color: "#555",
    fontSize: 18,
  },

  plusBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#fff",
    borderRadius: 11,
  },

  label: {
    marginTop: 5,
    fontSize: 11,
    color: "#222",
    textAlign: "center",
  },
});