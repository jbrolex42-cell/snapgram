import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getSocket,
} from "../../services/socket";

import {
  getUserStatus,
} from "../../services/userService";

export default function OnlineStatus({
  userId,
}) {
  const [status, setStatus] = useState({
    online: false,
    lastSeen: null,
  });

  const loadStatus = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const data = await getUserStatus(userId);

      setStatus({
        online: Boolean(data?.isOnline),
        lastSeen: data?.lastSeen || null,
      });
    } catch (error) {
      console.error(
        "STATUS LOAD ERROR:",
        error
      );
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let socket;

    loadStatus();

    try {
      socket = getSocket();
    } catch (error) {
      console.error(
        "STATUS SOCKET ERROR:",
        error
      );
    }

    if (!socket) {
      return;
    }

    const handleStatus = (data) => {
      if (!data?.userId) {
        return;
      }

      if (
        String(data.userId) !==
        String(userId)
      ) {
        return;
      }

      setStatus({
        online: Boolean(data.online),
        lastSeen:
          data.lastSeen || null,
      });
    };

    socket.on(
      "user:status",
      handleStatus
    );

    return () => {
      socket.off(
        "user:status",
        handleStatus
      );
    };
  }, [userId, loadStatus]);

  useEffect(() => {
    if (!status.lastSeen || status.online) {
      return;
    }

    const interval = setInterval(() => {
      setStatus((previous) => ({
        ...previous,
      }));
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [status.lastSeen, status.online]);

  if (!userId) {
    return null;
  }

  const statusText = status.online
    ? "Active now"
    : formatLastSeen(status.lastSeen);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          status.online
            ? styles.onlineDot
            : styles.offlineDot,
        ]}
      />

      <Text
        style={[
          styles.text,
          status.online
            ? styles.onlineText
            : styles.offlineText,
        ]}
        numberOfLines={1}
      >
        {statusText}
      </Text>
    </View>
  );
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) {
    return "Offline";
  }

  const date = new Date(lastSeen);

  if (Number.isNaN(date.getTime())) {
    return "Offline";
  }

  const now = new Date();

  const diffSeconds = Math.max(
    0,
    Math.floor(
      (now.getTime() -
        date.getTime()) /
        1000
    )
  );

  if (diffSeconds < 60) {
    return "Active just now";
  }

  const minutes = Math.floor(
    diffSeconds / 60
  );

  if (minutes < 60) {
    return `Active ${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `Active ${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `Active ${days}d ago`;
  }

  return `Active ${date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  )}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 18,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  onlineDot: {
    backgroundColor: "#34C759",
  },

  offlineDot: {
    backgroundColor: "#C7C7CC",
  },

  text: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400",
  },

  onlineText: {
    color: "#8E8E93",
  },

  offlineText: {
    color: "#8E8E93",
  },
});