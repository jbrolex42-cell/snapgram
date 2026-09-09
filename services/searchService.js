import {
  searchExplore,
} from "./exploreService";

export async function searchAll(
  query,
  page = 1,
  limit = 30
) {
  return searchExplore(
    query,
    page,
    limit
  );
}

export async function searchUsers(
  query,
  page = 1,
  limit = 30
) {
  const result =
    await searchExplore(
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
    await searchExplore(
      query,
      page,
      limit
    );

  return result.posts;
}