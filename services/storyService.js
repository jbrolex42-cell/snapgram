import api from "./api";

function getErrorDetails(error) {
  return {
    message:
      error?.response?.data?.message ||
      error?.message ||
      "Story request failed",

    status:
      error?.response?.status || null,

    data:
      error?.response?.data || null,
  };
}

function getData(response) {
  return response?.data || {};
}

function getArray(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

export async function getStories() {
  try {
    const response = await api.get("/stories");

    return getArray(getData(response), [
      "stories",
      "data",
    ]);
  } catch (error) {
    console.error(
      "GET STORIES ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getUserStories(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await api.get(
      `/stories/user/${userId}`
    );

    return getArray(getData(response), [
      "stories",
      "data",
    ]);
  } catch (error) {
    console.error(
      "GET USER STORIES ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryGroups() {
  try {
    const response =
      await api.get("/stories/groups");

    return getArray(getData(response), [
      "groups",
      "data",
    ]);
  } catch (error) {
    console.error(
      "GET STORY GROUPS ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function createStory(
  uri,
  mediaType = "image",
  caption = ""
) {
  if (!uri) {
    throw new Error("Story media URI is required");
  }

  const normalizedType =
    String(mediaType).toLowerCase() === "video"
      ? "video"
      : "image";

  const extension =
    normalizedType === "video"
      ? "mp4"
      : "jpg";

  const mimeType =
    normalizedType === "video"
      ? "video/mp4"
      : "image/jpeg";

  const formData = new FormData();

  formData.append("media", {
    uri,
    name: `snapgram-story-${Date.now()}.${extension}`,
    type: mimeType,
  });

  if (
    typeof caption === "string" &&
    caption.trim()
  ) {
    formData.append(
      "caption",
      caption.trim()
    );
  }

  console.log(
    "[STORY SERVICE] UPLOAD:",
    {
      uri,
      mediaType: normalizedType,
      mimeType,
      fieldName: "media",
    }
  );

  try {
    const response = await api.post(
      "/stories",
      formData,
      {
        headers: {
          Accept: "application/json",
        },

        timeout: 120000,

        transformRequest: [
          (data) => data,
        ],
      }
    );

    console.log(
      "[STORY SERVICE] SUCCESS:",
      response?.status
    );

    return (
      response?.data?.story ??
      response?.data ??
      null
    );
  } catch (error) {
    console.error(
      "[STORY SERVICE] CREATE STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function viewStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.post(
      `/stories/${storyId}/view`
    );

    return getData(response);
  } catch (error) {
    console.error(
      "VIEW STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function toggleStoryLike(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.post(
      `/stories/${storyId}/toggle-like`
    );

    return getData(response);
  } catch (error) {
    console.error(
      "TOGGLE STORY LIKE ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function likeStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.post(
      `/stories/${storyId}/like`
    );

    return getData(response);
  } catch (error) {
    console.error(
      "LIKE STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function unlikeStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.delete(
      `/stories/${storyId}/like`
    );

    return getData(response);
  } catch (error) {
    console.error(
      "UNLIKE STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function replyToStory(
  storyId,
  text
) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  if (!text?.trim()) {
    throw new Error("Reply cannot be empty");
  }

  try {
    const response = await api.post(
      `/stories/${storyId}/reply`,
      {
        text: text.trim(),
      }
    );

    return (
      response?.data?.reply ??
      response?.data ??
      null
    );
  } catch (error) {
    console.error(
      "REPLY TO STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryReplies(
  storyId
) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.get(
      `/stories/${storyId}/replies`
    );

    return getArray(getData(response), [
      "replies",
      "data",
    ]);
  } catch (error) {
    console.error(
      "GET STORY REPLIES ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function deleteStory(
  storyId
) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.delete(
      `/stories/${storyId}`
    );

    return getData(response);
  } catch (error) {
    console.error(
      "DELETE STORY ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryViewers(
  storyId
) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.get(
      `/stories/${storyId}/viewers`
    );

    return getArray(getData(response), [
      "viewers",
      "data",
    ]);
  } catch (error) {
    console.error(
      "GET STORY VIEWERS ERROR:",
      getErrorDetails(error)
    );

    throw error;
  }
}