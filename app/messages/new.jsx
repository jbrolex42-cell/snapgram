import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { searchExplore } from "../../services/exploreService";
import { getOrCreateConversation } from "../../services/messageService";

import VerifiedBadge from "../../components/common/VerifiedBadge";

function getUserId(user) {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    null
  );
}

function getUsername(user) {
  return (
    user?.username ||
    user?.userName ||
    user?.handle ||
    ""
  );
}

function getFullName(user) {
  return (
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.displayName?.trim() ||
    ""
  );
}

function getAvatar(user) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.profileImage ||
    null
  );
}

function getInitial(user) {
  const fullName = getFullName(user);
  const username = getUsername(user);

  return (
    fullName?.charAt(0) ||
    username?.charAt(0) ||
    "U"
  ).toUpperCase();
}

function getConversationId(user) {
  return (
    user?.conversationId ||
    user?.conversation?._id ||
    user?.conversation?.id ||
    null
  );
}

function UserIdentity({ user }) {
  const fullName = getFullName(user);
  const username = getUsername(user);
  const isVerified = Boolean(user?.isVerified);

  const displayName =
    fullName ||
    username ||
    "Unknown user";

  return (
    <View style={styles.identityContainer}>
      <View style={styles.nameRow}>
        <Text
          style={styles.fullName}
          numberOfLines={1}
        >
          {displayName}
        </Text>

        {isVerified ? (
          <VerifiedBadge size={14} />
        ) : null}
      </View>

      {!isVerified && username ? (
        <Text
          style={styles.username}
          numberOfLines={1}
        >
          @{username}
        </Text>
      ) : null}
    </View>
  );
}

export default function NewMessageScreen() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleSearch = useCallback(
    async (value) => {
      const trimmed = value.trim();

      if (!trimmed) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response =
          await searchExplore(
            trimmed,
            1,
            20
          );

        const results = Array.isArray(
          response?.users
        )
          ? response.users
          : [];

        setUsers(results);
      } catch (error) {
        console.error(
          "[NEW MESSAGE] USER SEARCH ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(trimmed);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, handleSearch]);

  const handleUserPress = useCallback(
    async (selectedUser) => {
      if (starting) {
        return;
      }

      const userId =
        getUserId(selectedUser);

      const existingConversationId =
        getConversationId(selectedUser);

      if (existingConversationId) {
        router.push(
          `/messages/${existingConversationId}`
        );

        return;
      }

      if (!userId) {
        console.warn(
          "[NEW MESSAGE] MISSING USER ID:",
          selectedUser
        );

        Alert.alert(
          "Unable to start conversation",
          "This user could not be identified."
        );

        return;
      }

      try {
        setStarting(true);

        const conversation =
          await getOrCreateConversation(
            userId
          );

        const conversationId =
          conversation?._id ||
          conversation?.id ||
          conversation?.conversationId;

        if (!conversationId) {
          console.warn(
            "[NEW MESSAGE] MISSING CONVERSATION ID:",
            conversation
          );

          Alert.alert(
            "Unable to start conversation",
            "The conversation could not be created. Please try again."
          );

          return;
        }

        router.push(
          `/messages/${conversationId}`
        );
      } catch (error) {
        console.error(
          "[NEW MESSAGE] START CONVERSATION ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        Alert.alert(
          "Unable to start conversation",
          error?.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      } finally {
        setStarting(false);
      }
    },
    [starting]
  );

  const renderUser = useCallback(
    ({ item }) => {
      const avatar = getAvatar(item);
      const initial = getInitial(item);

      return (
        <Pressable
          onPress={() =>
            handleUserPress(item)
          }
          disabled={starting}
          style={({ pressed }) => [
            styles.userRow,
            pressed && styles.userRowPressed,
            starting &&
              styles.userRowDisabled,
          ]}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={styles.avatarPlaceholder}
            >
              <Text
                style={styles.avatarLetter}
              >
                {initial}
              </Text>
            </View>
          )}

          <UserIdentity user={item} />

          {starting ? (
            <ActivityIndicator
              size="small"
              style={styles.rowLoader}
            />
          ) : null}
        </Pressable>
      );
    },
    [handleUserPress, starting]
  );

  const keyExtractor = useCallback(
    (item, index) => {
      return String(
        getUserId(item) ||
          getUsername(item) ||
          index
      );
    },
    []
  );

  const emptyMessage = useMemo(() => {
    if (loading) {
      return "";
    }

    if (!query.trim()) {
      return "Search for someone to start a conversation.";
    }

    return "No users found.";
  }, [loading, query]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.iconButtonPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={27}
              color="#111111"
            />
          </Pressable>

          <Text style={styles.title}>
            New message
          </Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#737373"
            style={styles.searchIcon}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            placeholderTextColor="#8E8E8E"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="search"
            selectionColor="#0095F6"
            style={styles.searchInput}
          />

          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              style={styles.clearButton}
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#8E8E8E"
              />
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="small"
              color="#111111"
            />
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            keyExtractor={keyExtractor}
            renderItem={renderUser}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios"
                ? "interactive"
                : "on-drag"
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.listContent
            }
            removeClippedSubviews={
              Platform.OS === "android"
            }
          />
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="chatbubble-outline"
                size={30}
                color="#111111"
              />
            </View>

            <Text style={styles.emptyTitle}>
              New message
            </Text>

            <Text style={styles.emptyText}>
              {emptyMessage}
            </Text>
          </View>
        )}

        {starting ? (
          <View
            pointerEvents="auto"
            style={styles.startingOverlay}
          >
            <View style={styles.startingCard}>
              <ActivityIndicator
                size="small"
                color="#111111"
              />

              <Text
                style={styles.startingText}
              >
                Opening conversation…
              </Text>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#DBDBDB",
  },

  backButton: {
    position: "absolute",
    left: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerRight: {
    position: "absolute",
    right: 8,
    width: 44,
    height: 44,
  },

  iconButtonPressed: {
    opacity: 0.55,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },

  searchContainer: {
    height: 44,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#EFEFEF",
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    fontSize: 15,
    color: "#111111",
  },

  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingBottom: 24,
  },

  userRow: {
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  userRowPressed: {
    backgroundColor: "#F7F7F7",
  },

  userRowDisabled: {
    opacity: 0.65,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFEFEF",
  },

  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E1E1E1",
  },

  avatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555555",
  },

  identityContainer: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  fullName: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#111111",
  },

  username: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: "#777777",
  },

  rowLoader: {
    marginLeft: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    marginBottom: 16,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#111111",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  emptyText: {
    marginTop: 8,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#777777",
  },

  startingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  startingCard: {
    minWidth: 170,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  startingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
  },
});