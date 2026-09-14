import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import CallHistoryItem from "../../components/calls/CallHistoryItem";

import {
  getCallHistory,
} from "../../services/callService";

export default function CallHistoryScreen() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCalls = useCallback(async () => {
    try {
      const data = await getCallHistory();

      setCalls(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "CALL HISTORY ERROR:",
        error
      );

      setCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          const data = await getCallHistory();

          if (!active) {
            return;
          }

          setCalls(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (error) {
          if (active) {
            console.error(
              "CALL HISTORY ERROR:",
              error
            );

            setCalls([]);
          }
        } finally {
          if (active) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    await loadCalls();
  }, [loadCalls]);

  const openCall = useCallback((call) => {
    if (!call?._id) {
      return;
    }

    const callerId =
      call?.caller?._id ||
      call?.caller?.id;

    const receiverId =
      call?.receiver?._id ||
      call?.receiver?.id;

    const currentUserId =
      call?.currentUserId;

    const isCaller =
      currentUserId &&
      callerId
        ? String(callerId) ===
          String(currentUserId)
        : false;

    const otherUser =
      isCaller
        ? call?.receiver
        : call?.caller;

    const otherUserId =
      otherUser?._id ||
      otherUser?.id;

    if (!otherUserId) {
      console.warn(
        "CALL HISTORY: Missing other user ID"
      );

      return;
    }

    router.push({
      pathname: "/calls/[callId]",

      params: {
      
        callId: String(call._id),

        username:
          String(
            otherUser?.username ||
            otherUser?.name ||
            "User"
          ),

        avatar:
          String(
            otherUser?.avatar ||
            ""
          ),

        type:
          String(
            call?.type || "voice"
          ),

        otherUserId:
          String(otherUserId),

        isCaller: "true",
      },
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color="#111"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Calls
        </Text>
      </View>

      {calls.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="call-outline"
              size={34}
              color="#111"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No calls yet
          </Text>

          <Text style={styles.emptyText}>
            Your call history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item, index) =>
            String(
              item?._id ||
              item?.id ||
              index
            )
          }
          renderItem={({ item }) => (
            <CallHistoryItem
              call={item}
              onPress={openCall}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#111"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    height: 60,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.4,
  },

  listContent: {
    paddingBottom: 24,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#8e8e8e",
    textAlign: "center",
  },
});