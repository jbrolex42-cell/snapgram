import {
    useEffect,
    useState,
} from "react";

import {
    getSocket,
} from "../services/socket";

export function useOnlineStatus(
  userId
) {
  const [online, setOnline] =
    useState(false);

  useEffect(() => {
    const socket =
      getSocket();

    if (!socket) {
      return;
    }

    const handleStatus =
      (data) => {
        if (
          String(data.userId) ===
          String(userId)
        ) {
          setOnline(
            data.online
          );
        }
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
  }, [userId]);

  return online;
}