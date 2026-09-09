import api from "./api";

export async function getReels(page = 1) {
  const response = await api.get(
    `/reels?page=${page}&limit=10`
  );

  return (
    response.data.reels ||
    response.data ||
    []
  );
}

export async function getReel(id) {
  const response = await api.get(
    `/reels/${id}`
  );

  return response.data.reel;
}

export async function likeReel(id) {
  const response = await api.post(
    `/reels/${id}/like`
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

export async function createReel({
  asset,
  caption = "",
  duration = 0,
  trimStart = 0,
  trimEnd = 0,
  location = "",
  tags = [],
  hashtags = [],
  coverUri = null,
}) {
  if (!asset?.uri) {
    throw new Error(
      "A video asset is required to create a reel."
    );
  }

  const formData = new FormData();

  formData.append(
    "caption",
    caption
  );

  formData.append(
    "duration",
    String(duration)
  );

  formData.append(
    "trimStart",
    String(trimStart)
  );

  formData.append(
    "trimEnd",
    String(trimEnd)
  );

  formData.append(
    "location",
    location
  );

  formData.append(
    "tags",
    JSON.stringify(tags)
  );

  formData.append(
    "hashtags",
    JSON.stringify(hashtags)
  );

  formData.append(
    "video",
    {
      uri: asset.uri,
      name:
        asset.fileName ||
        `reel-${Date.now()}.mp4`,
      type:
        asset.mimeType ||
        "video/mp4",
    }
  );

  if (coverUri) {
    formData.append(
      "cover",
      {
        uri: coverUri,
        name:
          `cover-${Date.now()}.jpg`,
        type: "image/jpeg",
      }
    );
  }

  const response = await api.post(
    "/reels",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data.reel;
}