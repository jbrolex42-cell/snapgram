import api from "./api";

export async function getHomeFeed() {
  const response =
    await api.get("/feed");

  return response.data.posts || [];
}