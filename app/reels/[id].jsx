import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import ReelItem from "../../components/reels/ReelItem";
import { getReelById } from "../../services/reelService";

export default function ReelScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [reel, setReel] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [muted, setMuted] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [following, setFollowing] =
    useState(false);

  const loadReel = useCallback(
    async () => {
      if (!id) {
        setLoading(false);
        setError("Reel not found.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await getReelById(id);

        const data =
          result?.reel || result;

        if (!data?._id) {
          throw new Error(
            "Reel not found"
          );
        }

        setReel(data);
        setLiked(
          Boolean(data?.isLiked)
        );
        setSaved(
          Boolean(data?.isSaved)
        );
        setFollowing(
          Boolean(
            data?.user?.isFollowing
          )
        );
      } catch (err) {
        console.error(
          "Load reel error:",
          err
        );

        setReel(null);
        setError(
          "This Reel isn't available."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadReel();
  }, [loadReel]);

  const toggleMute = useCallback(
    () =>
      setMuted(
        (previous) => !previous
      ),
    []
  );

  const toggleLike = useCallback(
    () =>
      setLiked(
        (previous) => !previous
      ),
    []
  );

  const toggleSave = useCallback(
    () =>
      setSaved(
        (previous) => !previous
      ),
    []
  );

  const toggleFollow = useCallback(
    () =>
      setFollowing(
        (previous) => !previous
      ),
    []
  );

  const openComments = useCallback(
    () => {
      if (!reel?._id) {
        return;
      }

      router.push({
        pathname:
          "/reels/comments",
        params: {
          reelId:
            reel._id.toString(),
        },
      });
    },
    [reel?._id]
  );

  const handleShare = useCallback(
    () => {
      if (!reel?._id) {
        return;
      }

      router.push({
        pathname: "/share",
        params: {
          type: "reel",
          id: reel._id.toString(),
        },
      });
    },
    [reel?._id]
  );

  const openProfile = useCallback(
    (user) => {
      const userId =
        user?._id ||
        user?.id ||
        reel?.user?._id;

      if (!userId) {
        return;
      }

      router.push({
        pathname:
          "/profile/[id]",
        params: {
          id: userId.toString(),
        },
      });
    },
    [reel?.user]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#fff"
        />
      </View>
    );
  }

  if (error || !reel) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="film-outline"
          size={42}
          color="rgba(255,255,255,0.5)"
        />

        <Text style={styles.errorTitle}>
          Reel unavailable
        </Text>

        <Text style={styles.errorText}>
          {error ||
            "This Reel may have been removed."}
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.backPill}
        >
          <Text
            style={
              styles.backPillText
            }
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReelItem
        reel={reel}
        active
        muted={muted}
        isLiked={liked}
        isSaved={saved}
        isFollowing={following}
        onLike={toggleLike}
        onSave={toggleSave}
        onFollow={toggleFollow}
        onComment={openComments}
        onShare={handleShare}
        onProfile={openProfile}
        onDoubleTap={() =>
          setLiked(true)
        }
      />

      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0.5)",
          "transparent",
        ]}
        style={styles.topShade}
      />

      <Pressable
        onPress={() =>
          router.back()
        }
        style={[
          styles.backButton,
          { top: insets.top + 8 },
        ]}
        hitSlop={12}
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color="#fff"
        />
      </Pressable>

      <Pressable
        onPress={toggleMute}
        style={[
          styles.muteButton,
          { top: insets.top + 8 },
        ]}
        hitSlop={12}
      >
        <Ionicons
          name={
            muted
              ? "volume-mute-outline"
              : "volume-high-outline"
          }
          size={22}
          color="#fff"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  errorTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 14,
  },

  errorText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  backPill: {
    marginTop: 22,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  backPillText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 15,
  },

  backButton: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  muteButton: {
    position: "absolute",
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});