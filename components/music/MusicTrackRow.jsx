import React, { memo } from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function MusicTrackRow({
  track,
  selected = false,
  playing = false,
  onPress,
  onPlay,
}) {
  if (!track) {
    return null;
  }

  return (
    <Pressable
      style={[
        styles.container,
        selected && styles.selected,
      ]}
      onPress={() => onPress?.(track)}
    >
      <Image
        source={
          track.artworkUrl
            ? { uri: track.artworkUrl }
            : require("../../assets/images/icon.png")
        }
        style={styles.artwork}
      />

      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={styles.title}
        >
          {track.title}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.artist}
        >
          {track.artist}
          {track.album
            ? ` • ${track.album}`
            : ""}
        </Text>
      </View>

      <Pressable
        hitSlop={10}
        style={styles.playButton}
        onPress={(event) => {
          event?.stopPropagation?.();
          onPlay?.(track);
        }}
      >
        <Text style={styles.playText}>
          {playing ? "❚❚" : "▶"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  selected: {
    opacity: 0.65,
  },

  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
  },

  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  artist: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },

  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  playText: {
    fontSize: 17,
    color: "#111",
  },
});

export default memo(MusicTrackRow);