import api from "./api";

export async function followUser(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await api.post(
      `/follows/${userId}`
    );

    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

   
    if (
      status === 400 &&
      data?.message === "Already following this user."
    ) {
      return {
        ...(data || {}),
        following: true,
        alreadyFollowing: true,
      };
    }

    throw error;
  }
}

/**
 * Unfollow a user.
 */
export async function unfollowUser(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await api.delete(
    `/follows/${userId}`
  );

  return response.data;
}

/**
 * Toggle follow status.
 */
export async function toggleFollow(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await api.post(
    `/follows/${userId}/toggle`
  );

  return response.data;
}

/**
 * Get follow status for a user.
 */
export async function getFollowStatus(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const response = await api.get(
    `/follows/${userId}/status`
  );

  return response.data;
}

/**
 * Get followers using cursor pagination.
 */
export async function getFollowers(
  userId,
  {
    cursor = null,
    limit = 30,
  } = {}
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const params = {
    limit,
  };

  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get(
    `/follows/${userId}/followers`,
    {
      params,
    }
  );

  const data = response.data || {};

  return {
    users: Array.isArray(data.users)
      ? data.users
      : Array.isArray(data.followers)
        ? data.followers
        : [],

    nextCursor:
      data.nextCursor || null,

    hasMore:
      Boolean(data.hasMore),
  };
}

/**
 * Get following using cursor pagination.
 */
export async function getFollowing(
  userId,
  {
    cursor = null,
    limit = 30,
  } = {}
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const params = {
    limit,
  };

  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get(
    `/follows/${userId}/following`,
    {
      params,
    }
  );

  const data = response.data || {};

  return {
    users: Array.isArray(data.users)
      ? data.users
      : Array.isArray(data.following)
        ? data.following
        : [],

    nextCursor:
      data.nextCursor || null,

    hasMore:
      Boolean(data.hasMore),
  };
}

/**
 * Get pending follow requests.
 */
export async function getPendingRequests() {
  const response = await api.get(
    "/follows/requests"
  );

  return response.data?.requests || [];
}

/**
 * Accept a follow request.
 */
export async function acceptFollowRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const response = await api.post(
    `/follows/requests/${requestId}/accept`
  );

  return response.data;
}

/**
 * Reject a follow request.
 */
export async function rejectFollowRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const response = await api.delete(
    `/follows/requests/${requestId}`
  );

  return response.data;
}