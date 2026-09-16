import api from "./api";

export async function getGiftSummary() {
  const response = await api.get("/gifts/summary");

  return (
    response.data?.summary || {
      totalReceived: 0,
      totalCoins: 0,
      availableBalance: 0,
    }
  );
}

export async function getGiftActivity({
  page = 1,
  limit = 30,
} = {}) {
  const response = await api.get("/gifts/activity", {
    params: {
      page,
      limit,
    },
  });

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

export async function getGiftSettings() {
  const response = await api.get("/gifts/settings");

  return (
    response.data?.settings || {
      enabled: true,
      allowGifts: true,
      showGiftButton: true,
    }
  );
}

export async function updateGiftSettings(
  patch = {}
) {
  if (
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch)
  ) {
    throw new Error(
      "Gift settings patch must be an object."
    );
  }

  const response = await api.patch(
    "/gifts/settings",
    patch
  );

  return (
    response.data?.settings ||
    response.data
  );
}