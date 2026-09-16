import api from "./api";

export async function getPayoutSummary() {
  const response = await api.get("/payouts/summary");

  return (
    response.data?.summary || {
      availableBalance: 0,
      pendingBalance: 0,
      totalPaid: 0,
      currency: "USD",
    }
  );
}

export async function getPayoutMethod() {
  const response = await api.get("/payouts/method");

  return response.data?.method || null;
}

export async function getPayoutHistory({
  page = 1,
  limit = 20,
} = {}) {
  const response = await api.get("/payouts/history", {
    params: {
      page,
      limit,
    },
  });

  return {
    history:
      response.data?.history ||
      response.data?.items ||
      [],
    page:
      response.data?.page ||
      page,
    limit:
      response.data?.limit ||
      limit,
    total:
      response.data?.total ||
      0,
    hasMore:
      response.data?.hasMore ||
      false,
  };
}

export async function getPayoutStatus() {
  const response = await api.get("/payouts/status");

  return (
    response.data?.status ||
    response.data?.payout ||
    null
  );
}