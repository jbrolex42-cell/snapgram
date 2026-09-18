import api from "./api";

const VALID_TYPES = [
  "voice",
  "video",
];

export async function startCall({
  receiverId,
  type,
}) {
  if (!receiverId) {
    throw new Error(
      "Receiver ID is required."
    );
  }

  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      "Call type must be voice or video."
    );
  }

  const response = await api.post(
    "/calls",
    {
      receiverId,
      type,
    }
  );

  return (
    response.data?.call ||
    response.data
  );
}

export async function getCall(callId) {
  if (!callId) {
    throw new Error(
      "Call ID is required."
    );
  }

  const response = await api.get(
    `/calls/${callId}`
  );

  return (
    response.data?.call ||
    response.data
  );
}

export async function getCallHistory() {
  const response = await api.get(
    "/calls/history"
  );

  return (
    response.data?.calls ||
    []
  );
}

export async function getTurnCredentials() {
  const response = await api.get(
    "/calls/turn-credentials"
  );

  return (
    response.data?.iceServers ||
    []
  );
}

export async function createGroupCall({
  participantIds,
  type,
}) {
  if (
    !Array.isArray(participantIds) ||
    participantIds.length === 0
  ) {
    throw new Error(
      "At least one participant is required."
    );
  }

  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      "Call type must be voice or video."
    );
  }

  const response = await api.post(
    "/calls/group",
    {
      participantIds,
      type,
    }
  );

  return (
    response.data?.call ||
    response.data
  );
}