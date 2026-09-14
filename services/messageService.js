import api from "./api";

export async function getConversations() {
  const response = await api.get("/messages/conversations");

  return Array.isArray(response.data?.conversations)
    ? response.data.conversations
    : [];
}

export async function getOrCreateConversation(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await api.post(
    `/messages/conversations/${encodeURIComponent(userId)}`
  );

  return response.data?.conversation || null;
}

export async function getMessages(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const response = await api.get(
    `/messages/${encodeURIComponent(conversationId)}`
  );

  return {
    conversation: response.data?.conversation || null,
    messages: Array.isArray(response.data?.messages)
      ? response.data.messages
      : [],
  };
}

export async function sendMessage({
  conversationId,
  receiverId,
  text,
  replyTo = null,
}) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!receiverId) {
    throw new Error("Receiver ID is required");
  }

  const cleanText = String(text || "").trim();

  if (!cleanText) {
    throw new Error("Message cannot be empty");
  }

  const response = await api.post("/messages", {
    conversationId,
    receiverId,
    text: cleanText,
    replyTo: replyTo || null,
  });

  return response.data?.message || null;
}

export async function markMessagesRead(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const response = await api.patch(
    `/messages/${encodeURIComponent(conversationId)}/read`
  );

  return response.data || {};
}

export async function reactToMessage(messageId, emoji) {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const cleanEmoji = String(emoji || "").trim();

  if (!cleanEmoji) {
    throw new Error("Reaction is required");
  }

  const response = await api.post(
    `/messages/${encodeURIComponent(messageId)}/reaction`,
    {
      emoji: cleanEmoji,
    }
  );

  return response.data || {};
}

export async function unsendMessage(messageId) {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const response = await api.patch(
    `/messages/${encodeURIComponent(messageId)}/unsend`
  );

  return response.data || {};
}

export async function deleteMessage(messageId) {
  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const response = await api.delete(
    `/messages/${encodeURIComponent(messageId)}`
  );

  return response.data || {};
}

export async function sendMediaMessage({
  conversationId,
  receiverId,
  type,
  uri,
  mimeType,
  text = "",
  replyTo = null,
}) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!receiverId) {
    throw new Error("Receiver ID is required");
  }

  if (!uri) {
    throw new Error("Media URI is required");
  }

  if (!type) {
    throw new Error("Media type is required");
  }

  const formData = new FormData();

  formData.append("conversationId", String(conversationId));
  formData.append("receiverId", String(receiverId));
  formData.append("type", String(type));

  const cleanText = String(text || "").trim();

  if (cleanText) {
    formData.append("text", cleanText);
  }

  if (replyTo) {
    formData.append("replyTo", String(replyTo));
  }

  const isVideo = type === "video";

  formData.append("media", {
    uri,
    name: isVideo
      ? `snapgram-video-${Date.now()}.mp4`
      : `snapgram-image-${Date.now()}.jpg`,
    type:
      mimeType ||
      (isVideo ? "video/mp4" : "image/jpeg"),
  });

  const response = await api.post(
    "/messages/media",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data?.message || null;
}

export async function sendVoiceMessage({
  conversationId,
  receiverId,
  uri,
  duration,
  replyTo = null,
}) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!receiverId) {
    throw new Error("Receiver ID is required");
  }

  if (!uri) {
    throw new Error("Voice URI is required");
  }

  const formData = new FormData();

  formData.append(
    "conversationId",
    String(conversationId)
  );

  formData.append(
    "receiverId",
    String(receiverId)
  );

  formData.append(
    "duration",
    String(Number(duration) || 0)
  );

  if (replyTo) {
    formData.append(
      "replyTo",
      String(replyTo)
    );
  }

  formData.append("voice", {
    uri,
    name: `snapgram-voice-${Date.now()}.m4a`,
    type: "audio/m4a",
  });

  console.log("SENDING VOICE:", {
    conversationId,
    receiverId,
    uri,
    duration,
  });

  const response = await api.post(
    "/messages/voice",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  console.log(
    "VOICE MESSAGE RESPONSE:",
    response.data
  );

  return response.data?.message || null;
}

export async function searchMessages(
  conversationId,
  query = ""
) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    return [];
  }

  const response = await api.get(
    `/messages/${encodeURIComponent(
      conversationId
    )}/search`,
    {
      params: {
        q: cleanQuery,
      },
    }
  );

  return Array.isArray(response.data?.messages)
    ? response.data.messages
    : [];
}