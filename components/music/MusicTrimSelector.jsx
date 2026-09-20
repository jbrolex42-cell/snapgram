import React, { useMemo } from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MAX_CLIP_SECONDS = 60;

function formatSeconds(value) {
  const seconds = Math.max(
    Math.floor(Number(value) || 0),
    0
  );

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${String(remaining).padStart(
    2,
    "0"
  )}`;
}

export default function MusicTrimSelector({
  durationMs = 0,
  startMs = 0,
  clipDurationMs = 15000,
  onChange,
}) {
  const durationSeconds = useMemo(
    () =>
      Math.max(
        Number(durationMs || 0) / 1000,
        1
      ),
    [durationMs]
  );

  const clipSeconds = Math.min(
    Math.max(
      Number(clipDurationMs || 15000) / 1000,
      1
    ),
    MAX_CLIP_SECONDS,
    durationSeconds
  );

  const startSeconds =
    Number(startMs || 0) / 1000;

  const maxStart = Math.max(
    durationSeconds - clipSeconds,
    0
  );

  const moveStart = (amount) => {
    const next = Math.min(
      Math.max(startSeconds + amount, 0),
      maxStart
    );

    onChange?.({
      startMs: Math.round(next * 1000),
      durationMs: Math.round(clipSeconds * 1000),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Choose your clip
      </Text>

      <View style={styles.timeRow}>
        <Text style={styles.time}>
          {formatSeconds(startSeconds)}
        </Text>

        <Text style={styles.time}>
          {formatSeconds(
            startSeconds + clipSeconds
          )}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.button}
          onPress={() => moveStart(-5)}
        >
          <Text style={styles.buttonText}>
            −5s
          </Text>
        </Pressable>

        <Text style={styles.duration}>
          {formatSeconds(clipSeconds)}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => moveStart(5)}
        >
          <Text style={styles.buttonText}>
            +5s
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  time: {
    fontSize: 13,
    color: "#666",
  },

  controls: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "600",
    color: "#111",
  },

  duration: {
    marginHorizontal: 20,
    fontWeight: "700",
    color: "#111",
  },
});