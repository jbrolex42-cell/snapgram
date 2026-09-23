import api from "./api";

const DEFAULT_LIMIT = 15;

function normalizePagination(
  pagination,
  limit
) {
  const data =
    pagination || {};

  return {
    limit: Number(
      data.limit ??
        limit
    ),

    hasMore: Boolean(
      data.hasMore ??
        data.has_more ??
        false
    ),

    returned: Number(
      data.returned ?? 0
    ),

    candidateCount:
      Number(
        data.candidateCount ??
          0
      ),

    nextCursor:
      data.nextCursor ??
      data.next_cursor ??
      null,
  };
}

export async function getHomeFeed(
  cursor = null,
  limit = DEFAULT_LIMIT
) {
  const params = {
    limit,
  };

  if (cursor) {
    params.cursor =
      cursor;
  }

  const response =
    await api.get(
      "/feed",
      {
        params,
      }
    );

  const data =
    response.data || {};

  return {
    posts:
      Array.isArray(
        data.posts
      )
        ? data.posts
        : [],

    pagination:
      normalizePagination(
        data.pagination,
        limit
      ),
  };
}