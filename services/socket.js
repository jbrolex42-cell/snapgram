import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://10.0.2.2:5000/api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

const TOKEN_KEYS = [
  "snapgram_token",
  "accessToken",
  "authToken",
];


let socket = null;
let currentUserId = null;

let connectPromise = null;
let connectingUserId = null;

async function getAuthToken() {
  for (const key of TOKEN_KEYS) {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value) {
        return value;
      }
    } catch (error) {
      console.warn(
        `[SOCKET] Failed reading ${key}:`,
        error?.message || error
      );
    }
  }

  return null;
}

export async function connectSocket(userId) {
  if (!userId) {
    console.warn(
      "[SOCKET] connectSocket: userId is required"
    );

    return null;
  }

  const normalizedUserId = String(userId);

  if (
    socket &&
    currentUserId &&
    String(currentUserId) !== normalizedUserId
  ) {
    console.log(
      "[SOCKET] USER CHANGED — RECREATING SOCKET"
    );

    disconnectSocket();
  }

  currentUserId = normalizedUserId;

  if (socket?.connected) {
    return socket;
  }

  if (
    socket &&
    !socket.disconnected
  ) {
    return socket;
  }

  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (error) {
      console.warn(
        "[SOCKET] stale socket cleanup:",
        error?.message || error
      );
    }

    socket = null;
  }

  const token = await getAuthToken();

  if (!token) {
    console.error(
      "[SOCKET] No authentication token found."
    );

    return null;
  }

  connectingUserId = normalizedUserId;

  console.log(
    "===================================="
  );

  console.log(
    "[SOCKET] CONNECTING"
  );

  console.log(
    "[SOCKET] URL:",
    SOCKET_URL
  );

  console.log(
    "[SOCKET] USER:",
    normalizedUserId
  );

  console.log(
    "[SOCKET] TOKEN:",
    "FOUND"
  );

  console.log(
    "===================================="
  );

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],

    autoConnect: true,

    reconnection: true,

    reconnectionAttempts: Infinity,

    reconnectionDelay: 1000,

    reconnectionDelayMax: 5000,

    timeout: 10000,

    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log(
      "===================================="
    );

    console.log(
      "[SOCKET] CONNECTED"
    );

    console.log(
      "[SOCKET] ID:",
      socket?.id
    );

    console.log(
      "[SOCKET] USER:",
      currentUserId
    );

    console.log(
      "===================================="
    );

    if (
      currentUserId &&
      socket?.connected
    ) {
      socket.emit(
        "user:join",
        String(currentUserId)
      );
    }
  });

  socket.on(
    "socket:connected",
    (data) => {
      console.log(
        "[SOCKET] SERVER READY:",
        data
      );
    }
  );

  socket.on(
    "connect_error",
    (error) => {
      console.error(
        "[SOCKET] CONNECT ERROR:",
        error?.message || error
      );
    }
  );

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "[SOCKET] DISCONNECTED:",
        reason
      );
    }
  );

  socket.io.on(
    "reconnect_attempt",
    (attempt) => {
      console.log(
        "[SOCKET] RECONNECT ATTEMPT:",
        attempt
      );
    }
  );

  socket.io.on(
    "reconnect",
    (attempt) => {
      console.log(
        "[SOCKET] RECONNECTED:",
        attempt
      );

      if (
        currentUserId &&
        socket?.connected
      ) {
        socket.emit(
          "user:join",
          String(currentUserId)
        );
      }
    }
  );

  socket.io.on(
    "reconnect_error",
    (error) => {
      console.error(
        "[SOCKET] RECONNECT ERROR:",
        error?.message || error
      );
    }
  );

  return socket;
}

export function getSocket() {
  return socket;
}

export function getSocketUserId() {
  return currentUserId;
}

export async function waitForSocket(
  userId,
  timeout = 10000
) {
  if (!userId) {
    throw new Error(
      "Cannot connect socket without a user ID."
    );
  }

  const normalizedUserId =
    String(userId);

  if (
    connectPromise &&
    connectingUserId !== normalizedUserId
  ) {
    connectPromise = null;
  }

  const existingSocket =
    await connectSocket(
      normalizedUserId
    );

  if (!existingSocket) {
    throw new Error(
      "Unable to create Socket.IO connection."
    );
  }

  if (existingSocket.connected) {
    return existingSocket;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectingUserId =
    normalizedUserId;

  connectPromise =
    new Promise(
      (resolve, reject) => {
        let finished = false;

        const timer =
          setTimeout(() => {
            finishError(
              new Error(
                "Socket connection timed out."
              )
            );
          }, timeout);

        function cleanup() {
          clearTimeout(timer);

          existingSocket.off(
            "connect",
            handleConnect
          );

          existingSocket.off(
            "connect_error",
            handleConnectError
          );
        }

        function finishSuccess() {
          if (finished) {
            return;
          }

          finished = true;

          cleanup();

          connectPromise = null;

          console.log(
            "[SOCKET] READY:",
            existingSocket.id
          );

          resolve(existingSocket);
        }

        function finishError(error) {
          if (finished) {
            return;
          }

          finished = true;

          cleanup();

          connectPromise = null;

          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Socket connection failed."
                )
          );
        }

        function handleConnect() {
          finishSuccess();
        }

        function handleConnectError(
          error
        ) {
          console.error(
            "[SOCKET] WAIT CONNECT ERROR:",
            error?.message || error
          );

          finishError(error);
        }

        existingSocket.once(
          "connect",
          handleConnect
        );

        existingSocket.once(
          "connect_error",
          handleConnectError
        );

        if (existingSocket.connected) {
          finishSuccess();
        }
      }
    );

  return connectPromise;
}

export function disconnectSocket() {
  if (!socket) {
    currentUserId = null;
    connectingUserId = null;
    connectPromise = null;

    return;
  }

  console.log(
    "[SOCKET] DISCONNECTING"
  );

  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch (error) {
    console.warn(
      "[SOCKET] disconnect warning:",
      error?.message || error
    );
  }

  socket = null;
  currentUserId = null;
  connectingUserId = null;
  connectPromise = null;
}

export function isSocketConnected() {
  return Boolean(
    socket?.connected
  );
}

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
    "typing:start",
    {
      conversationId:
        String(conversationId),

      userId:
        String(userId),

      username:
        username || "",
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
    "typing:stop",
    {
      conversationId:
        String(conversationId),

      userId:
        String(userId),
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
    !messageId
  ) {
    return false;
  }

  socket.emit(
    "message:seen",
    {
      conversationId:
        String(conversationId),

      messageId:
        String(messageId),

      userId:
        userId
          ? String(userId)
          : undefined,
    }
  );

  return true;
}

export function initiateCall({
  callId,
  receiverId,
  type = "voice",
  caller = null,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !receiverId
  ) {
    return false;
  }

  socket.emit(
    "call:initiate",
    {
      callId:
        String(callId),

      receiverId:
        String(receiverId),

      type,

      caller,
    }
  );

  return true;
}

export function acceptCall({
  callId,
  callerId,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !callerId
  ) {
    return false;
  }

  socket.emit(
    "call:accept",
    {
      callId:
        String(callId),

      callerId:
        String(callerId),
    }
  );

  return true;
}

export function rejectCall({
  callId,
  callerId,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !callerId
  ) {
    return false;
  }

  socket.emit(
    "call:reject",
    {
      callId:
        String(callId),

      callerId:
        String(callerId),
    }
  );

  return true;
}

export function sendCallReady({
  callId,
  targetUserId,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !targetUserId
  ) {
    return false;
  }

  socket.emit(
    "call:ready",
    {
      callId:
        String(callId),

      targetUserId:
        String(targetUserId),
    }
  );

  console.log(
    "[CALL] READY SENT:",
    callId,
    "→",
    targetUserId
  );

  return true;
}

export function cancelCall({
  callId,
  otherUserId,
}) {
  if (
    !socket?.connected ||
    !callId
  ) {
    return false;
  }

  socket.emit(
    "call:cancel",
    {
      callId:
        String(callId),

      otherUserId:
        otherUserId
          ? String(otherUserId)
          : null,
    }
  );

  return true;
}

export function endCall({
  callId,
  otherUserId,
}) {
  if (
    !socket?.connected ||
    !callId
  ) {
    return false;
  }

  socket.emit(
    "call:end",
    {
      callId:
        String(callId),

      otherUserId:
        otherUserId
          ? String(otherUserId)
          : null,
    }
  );

  return true;
}

export function missedCall({
  callId,
  callerId,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !callerId
  ) {
    return false;
  }

  socket.emit(
    "call:missed",
    {
      callId:
        String(callId),

      callerId:
        String(callerId),
    }
  );

  return true;
}

export function sendWebRTCOffer({
  callId,
  targetUserId,
  offer,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !targetUserId ||
    !offer
  ) {
    return false;
  }

  socket.emit(
    "webrtc:offer",
    {
      callId:
        String(callId),

      targetUserId:
        String(targetUserId),

      offer,
    }
  );

  return true;
}

export function sendWebRTCAnswer({
  callId,
  targetUserId,
  answer,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !targetUserId ||
    !answer
  ) {
    return false;
  }

  socket.emit(
    "webrtc:answer",
    {
      callId:
        String(callId),

      targetUserId:
        String(targetUserId),

      answer,
    }
  );

  return true;
}

export function sendICECandidate({
  callId,
  targetUserId,
  candidate,
}) {
  if (
    !socket?.connected ||
    !callId ||
    !targetUserId ||
    !candidate
  ) {
    return false;
  }

  socket.emit(
    "webrtc:ice-candidate",
    {
      callId:
        String(callId),

      targetUserId:
        String(targetUserId),

      candidate,
    }
  );

  return true;
}