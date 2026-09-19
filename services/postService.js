import api from "./api";

/**
 * Safely determine the MIME type for an uploaded media item.
 */
function getMimeType(item) {
  const mimeType =
    item?.mimeType ||
    item?.type ||
    item?.file?.type ||
    item?.asset?.mimeType ||
    "";

  if (mimeType === "image" || mimeType === "video") {
    return mimeType === "image" ? "image/jpeg" : "video/mp4";
  }

  if (mimeType.startsWith("image/")) {
    return mimeType;
  }

  if (mimeType.startsWith("video/")) {
    return mimeType;
  }

  const uri = String(item?.uri || "").toLowerCase();

  if (uri.match(/\.(mp4|mov|m4v|avi|webm)$/)) {
    return "video/mp4";
  }

  if (uri.match(/\.(png)$/)) {
    return "image/png";
  }

  if (uri.match(/\.(webp)$/)) {
    return "image/webp";
  }

  return "image/jpeg";
}

/**
 * Generate a safe filename for FormData uploads.
 */
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

  if (mimeType.startsWith("video/")) {
    return `video-${Date.now()}-${index}.mp4`;
  }

  if (mimeType === "image/png") {
    return `image-${Date.now()}-${index}.png`;
  }

  if (mimeType === "image/webp") {
    return `image-${Date.now()}-${index}.webp`;
  }

  return `image-${Date.now()}-${index}.jpg`;
}

/**
 * Add JSON data to FormData.
 */
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
    console.warn(`[POST SERVICE] Unable to stringify ${key}:`, error);
  }
}

/**
 * Extract an array of posts/reels from different possible API response shapes.
 */
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

/**
 * Create a post or reel.
 *
 * postType:
 * - "post"
 * - "reel"
 */
export async function createPost({
  media = [],
  caption = "",
  location = null,
  taggedUsers = [],
  postType = "post",
  visibility = "public",
  onUploadProgress,
} = {}) {
  if (!Array.isArray(media) || media.length === 0) {
    throw new Error("Please select at least one media file.");
  }

  if (media.length > 10) {
    throw new Error("You can upload a maximum of 10 media files.");
  }

  const normalizedPostType = postType === "reel" ? "reel" : "post";

  if (normalizedPostType === "reel") {
    const hasVideo = media.some((item) => {
      const mimeType = getMimeType(item);
      return mimeType.startsWith("video/");
    });

    if (!hasVideo) {
      throw new Error("A reel must contain at least one video.");
    }
  }

  const formData = new FormData();

  media.forEach((item, index) => {
    if (!item?.uri) {
      return;
    }

    const mimeType = getMimeType(item);
    const name = getFileName(item, index);

    formData.append("media", {
      uri: item.uri,
      type: mimeType,
      name,
    });
  });

  formData.append("postType", normalizedPostType);

  if (caption) {
    formData.append("caption", String(caption));
  }

  if (location !== null && location !== undefined) {
    appendJsonField(formData, "location", location);
  }

  if (taggedUsers !== null && taggedUsers !== undefined) {
    appendJsonField(formData, "taggedUsers", taggedUsers);
  }

  if (visibility) {
    formData.append("visibility", visibility);
  }

  console.log("[POST SERVICE] CREATE POST:", {
    postType: normalizedPostType,
    mediaCount: media.length,
    captionLength: String(caption || "").length,
  });

  try {
    const response = await api.post("/posts", formData, {
      timeout: 120000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });

    console.log("[POST SERVICE] CREATE RESPONSE:", {
      status: response?.status,
      data: response?.data,
    });

    return response?.data?.post || response?.data;
  } catch (error) {
    console.error("[POST SERVICE] CREATE ERROR STATUS:", error?.response?.status);
    console.error("[POST SERVICE] CREATE ERROR DATA:", error?.response?.data);
    console.error("[POST SERVICE] CREATE ERROR MESSAGE:", error?.message);

    throw error;
  }
}

/**
 * Get the main feed.
 */
export async function getFeed(page = 1, limit = 30) {
  const response = await api.get("/posts/feed", {
    params: {
      page,
      limit,
    },
  });

  return extractPosts(response);
}

/**
 * Get the current user's posts.
 */
export async function getUserPosts(page = 1, limit = 50) {
  try {
    console.log("[POST SERVICE] GET USER POSTS:", {
      endpoint: "/posts/mine",
      page,
      limit,
    });

    const response = await api.get("/posts/mine", {
      params: {
        page,
        limit,
      },
    });

    console.log("[POST SERVICE] /posts/mine STATUS:", response?.status);
    console.log("[POST SERVICE] /posts/mine DATA:", response?.data);

    const posts = extractPosts(response);

    console.log("[POST SERVICE] /posts/mine NORMALIZED:", posts.length);

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

/**
 * Get the current user's reels.
 */
export async function getUserReels(page = 1, limit = 50) {
  try {
    console.log("[POST SERVICE] GET USER REELS:", {
      endpoint: "/posts/reels",
      page,
      limit,
    });

    const response = await api.get("/posts/reels", {
      params: {
        page,
        limit,
      },
    });

    console.log("[POST SERVICE] /posts/reels STATUS:", response?.status);
    console.log("[POST SERVICE] /posts/reels DATA:", response?.data);

    const reels = extractPosts(response);

    console.log("[POST SERVICE] /posts/reels NORMALIZED:", reels.length);

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

/**
 * Get saved posts.
 */
export async function getSavedPosts(page = 1, limit = 50) {
  try {
    const response = await api.get("/posts/saved", {
      params: {
        page,
        limit,
      },
    });

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET SAVED POSTS ERROR:",
      error?.response?.data || error?.message
    );

    throw error;
  }
}

/**
 * Get liked posts.
 */
export async function getLikedPosts(page = 1, limit = 50) {
  try {
    const response = await api.get("/posts/liked", {
      params: {
        page,
        limit,
      },
    });

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET LIKED POSTS ERROR:",
      error?.response?.data || error?.message
    );

    throw error;
  }
}

/**
 * Get tagged posts.
 */
export async function getTaggedPosts(page = 1, limit = 50) {
  try {
    const response = await api.get("/posts/tagged", {
      params: {
        page,
        limit,
      },
    });

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET TAGGED POSTS ERROR:",
      error?.response?.data || error?.message
    );

    throw error;
  }
}

/**
 * Get the current user's reposts.
 */
export async function getUserReposts(page = 1, limit = 50) {
  try {
    const response = await api.get("/posts/reposts", {
      params: {
        page,
        limit,
      },
    });

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET REPOSTS ERROR:",
      error?.response?.data || error?.message
    );

    throw error;
  }
}

/**
 * Get a single post.
 */
export async function getPost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.get(`/posts/${postId}`);

  return response?.data?.post || response?.data;
}

/**
 * Delete a post.
 */
export async function deletePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.delete(`/posts/${postId}`);

  return response?.data;
}

/**
 * Like a post.
 */
export async function likePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.post(`/posts/${postId}/like`);

  return response?.data;
}

/**
 * Unlike a post.
 */
export async function unlikePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.delete(`/posts/${postId}/like`);

  return response?.data;
}

/**
 * Toggle post like.
 */
export async function togglePostLike(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.post(`/posts/${postId}/toggle-like`);

  return response?.data;
}

/**
 * Save a post.
 */
export async function savePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.post(`/posts/${postId}/save`);

  return response?.data;
}

/**
 * Unsave a post.
 */
export async function unsavePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.delete(`/posts/${postId}/save`);

  return response?.data;
}

/**
 * Toggle saved state.
 */
export async function toggleSave(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.post(`/posts/${postId}/toggle-save`);

  return response?.data;
}

/**
 * Repost a post.
 */
export async function repostPost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.post(`/posts/${postId}/repost`);

  return response?.data?.post || response?.data;
}

/**
 * Remove a repost.
 */
export async function unrepostPost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.delete(`/posts/${postId}/repost`);

  return response?.data;
}

/**
 * Create a comment.
 */
export async function createComment(postId, text) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  if (!text || !String(text).trim()) {
    throw new Error("Comment cannot be empty.");
  }

  const response = await api.post(`/posts/${postId}/comments`, {
    text: String(text).trim(),
  });

  return response?.data?.comment || response?.data;
}

/**
 * Get comments for a post.
 */
export async function getComments(postId, page = 1, limit = 50) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.get(`/posts/${postId}/comments`, {
    params: {
      page,
      limit,
    },
  });

  const body = response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.comments)) {
    return body.comments;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
}

/**
 * Get archived posts.
 *
 * These endpoints are kept here only if your backend implements them.
 */
export async function getArchivedPosts(page = 1, limit = 50) {
  try {
    const response = await api.get("/posts/archived", {
      params: {
        page,
        limit,
      },
    });

    return extractPosts(response);
  } catch (error) {
    console.error(
      "[POST SERVICE] GET ARCHIVED POSTS ERROR:",
      error?.response?.data || error?.message
    );

    throw error;
  }
}

/**
 * Restore an archived post.
 */
export async function restorePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.patch(`/posts/${postId}/archive`, {
    archived: false,
  });

  return response?.data?.post || response?.data;
}

/**
 * Archive a post.
 */
export async function archivePost(postId) {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  const response = await api.patch(`/posts/${postId}/archive`, {
    archived: true,
  });

  return response?.data?.post || response?.data;
}

/**
 * Default export.
 */
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