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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { searchExplore } from "../../services/exploreService";
import { getOrCreateConversation } from "../../services/messageService";

import VerifiedBadge from "../../components/common/VerifiedBadge";

export default function NewMessageScreen() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleSearch = useCallback(async (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await searchExplore(trimmed, 1, 20);

      setUsers(
        Array.isArray(response?.users)
          ? response.users
          : []
      );
    } catch (error) {
      console.error(
        "New message user search error:",
        error
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Debounced search
   */
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

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  /**
   * Open or create a conversation with the selected user.
   */
  const handleUserPress = useCallback(
    async (user) => {
      if (starting) {
        return;
      }

      const userId =
        user?._id ||
        user?.id ||
        user?.userId;

      const existingConversationId =
        user?.conversationId ||
        user?.conversation?._id ||
        user?.conversation?.id;

      if (existingConversationId) {
        router.push(
          `/messages/${existingConversationId}`
        );
        return;
      }

      if (!userId) {
        console.warn(
          "Cannot start conversation: missing user ID.",
          user
        );
        return;
      }

      try {
        setStarting(true);

        const conversation =
          await getOrCreateConversation(userId);

        const conversationId =
          conversation?._id ||
          conversation?.id;

        if (!conversationId) {
          console.warn(
            "No conversation ID returned from server.",
            conversation
          );

          Alert.alert(
            "Error",
            "Unable to start this conversation. Please try again."
          );

          return;
        }

        router.push(
          `/messages/${conversationId}`
        );
      } catch (error) {
        console.error(
          "START CONVERSATION ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            "Unable to start this conversation. Please try again."
        );
      } finally {
        setStarting(false);
      }
    },
    [starting]
  );

  /**
   * Render user
   */
  const renderUser = useCallback(
    ({ item }) => {
      const avatar =
        item?.avatar ||
        item?.avatarUrl ||
        item?.profilePicture ||
        item?.profileImage;

      const username =
        item?.username ||
        item?.userName ||
        item?.handle ||
        "Unknown user";

      const name =
        item?.name ||
        item?.fullName ||
        item?.displayName ||
        "";

      const isVerified =
        Boolean(item?.isVerified);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            handleUserPress(item)
          }
          style={styles.userRow}
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
                {username
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <Text
              style={styles.username}
              numberOfLines={1}
            >
              {username}
            </Text>

            {!!name && (
              <View style={styles.nameRow}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                >
                  {name}
                </Text>

                {isVerified && (
                  <VerifiedBadge size={14} />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleUserPress]
  );

  /**
   * Empty state
   */
  const emptyMessage = useMemo(() => {
    if (loading) {
      return null;
    }

    if (!query.trim()) {
      return "Search for someone to start a conversation";
    }

    return "No users found";
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            New message
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>
            ⌕
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            placeholderTextColor="#8E8E8E"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {!!query && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RESULTS */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" />
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            keyExtractor={(item, index) =>
              String(
                item?._id ||
                  item?.id ||
                  item?.userId ||
                  item?.username ||
                  index
              )
            }
            renderItem={renderUser}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.listContent
            }
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              New message
            </Text>

            <Text style={styles.emptyText}>
              {emptyMessage}
            </Text>
          </View>
        )}
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
    left: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: "300",
    color: "#111111",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  headerSpacer: {
    width: 40,
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
    fontSize: 22,
    color: "#777777",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111111",
  },

  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  clearText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#777777",
  },

  listContent: {
    paddingBottom: 20,
  },

  userRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFEFEF",
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBDBDB",
  },

  avatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555555",
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
  },

  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },

  nameRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },

  name: {
    fontSize: 13,
    color: "#777777",
    flexShrink: 1,
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
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#777777",
  },
});