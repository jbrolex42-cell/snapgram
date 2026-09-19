import api from "./api";

export async function getConversationPreferences(
  conversationId
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.get(
    `/conversation-preferences/${conversationId}`
  );

  return response.data;
}

export async function setConversationMute(
  conversationId,
  duration
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.patch(
    `/conversation-preferences/${conversationId}/mute`,
    {
      duration,
    }
  );

  return response.data;
}

export async function setConversationRestriction(
  conversationId,
  restricted
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.patch(
    `/conversation-preferences/${conversationId}/restrict`,
    {
      restricted: Boolean(restricted),
    }
  );

  return response.data;
}

export async function setConversationTheme(
  conversationId,
  theme
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.patch(
    `/conversation-preferences/${conversationId}/theme`,
    {
      theme,
    }
  );

  return response.data;
}

export async function setConversationNickname(
  conversationId,
  nickname
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.patch(
    `/conversation-preferences/${conversationId}/nickname`,
    {
      nickname: nickname || "",
    }
  );

  return response.data;
}

export async function setDisappearingMessages(
  conversationId,
  duration
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.patch(
    `/conversation-preferences/${conversationId}/disappearing`,
    {
      duration,
    }
  );

  return response.data;
}

export async function setConversationBlock(
  conversationId,
  blocked
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  const response = await api.post(
    `/conversation-preferences/${conversationId}/block`,
    {
      blocked: Boolean(blocked),
    }
  );

  return response.data;
}

export async function reportConversation(
  conversationId,
  {
    reason,
    messageId = null,
    details = "",
  } = {}
) {
  if (!conversationId) {
    throw new Error(
      "Conversation ID is required"
    );
  }

  if (!reason) {
    throw new Error(
      "Report reason is required"
    );
  }

  const response = await api.post(
    `/conversation-preferences/${conversationId}/report`,
    {
      reason,
      messageId,
      details,
    }
  );

  return response.data;
}