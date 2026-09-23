import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { useAuth } from "../../../context/AuthContext";

function normalizeParam(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function getId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value?._id || value?.id || null;
  }

  return String(value);
}

function getMessageText(message) {
  return (
    message?.text ||
    message?.message ||
    message?.body ||
    ""
  );
}

function getSenderName(message, currentUserId) {
  const sender =
    message?.sender ||
    message?.user ||
    message?.author;

  const senderId = getId(sender);

  if (
    senderId &&
    String(senderId) ===
      String(currentUserId)
  ) {
    return "You";
  }

  return (
    sender?.fullName ||
    sender?.username ||
    "User"
  );
}

export default function ConversationSearchScreen() {
  const params =
    useLocalSearchParams();

  const { user: currentUser } =
    useAuth();

  const conversationId =
    normalizeParam(
      params?.conversationId
    );

  const [query, setQuery] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const currentUserId =
    getId(currentUser);

  const searchMessages =
    useCallback(
      async (searchText) => {
        const trimmed =
          searchText.trim();

        if (!conversationId) {
          return;
        }

        if (!trimmed) {
          setMessages([]);
          setSearched(false);
          return;
        }

        /*
         * IMPORTANT:
         *
         * This screen is intentionally kept independent
         * from a nonexistent search service endpoint.
         *
         * If your backend already has a conversation-search
         * endpoint, connect it here.
         */
        setLoading(true);

        try {
          /*
           * Replace this section with your actual
           * conversation message search service.
           *
           * Example:
           *
           * const result =
           *   await searchConversationMessages(
           *     conversationId,
           *     trimmed
           *   );
           *
           * setMessages(
           *   result?.messages || []
           * );
           */

          setMessages([]);
          setSearched(true);
        } catch (error) {
          console.error(
            "[MESSAGE SEARCH] ERROR:",
            error
          );

          setMessages([]);
        } finally {
          setLoading(false);
        }
      },
      [conversationId]
    );

  useEffect(() => {
    const timer =
      setTimeout(() => {
        searchMessages(query);
      }, 350);

    return () =>
      clearTimeout(timer);
  }, [
    query,
    searchMessages,
  ]);

  const renderItem =
    useCallback(
      ({ item }) => {
        const text =
          getMessageText(item);

        const sender =
          getSenderName(
            item,
            currentUserId
          );

        return (
          <Pressable
            style={
              styles.resultRow
            }
          >
            <View
              style={
                styles.resultIcon
              }
            >
              <Ionicons
                name="chatbubble-outline"
                size={19}
                color="#555555"
              />
            </View>

            <View
              style={
                styles.resultContent
              }
            >
              <Text
                style={
                  styles.resultSender
                }
                numberOfLines={1}
              >
                {sender}
              </Text>

              <Text
                style={
                  styles.resultText
                }
                numberOfLines={2}
              >
                {text}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color="#999999"
            />
          </Pressable>
        );
      },
      [currentUserId]
    );

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111111"
          />
        </Pressable>

        <View
          style={
            styles.searchBox
          }
        >
          <Ionicons
            name="search-outline"
            size={19}
            color="#777777"
          />

          <TextInput
            value={query}
            onChangeText={
              setQuery
            }
            placeholder="Search messages"
            placeholderTextColor="#999999"
            autoFocus
            returnKeyType="search"
            style={
              styles.input
            }
          />

          {query.length > 0 ? (
            <Pressable
              onPress={() =>
                setQuery("")
              }
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#999999"
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="small"
            color="#111111"
          />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(
            item,
            index
          ) =>
            String(
              item?._id ||
                item?.id ||
                index
            )
          }
          renderItem={
            renderItem
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            messages.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
          ListEmptyComponent={
            searched ? (
              <View
                style={
                  styles.empty
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={27}
                    color="#555555"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No messages found
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Try another search term.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.empty
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={27}
                    color="#555555"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Search this conversation
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Search for words or phrases
                  in your messages.
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    header: {
      minHeight: 62,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: "#DBDBDB",
      backgroundColor: "#FFFFFF",
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },

    searchBox: {
      flex: 1,
      height: 42,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: "#F2F2F2",
    },

    input: {
      flex: 1,
      marginLeft: 8,
      paddingVertical: 0,
      fontSize: 15,
      color: "#111111",
    },

    listContent: {
      paddingVertical: 8,
    },

    resultRow: {
      minHeight: 70,
      paddingHorizontal: 18,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    resultIcon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      backgroundColor: "#F1F1F1",
    },

    resultContent: {
      flex: 1,
      marginHorizontal: 12,
    },

    resultSender: {
      marginBottom: 3,
      fontSize: 14,
      fontWeight: "700",
      color: "#111111",
    },

    resultText: {
      fontSize: 14,
      lineHeight: 19,
      color: "#555555",
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyContainer: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 35,
    },

    empty: {
      alignItems: "center",
      justifyContent: "center",
    },

    emptyIcon: {
      width: 62,
      height: 62,
      marginBottom: 14,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 31,
      backgroundColor: "#F1F1F1",
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#111111",
      textAlign: "center",
    },

    emptyText: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: "#777777",
      textAlign: "center",
    },
  });