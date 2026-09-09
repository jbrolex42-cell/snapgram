import api from "./api";

/**
 * Search users
 */
export async function searchUsers(query = "") {
  const response = await api.get("/users/search", {
    params: {
      q: query,
    },
  });

  return response.data?.users || [];
}

/**
 * Get a user's profile by username
 */
export async function getUserProfile(username) {
  if (!username) {
    return null;
  }

  const response = await api.get(
    `/users/profile/${encodeURIComponent(username)}`
  );

  return response.data?.user || null;
}

/**
 * Update the authenticated user's profile
 */
export async function updateProfile({
  name = "",
  username = "",
  bio = "",
  website = "",
  pronouns = "",
  gender = "",
  avatar = null,
}) {
  const formData = new FormData();

  formData.append("name", String(name || ""));
  formData.append("username", String(username || ""));
  formData.append("bio", String(bio || ""));
  formData.append("website", String(website || ""));
  formData.append("pronouns", String(pronouns || ""));
  formData.append("gender", String(gender || ""));

  if (avatar?.uri) {
    formData.append("avatar", {
      uri: avatar.uri,
      name:
        avatar.fileName ||
        `snapgram-avatar-${Date.now()}.jpg`,
      type: avatar.mimeType || "image/jpeg",
    });
  }

  const response = await api.patch(
    "/users/profile",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data?.user || null;
}

/**
 * Get posts created by a user
 */
export async function getUserPosts(username) {
  if (!username) {
    return [];
  }

  const response = await api.get(
    `/users/${encodeURIComponent(username)}/posts`
  );

  return response.data?.posts || [];
}

/**
 * Get saved posts for the authenticated user
 */
export async function getSavedPosts() {
  const response = await api.get("/users/saved");

  return response.data?.posts || [];
}

/**
 * Get a user's online/status information
 */
export async function getUserStatus(userId) {
  if (!userId) {
    return null;
  }

  const response = await api.get(
    `/status/${userId}`
  );

  return response.data || null;
}