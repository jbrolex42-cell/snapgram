import api from "./api";

function getMimeType(item) {
  const mimeType =
    item?.mimeType ||
    item?.type ||
    item?.file?.type ||
    item?.asset?.mimeType ||
    "";

  if (mimeType === "image") {
    return "image/jpeg";
  }

  if (mimeType === "video") {
    return "video/mp4";
  }

  if (mimeType.startsWith("image/")) {
    return mimeType;
  }

  if (mimeType.startsWith("video/")) {
    return mimeType;
  }

  const uri = String(item?.uri || "").toLowerCase();

  if (/\.(mp4|mov|m4v|avi|webm)(\?.*)?$/.test(uri)) {
    return "video/mp4";
  }

  if (/\.(png)(\?.*)?$/.test(uri)) {
    return "image/png";
  }

  if (/\.(webp)(\?.*)?$/.test(uri)) {
    return "image/webp";
  }

  if (/\.(heic|heif)(\?.*)?$/.test(uri)) {
    return "image/heic";
  }

  return "image/jpeg";
}

function getFileName(item, index = 0) {
  const originalName =
    item?.fileName ||
    item?.filename ||
    item?.name ||
    item?.file?.name ||
    item?.asset?.fileName ||
    "";

  if (originalName) {
    return originalName;
  }

  const mimeType = getMimeType(item);
  const timestamp = Date.now();

  if (mimeType.startsWith("video/")) {
    return `video-${timestamp}-${index}.mp4`;
  }

  if (mimeType === "image/png") {
    return `image-${timestamp}-${index}.png`;
  }

  if (mimeType === "image/webp") {
    return `image-${timestamp}-${index}.webp`;
  }

  if (mimeType === "image/heic") {
    return `image-${timestamp}-${index}.heic`;
  }

  return `image-${timestamp}-${index}.jpg`;
}

function appendJsonField(formData, key, value) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === "string") {
    formData.append(key, value);
    return;
  }

  try {
    formData.append(key, JSON.stringify(value));
  } catch (error) {
    console.warn(
      `[POST SERVICE] Unable to stringify ${key}:`,
      error
    );
  }
}

function normalizeMusic(music) {
  if (!music || typeof music !== "object") {
    return null;
  }

  const trackId =
    music.trackId ||
    music.id ||
    music.providerTrackId ||
    "";

  if (!trackId) {
    return null;
  }

  const startMs = Math.max(
    Number(music.startMs) || 0,
    0
  );

  const durationMs = Math.max(
    Number(music.durationMs) || 0,
    0
  );

  return {
    trackId: String(trackId),

    title: String(
      music.title ||
        ""
    ),

    artist: String(
      music.artist ||
        ""
    ),

    album: String(
      music.album ||
        ""
    ),

    artworkUrl: String(
      music.artworkUrl ||
        ""
    ),

    provider: String(
      music.provider ||
        "epidemic-sound"
    ),

    providerTrackId: String(
      music.providerTrackId ||
        trackId
    ),

    startMs,
    durationMs,
  };
}

function extractPosts(response) {
  const body = response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.posts)) {
    return body.posts;
  }

  if (Array.isArray(body?.reels)) {
    return body.reels;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.data?.posts)) {
    return body.data.posts;
  }

  if (Array.isArray(body?.data?.reels)) {
    return body.data.reels;
  }

  if (Array.isArray(body?.data?.data)) {
    return body.data.data;
  }

  if (Array.isArray(body?.items)) {
    return body.items;
  }

  if (Array.isArray(body?.results)) {
    return body.results;
  }

  return [];
}

export async function createPost({
  media = [],
  caption = "",
  location = null,
  taggedUsers = [],
  postType = "post",
  visibility = "public",
  music = null,

  onUploadProgress,
} = {}) {
  if (!Array.isArray(media) || media.length === 0) {
    throw new Error("Please select at least one media file.");
  }

  if (media.length > 10) {
    throw new Error(
      "You can upload a maximum of 10 media files."
    );
  }

  const normalizedPostType =
    postType === "reel"
      ? "reel"
      : "post";

  if (normalizedPostType === "reel") {
    const hasVideo = media.some((item) => {
      const mimeType = getMimeType(item);

      return mimeType.startsWith("video/");
    });

    if (!hasVideo) {
      throw new Error(
        "A reel must contain at least one video."
      );
    }
  }

  const normalizedMusic = normalizeMusic(music);

  const formData = new FormData();

  let validMediaCount = 0;

  media.forEach((item, index) => {
    if (!item?.uri) {
      console.warn(
        `[POST SERVICE] Skipping media ${index}: missing URI`
      );

      return;
    }

    const mimeType = getMimeType(item);
    const name = getFileName(item, index);

    formData.append("media", {
      uri: item.uri,
      type: mimeType,
      name,
    });

    validMediaCount += 1;
  });

  if (validMediaCount === 0) {
    throw new Error(
      "No valid media files were found."
    );
  }

  formData.append(
    "postType",
    normalizedPostType
  );

  if (caption && String(caption).trim()) {
    formData.append(
      "caption",
      String(caption).trim()
    );
  }

  if (
    location !== null &&
    location !== undefined
  ) {
    appendJsonField(
      formData,
      "location",
      location
    );
  }

  if (
    taggedUsers !== null &&
    taggedUsers !== undefined
  ) {
    appendJsonField(
      formData,
      "taggedUsers",
      taggedUsers
    );
  }

  if (visibility) {
    formData.append(
      "visibility",
      String(visibility)
    );
  }

  if (normalizedMusic) {
    appendJsonField(
      formData,
      "music",
      normalizedMusic
    );
  }

  console.log(
    "[POST SERVICE] CREATE POST:",
    {
      postType: normalizedPostType,
      mediaCount: validMediaCount,
      captionLength: String(
        caption || ""
      ).length,

      hasMusic: Boolean(
        normalizedMusic
      ),

      music: normalizedMusic
        ? {
            trackId:
              normalizedMusic.trackId,
            provider:
              normalizedMusic.provider,
            providerTrackId:
              normalizedMusic.providerTrackId,
            startMs:
              normalizedMusic.startMs,
            durationMs:
              normalizedMusic.durationMs,
          }
        : null,
    }
  );

  try {
    const response = await api.post(
      "/posts",
      formData,
      {
        timeout: 120000,

        headers: {
          "Content-Type":
            "multipart/form-data",
        },

        onUploadProgress,
      }
    );

    console.log(
      "[POST SERVICE] CREATE RESPONSE:",
      {
        status:
          response?.status,
        data:
          response?.data,
      }
    );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    console.error(
      "[POST SERVICE] CREATE ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "[POST SERVICE] CREATE ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "[POST SERVICE] CREATE ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
}

export async function getFeed(
  page = 1,
  limit = 30
) {
  const response = await api.get(
    "/posts/feed",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return extractPosts(response);
}

export async function getUserPosts(
  page = 1,
  limit = 50
) {
  try {
    console.log(
      "[POST SERVICE] GET USER POSTS:",
      {
        endpoint: "/posts/mine",
        page,
        limit,
      }
    );

    const response = await api.get(
      "/posts/mine",
      {
        params: {
          page,
          limit,
        },
      }
    );

    console.log(
      "[POST SERVICE] /posts/mine STATUS:",
      response?.status
    );

    console.log(
      "[POST SERVICE] /posts/mine DATA:",
      response?.data
    );

    const posts =
      extractPosts(response);

    console.log(
      "[POST SERVICE] /posts/mine NORMALIZED:",
      posts.length
    );

    return posts;
  } catch (error) {
    console.error(
      "[POST SERVICE] /posts/mine ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "[POST SERVICE] /posts/mine ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "[POST SERVICE] /posts/mine ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
}

export async function getUserReels(
  page = 1,
  limit = 50
) {
  try {
    console.log(
      "[POST SERVICE] GET USER REELS:",
      {
        endpoint: "/posts/reels",
        page,
        limit,
      }
    );

    const response = await api.get(
      "/posts/reels",
      {
        params: {
          page,
          limit,
        },
      }
    );

    console.log(
      "[POST SERVICE] /posts/reels STATUS:",
      response?.status
    );

    console.log(
      "[POST SERVICE] /posts/reels DATA:",
      response?.data
    );

    const reels =
      extractPosts(response);

    console.log(
      "[POST SERVICE] /posts/reels NORMALIZED:",
      reels.length
    );

    return reels;
  } catch (error) {
    console.error(
      "[POST SERVICE] /posts/reels ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "[POST SERVICE] /posts/reels ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "[POST SERVICE] /posts/reels ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
}

export async function getSavedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response = await api.get(
      "/posts/saved",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET SAVED POSTS ERROR:",
      error?.response?.data ||
        error?.message
    );

    throw error;
  }
}

export async function getLikedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response = await api.get(
      "/posts/liked",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET LIKED POSTS ERROR:",
      error?.response?.data ||
        error?.message
    );

    throw error;
  }
}

export async function getTaggedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response = await api.get(
      "/posts/tagged",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET TAGGED POSTS ERROR:",
      error?.response?.data ||
        error?.message
    );

    throw error;
  }
}

export async function getUserReposts(
  page = 1,
  limit = 50
) {
  try {
    const response = await api.get(
      "/posts/reposts",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET REPOSTS ERROR:",
      error?.response?.data ||
        error?.message
    );

    throw error;
  }
}

export async function getPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.get(
    `/posts/${postId}`
  );

  return (
    response?.data?.post ||
    response?.data
  );
}

export async function deletePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.delete(
    `/posts/${postId}`
  );

  return response?.data;
}

export async function likePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.post(
    `/posts/${postId}/like`
  );

  return response?.data;
}

export async function unlikePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.delete(
    `/posts/${postId}/like`
  );

  return response?.data;
}

export async function togglePostLike(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.post(
    `/posts/${postId}/toggle-like`
  );

  return response?.data;
}

export async function savePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.post(
    `/posts/${postId}/save`
  );

  return response?.data;
}

export async function unsavePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.delete(
    `/posts/${postId}/save`
  );

  return response?.data;
}

export async function toggleSave(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.post(
    `/posts/${postId}/toggle-save`
  );

  return response?.data;
}

export async function repostPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.post(
    `/posts/${postId}/repost`
  );

  return (
    response?.data?.post ||
    response?.data
  );
}

export async function unrepostPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.delete(
    `/posts/${postId}/repost`
  );

  return response?.data;
}

export async function createComment(
  postId,
  text
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  if (
    !text ||
    !String(text).trim()
  ) {
    throw new Error(
      "Comment cannot be empty."
    );
  }

  const response = await api.post(
    `/posts/${postId}/comments`,
    {
      text: String(text).trim(),
    }
  );

  return (
    response?.data?.comment ||
    response?.data
  );
}

export async function getComments(
  postId,
  page = 1,
  limit = 50
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.get(
    `/posts/${postId}/comments`,
    {
      params: {
        page,
        limit,
      },
    }
  );

  const body =
    response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (
    Array.isArray(
      body?.comments
    )
  ) {
    return body.comments;
  }

  if (
    Array.isArray(body?.data)
  ) {
    return body.data;
  }

  return [];
}

export async function getArchivedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response = await api.get(
      "/posts/archived",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET ARCHIVED POSTS ERROR:",
      error?.response?.data ||
        error?.message
    );

    throw error;
  }
}

export async function restorePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.patch(
    `/posts/${postId}/archive`,
    {
      archived: false,
    }
  );

  return (
    response?.data?.post ||
    response?.data
  );
}

export async function archivePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const response = await api.patch(
    `/posts/${postId}/archive`,
    {
      archived: true,
    }
  );

  return (
    response?.data?.post ||
    response?.data
  );
}

export default {
  createPost,

  getFeed,
  getUserPosts,
  getUserReels,

  getSavedPosts,
  getLikedPosts,
  getTaggedPosts,
  getUserReposts,

  getPost,
  deletePost,

  likePost,
  unlikePost,
  togglePostLike,

  savePost,
  unsavePost,
  toggleSave,

  repostPost,
  unrepostPost,

  createComment,
  getComments,

  getArchivedPosts,
  restorePost,
  archivePost,
};