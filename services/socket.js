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
let connectingPromise = null;

async function getStoredToken() {
  for (const key of TOKEN_KEYS) {
    const value = await AsyncStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
}

export async function connectSocket(userId) {
  if (!userId) {
    throw new Error("User ID is required to connect socket.");
  }

  const token = await getStoredToken();

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  if (socket?.connected) {
    return socket;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = new Promise((resolve, reject) => {
    const nextSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token,
      },
    });

    socket = nextSocket;

    const handleConnect = () => {
      nextSocket.emit("user:join", {
        userId: String(userId),
      });

      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleInitialError);

      connectingPromise = null;
      resolve(nextSocket);
    };

    const handleInitialError = (error) => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleInitialError);

      connectingPromise = null;

      reject(
        error instanceof Error
          ? error
          : new Error("Socket connection failed.")
      );
    };

    nextSocket.once("connect", handleConnect);
    nextSocket.once("connect_error", handleInitialError);

    nextSocket.connect();
  });

  return connectingPromise;
}

export async function waitForSocket(timeout = 10000) {
  if (socket?.connected) {
    return socket;
  }

  const token = await getStoredToken();

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  if (!socket) {
    throw new Error("Socket is not initialized.");
  }

  return new Promise((resolve, reject) => {
    let finished = false;

    const cleanup = () => {
      clearTimeout(timer);
      socket?.off("connect", handleConnect);
      socket?.off("connect_error", handleError);
    };

    const finish = (callback, value) => {
      if (finished) return;

      finished = true;
      cleanup();
      callback(value);
    };

    const handleConnect = () => {
      finish(resolve, socket);
    };

    const handleError = (error) => {
      finish(
        reject,
        error instanceof Error
          ? error
          : new Error("Socket connection failed.")
      );
    };

    const timer = setTimeout(() => {
      finish(
        reject,
        new Error("Timed out waiting for socket connection.")
      );
    }, timeout);

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleError);

    if (!socket.connected) {
      socket.connect();
    }
  });
}

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return Boolean(socket?.connected);
}

export function disconnectSocket() {
  if (!socket) return;

  try {
    socket.disconnect();
  } catch {}

  socket = null;
  connectingPromise = null;
}

export function onSocketEvent(event, handler) {
  if (!socket || typeof handler !== "function") {
    return () => {};
  }

  socket.on(event, handler);

  return () => {
    socket?.off(event, handler);
  };
}

export function offSocketEvent(event, handler) {
  if (!socket) return;

  if (handler) {
    socket.off(event, handler);
  } else {
    socket.off(event);
  }
}

export function joinConversation(conversationId) {
  if (!socket?.connected || !conversationId) return false;

  socket.emit("conversation:join", {
    conversationId: String(conversationId),
  });

  return true;
}

export function leaveConversation(conversationId) {
  if (!socket?.connected || !conversationId) return false;

  socket.emit("conversation:leave", {
    conversationId: String(conversationId),
  });

  return true;
}

export function sendTyping(conversationId, receiverId) {
  if (!socket?.connected || !conversationId) return false;

  socket.emit("typing:start", {
    conversationId: String(conversationId),
    receiverId: receiverId ? String(receiverId) : undefined,
  });

  return true;
}

export function stopTyping(conversationId, receiverId) {
  if (!socket?.connected || !conversationId) return false;

  socket.emit("typing:stop", {
    conversationId: String(conversationId),
    receiverId: receiverId ? String(receiverId) : undefined,
  });

  return true;
}

export function sendMessageSeen(conversationId, messageIds = []) {
  if (!socket?.connected || !conversationId) return false;

  socket.emit("message:seen", {
    conversationId: String(conversationId),
    messageIds: Array.isArray(messageIds)
      ? messageIds.map(String)
      : [],
  });

  return true;
}

export function sendSocketMessage({
  conversationId,
  receiverId,
  ciphertext,
  envelopeType,
  encryptionVersion,
  senderDeviceId,
  receiverDeviceId,
  replyTo = null,
}) {
  if (!socket?.connected) {
    throw new Error("Socket connection is not available.");
  }

  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  if (!ciphertext) {
    throw new Error("Ciphertext is required.");
  }

  socket.emit("message:send", {
    conversationId: String(conversationId),
    receiverId: receiverId ? String(receiverId) : undefined,
    ciphertext,
    envelopeType,
    encryptionVersion,
    senderDeviceId,
    receiverDeviceId,
    replyTo: replyTo ? String(replyTo) : null,
  });

  return true;
}

function requireSocket() {
  if (!socket?.connected) {
    throw new Error("Socket connection is not available.");
  }

  return socket;
}

function normalizeCallPayload(callId, extra = {}) {
  if (!callId) {
    throw new Error("Call ID is required.");
  }

  return {
    callId: String(callId),
    ...extra,
  };
}

export function initiateCall(callId) {
  requireSocket().emit(
    "call:initiate",
    normalizeCallPayload(callId)
  );
}

export function acceptCall(callId) {
  requireSocket().emit(
    "call:accept",
    normalizeCallPayload(callId)
  );
}

export function rejectCall(callId) {
  requireSocket().emit(
    "call:reject",
    normalizeCallPayload(callId)
  );
}

export function cancelCall(callId) {
  requireSocket().emit(
    "call:cancel",
    normalizeCallPayload(callId)
  );
}

export function missedCall(callId) {
  requireSocket().emit(
    "call:missed",
    normalizeCallPayload(callId)
  );
}

export function endCall(callId) {
  requireSocket().emit(
    "call:end",
    normalizeCallPayload(callId)
  );
}

export function sendCallReady(callId) {
  requireSocket().emit(
    "call:ready",
    normalizeCallPayload(callId)
  );
}

export function sendWebRTCOffer(callId, offer) {
  requireSocket().emit(
    "webrtc:offer",
    normalizeCallPayload(callId, {
      offer,
    })
  );
}

export function sendWebRTCAnswer(callId, answer) {
  requireSocket().emit(
    "webrtc:answer",
    normalizeCallPayload(callId, {
      answer,
    })
  );
}

export function sendICECandidate(callId, candidate) {
  requireSocket().emit(
    "webrtc:ice-candidate",
    normalizeCallPayload(callId, {
      candidate,
    })
  );
}