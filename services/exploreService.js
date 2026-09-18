import api from "./api";

const DEFAULT_LIMIT = 30;

function normalizePagination(pagination, page, limit) {
  const data = pagination || {};

  return {
    page: Number(data.page ?? page),
    limit: Number(data.limit ?? limit),
    total: Number(data.total ?? 0),
    hasMore: Boolean(
      data.hasMore ??
      data.has_more ??
      false
    ),
  };
}

export async function getExplorePosts(
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const response = await api.get("/explore", {
    params: {
      page,
      limit,
    },
  });

  const data = response.data || {};

  return {
    posts: Array.isArray(data.posts)
      ? data.posts
      : [],

    pagination: normalizePagination(
      data.pagination,
      page,
      limit
    ),
  };
}

export async function searchExplore(
  query = "",
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const cleanQuery = String(query).trim();

  if (!cleanQuery) {
    return {
      users: [],
      posts: [],
      hashtags: [],
      pagination: normalizePagination(
        null,
        page,
        limit
      ),
    };
  }

  const response = await api.get("/explore/search", {
    params: {
      q: cleanQuery,
      page,
      limit,
    },
  });

  const data = response.data || {};

  return {
    users: Array.isArray(data.users)
      ? data.users
      : [],

    posts: Array.isArray(data.posts)
      ? data.posts
      : [],

    hashtags: Array.isArray(data.hashtags)
      ? data.hashtags
      : [],

    pagination: normalizePagination(
      data.pagination,
      page,
      limit
    ),
  };
}