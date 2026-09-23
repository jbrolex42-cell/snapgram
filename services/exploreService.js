import api from "./api";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

function normalizePage(value, fallback = 1) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return fallback;
  }

  return Math.floor(page);
}

function normalizeLimit(
  value,
  fallback = DEFAULT_LIMIT
) {
  const limit = Number(value);

  if (
    !Number.isFinite(limit) ||
    limit < 1
  ) {
    return fallback;
  }

  return Math.min(
    Math.floor(limit),
    MAX_LIMIT
  );
}

function normalizePagination(
  pagination,
  page,
  limit
) {
  const data =
    pagination || {};

  return {
    page: normalizePage(
      data.page,
      page
    ),

    limit: normalizeLimit(
      data.limit,
      limit
    ),

    total:
      Number(data.total) || 0,

    returned:
      Number(data.returned) || 0,

    hasMore: Boolean(
      data.hasMore ??
      data.has_more ??
      false
    ),
  };
}

function normalizePost(post) {
  if (!post) {
    return null;
  }

  return {
    ...post,

    id:
      post.id ||
      post._id ||
      null,

    exploreLayout:
      post.exploreLayout ||
      "normal",

    media: Array.isArray(
      post.media
    )
      ? post.media
      : [],

    mediaCount:
      Number(
        post.mediaCount
      ) ||
      (
        Array.isArray(
          post.media
        )
          ? post.media.length
          : 0
      ),

    isVideo:
      post.isVideo === true ||
      post.media?.[0]?.type ===
        "video",
  };
}

export async function getExplorePosts(
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const normalizedPage =
    normalizePage(page);

  const normalizedLimit =
    normalizeLimit(limit);

  const response =
    await api.get(
      "/explore",
      {
        params: {
          page:
            normalizedPage,

          limit:
            normalizedLimit,
        },
      }
    );

  const data =
    response?.data || {};

  const posts =
    Array.isArray(
      data.posts
    )
      ? data.posts
          .map(normalizePost)
          .filter(Boolean)
      : [];

  return {
    posts,

    pagination:
      normalizePagination(
        data.pagination,
        normalizedPage,
        normalizedLimit
      ),
  };
}

export async function searchExplore(
  query = "",
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const cleanQuery =
    String(query || "")
      .trim();

  const normalizedPage =
    normalizePage(page);

  const normalizedLimit =
    normalizeLimit(limit);

  if (!cleanQuery) {
    return {
      users: [],
      posts: [],
      reels: [],
      hashtags: [],

      pagination:
        normalizePagination(
          null,
          normalizedPage,
          normalizedLimit
        ),
    };
  }

  const response =
    await api.get(
      "/explore/search",
      {
        params: {
          q: cleanQuery,

          page:
            normalizedPage,

          limit:
            normalizedLimit,
        },
      }
    );

  const data =
    response?.data || {};

  return {
    users:
      Array.isArray(
        data.users
      )
        ? data.users
        : [],

    posts:
      Array.isArray(
        data.posts
      )
        ? data.posts
            .map(normalizePost)
            .filter(Boolean)
        : [],

    reels:
      Array.isArray(
        data.reels
      )
        ? data.reels
            .map(normalizePost)
            .filter(Boolean)
        : [],

    hashtags:
      Array.isArray(
        data.hashtags
      )
        ? data.hashtags
        : [],

    pagination:
      normalizePagination(
        data.pagination,
        normalizedPage,
        normalizedLimit
      ),
  };
}