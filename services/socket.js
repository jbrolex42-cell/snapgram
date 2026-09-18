import { io } from "socket.io-client";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://10.0.2.2:5000/api";

const SOCKET_URL = API_URL.replace(
  /\/api\/?$/,
  ""
);

const TOKEN_KEYS = [
  "snapgram_token",
  "accessToken",
  "authToken",
];

const DEFAULT_CONNECT_TIMEOUT = 10000;

let socket = null;

let currentUserId = null;

let connectPromise = null;

let connectingUserId = null;

/*
 * ============================================================
 * AUTH TOKEN
 * ============================================================
 */

async function getAuthToken() {
  for (const key of TOKEN_KEYS) {
    try {
      const token =
        await AsyncStorage.getItem(key);

      if (token) {
        return token;
      }
    } catch (error) {
      console.warn(
        "[SOCKET] Token read error:",
        error?.message || error
      );
    }
  }

  return null;
}

export async function connectSocket(
  userId
) {
  const normalizedUserId =
    String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error(
      "User ID is required to connect socket."
    );
  }

  /*
   * Already connected for this account.
   */
  if (
    socket?.connected &&
    currentUserId === normalizedUserId
  ) {
    return socket;
  }

  /*
   * If another account is currently connected,
   * disconnect it first.
   */
  if (
    socket &&
    currentUserId &&
    currentUserId !== normalizedUserId
  ) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {}

    socket = null;
    connectPromise = null;
  }

  /*
   * If the same account is already connecting,
   * reuse that connection promise.
   */
  if (
    connectPromise &&
    connectingUserId === normalizedUserId
  ) {
    return connectPromise;
  }

  currentUserId =
    normalizedUserId;

  connectingUserId =
    normalizedUserId;

  connectPromise = new Promise(
    async (resolve, reject) => {
      try {
        const token =
          await getAuthToken();

        if (!token) {
          throw new Error(
            "Authentication token is missing."
          );
        }

        /*
         * Create a fresh authenticated socket.
         */
        const nextSocket = io(
          SOCKET_URL,
          {
            transports: [
              "websocket",
              "polling",
            ],

            auth: {
              token,
            },

            reconnection: true,

            reconnectionAttempts: 10,

            reconnectionDelay: 1000,

            reconnectionDelayMax: 5000,

            timeout: DEFAULT_CONNECT_TIMEOUT,
          }
        );

        socket = nextSocket;

        const handleConnect =
          () => {
            if (
              connectingUserId !==
              normalizedUserId
            ) {
              return;
            }

            /*
             * Compatibility event.
             *
             * The backend should NOT trust this ID.
             * It should use the authenticated socket user.
             */
            nextSocket.emit(
              "user:join",
              {
                userId:
                  normalizedUserId,
              }
            );

            console.log(
              "[SOCKET] Connected:",
              nextSocket.id
            );

            resolve(nextSocket);
          };

        const handleConnectError =
          (error) => {
            console.error(
              "[SOCKET] Connection error:",
              error?.message || error
            );

            reject(error);
          };

        nextSocket.once(
          "connect",
          handleConnect
        );

        nextSocket.once(
          "connect_error",
          handleConnectError
        );
      } catch (error) {
        reject(error);
      }
    }
  );

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
    connectingUserId = null;
  }
}

/*
 * ============================================================
 * WAIT FOR SOCKET
 * ============================================================
 */

export async function waitForSocket(
  userId,
  timeout = DEFAULT_CONNECT_TIMEOUT
) {
  const connectionPromise =
    connectSocket(userId);

  let timeoutId = null;

  const timeoutPromise =
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            "Socket connection timed out."
          )
        );
      }, timeout);
    });

  try {
    return await Promise.race([
      connectionPromise,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/*
 * ============================================================
 * SOCKET ACCESS
 * ============================================================
 */

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return Boolean(
    socket?.connected
  );
}

/*
 * ============================================================
 * DISCONNECT
 * ============================================================
 */

export function disconnectSocket() {
  try {
    socket?.removeAllListeners();
    socket?.disconnect();
  } catch {}

  socket = null;

  currentUserId = null;

  connectPromise = null;

  connectingUserId = null;
}

/*
 * ============================================================
 * CONVERSATIONS
 * ============================================================
 */

export function joinConversation(
  conversationId
) {
  if (!socket?.connected) {
    return false;
  }

  if (!conversationId) {
    return false;
  }

  socket.emit(
    "conversation:join",
    {
      conversationId:
        String(conversationId),
    }
  );

  return true;
}

export function leaveConversation(
  conversationId
) {
  if (!socket?.connected) {
    return false;
  }

  if (!conversationId) {
    return false;
  }

  socket.emit(
    "conversation:leave",
    {
      conversationId:
        String(conversationId),
    }
  );

  return true;
}

/*
 * ============================================================
 * TYPING
 * ============================================================
 */

export function startTyping(
  conversationId
) {
  if (!socket?.connected) {
    return false;
  }

  if (!conversationId) {
    return false;
  }

  socket.emit(
    "typing:start",
    {
      conversationId:
        String(conversationId),
    }
  );

  return true;
}

export function stopTyping(
  conversationId
) {
  if (!socket?.connected) {
    return false;
  }

  if (!conversationId) {
    return false;
  }

  socket.emit(
    "typing:stop",
    {
      conversationId:
        String(conversationId),
    }
  );

  return true;
}

/*
 * ============================================================
 * MESSAGE SEEN
 * ============================================================
 */

export function markSocketMessageSeen(
  conversationId,
  messageId
) {
  if (!socket?.connected) {
    return false;
  }

  if (
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
    }
  );

  return true;
}

/*
 * ============================================================
 * ENCRYPTED MESSAGE EVENTS
 * ============================================================
 *
 * IMPORTANT:
 *
 * Never send plaintext message text through Socket.IO.
 *
 * `ciphertext` is already encrypted by messageService/e2eeService.
 *
 * The server should only forward/store ciphertext and metadata.
 * ============================================================
 */

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
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!conversationId) {
    throw new Error(
      "conversationId is required."
    );
  }

  if (!ciphertext) {
    throw new Error(
      "Encrypted message ciphertext is required."
    );
  }

  socket.emit(
    "message:send",
    {
      conversationId:
        String(conversationId),

      receiverId:
        receiverId
          ? String(receiverId)
          : undefined,

      ciphertext,

      envelopeType,

      encryptionVersion,

      senderDeviceId:
        Number(senderDeviceId) || 1,

      receiverDeviceId:
        receiverDeviceId
          ? Number(receiverDeviceId)
          : undefined,

      replyTo:
        replyTo
          ? String(replyTo)
          : null,
    }
  );

  return true;
}

/*
 * ============================================================
 * CALL INITIATION
 * ============================================================
 */

export function initiateCall({
  callId,
  receiverId,
  type,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  if (!receiverId) {
    throw new Error(
      "receiverId is required."
    );
  }

  if (
    type !== "voice" &&
    type !== "video"
  ) {
    throw new Error(
      "Call type must be voice or video."
    );
  }

  socket.emit(
    "call:initiate",
    {
      callId:
        String(callId),

      receiverId:
        String(receiverId),

      type,
    }
  );

  return true;
}

/*
 * ============================================================
 * ACCEPT CALL
 * ============================================================
 */

export function acceptCall({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:accept",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

/*
 * ============================================================
 * REJECT CALL
 * ============================================================
 */

export function rejectCall({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:reject",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

/*
 * ============================================================
 * CANCEL CALL
 * ============================================================
 */

export function cancelCall({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:cancel",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

/*
 * ============================================================
 * END CALL
 * ============================================================
 */

export function endCall({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:end",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

/*
 * ============================================================
 * MISSED CALL
 * ============================================================
 */

export function missedCall({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:missed",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

/*
 * ============================================================
 * CALL READY
 * ============================================================
 *
 * Used by the receiver after the call screen and WebRTC
 * peer connection have been initialized.
 * ============================================================
 */

export function sendCallReady({
  callId,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  socket.emit(
    "call:ready",
    {
      callId:
        String(callId),
    }
  );

  return true;
}

export function sendWebRTCOffer({
  callId,
  offer,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  if (!offer) {
    throw new Error(
      "WebRTC offer is required."
    );
  }

  socket.emit(
    "webrtc:offer",
    {
      callId:
        String(callId),

      offer,
    }
  );

  return true;
}


export function sendWebRTCAnswer({
  callId,
  answer,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  if (!answer) {
    throw new Error(
      "WebRTC answer is required."
    );
  }

  socket.emit(
    "webrtc:answer",
    {
      callId:
        String(callId),

      answer,
    }
  );

  return true;
}

export function sendICECandidate({
  callId,
  candidate,
}) {
  if (!socket?.connected) {
    throw new Error(
      "Socket is not connected."
    );
  }

  if (!callId) {
    throw new Error(
      "callId is required."
    );
  }

  if (!candidate) {
    throw new Error(
      "ICE candidate is required."
    );
  }

  socket.emit(
    "webrtc:ice-candidate",
    {
      callId:
        String(callId),

      candidate,
    }
  );

  return true;
}

socket.emit("message:send", {
  conversationId,
  ciphertext,
  envelopeType,
  encryptionVersion,
  senderDeviceId,
});