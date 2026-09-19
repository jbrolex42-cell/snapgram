import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  cachedRequest,
  invalidateRequest,
} from "../services/performance/requestCache";

export default function useCachedData(
  key,
  request,
  {
    ttl = 30 * 1000,
    persistent = false,
    enabled = true,
    forceRefresh = false,
  } = {}
) {
  const mountedRef = useRef(true);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (options = {}) => {
      if (!enabled || typeof request !== "function") {
        return null;
      }

      const shouldForceRefresh =
        options.forceRefresh ?? forceRefresh;

      try {
        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const result = await cachedRequest(
          key,
          request,
          {
            ttl,
            persistent,
            forceRefresh: shouldForceRefresh,
          }
        );

        if (mountedRef.current) {
          setData(result);
        }

        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [
      key,
      request,
      ttl,
      persistent,
      enabled,
      forceRefresh,
    ]
  );

  const refresh = useCallback(async () => {
    await invalidateRequest(key);

    return load({
      forceRefresh: true,
    });
  }, [key, load]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    load().catch(() => {});
  }, [enabled, load]);

  return {
    data,
    setData,
    loading,
    error,
    load,
    refresh,
  };
}