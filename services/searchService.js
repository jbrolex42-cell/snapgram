import {
  searchExplore,
} from "./exploreService";

function normalizePagination(
  page,
  limit
) {
  return {
    page: Math.max(
      1,
      Number(page) || 1
    ),
    limit: Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 30
      )
    ),
  };
}

export async function searchAll(
  query,
  page = 1,
  limit = 30
) {
  const normalizedQuery =
    String(query || "").trim();

  if (!normalizedQuery) {
    return {
      users: [],
      posts: [],
      reels: [],
      hashtags: [],
      page: 1,
      limit: 30,
      hasMore: false,
    };
  }

  const pagination =
    normalizePagination(
      page,
      limit
    );

  const result =
    await searchExplore(
      normalizedQuery,
      pagination.page,
      pagination.limit
    );

  return {
    users: Array.isArray(
      result?.users
    )
      ? result.users
      : [],

    posts: Array.isArray(
      result?.posts
    )
      ? result.posts
      : [],

    reels: Array.isArray(
      result?.reels
    )
      ? result.reels
      : [],

    hashtags: Array.isArray(
      result?.hashtags
    )
      ? result.hashtags
      : [],

    page:
      Number(result?.page) ||
      pagination.page,

    limit:
      Number(result?.limit) ||
      pagination.limit,

    hasMore:
      Boolean(
        result?.hasMore
      ),
  };
}

export async function searchUsers(
  query,
  page = 1,
  limit = 30
) {
  const result =
    await searchAll(
      query,
      page,
      limit
    );

  return result.users;
}

export async function searchPosts(
  query,
  page = 1,
  limit = 30
) {
  const result =
    await searchAll(
      query,
      page,
      limit
    );

  return result.posts;
}

export async function searchReels(
  query,
  page = 1,
  limit = 30
) {
  const result =
    await searchAll(
      query,
      page,
      limit
    );

  return result.reels;
}

export async function searchHashtags(
  query,
  page = 1,
  limit = 30
) {
  const result =
    await searchAll(
      query,
      page,
      limit
    );

  return result.hashtags;
}