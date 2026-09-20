import api from "../api";

function extractTracks(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.tracks)) {
    return data.tracks;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export async function searchMusic(
  query = "",
  page = 1,
  limit = 20
) {
  const response = await api.get("/music/search", {
    params: {
      q: query,
      page,
      limit,
    },
  });

  return {
    tracks: extractTracks(response),
    page: response?.data?.page || page,
    limit: response?.data?.limit || limit,
    total: response?.data?.total || 0,
    hasMore: Boolean(response?.data?.hasMore),
  };
}

export async function getFeaturedMusic(limit = 20) {
  const response = await api.get("/music/featured", {
    params: {
      limit,
    },
  });

  return extractTracks(response);
}

export async function getPopularMusic(limit = 20) {
  const response = await api.get("/music/popular", {
    params: {
      limit,
    },
  });

  return extractTracks(response);
}

export async function getMusicTrack(id) {
  if (!id) {
    return null;
  }

  const response = await api.get(`/music/${id}`);

  return response?.data?.track || null;
}

export async function recordMusicPlay(id) {
  if (!id) {
    return;
  }

  try {
    await api.post(`/music/${id}/play`);
  } catch (error) {
    console.warn(
      "[MUSIC] Failed to record play:",
      error?.message
    );
  }
}

export async function recordMusicUse(id) {
  if (!id) {
    return;
  }

  try {
    await api.post(`/music/${id}/use`);
  } catch (error) {
    console.warn(
      "[MUSIC] Failed to record usage:",
      error?.message
    );
  }
}

export default {
  searchMusic,
  getFeaturedMusic,
  getPopularMusic,
  getMusicTrack,
  recordMusicPlay,
  recordMusicUse,
};