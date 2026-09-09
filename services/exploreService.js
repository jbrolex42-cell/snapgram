import api from "./api";

const DEFAULT_LIMIT = 30;

export async function getExplorePosts(
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const response = await api.get(
    "/explore",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return {
    posts:
      response.data?.posts || [],

    pagination:
      response.data?.pagination || {
        page,
        limit,
        hasMore: false,
      },
  };
}

export async function searchExplore(
  query,
  page = 1,
  limit = DEFAULT_LIMIT
) {
  const response = await api.get(
    "/explore/search",
    {
      params: {
        q: query,
        page,
        limit,
      },
    }
  );

  return {
    users:
      response.data?.users || [],

    posts:
      response.data?.posts || [],

    hashtags:
      response.data?.hashtags || [],

    pagination:
      response.data?.pagination || {
        page,
        limit,
        hasMore: false,
      },
  };
}