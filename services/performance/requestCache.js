import {
  getCached,
  setCached,
  removeCached,
} from "./cacheService";

const inFlightRequests = new Map();

const DEFAULT_TTL = 30 * 1000;

export async function cachedRequest(
  key,
  request,
  {
    ttl = DEFAULT_TTL,
    persistent = false,
    forceRefresh = false,
  } = {}
) {
  if (typeof request !== "function") {
    throw new TypeError(
      "[REQUEST CACHE] request must be a function"
    );
  }

  if (!forceRefresh) {
    const cached = await getCached(key, {
      ttl,
      persistent,
    });

    if (cached !== null && cached !== undefined) {
      return cached;
    }
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = Promise.resolve()
    .then(() => request())
    .then(async (data) => {
      await setCached(key, data, {
        persistent,
      });

      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);

  return promise;
}

export async function invalidateRequest(key) {
  await removeCached(key);
}

export function clearRequestMemory() {
  inFlightRequests.clear();
}

export function hasPendingRequest(key) {
  return inFlightRequests.has(key);
}

export default {
  cachedRequest,
  invalidateRequest,
  clearRequestMemory,
  hasPendingRequest,
};