import {
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

import CallHistoryItem from "../../components/calls/CallHistoryItem";

import {
    getCallHistory,
} from "../../services/callService";

export default function CallHistoryScreen() {
  const [calls, setCalls] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCalls();
    }, [])
  );

  async function loadCalls() {
    try {
      const data =
        await getCallHistory();

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);

    await loadCalls();
  }

  function openCall(call) {
    const isCaller =
      String(
        call.caller?._id
      ) ===
      String(
        call.currentUserId
      );

    router.push({
      pathname:
        "/calls/[callId]",

      params: {
        callId: call._id,

        username:
          isCaller
            ? call.receiver
                ?.username
            : call.caller
                ?.username,

        avatar:
          isCaller
            ? call.receiver
                ?.avatar
            : call.caller
                ?.avatar,

        type:
          call.type,

        otherUserId:
          isCaller
            ? call.receiver
                ?._id
            : call.caller
                ?._id,

        isCaller: "true",
      },
    });
  }

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
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
        <View
          style={styles.empty}
        >
          <Text
            style={styles.emptyIcon}
          >
            📞
          </Text>

          <Text
            style={styles.emptyTitle}
          >
            No calls yet
          </Text>

          <Text
            style={styles.emptyText}
          >
            Your call history will
            appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) =>
            item._id
          }
          renderItem={({
            item,
          }) => (
            <CallHistoryItem
              call={item}
              onPress={
                openCall
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                refresh
              }
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

  header: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
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

  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
});