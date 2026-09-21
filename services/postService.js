import api from "./api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getMimeType(item) {
  const explicitType =
    item?.mimeType ||
    item?.type ||
    item?.file?.type ||
    item?.asset?.mimeType ||
    "";

  const type = String(explicitType).toLowerCase().trim();

  if (type === "image") {
    return "image/jpeg";
  }

  if (type === "video") {
    return "video/mp4";
  }

  if (type.startsWith("image/")) {
    return type;
  }

  if (type.startsWith("video/")) {
    return type;
  }

  const uri = String(item?.uri || "")
    .toLowerCase()
    .split("?")[0];

  if (/\.(mp4|mov|m4v|avi|webm)$/i.test(uri)) {
    return "video/mp4";
  }

  if (/\.png$/i.test(uri)) {
    return "image/png";
  }

  if (/\.webp$/i.test(uri)) {
    return "image/webp";
  }

  if (/\.(heic|heif)$/i.test(uri)) {
    return "image/heic";
  }

  if (/\.(jpg|jpeg)$/i.test(uri)) {
    return "image/jpeg";
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
    return String(originalName);
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
  if (
    value === undefined ||
    value === null
  ) {
    return;
  }

  if (typeof value === "string") {
    formData.append(key, value);
    return;
  }

  try {
    formData.append(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.warn(
      `[POST SERVICE] Unable to serialize ${key}:`,
      error?.message || error
    );
  }
}

function normalizeMusic(music) {
  if (
    !music ||
    typeof music !== "object"
  ) {
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

  return {
    trackId: String(trackId),

    title: String(
      music.title || ""
    ),

    artist: String(
      music.artist || ""
    ),

    album: String(
      music.album || ""
    ),

    artworkUrl: String(
      music.artworkUrl || ""
    ),

    provider: String(
      music.provider ||
        "epidemic-sound"
    ),

    providerTrackId: String(
      music.providerTrackId ||
        trackId
    ),

    startMs: Math.max(
      Number(music.startMs) || 0,
      0
    ),

    durationMs: Math.max(
      Number(music.durationMs) || 0,
      0
    ),
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

function logRequestError(
  label,
  error
) {
  console.error(
    `[POST SERVICE] ${label} ERROR MESSAGE:`,
    error?.message
  );

  console.error(
    `[POST SERVICE] ${label} ERROR CODE:`,
    error?.code
  );

  console.error(
    `[POST SERVICE] ${label} ERROR STATUS:`,
    error?.response?.status
  );

  console.error(
    `[POST SERVICE] ${label} ERROR DATA:`,
    error?.response?.data
  );

  console.error(
    `[POST SERVICE] ${label} ERROR URL:`,
    error?.config?.url
  );

  console.error(
    `[POST SERVICE] ${label} ERROR BASE URL:`,
    error?.config?.baseURL
  );
}

/* -------------------------------------------------------------------------- */
/* Create post / reel                                                         */
/* -------------------------------------------------------------------------- */

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
  if (
    !Array.isArray(media) ||
    media.length === 0
  ) {
    throw new Error(
      "Please select at least one media file."
    );
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

  const validMedia = media.filter(
    (item) => Boolean(item?.uri)
  );

  if (validMedia.length === 0) {
    throw new Error(
      "No valid media files were found."
    );
  }

  if (
    normalizedPostType === "reel"
  ) {
    const hasVideo = validMedia.some(
      (item) =>
        getMimeType(item).startsWith(
          "video/"
        )
    );

    if (!hasVideo) {
      throw new Error(
        "A reel must contain at least one video."
      );
    }
  }

  const normalizedMusic =
    normalizeMusic(music);

  const formData = new FormData();

  validMedia.forEach(
    (item, index) => {
      const mimeType =
        getMimeType(item);

      const name =
        getFileName(item, index);

      formData.append("media", {
        uri: item.uri,
        type: mimeType,
        name,
      });
    }
  );

  formData.append(
    "postType",
    normalizedPostType
  );

  if (
    caption &&
    String(caption).trim()
  ) {
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
    "[POST SERVICE] CREATE:",
    {
      endpoint: "/posts",
      postType: normalizedPostType,
      mediaCount: validMedia.length,
      hasCaption:
        Boolean(
          String(caption || "").trim()
        ),
      hasMusic:
        Boolean(normalizedMusic),
    }
  );

  try {
    const response =
      await api.post(
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
      "[POST SERVICE] CREATE SUCCESS:",
      response?.status
    );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "CREATE POST",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Feed                                                                       */
/* -------------------------------------------------------------------------- */

export async function getFeed(
  page = 1,
  limit = 30
) {
  try {
    console.log(
      "[POST SERVICE] GET FEED:",
      {
        endpoint: "/feed",
        page,
        limit,
      }
    );

    const response =
      await api.get(
        "/feed",
        {
          params: {
            page,
            limit,
          },
        }
      );

    const posts =
      extractPosts(response);

    console.log(
      "[POST SERVICE] GET FEED SUCCESS:",
      {
        status: response?.status,
        count: posts.length,
      }
    );

    return posts;
  } catch (error) {
    logRequestError(
      "GET FEED",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* My posts                                                                   */
/* -------------------------------------------------------------------------- */

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

    const response =
      await api.get(
        "/posts/mine",
        {
          params: {
            page,
            limit,
          },
        }
      );

    const posts =
      extractPosts(response);

    console.log(
      "[POST SERVICE] GET USER POSTS SUCCESS:",
      {
        status: response?.status,
        count: posts.length,
      }
    );

    return posts;
  } catch (error) {
    logRequestError(
      "GET USER POSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* My reels                                                                   */
/* -------------------------------------------------------------------------- */

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

    const response =
      await api.get(
        "/posts/reels",
        {
          params: {
            page,
            limit,
          },
        }
      );

    const reels =
      extractPosts(response);

    console.log(
      "[POST SERVICE] GET USER REELS SUCCESS:",
      {
        status: response?.status,
        count: reels.length,
      }
    );

    return reels;
  } catch (error) {
    logRequestError(
      "GET USER REELS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Saved posts                                                                */
/* -------------------------------------------------------------------------- */

export async function getSavedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response =
      await api.get(
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
    logRequestError(
      "GET SAVED POSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Liked posts                                                                */
/* -------------------------------------------------------------------------- */

export async function getLikedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response =
      await api.get(
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
    logRequestError(
      "GET LIKED POSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Tagged posts                                                               */
/* -------------------------------------------------------------------------- */

export async function getTaggedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response =
      await api.get(
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
    logRequestError(
      "GET TAGGED POSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reposts                                                                    */
/* -------------------------------------------------------------------------- */

export async function getUserReposts(
  page = 1,
  limit = 50
) {
  try {
    const response =
      await api.get(
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
    logRequestError(
      "GET REPOSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Single post                                                                */
/* -------------------------------------------------------------------------- */

export async function getPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.get(
        `/posts/${postId}`
      );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "GET POST",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Delete post                                                                */
/* -------------------------------------------------------------------------- */

export async function deletePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.delete(
        `/posts/${postId}`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "DELETE POST",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Likes                                                                      */
/* -------------------------------------------------------------------------- */

export async function likePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/like`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "LIKE POST",
      error
    );

    throw error;
  }
}

export async function unlikePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.delete(
        `/posts/${postId}/like`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "UNLIKE POST",
      error
    );

    throw error;
  }
}

export async function togglePostLike(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/toggle-like`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "TOGGLE POST LIKE",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Saves                                                                      */
/* -------------------------------------------------------------------------- */

export async function savePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/save`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "SAVE POST",
      error
    );

    throw error;
  }
}

export async function unsavePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.delete(
        `/posts/${postId}/save`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "UNSAVE POST",
      error
    );

    throw error;
  }
}

export async function toggleSave(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/toggle-save`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "TOGGLE SAVE",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Reposts                                                                    */
/* -------------------------------------------------------------------------- */

export async function repostPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/repost`
      );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "REPOST POST",
      error
    );

    throw error;
  }
}

export async function unrepostPost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.delete(
        `/posts/${postId}/repost`
      );

    return response?.data;
  } catch (error) {
    logRequestError(
      "UNREPOST POST",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                   */
/* -------------------------------------------------------------------------- */

export async function createComment(
  postId,
  text
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  const cleanText =
    String(text || "").trim();

  if (!cleanText) {
    throw new Error(
      "Comment cannot be empty."
    );
  }

  try {
    const response =
      await api.post(
        `/posts/${postId}/comments`,
        {
          text: cleanText,
        }
      );

    return (
      response?.data?.comment ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "CREATE COMMENT",
      error
    );

    throw error;
  }
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

  try {
    const response =
      await api.get(
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
  } catch (error) {
    logRequestError(
      "GET COMMENTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Archived posts                                                             */
/* -------------------------------------------------------------------------- */

export async function getArchivedPosts(
  page = 1,
  limit = 50
) {
  try {
    const response =
      await api.get(
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
    logRequestError(
      "GET ARCHIVED POSTS",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Archive / restore                                                          */
/* -------------------------------------------------------------------------- */

export async function archivePost(
  postId
) {
  if (!postId) {
    throw new Error(
      "Post ID is required."
    );
  }

  try {
    const response =
      await api.patch(
        `/posts/${postId}/archive`,
        {
          archived: true,
        }
      );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "ARCHIVE POST",
      error
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

  try {
    const response =
      await api.patch(
        `/posts/${postId}/archive`,
        {
          archived: false,
        }
      );

    return (
      response?.data?.post ||
      response?.data
    );
  } catch (error) {
    logRequestError(
      "RESTORE POST",
      error
    );

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

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