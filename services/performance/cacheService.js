import AsyncStorage from "@react-native-async-storage/async-storage";

const MEMORY_CACHE = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ITEMS = 100;

function isFresh(entry, ttl) {
  if (!entry) return false;

  return Date.now() - entry.timestamp < ttl;
}

function trimMemoryCache() {
  if (MEMORY_CACHE.size <= MAX_MEMORY_ITEMS) {
    return;
  }

  const entries = [...MEMORY_CACHE.entries()];

  entries
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, MEMORY_CACHE.size - MAX_MEMORY_ITEMS)
    .forEach(([key]) => {
      MEMORY_CACHE.delete(key);
    });
}

export async function getCached(
  key,
  {
    ttl = DEFAULT_TTL,
    persistent = false,
  } = {}
) {
  try {
    const memoryEntry = MEMORY_CACHE.get(key);

    if (isFresh(memoryEntry, ttl)) {
      return memoryEntry.data;
    }

    MEMORY_CACHE.delete(key);

    if (!persistent) {
      return null;
    }

    const stored = await AsyncStorage.getItem(`snapgram_cache:${key}`);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!isFresh(parsed, ttl)) {
      await AsyncStorage.removeItem(`snapgram_cache:${key}`);
      return null;
    }

    MEMORY_CACHE.set(key, parsed);
    trimMemoryCache();

    return parsed.data;
  } catch (error) {
    console.warn("[CACHE] GET ERROR:", error?.message);
    return null;
  }
}

export async function setCached(
  key,
  data,
  {
    persistent = false,
  } = {}
) {
  const entry = {
    data,
    timestamp: Date.now(),
  };

  try {
    MEMORY_CACHE.set(key, entry);
    trimMemoryCache();

    if (persistent) {
      await AsyncStorage.setItem(
        `snapgram_cache:${key}`,
        JSON.stringify(entry)
      );
    }

    return data;
  } catch (error) {
    console.warn("[CACHE] SET ERROR:", error?.message);
    return data;
  }
}

export async function removeCached(key) {
  try {
    MEMORY_CACHE.delete(key);

    await AsyncStorage.removeItem(`snapgram_cache:${key}`);
  } catch (error) {
    console.warn("[CACHE] REMOVE ERROR:", error?.message);
  }
}

export async function clearCache() {
  try {
    MEMORY_CACHE.clear();

    const keys = await AsyncStorage.getAllKeys();

    const cacheKeys = keys.filter((key) =>
      key.startsWith("snapgram_cache:")
    );

    if (cacheKeys.length) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.warn("[CACHE] CLEAR ERROR:", error?.message);
  }
}

export function clearMemoryCache() {
  MEMORY_CACHE.clear();
}

export function getMemoryCacheSize() {
  return MEMORY_CACHE.size;
}

export default {
  getCached,
  setCached,
  removeCached,
  clearCache,
  clearMemoryCache,
  getMemoryCacheSize,
};