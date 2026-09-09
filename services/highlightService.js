import api from "./api";

/*
|--------------------------------------------------------------------------
| Get a user's highlights
|--------------------------------------------------------------------------
*/

export async function getHighlights(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await api.get(`/highlights/user/${userId}`);

  return (
    response.data?.highlights ||
    response.data?.data?.highlights ||
    response.data ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Get my highlights
|--------------------------------------------------------------------------
*/

export async function getMyHighlights() {
  const response = await api.get("/highlights");

  return (
    response.data?.highlights ||
    response.data?.data?.highlights ||
    response.data ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Get one highlight
|--------------------------------------------------------------------------
*/

export async function getHighlight(highlightId) {
  if (!highlightId) {
    throw new Error("Highlight ID is required");
  }

  const response = await api.get(`/highlights/${highlightId}`);

  return (
    response.data?.highlight ||
    response.data?.data?.highlight ||
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Create highlight
|--------------------------------------------------------------------------
*/

export async function createHighlight({
  title,
  storyIds,
  coverUrl = "",
}) {
  if (!Array.isArray(storyIds) || storyIds.length === 0) {
    throw new Error("Select at least one story");
  }

  const payload = {
    title: String(title || "Highlight").trim(),
    storyIds,
    coverUrl: coverUrl || "",
  };

  const response = await api.post("/highlights", payload);

  return (
    response.data?.highlight ||
    response.data?.data?.highlight ||
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Update highlight
|--------------------------------------------------------------------------
*/

export async function updateHighlight(
  highlightId,
  {
    title,
    storyIds,
    coverUrl,
  } = {}
) {
  if (!highlightId) {
    throw new Error("Highlight ID is required");
  }

  const payload = {};

  if (title !== undefined) {
    payload.title = String(title || "Highlight").trim();
  }

  if (storyIds !== undefined) {
    payload.storyIds = Array.isArray(storyIds) ? storyIds : [];
  }

  if (coverUrl !== undefined) {
    payload.coverUrl = coverUrl || "";
  }

  const response = await api.put(
    `/highlights/${highlightId}`,
    payload
  );

  return (
    response.data?.highlight ||
    response.data?.data?.highlight ||
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Delete highlight
|--------------------------------------------------------------------------
*/

export async function deleteHighlight(highlightId) {
  if (!highlightId) {
    throw new Error("Highlight ID is required");
  }

  const response = await api.delete(
    `/highlights/${highlightId}`
  );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Add stories to highlight
|--------------------------------------------------------------------------
*/

export async function addStoriesToHighlight(
  highlightId,
  storyIds
) {
  if (!highlightId) {
    throw new Error("Highlight ID is required");
  }

  if (!Array.isArray(storyIds) || storyIds.length === 0) {
    throw new Error("Select at least one story");
  }

  const response = await api.post(
    `/highlights/${highlightId}/stories`,
    {
      storyIds,
    }
  );

  return (
    response.data?.highlight ||
    response.data?.data?.highlight ||
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Remove story from highlight
|--------------------------------------------------------------------------
*/

export async function removeStoryFromHighlight(
  highlightId,
  storyId
) {
  if (!highlightId) {
    throw new Error("Highlight ID is required");
  }

  if (!storyId) {
    throw new Error("Story ID is required");
  }

  const response = await api.delete(
    `/highlights/${highlightId}/stories/${storyId}`
  );

  return (
    response.data?.highlight ||
    response.data?.data?.highlight ||
    response.data
  );
}

export default {
  getHighlights,
  getMyHighlights,
  getHighlight,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  addStoriesToHighlight,
  removeStoryFromHighlight,
};