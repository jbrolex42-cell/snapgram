import api from "./api";

import {
  encryptMessage,
  decryptMessage,
  establishSession,
  hasSession,
} from "./e2ee/e2eeService";

function normalizeUserId(userId) {
  if (!userId) {
    throw new Error("Authenticated user ID is required");
  }

  return String(userId);
}

function normalizeDeviceId(deviceId) {
  const normalized = Number(deviceId);

  return Number.isFinite(normalized) && normalized > 0
    ? normalized
    : 1;
}

function getMessageId(message) {
  return message?.id || message?._id || null;
}

export async function getConversations() {
  const response = await api.get("/messages/conversations");

  return response.data?.conversations || [];
}

export async function getOrCreateConversation(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const response = await api.post(
    `/messages/conversations/${encodeURIComponent(
      String(userId)
    )}`
  );

  return (
    response.data?.conversation ||
    response.data ||
    null
  );
}

export async function getMessages({
  conversationId,
  localUserId,
} = {}) {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  const normalizedLocalUserId =
    normalizeUserId(localUserId);

  const response = await api.get(
    `/messages/${encodeURIComponent(
      String(conversationId)
    )}`
  );

  const serverMessages =
    response.data?.messages || [];

  const messages = await Promise.all(
    serverMessages.map(async (message) => {
      try {
        return await decryptIncomingMessage({
          message,
          localUserId: normalizedLocalUserId,
        });
      } catch (error) {
        console.warn(
          "[E2EE] Failed to decrypt message:",
          getMessageId(message),
          error?.message || error
        );

        return {
          ...message,

          text: null,

          decryptionFailed: true,

          displayText:
            "Unable to decrypt this message.",
        };
      }
    })
  );

  return {
    conversation:
      response.data?.conversation || null,

    messages,

    pagination:
      response.data?.pagination || null,
  };
}

export async function sendMessage({
  conversationId,
  receiverId,
  receiverDeviceId = 1,
  text,
  replyTo = null,
  localUserId,
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

  const normalizedLocalUserId =
    normalizeUserId(localUserId);

  const normalizedReceiverId =
    String(receiverId);

  const normalizedDeviceId =
    normalizeDeviceId(receiverDeviceId);

  const sessionExists = await hasSession({
    userId: normalizedReceiverId,
    deviceId: normalizedDeviceId,

    localUserId:
      normalizedLocalUserId,
  });

  if (!sessionExists) {
    await establishSession({
      userId: normalizedReceiverId,
      deviceId: normalizedDeviceId,

      localUserId:
        normalizedLocalUserId,
    });
  }

  const encrypted = await encryptMessage({
    recipientUserId:
      normalizedReceiverId,

    recipientDeviceId:
      normalizedDeviceId,

    text: cleanText,

    localUserId:
      normalizedLocalUserId,
  });

  if (!encrypted?.ciphertext) {
    throw new Error(
      "Message encryption failed"
    );
  }

  const response = await api.post(
    "/messages",
    {
      conversationId:
        String(conversationId),

      receiverId:
        normalizedReceiverId,

      receiverDeviceId:
        normalizedDeviceId,

      ciphertext:
        encrypted.ciphertext,

      envelopeType:
        encrypted.envelopeType,

      encryptionVersion:
        encrypted.encryptionVersion,

      senderDeviceId:
        encrypted.senderDeviceId,

      replyTo:
        replyTo
          ? String(replyTo)
          : null,
    }
  );

  const message =
    response.data?.message ||
    response.data;

  if (!message) {
    throw new Error(
      "Server did not return the created message"
    );
  }

  return {
    ...message,

    text: cleanText,

    ciphertext:
      message?.ciphertext ||
      encrypted.ciphertext,

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
      message?.replyTo ??
      (replyTo
        ? String(replyTo)
        : null),

    decryptionFailed: false,

    localPlaintext: true,
  };
}

export async function decryptIncomingMessage({
  message,
  localUserId,
} = {}) {
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

  const normalizedLocalUserId =
    normalizeUserId(localUserId);

  const senderUserId =
    String(message.sender);

  const senderDeviceId =
    normalizeDeviceId(
      message.senderDeviceId
    );

  const decrypted = await decryptMessage({
    senderUserId,

    senderDeviceId,

    ciphertext:
      message.ciphertext,

    envelopeType:
      message.envelopeType,

    localUserId:
      normalizedLocalUserId,
  });

  if (
    !decrypted ||
    typeof decrypted.text !== "string"
  ) {
    throw new Error(
      "Message decryption returned no plaintext"
    );
  }

  return {
    ...message,

    text: decrypted.text,

    decryptionFailed: false,

    localPlaintext: true,
  };
}

export async function decryptSocketMessage({
  message,
  localUserId,
} = {}) {
  return decryptIncomingMessage({
    message,
    localUserId,
  });
}


export async function normalizeIncomingMessage({
  message,
  localUserId,
} = {}) {
  if (!message) {
    return null;
  }

  if (
    message.localPlaintext === true &&
    typeof message.text === "string"
  ) {
    return {
      ...message,

      decryptionFailed: false,
    };
  }

  if (message.ciphertext) {
    try {
      return await decryptIncomingMessage({
        message,
        localUserId,
      });
    } catch (error) {
      console.warn(
        "[E2EE] Incoming message decryption failed:",
        getMessageId(message),
        error?.message || error
      );

      return {
        ...message,

        text: null,

        decryptionFailed: true,

        displayText:
          "Unable to decrypt this message.",
      };
    }
  }

  return {
    ...message,

    text: null,

    decryptionFailed: true,

    displayText:
      "Encrypted message unavailable.",
  };
}