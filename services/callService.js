import api from "./api";

export async function startCall({
  receiverId,
  type,
}) {
  const response = await api.post(
    "/calls",
    {
      receiverId,
      type,
    }
  );

  return response.data.call;
}

export async function updateCall(
  callId,
  status
) {
  const response = await api.patch(
    `/calls/${callId}`,
    {
      status,
    }
  );

  return response.data.call;
}

export async function getCallHistory() {
  const response =
    await api.get(
      "/calls/history"
    );

  return response.data.calls;
}

export async function getTurnCredentials() {
  const response =
    await api.get(
      "/calls/turn-credentials"
    );

  return response.data.iceServers;
}