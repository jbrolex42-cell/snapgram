import api from "./api";

export async function getEarningsSummary() {
  const response = await api.get(
    "/earnings/summary"
  );

  return (
    response.data?.summary || {
      totalEarnings: 0,
      availableBalance: 0,
      pendingEarnings: 0,
      currency: "USD",
    }
  );
}

export async function getEarningsHistory({
  page = 1,
  limit = 20,
} = {}) {
  const response = await api.get(
    "/earnings/history",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return {
    history:
      response.data?.history ||
      response.data?.items ||
      [],
    page:
      response.data?.page || page,
    limit:
      response.data?.limit || limit,
    total:
      response.data?.total || 0,
    hasMore:
      response.data?.hasMore || false,
  };
}

export async function getEarningsActivity({
  page = 1,
  limit = 20,
} = {}) {
  const response = await api.get(
    "/earnings/activity",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return {
    activity:
      response.data?.activity ||
      response.data?.items ||
      [],
    page:
      response.data?.page || page,
    limit:
      response.data?.limit || limit,
    total:
      response.data?.total || 0,
    hasMore:
      response.data?.hasMore || false,
  };
}