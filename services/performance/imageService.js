import { Image } from "expo-image";

const imageCache = new Map();

const DEFAULT_CACHE_POLICY = "memory-disk";

function normalizeUri(uri) {
  if (!uri || typeof uri !== "string") {
    return null;
  }

  return uri.trim();
}

export function getImageUri(source) {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    return normalizeUri(source);
  }

  if (source?.uri) {
    return normalizeUri(source.uri);
  }

  return (
    normalizeUri(source?.secure_url) ||
    normalizeUri(source?.url) ||
    normalizeUri(source?.imageUrl) ||
    normalizeUri(source?.mediaUrl) ||
    normalizeUri(source?.thumbnailUrl) ||
    null
  );
}

export function getImageSource(source) {
  const uri = getImageUri(source);

  if (!uri) {
    return null;
  }

  return {
    uri,
  };
}

export async function preloadImage(uri) {
  const normalizedUri = getImageUri(uri);

  if (!normalizedUri) {
    return false;
  }

  if (imageCache.has(normalizedUri)) {
    return true;
  }

  try {
    await Image.prefetch(normalizedUri, DEFAULT_CACHE_POLICY);

    imageCache.set(normalizedUri, true);

    return true;
  } catch (error) {
    console.warn(
      "[IMAGE] PREFETCH ERROR:",
      error?.message
    );

    return false;
  }
}

export async function preloadImages(
  sources = [],
  limit = 5
) {
  if (!Array.isArray(sources)) {
    return;
  }

  const uniqueUris = [
    ...new Set(
      sources
        .map(getImageUri)
        .filter(Boolean)
    ),
  ].slice(0, limit);

  await Promise.allSettled(
    uniqueUris.map(preloadImage)
  );
}

export function isImageCached(source) {
  const uri = getImageUri(source);

  return uri ? imageCache.has(uri) : false;
}

export function clearImageCache() {
  imageCache.clear();
}

export function getImageCacheSize() {
  return imageCache.size;
}

export default {
  getImageUri,
  getImageSource,
  preloadImage,
  preloadImages,
  isImageCached,
  clearImageCache,
  getImageCacheSize,
};