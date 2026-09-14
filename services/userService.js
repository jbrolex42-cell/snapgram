import api from "./api";

export async function searchUsers(query = "") {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    return [];
  }

  const response = await api.get("/users/search", {
    params: {
      q: cleanQuery,
    },
  });

  return Array.isArray(response.data?.users)
    ? response.data.users
    : [];
}

export async function getUserProfile(username) {
  const cleanUsername = String(username || "")
    .trim()
    .toLowerCase();

  if (!cleanUsername) {
    return null;
  }

  const response = await api.get(
    `/users/profile/${encodeURIComponent(cleanUsername)}`
  );

  return response.data?.user || null;
}

export async function updateProfile({
  fullName = "",
  username = "",
  bio = "",
  website = "",
  pronouns = "",
  gender = "",
  avatar = null,
}) {
  const formData = new FormData();

  formData.append(
    "fullName",
    String(fullName || "").trim()
  );

  formData.append(
    "username",
    String(username || "").trim().toLowerCase()
  );

  formData.append(
    "bio",
    String(bio || "").trim()
  );

  formData.append(
    "website",
    String(website || "").trim()
  );

  formData.append(
    "pronouns",
    String(pronouns || "").trim()
  );

  formData.append(
    "gender",
    String(gender || "").trim()
  );

  if (avatar?.uri) {
    formData.append("avatar", {
      uri: avatar.uri,
      name:
        avatar.fileName ||
        `snapgram-avatar-${Date.now()}.jpg`,
      type:
        avatar.mimeType ||
        avatar.type ||
        "image/jpeg",
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

export async function getUserPosts(username) {
  const cleanUsername = String(username || "")
    .trim()
    .toLowerCase();

  if (!cleanUsername) {
    return [];
  }

  const response = await api.get(
    `/users/${encodeURIComponent(cleanUsername)}/posts`
  );

  return Array.isArray(response.data?.posts)
    ? response.data.posts
    : [];
}

export async function getSavedPosts() {
  const response = await api.get("/users/saved");

  return Array.isArray(response.data?.posts)
    ? response.data.posts
    : [];
}

export async function getUserStatus(userId) {
  if (!userId) {
    return null;
  }

  const response = await api.get(
    `/status/${encodeURIComponent(userId)}`
  );

  return response.data || null;
}