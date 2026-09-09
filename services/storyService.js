import api from "./api";

function getErrorDetails(error) {
  return {
    message: error?.message,
    code: error?.code,
    url: error?.config?.url,
    baseURL: error?.config?.baseURL,
    method: error?.config?.method,
    status: error?.response?.status,
    response: error?.response?.data,
  };
}

export async function getStories() {
  try {
    console.log("GET STORIES START");

    const response = await api.get("/stories");

    console.log("GET STORIES SUCCESS:", {
      status: response.status,
      count: response.data?.stories?.length || 0,
    });

    return response.data?.stories || [];
  } catch (error) {
    console.error("GET STORIES FAILED:", getErrorDetails(error));
    throw error;
  }
}

export async function getUserStories(userId) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const response = await api.get(
      `/stories/user/${userId}`
    );

    return response.data?.stories || [];
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
    console.log("━━━━━━━━ GET STORY GROUPS START ━━━━━━━━");

    const url = "/stories/groups";

    console.log("REQUEST URL:", url);

    const response = await api.get(url, {
      timeout: 30000,
    });

    console.log(
      "GET STORY GROUPS SUCCESS:",
      response.status
    );

    console.log(
      "GROUP COUNT:",
      response.data?.groups?.length || 0
    );

    return response.data?.groups || [];
  } catch (error) {
    console.error(
      "━━━━━━━━ GET STORY GROUPS FAILED ━━━━━━━━"
    );

    console.error(
      "MESSAGE:",
      error?.message
    );

    console.error(
      "CODE:",
      error?.code
    );

    console.error(
      "URL:",
      error?.config?.url
    );

    console.error(
      "BASE URL:",
      error?.config?.baseURL
    );

    console.error(
      "FULL URL:",
      `${error?.config?.baseURL || ""}${error?.config?.url || ""}`
    );

    console.error(
      "METHOD:",
      error?.config?.method
    );

    console.error(
      "STATUS:",
      error?.response?.status
    );

    console.error(
      "RESPONSE:",
      error?.response?.data
    );

    console.error(
      "NETWORK ERROR:",
      !error?.response
    );

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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

  const formData = new FormData();

  const isVideo = mediaType === "video";

  const fileName = isVideo
    ? `snapgram-story-${Date.now()}.mp4`
    : `snapgram-story-${Date.now()}.jpg`;

  const mimeType = isVideo
    ? "video/mp4"
    : "image/jpeg";

  formData.append("media", {
    uri,
    name: fileName,
    type: mimeType,
  });

  if (caption?.trim()) {
    formData.append(
      "caption",
      caption.trim()
    );
  }

  console.log("CREATE STORY UPLOAD:", {
    uri,
    mediaType,
    fileName,
    mimeType,
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
    "CREATE STORY RESPONSE:",
    response.data
  );

  return (
    response.data?.story ||
    response.data
  );
}

export async function viewStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.post(
    `/stories/${storyId}/view`
  );

  return response.data;
}

export async function toggleStoryLike(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.post(
    `/stories/${storyId}/toggle-like`
  );

  return response.data;
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

  const response = await api.post(
    `/stories/${storyId}/reply`,
    {
      text: cleanText,
    }
  );

  return (
    response.data?.reply ||
    response.data
  );
}

export async function getStoryReplies(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.get(
    `/stories/${storyId}/replies`
  );

  return response.data?.replies || [];
}

export async function deleteStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.delete(
    `/stories/${storyId}`
  );

  return response.data;
}

export async function getStoryViewers(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.get(
    `/stories/${storyId}/viewers`
  );

  return response.data?.viewers || [];
}