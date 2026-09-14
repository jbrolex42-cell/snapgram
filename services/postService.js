import api from "./api";

function getMimeType(item) {
  if (item?.mimeType) {
    return item.mimeType;
  }

  if (item?.type === "video") {
    return "video/mp4";
  }

  const uri = item?.uri || "";

  const extension = uri
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    case "heic":
      return "image/heic";

    case "mov":
      return "video/quicktime";

    case "mp4":
      return "video/mp4";

    default:
      return "image/jpeg";
  }
}

function getFileName(item, index) {
  if (item?.fileName) {
    return item.fileName;
  }

  const mimeType = getMimeType(item);

  let extension = "jpg";

  if (mimeType === "video/mp4") {
    extension = "mp4";
  } else if (mimeType === "video/quicktime") {
    extension = "mov";
  } else if (mimeType === "image/png") {
    extension = "png";
  } else if (mimeType === "image/webp") {
    extension = "webp";
  }

  return `snapgram-${Date.now()}-${index}.${extension}`;
}

function appendJsonField(formData, key, value) {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, JSON.stringify(value));
}

function extractPosts(response) {
  const body = response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.posts)) {
    return body.posts;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.data?.posts)) {
    return body.data.posts;
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
  visibility = "public",
  postType = "post",
  edit = {},
  onUploadProgress,
}) {
  if (!Array.isArray(media) || media.length === 0) {
    throw new Error(
      "At least one photo or video is required."
    );
  }

  const formData = new FormData();

  media.forEach((item, index) => {
    if (!item?.uri) {
      return;
    }

    const mimeType = getMimeType(item);
    const fileName = getFileName(item, index);

    formData.append("media", {
      uri: item.uri,
      name: fileName,
      type: mimeType,
    });
  });

  formData.append(
    "caption",
    String(caption || "").trim()
  );

  formData.append(
    "postType",
    postType === "reel" ? "reel" : "post"
  );

  if (location) {
    appendJsonField(
      formData,
      "location",
      location
    );
  }

  if (
    Array.isArray(taggedUsers) &&
    taggedUsers.length > 0
  ) {
    appendJsonField(
      formData,
      "taggedUsers",
      taggedUsers
    );
  }

  formData.append(
    "visibility",
    visibility
  );

  appendJsonField(
    formData,
    "edit",
    edit
  );

  const response = await api.post(
    "/posts",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      timeout: 120000,

      onUploadProgress: (event) => {
        if (!event?.total || !onUploadProgress) {
          return;
        }

        const progress = Math.round(
          (event.loaded / event.total) * 100
        );

        onUploadProgress(progress);
      },
    }
  );

  return response.data;
}

export async function getFeed(
  page = 1,
  limit = 10
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
    "[POST SERVICE] /posts/mine RAW:",
    response?.data
  );

  const posts = extractPosts(response);

  console.log(
    "[POST SERVICE] /posts/mine NORMALIZED:",
    posts.length,
    posts
  );

  return posts;
}

export async function getUserReels(
  page = 1,
  limit = 50
) {
  const response = await api.get(
    "/posts/reels",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return extractPosts(response);
}

export async function getSavedPosts(
  page = 1,
  limit = 50
) {
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
}

export async function getTaggedPosts(
  page = 1,
  limit = 50
) {
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
}

export async function getUserReposts(
  page = 1,
  limit = 50
) {
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
}

export async function getPost(id) {
  if (!id) {
    return null;
  }

  const response = await api.get(
    `/posts/${id}`
  );

  return (
    response.data?.post ||
    response.data
  );
}

export async function getPostById(id) {
  return getPost(id);
}

export async function likePost(id) {
  const response = await api.post(
    `/posts/${id}/like`
  );

  return response.data;
}

export async function unlikePost(id) {
  const response = await api.delete(
    `/posts/${id}/like`
  );

  return response.data;
}

export async function togglePostLike(id) {
  const response = await api.post(
    `/posts/${id}/toggle-like`
  );

  return response.data;
}

export async function toggleLike(id) {
  return togglePostLike(id);
}

export async function savePost(id) {
  const response = await api.post(
    `/posts/${id}/save`
  );

  return response.data;
}

export async function unsavePost(id) {
  const response = await api.delete(
    `/posts/${id}/save`
  );

  return response.data;
}

export async function toggleSavePost(id) {
  const response = await api.post(
    `/posts/${id}/toggle-save`
  );

  return response.data;
}

export async function toggleSave(id) {
  return toggleSavePost(id);
}

export async function repostPost(id) {
  const response = await api.post(
    `/posts/${id}/repost`
  );

  return response.data;
}

export async function unrepostPost(id) {
  const response = await api.delete(
    `/posts/${id}/repost`
  );

  return response.data;
}

export async function deletePost(id) {
  const response = await api.delete(
    `/posts/${id}`
  );

  return response.data;
}

export async function createComment(
  postId,
  text,
  parentComment = null
) {
  const response = await api.post(
    `/posts/${postId}/comments`,
    {
      text,
      parentComment,
    }
  );

  return response.data;
}

export async function getComments(
  postId,
  page = 1,
  limit = 50
) {
  const response = await api.get(
    `/posts/${postId}/comments`,
    {
      params: {
        page,
        limit,
      },
    }
  );

  return (
    response.data?.comments ||
    response.data ||
    []
  );
}