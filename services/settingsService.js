import api from "./api";

export async function getSettings() {
  const response = await api.get(
    "/settings"
  );

  return (
    response.data?.settings || {
      isPrivate: false,
      closeFriends: [],
      blockedUsers: [],
      mutedUsers: [],
      restrictedUsers: [],
      preferences: {},
    }
  );
}

export async function updateSettings(
  data
) {
  const response = await api.patch(
    "/settings",
    data
  );

  return response.data;
}

export async function addRelationship(
  userId,
  type
) {
  const response = await api.post(
    `/settings/relationships/${userId}`,
    {
      type,
    }
  );

  return response.data;
}

export async function removeRelationship(
  userId,
  type
) {
  const response = await api.delete(
    `/settings/relationships/${userId}`,
    {
      data: {
        type,
      },
    }
  );

  return response.data;
}