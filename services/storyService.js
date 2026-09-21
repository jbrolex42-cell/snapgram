import api from "./api";

function getErrorDetails(error) {
  return {
    message: error?.message,
    code: error?.code,
    status: error?.response?.status,
    url: error?.config?.url,
    baseURL: error?.config?.baseURL,
    method: error?.config?.method,
    response: error?.response?.data,
  };
}

function getData(response, fallback = null) {
  return response?.data ?? fallback;
}

function getArray(response, key) {
  const value =
    response?.data?.[key] ??
    response?.data?.data?.[key] ??
    [];

  return Array.isArray(value) ? value : [];
}

export async function getStories() {
  try {
    const response = await api.get("/stories");

    return getArray(response, "stories");
  } catch (error) {
    console.error(
      "GET STORIES FAILED:",
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

    return getArray(response, "stories");
  } catch (error) {
    console.error(
      "GET USER STORIES FAILED:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryGroups() {
  try {
    const response = await api.get(
      "/stories/groups",
      {
        timeout: 30000,
      }
    );

    return getArray(response, "groups");
  } catch (error) {
    console.error(
      "GET STORY GROUPS FAILED:",
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
    throw new Error("Story media is required");
  }

  const type =
    mediaType === "video"
      ? "video"
      : "image";

  const isVideo = type === "video";

  const formData = new FormData();

  formData.append("media", {
    uri,
    name: `snapgram-story-${Date.now()}.${
      isVideo ? "mp4" : "jpg"
    }`,
    type: isVideo
      ? "video/mp4"
      : "image/jpeg",
  });

  const cleanCaption =
    typeof caption === "string"
      ? caption.trim()
      : "";

  if (cleanCaption) {
    formData.append(
      "caption",
      cleanCaption
    );
  }

  try {
    console.log("[STORY] UPLOADING STORY:", {
      mediaType: type,
      hasCaption: Boolean(cleanCaption),
    });

    const response = await api.post(
      "/stories",
      formData,
      {
        headers: {
          Accept: "application/json",
        },
        timeout: 120000,
      }
    );

    console.log(
      "[STORY] CREATE SUCCESS:",
      response.status
    );

    return (
      response?.data?.story ??
      response?.data ??
      null
    );
  } catch (error) {
    console.error(
      "[STORY] CREATE FAILED:",
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

    return getData(response, {});
  } catch (error) {
    console.error(
      "VIEW STORY FAILED:",
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

    return getData(response, {});
  } catch (error) {
    console.error(
      "TOGGLE STORY LIKE FAILED:",
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

  const cleanText =
    typeof text === "string"
      ? text.trim()
      : "";

  if (!cleanText) {
    throw new Error("Reply cannot be empty");
  }

  if (cleanText.length > 500) {
    throw new Error(
      "Reply cannot exceed 500 characters"
    );
  }

  try {
    const response = await api.post(
      `/stories/${storyId}/reply`,
      {
        text: cleanText,
      }
    );

    return (
      response?.data?.reply ??
      response?.data ??
      null
    );
  } catch (error) {
    console.error(
      "REPLY TO STORY FAILED:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryReplies(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.get(
      `/stories/${storyId}/replies`
    );

    return getArray(response, "replies");
  } catch (error) {
    console.error(
      "GET STORY REPLIES FAILED:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function deleteStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.delete(
      `/stories/${storyId}`
    );

    return getData(response, {});
  } catch (error) {
    console.error(
      "DELETE STORY FAILED:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export async function getStoryViewers(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  try {
    const response = await api.get(
      `/stories/${storyId}/viewers`
    );

    return getArray(response, "viewers");
  } catch (error) {
    console.error(
      "GET STORY VIEWERS FAILED:",
      getErrorDetails(error)
    );

    throw error;
  }
}

export default {
  getStories,
  getUserStories,
  getStoryGroups,
  createStory,
  viewStory,
  toggleStoryLike,
  replyToStory,
  getStoryReplies,
  deleteStory,
  getStoryViewers,
};