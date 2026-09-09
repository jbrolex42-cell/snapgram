import api from "../services/api";

export async function getStories() {
  const response = await api.get("/stories");

  return (
    response?.data?.stories ||
    response?.data ||
    []
  );
}

export async function getStory(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required.");
  }

  const response = await api.get(`/stories/${storyId}`);

  return response?.data?.story || response?.data;
}

export async function markStoryViewed(storyId) {
  if (!storyId) {
    throw new Error("Story ID is required.");
  }

  const response = await api.post(
    `/stories/${storyId}/view`
  );

  return response?.data;
}