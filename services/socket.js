import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://10.0.2.2:5000";

let socket = null;
let currentUserId = null;
let connectPromise = null;

/**
 * Create or return the global Socket.IO connection.
 */
export function connectSocket(userId) {
  if (!userId) {
    console.warn(
      "connectSocket: userId is required"
    );
    return null;
  }

  const normalizedUserId = String(userId);

  currentUserId = normalizedUserId;

  /*
   * Socket already exists and is connected.
   */
  if (socket?.connected) {
    return socket;
  }

  /*
   * Socket exists but is currently connecting.
   */
  if (socket && !socket.connected) {
    return socket;
  }

  console.log(
    "CONNECTING SNAPGRAM SOCKET:",
    SOCKET_URL
  );

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,

    /*
     * Socket.IO should reconnect automatically
     * if the network temporarily disappears.
     */
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log(
      "SNAPGRAM SOCKET CONNECTED:",
      socket.id
    );

    /*
     * Tell the backend which authenticated
     * Snapgram user owns this socket.
     */
    socket.emit(
      "user:online",
      normalizedUserId
    );
  });

  socket.on("connect_error", (error) => {
    console.error(
      "SNAPGRAM SOCKET CONNECT ERROR:",
      error?.message || error
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      "SNAPGRAM SOCKET DISCONNECTED:",
      reason
    );
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(
      "SNAPGRAM SOCKET RECONNECT ATTEMPT:",
      attempt
    );
  });

  socket.io.on("reconnect", (attempt) => {
    console.log(
      "SNAPGRAM SOCKET RECONNECTED:",
      attempt
    );

    /*
     * Re-register the user as online after
     * Socket.IO establishes a new connection.
     */
    if (currentUserId && socket?.connected) {
      socket.emit(
        "user:online",
        currentUserId
      );
    }
  });

  socket.io.on("reconnect_error", (error) => {
    console.error(
      "SNAPGRAM SOCKET RECONNECT ERROR:",
      error?.message || error
    );
  });

  return socket;
}

/**
 * Return the global socket instance.
 */
export function getSocket() {
  return socket;
}

/**
 * Wait until the global socket is actually connected.
 *
 * This is important for calls. A socket object existing
 * does NOT necessarily mean Socket.IO has connected yet.
 */
export function waitForSocket(
  userId,
  timeout = 10000
) {
  if (!userId) {
    return Promise.reject(
      new Error(
        "Cannot connect socket without a user ID."
      )
    );
  }

  const existingSocket =
    connectSocket(userId);

  if (!existingSocket) {
    return Promise.reject(
      new Error(
        "Unable to create Socket.IO connection."
      )
    );
  }

  if (existingSocket.connected) {
    return Promise.resolve(
      existingSocket
    );
  }

  /*
   * Prevent several screens from creating
   * independent connection promises.
   */
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise(
    (resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        clearTimeout(timer);

        existingSocket.off(
          "connect",
          handleConnect
        );

        existingSocket.off(
          "connect_error",
          handleConnectError
        );
      };

      const finishSuccess = () => {
        if (finished) return;

        finished = true;
        cleanup();

        connectPromise = null;

        resolve(existingSocket);
      };

      const finishError = (error) => {
        if (finished) return;

        finished = true;
        cleanup();

        connectPromise = null;

        reject(error);
      };

      const handleConnect = () => {
        console.log(
          "SOCKET READY FOR CALLS:",
          existingSocket.id
        );

        finishSuccess();
      };

      const handleConnectError = (
        error
      ) => {
        console.error(
          "SOCKET WAIT CONNECT ERROR:",
          error?.message || error
        );

        finishError(
          error instanceof Error
            ? error
            : new Error(
                "Socket connection failed."
              )
        );
      };

      const timer = setTimeout(() => {
        finishError(
          new Error(
            "Socket connection timed out."
          )
        );
      }, timeout);

      existingSocket.once(
        "connect",
        handleConnect
      );

      existingSocket.once(
        "connect_error",
        handleConnectError
      );

      /*
       * In case it connected between the
       * initial check and listener registration.
       */
      if (existingSocket.connected) {
        finishSuccess();
      }
    }
  );

  return connectPromise;
}

/**
 * Disconnect the global socket.
 *
 * Only call this when the authenticated user
 * logs out or the app session is destroyed.
 *
 * Do NOT call this from CallScreen cleanup.
 */
export function disconnectSocket() {
  if (!socket) {
    currentUserId = null;
    connectPromise = null;
    return;
  }

  console.log(
    "DISCONNECTING SNAPGRAM SOCKET"
  );

  socket.removeAllListeners();

  socket.disconnect();

  socket = null;
  currentUserId = null;
  connectPromise = null;
}

/**
 * Conversation helpers
 */

export function joinConversation(
  conversationId
) {
  if (
    !socket?.connected ||
    !conversationId
  ) {
    return false;
  }

  socket.emit(
    "conversation:join",
    String(conversationId)
  );

  return true;
}

export function leaveConversation(
  conversationId
) {
  if (
    !socket?.connected ||
    !conversationId
  ) {
    return false;
  }

  socket.emit(
    "conversation:leave",
    String(conversationId)
  );

  return true;
}

/**
 * Message helpers
 */

export function sendSocketMessage(
  message
) {
  if (!socket?.connected) {
    return false;
  }

  socket.emit(
    "message:send",
    message
  );

  return true;
}

export function sendTyping(
  conversationId,
  userId,
  username
) {
  if (
    !socket?.connected ||
    !conversationId ||
    !userId
  ) {
    return false;
  }

  socket.emit(
    "message:typing",
    {
      conversationId,
      userId,
      username,
    }
  );

  return true;
}

export function stopTyping(
  conversationId,
  userId
) {
  if (
    !socket?.connected ||
    !conversationId ||
    !userId
  ) {
    return false;
  }

  socket.emit(
    "message:stopTyping",
    {
      conversationId,
      userId,
    }
  );

  return true;
}

export function markSocketMessageSeen(
  conversationId,
  messageId,
  userId
) {
  if (
    !socket?.connected ||
    !conversationId ||
    !messageId ||
    !userId
  ) {
    return false;
  }

  socket.emit(
    "message:seen",
    {
      conversationId,
      messageId,
      userId,
    }
  );

  return true;
}