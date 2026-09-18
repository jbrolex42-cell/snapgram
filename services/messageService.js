import api from "./api";

import {
  encryptMessage,
  decryptMessage,
  establishSession,
  hasSession,
} from "./e2ee/e2eeService";

/**
 * ============================================================
 * CONVERSATIONS
 * ============================================================
 */

export async function getConversations() {
  const response = await api.get("/messages/conversations");

  return response.data?.conversations || [];
}

export async function getOrCreateConversation(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const response = await api.post(
    `/messages/conversations/${encodeURIComponent(userId)}`
  );

  return response.data?.conversation || response.data;
}

export async function getMessages(conversationId) {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  const response = await api.get(
    `/messages/${encodeURIComponent(conversationId)}`
  );

  const messages = response.data?.messages || [];

  return Promise.all(
    messages.map(async (message) => {
      try {
        return await decryptIncomingMessage(message);
      } catch (error) {
        console.warn(
          "[E2EE] Failed to decrypt message:",
          message?.id || message?._id,
          error?.message || error
        );

        return {
          ...message,

          text: null,

          decryptionFailed: true,
        };
      }
    })
  );
}

export async function sendMessage({
  conversationId,
  receiverId,
  receiverDeviceId = 1,
  text,
  replyTo = null,
}) {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  if (!receiverId) {
    throw new Error("receiverId is required");
  }

  if (typeof text !== "string") {
    throw new Error("Message text must be a string");
  }

  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("Message cannot be empty");
  }

  const normalizedReceiverId = String(receiverId);
  const normalizedDeviceId = Number(receiverDeviceId) || 1;

  /**
   * Make sure a Signal session exists before encryption.
   */
  const sessionExists = await hasSession({
    userId: normalizedReceiverId,
    deviceId: normalizedDeviceId,
  });

  if (!sessionExists) {
    await establishSession({
      userId: normalizedReceiverId,
      deviceId: normalizedDeviceId,
    });
  }

  /**
   * Encrypt locally.
   */
  const encrypted = await encryptMessage({
    recipientUserId: normalizedReceiverId,
    recipientDeviceId: normalizedDeviceId,
    text: cleanText,
  });

  const response = await api.post("/messages", {
    conversationId: String(conversationId),

    receiverId: normalizedReceiverId,

    receiverDeviceId: normalizedDeviceId,

    ciphertext: encrypted.ciphertext,

    envelopeType: encrypted.envelopeType,

    encryptionVersion: encrypted.encryptionVersion,

    senderDeviceId: encrypted.senderDeviceId,

    replyTo: replyTo ? String(replyTo) : null,
  });

  const message =
    response.data?.message ||
    response.data;

  /**
   * The server response normally contains ciphertext.
   *
   * Return a locally usable message object so the sender
   * immediately sees the plaintext they just wrote.
   */
  return {
    ...message,

    text: cleanText,

    ciphertext: message?.ciphertext || encrypted.ciphertext,

    envelopeType:
      message?.envelopeType ||
      encrypted.envelopeType,

    encryptionVersion:
      message?.encryptionVersion ||
      encrypted.encryptionVersion,

    senderDeviceId:
      message?.senderDeviceId ??
      encrypted.senderDeviceId,

    replyTo:
      message?.replyTo ||
      replyTo ||
      null,

    decryptionFailed: false,
  };
}

/**
 * ============================================================
 * DECRYPT INCOMING MESSAGE
 * ============================================================
 *
 * Used for messages received from:
 * - REST API
 * - Socket.IO
 * - message history
 *
 * The backend must never provide plaintext message content.
 */

export async function decryptIncomingMessage(message) {
  if (!message) {
    throw new Error("Message is required");
  }

  if (!message.ciphertext) {
    throw new Error(
      "Encrypted message is missing ciphertext"
    );
  }

  if (!message.sender) {
    throw new Error(
      "Encrypted message is missing sender"
    );
  }

  const decrypted = await decryptMessage({
    senderUserId: String(message.sender),

    senderDeviceId:
      Number(message.senderDeviceId) || 1,

    ciphertext: message.ciphertext,

    envelopeType: message.envelopeType,
  });

  return {
    ...message,

    text: decrypted.text,

    decryptionFailed: false,
  };
}

/**
 * ============================================================
 * DECRYPT SOCKET MESSAGE
 * ============================================================
 *
 * Alias kept separate so the socket/message layer can make
 * the intent explicit without duplicating crypto logic.
 */

export async function decryptSocketMessage(message) {
  return decryptIncomingMessage(message);
}

/**
 * ============================================================
 * LOCAL MESSAGE NORMALIZATION
 * ============================================================
 *
 * Useful when Socket.IO sends a message that may already have
 * been decrypted by another part of the application.
 */

export async function normalizeIncomingMessage(message) {
  if (!message) {
    return null;
  }

  if (message.text && !message.ciphertext) {
    return {
      ...message,
      decryptionFailed: false,
    };
  }

  if (message.ciphertext) {
    return decryptIncomingMessage(message);
  }

  return {
    ...message,
    text: null,
    decryptionFailed: true,
  };
}
