import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

const REACTIONS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👍",
  "👏",
  "🔥",
  "😍",
  "🙏",
  "💯",
  "✨",
];

export default function ReactionBar({
  onSelect,
  onReact,
  selectedReaction,
  showMoreButton = true,
}) {
  const [selected, setSelected] =
    useState(
      selectedReaction || null
    );


  const reactionHandler = useMemo(() => {
    if (
      typeof onSelect ===
      "function"
    ) {
      return onSelect;
    }

    if (
      typeof onReact ===
      "function"
    ) {
      return onReact;
    }

    return null;
  }, [onSelect, onReact]);

  const handleReaction =
    useCallback(
      (reaction) => {
        setSelected(
          reaction
        );

        if (
          typeof reactionHandler ===
          "function"
        ) {
          reactionHandler(
            reaction
          );
        }
      },
      [reactionHandler]
    );

  return (
    <View
      style={styles.wrapper}
    >
      <View
        style={styles.container}
      >

        <View
          style={styles.reactionsRow}
        >
          {REACTIONS.map(
            (reaction) => {
              const isSelected =
                selected ===
                reaction;

              return (
                <TouchableOpacity
                  key={reaction}
                  style={[
                    styles.reactionButton,
                    isSelected &&
                      styles.selectedReaction,
                  ]}
                  onPress={() =>
                    handleReaction(
                      reaction
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.emoji,
                      isSelected &&
                        styles.selectedEmoji,
                    ]}
                  >
                    {reaction}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {showMoreButton && (
          <TouchableOpacity
            style={
              styles.moreButton
            }
            activeOpacity={0.7}
            onPress={() => {

            }}
          >
            <Ionicons
              name="add"
              size={23}
              color="#111"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 8,
      backgroundColor: "#fff",
    },

    container: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
      borderRadius: 28,
      paddingHorizontal: 6,
      paddingVertical: 6,

      elevation: 5,

      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    reactionsRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
    },

    reactionButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },

    selectedReaction: {
      backgroundColor: "#f0f0f0",
      transform: [
        {
          scale: 1.12,
        },
      ],
    },

    emoji: {
      fontSize: 22,
      textAlign: "center",
    },

    selectedEmoji: {
      fontSize: 24,
    },

    moreButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f2f2f2",
      marginLeft: 3,
    },
  });