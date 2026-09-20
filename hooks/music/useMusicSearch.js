import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  searchMusic,
  getFeaturedMusic,
} from "../../services/music/musicService";

export default function useMusicSearch() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] =
    useState(true);
  const [error, setError] = useState(null);

  const requestId = useRef(0);

  const loadFeatured = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setInitialLoading(true);
    setError(null);

    try {
      const result = await getFeaturedMusic(30);

      if (currentRequest !== requestId.current) {
        return;
      }

      setTracks(result);
    } catch (err) {
      if (currentRequest !== requestId.current) {
        return;
      }

      setError(err);
    } finally {
      if (currentRequest === requestId.current) {
        setInitialLoading(false);
      }
    }
  }, []);

  const search = useCallback(
    async (value) => {
      const currentRequest = ++requestId.current;

      const normalized = String(value || "").trim();

      if (!normalized) {
        await loadFeatured();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await searchMusic(
          normalized,
          1,
          30
        );

        if (currentRequest !== requestId.current) {
          return;
        }

        setTracks(result.tracks);
      } catch (err) {
        if (currentRequest !== requestId.current) {
          return;
        }

        setError(err);
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [loadFeatured]
  );

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  return {
    query,
    setQuery,
    tracks,
    loading,
    initialLoading,
    error,
    search,
    reload: loadFeatured,
  };
}