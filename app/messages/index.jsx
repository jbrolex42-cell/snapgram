import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
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

import {
  getConversations,
} from "../../services/messageService";

export default function MessagesScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadConversations =
    useCallback(async () => {
      if (
        authLoading ||
        !user
      ) {
        if (!authLoading) {
          setLoading(false);
        }

        return;
      }

      try {
        console.log(
          "LOADING CONVERSATIONS"
        );

        setLoading(true);

        const data =
          await getConversations();

        setConversations(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "MESSAGES ERROR:",
          error
        );

        setConversations([]);
      } finally {
        setLoading(false);
      }
    }, [
      authLoading,
      user,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [
      loadConversations,
    ])
  );

  function openConversation(
    conversation
  ) {
    if (
      !conversation?._id
    ) {
      return;
    }

    console.log(
      "OPENING CONVERSATION:",
      conversation._id
    );

    router.push({
      pathname:
        "/messages/[conversationId]",

      params: {
        conversationId:
          String(
            conversation._id
          ),
      },
    });
  }

  if (authLoading) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          activeOpacity={0.7}
        >
          <Text
            style={styles.back}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          Messages
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push("/messages/new")
          }
          style={
            styles.headerSpace
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={25}
            color="#111"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(
          item,
          index
        ) =>
          item?._id
            ? String(
                item._id
              )
            : `conversation-${index}`
        }
        renderItem={({
          item,
        }) => (
          <ConversationItem
            conversation={
              item
            }
            currentUserId={
              user?._id ||
              user?.id
            }
            onPress={() =>
              openConversation(
                item
              )
            }
          />
        )}
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              💬
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No messages yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Start a conversation with
              someone on Snapgram.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ConversationItem({
  conversation,
  currentUserId,
  onPress,
}) {
  const participants =
    Array.isArray(
      conversation?.participants
    )
      ? conversation.participants
      : [];

  const other =
    participants.find(
      (participant) =>
        String(
          participant?._id
        ) !==
        String(
          currentUserId
        )
    ) ||
    participants[0] ||
    null;

  const avatar =
    other?.avatar ||
    other?.profilePicture ||
    null;

  const username =
    other?.username ||
    other?.name ||
    "Snapgram User";

  const lastMessage =
    conversation?.lastMessage;

  const lastMessageText =
    typeof lastMessage ===
    "string"
      ? lastMessage
      : lastMessage?.text ||
        "Start a conversation";

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={styles.avatar}
      >
        {avatar ? (
          <Image
            source={{
              uri: avatar,
            }}
            style={
              styles.avatarImage
            }
          />
        ) : (
          <Text
            style={
              styles.avatarText
            }
          >
            {username
              .charAt(0)
              .toUpperCase()}
          </Text>
        )}
      </View>

      <View
        style={styles.info}
      >
        <Text
          style={styles.username}
          numberOfLines={1}
        >
          {username}
        </Text>

        <Text
          style={
            styles.lastMessage
          }
          numberOfLines={1}
        >
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },

    header: {
      height: 100,
      paddingTop: 48,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems: "flex-start",
      justifyContent:
        "center",
    },

    back: {
      fontSize: 35,
      lineHeight: 38,
      fontWeight: "300",
      color: "#111",
    },

    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: "900",
      color: "#111",
      textAlign: "center",
    },

    headerSpace: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#eee",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarText: {
      fontSize: 22,
      fontWeight: "900",
      color: "#222",
    },

    info: {
      flex: 1,
      marginLeft: 13,
    },

    username: {
      fontSize: 15,
      fontWeight: "800",
      color: "#111",
    },

    lastMessage: {
      color: "#888",
      marginTop: 5,
      fontSize: 13,
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    },

    empty: {
      paddingTop: 180,
      paddingHorizontal: 30,
      alignItems: "center",
    },

    emptyIcon: {
      fontSize: 60,
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 21,
      fontWeight: "900",
      color: "#111",
    },

    emptyText: {
      marginTop: 8,
      color: "#888",
      textAlign: "center",
      lineHeight: 20,
    },
  });