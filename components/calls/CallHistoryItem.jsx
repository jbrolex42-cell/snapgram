import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CallHistoryItem({
  call,
  currentUserId,
  onPress,
}) {
  const isCaller =
    String(call.caller?._id) ===
    String(currentUserId);

  const otherUser = isCaller
    ? call.receiver
    : call.caller;

  const missed =
    call.status === "missed" ||
    call.status === "rejected";

  const incoming =
    !isCaller;

  const callIcon =
    call.type === "video"
      ? "📹"
      : "📞";

  const directionIcon =
    incoming ? "↙" : "↗";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        onPress?.(call)
      }
    >
      <Image
        source={{
          uri:
            otherUser?.avatar ||
            "https://via.placeholder.com/100",
        }}
        style={styles.avatar}
      />

      <View style={styles.info}>
        <Text
          style={[
            styles.username,
            missed &&
              styles.missed,
          ]}
        >
          {otherUser?.username ||
            "Unknown user"}
        </Text>

        <View style={styles.details}>
          <Text
            style={[
              styles.direction,
              missed &&
                styles.missed,
            ]}
          >
            {directionIcon}
          </Text>

          <Text style={styles.type}>
            {callIcon}{" "}
            {call.type ===
            "video"
              ? "Video"
              : "Voice"}
          </Text>

          {call.duration >
            0 && (
            <Text
              style={styles.duration}
            >
              {formatDuration(
                call.duration
              )}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.date}>
        {formatDate(
          call.createdAt
        )}
      </Text>
    </TouchableOpacity>
  );
}

function formatDuration(
  seconds
) {
  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${minutes}:${String(
    remaining
  ).padStart(2, "0")}`;
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const value =
    new Date(date);

  return value.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
    }
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eee",
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  missed: {
    color: "#ed4956",
  },

  details: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  direction: {
    fontSize: 15,
    marginRight: 4,
  },

  type: {
    fontSize: 13,
    color: "#777",
  },

  duration: {
    fontSize: 13,
    color: "#999",
    marginLeft: 8,
  },

  date: {
    fontSize: 12,
    color: "#999",
  },
});