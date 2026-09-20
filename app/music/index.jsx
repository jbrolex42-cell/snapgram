import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import {
  configureMusicAudio,
  createMusicPlayer,
  pauseMusic,
  playMusic,
  stopMusic,
} from "../../services/music/musicPlayer";

import {
  recordMusicPlay,
} from "../../services/music/musicService";

import useMusicSearch from "../../hooks/music/useMusicSearch";

import MusicTrackRow from "../../components/music/MusicTrackRow";

export default function MusicScreen() {
  const router = useRouter();

  const {
    query,
    setQuery,
    tracks,
    loading,
    initialLoading,
    error,
    search,
  } = useMusicSearch();

  const [playingId, setPlayingId] =
    useState(null);

  const searchTimer = useRef(null);

  useEffect(() => {
    configureMusicAudio();

    return () => {
      stopMusic();
    };
  }, []);

  const handleQueryChange = (value) => {
    setQuery(value);

    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      search(value);
    }, 350);
  };

  const handlePlay = async (track) => {
    if (!track?.audioUrl) {
      return;
    }

    if (playingId === track.id) {
      pauseMusic();
      setPlayingId(null);
      return;
    }

    const player = createMusicPlayer(
      track.audioUrl
    );

    if (!player) {
      return;
    }

    player.play();

    setPlayingId(track.id);

    recordMusicPlay(track.id);
  };

  const handleSelect = (track) => {
    pauseMusic();

    router.push({
      pathname: "/music/select",
      params: {
        track: JSON.stringify(track),
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
          Add music
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>
          🔍
        </Text>

        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search music"
          placeholderTextColor="#888"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => search(query)}
        />
      </View>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>
            Unable to load music.
          </Text>

          <Pressable
            onPress={() => search(query)}
            style={styles.retry}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={({ item }) => (
            <MusicTrackRow
              track={item}
              playing={playingId === item.id}
              onPlay={handlePlay}
              onPress={handleSelect}
            />
          )}
          contentContainerStyle={
            tracks.length === 0
              ? styles.emptyContent
              : styles.list
          }
          ListHeaderComponent={
            loading ? (
              <ActivityIndicator
                style={styles.loading}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No music found.
            </Text>
          }
        />
      )}
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
    alignItems: "flex-start",
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
    color: "#111",
  },

  headerSpacer: {
    width: 40,
  },

  searchBox: {
    margin: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f1f1f1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 16,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111",
  },

  list: {
    paddingBottom: 30,
  },

  loading: {
    marginVertical: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  error: {
    color: "#777",
    marginBottom: 12,
  },

  retry: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#111",
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  emptyContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    color: "#777",
  },
});