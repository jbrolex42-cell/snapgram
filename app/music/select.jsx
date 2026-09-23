import React, { useEffect, useState } from "react";

import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  createMusicPlayer,
  pauseMusic,
  playMusic,
  seekMusic,
  stopMusic,
} from "../../services/music/musicPlayer";

import {
  recordMusicUse,
} from "../../services/music/musicService";

import MusicTrimSelector from "../../components/music/MusicTrimSelector";

export default function MusicSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [track, setTrack] = useState(null);
  const [startMs, setStartMs] = useState(0);
  const [clipDurationMs, setClipDurationMs] = useState(15000);
  const [playing, setPlaying] = useState(false);
  const [usingMusic, setUsingMusic] = useState(false);

  /**
   * Parse selected track from navigation params.
   */
  useEffect(() => {
    const rawTrack = params?.track;

    if (!rawTrack) {
      setTrack(null);
      return;
    }

    try {
      const parsedTrack = JSON.parse(
        Array.isArray(rawTrack)
          ? rawTrack[0]
          : rawTrack
      );

      setTrack(parsedTrack);
    } catch (error) {
      console.warn(
        "[MUSIC] Failed to parse track:",
        error
      );

      setTrack(null);
    }
  }, [params?.track]);

  /**
   * Initialize music player when track changes.
   */
  useEffect(() => {
    if (!track?.audioUrl) {
      return undefined;
    }

    const player = createMusicPlayer(
      track.audioUrl
    );

    if (player) {
      seekMusic(0);
    }

    return () => {
      stopMusic();
      setPlaying(false);
    };
  }, [track]);

  /**
   * Stop playback when leaving the screen.
   */
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  /**
   * Preview / pause selected music.
   */
  const handlePlay = async () => {
    if (!track?.audioUrl) {
      return;
    }

    if (playing) {
      pauseMusic();
      setPlaying(false);
      return;
    }

    try {
      await seekMusic(startMs / 1000);
      playMusic();
      setPlaying(true);
    } catch (error) {
      console.warn(
        "[MUSIC] Preview failed:",
        error
      );

      setPlaying(false);
    }
  };

  /**
   * Handle music trim changes.
   */
  const handleTrimChange = ({
    startMs: nextStartMs,
    durationMs: nextDurationMs,
  }) => {
    setStartMs(nextStartMs);
    setClipDurationMs(nextDurationMs);

    if (playing) {
      seekMusic(nextStartMs / 1000);
    }
  };

  /**
   * Confirm selected music and return
   * to the create-post screen.
   */
  const handleUseMusic = async () => {
    if (!track || usingMusic) {
      return;
    }

    setUsingMusic(true);

    pauseMusic();
    setPlaying(false);

    try {
      try {
        await recordMusicUse(track.id);
      } catch (error) {
        console.warn(
          "[MUSIC] Failed to record use:",
          error
        );
      }

      const selectedMusic = {
        id: track.id,
        trackId: track.id,

        title: track.title || "",
        artist: track.artist || "",
        album: track.album || "",

        artworkUrl: track.artworkUrl || "",
        audioUrl: track.audioUrl || "",

        provider: track.provider || "snapgram",

        providerTrackId:
          track.providerTrackId || track.id,

        startMs,
        durationMs: clipDurationMs,
      };

      router.replace({
        pathname: "/create/post",
        params: {
          music: JSON.stringify(selectedMusic),
        },
      });
    } catch (error) {
      console.error(
        "[MUSIC] Failed to select music:",
        error
      );

      setUsingMusic(false);
    }
  };

  /**
   * Track unavailable state.
   */
  if (!track) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.unavailableText}>
            Music track unavailable.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const artworkSource = track.artworkUrl
    ? { uri: track.artworkUrl }
    : require("../../assets/images/icon.png");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            stopMusic();
            router.back();
          }}
          style={styles.back}
          hitSlop={10}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Choose music
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Artwork */}
        <Image
          source={artworkSource}
          style={styles.artwork}
        />

        {/* Track information */}
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {track.title || "Unknown track"}
        </Text>

        <Text
          style={styles.artist}
          numberOfLines={1}
        >
          {track.artist || "Unknown artist"}
        </Text>

        {/* Preview */}
        <Pressable
          onPress={handlePlay}
          style={[
            styles.playButton,
            playing && styles.playButtonActive,
          ]}
        >
          <Text style={styles.playIcon}>
            {playing ? "❚❚" : "▶"}
          </Text>

          <Text style={styles.playText}>
            {playing ? "Pause" : "Preview"}
          </Text>
        </Pressable>

        {/* Trim selector */}
        <View style={styles.trimContainer}>
          <MusicTrimSelector
            durationMs={
              Number(track.durationMs) || 0
            }
            startMs={startMs}
            clipDurationMs={clipDurationMs}
            onChange={handleTrimChange}
          />
        </View>

        {/* Selected clip information */}
        <View style={styles.clipInfo}>
          <Text style={styles.clipInfoText}>
            {Math.round(clipDurationMs / 1000)}s clip
          </Text>
        </View>

        {/* Use music */}
        <Pressable
          style={[
            styles.useButton,
            usingMusic && styles.useButtonDisabled,
          ]}
          onPress={handleUseMusic}
          disabled={usingMusic}
        >
          <Text style={styles.useButtonText}>
            {usingMusic
              ? "Adding music..."
              : "Use this music"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },

  back: {
    width: 40,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backText: {
    fontSize: 38,
    lineHeight: 38,
    color: "#111",
    fontWeight: "300",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 20,
  },

  artwork: {
    width: 190,
    height: 190,
    borderRadius: 14,
    backgroundColor: "#eee",
  },

  title: {
    width: "90%",
    marginTop: 18,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
  },

  artist: {
    width: "90%",
    marginTop: 5,
    textAlign: "center",
    fontSize: 15,
    color: "#777",
  },

  playButton: {
    marginTop: 20,
    minWidth: 125,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  playButtonActive: {
    backgroundColor: "#222",
  },

  playIcon: {
    marginRight: 8,
    fontSize: 13,
    color: "#fff",
  },

  playText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  trimContainer: {
    width: "100%",
    marginTop: 28,
  },

  clipInfo: {
    marginTop: 10,
    alignItems: "center",
  },

  clipInfoText: {
    fontSize: 13,
    color: "#777",
  },

  useButton: {
    marginTop: 20,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0095F6",
    alignItems: "center",
    justifyContent: "center",
  },

  useButtonDisabled: {
    opacity: 0.6,
  },

  useButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  unavailableText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },

  backButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#111",
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});