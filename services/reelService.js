import api from "./api";

export async function getReels(
  page = 1,
  limit = 10
) {
  const response = await api.get(
    "/reels",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return response.data;
}

export async function getReelById(id) {
  if (!id) {
    throw new Error(
      "Reel ID is required."
    );
  }

  const response = await api.get(
    `/reels/${id}`
  );

  return (
    response.data?.reel ||
    response.data
  );
}

export const getReel =
  getReelById;

export async function likeReel(id) {
  const response = await api.post(
    `/reels/${id}/like`
  );

  return response.data;
}

export async function unlikeReel(id) {
  const response = await api.delete(
    `/reels/${id}/like`
  );

  return response.data;
}

export async function toggleReelLike(id) {
  const response = await api.post(
    `/reels/${id}/toggle-like`
  );

  return response.data;
}

export async function saveReel(id) {
  const response = await api.post(
    `/reels/${id}/save`
  );

  return response.data;
}

export async function viewReel(id) {
  const response = await api.post(
    `/reels/${id}/view`
  );

  return response.data;
}