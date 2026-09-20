import React, {
  useEffect,
  useState,
} from "react";

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

  const [startMs, setStartMs] =
    useState(0);

  const [clipDurationMs, setClipDurationMs] =
    useState(15000);

  const [playing, setPlaying] =
    useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(
        params.track || "null"
      );

      setTrack(parsed);
    } catch {
      setTrack(null);
    }

    return () => {
      stopMusic();
    };
  }, [params.track]);

  useEffect(() => {
    if (!track?.audioUrl) {
      return;
    }

    const player = createMusicPlayer(
      track.audioUrl
    );

    if (player) {
      seekMusic(0);
    }

    return () => {
      stopMusic();
    };
  }, [track]);

  if (!track) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>
            Music track unavailable.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePlay = async () => {
    if (playing) {
      pauseMusic();
      setPlaying(false);
      return;
    }

    await seekMusic(startMs / 1000);

    playMusic();

    setPlaying(true);
  };

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

  const handleUseMusic = async () => {
    pauseMusic();

    await recordMusicUse(track.id);

    const selectedMusic = {
      id: track.id,
      trackId: track.id,

      title: track.title,
      artist: track.artist,
      album: track.album || "",

      artworkUrl: track.artworkUrl || "",

      provider: track.provider || "snapgram",
      providerTrackId:
        track.providerTrackId || track.id,

      startMs,
      durationMs: clipDurationMs,
    };

    router.replace({
      pathname: "/create",
      params: {
        music: JSON.stringify(
          selectedMusic
        ),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
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

      <View style={styles.content}>
        <Image
          source={
            track.artworkUrl
              ? { uri: track.artworkUrl }
              : require("../../assets/images/icon.png")
          }
          style={styles.artwork}
        />

        <Text style={styles.title}>
          {track.title}
        </Text>

        <Text style={styles.artist}>
          {track.artist}
        </Text>

        <Pressable
          onPress={handlePlay}
          style={styles.playButton}
        >
          <Text style={styles.playText}>
            {playing ? "Pause" : "Preview"}
          </Text>
        </Pressable>

        <MusicTrimSelector
          durationMs={track.durationMs}
          startMs={startMs}
          clipDurationMs={clipDurationMs}
          onChange={handleTrimChange}
        />

        <Pressable
          style={styles.useButton}
          onPress={handleUseMusic}
        >
          <Text style={styles.useButtonText}>
            Use this music
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },

  back: {
    width: 40,
  },

  backText: {
    fontSize: 38,
    lineHeight: 38,
    color: "#111",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    alignItems: "center",
    paddingTop: 30,
  },

  artwork: {
    width: 190,
    height: 190,
    borderRadius: 14,
    backgroundColor: "#eee",
  },

  title: {
    marginTop: 18,
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
  },

  artist: {
    marginTop: 5,
    fontSize: 15,
    color: "#777",
  },

  playButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: "#111",
  },

  playText: {
    color: "#fff",
    fontWeight: "700",
  },

  useButton: {
    marginTop: 15,
    marginHorizontal: 20,
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0095f6",
    alignItems: "center",
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
  },
});