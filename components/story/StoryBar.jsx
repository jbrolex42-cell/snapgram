import React from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import StoryBubble from "./StoryBubble";

export default function StoryBar({
  stories = [],
  onStoryPress,
  onCreateStory,
}) {
  return (
    <View
      style={styles.container}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* YOUR STORY */}

        <StoryBubble
          isOwn
          onPress={
            onCreateStory
          }
        />

        {/* OTHER STORIES */}

        {stories.map(
          (story) => (
            <StoryBubble
              key={String(
                story?._id
              )}
              story={story}
              hasStory
              onPress={() =>
                onStoryPress?.(
                  story
                )
              }
            />
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      height: 100,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    content: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
  });