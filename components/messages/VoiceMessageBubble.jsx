import React, {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

export default function VoiceMessageBubble({
  url,
  duration = 0,
  isMine = false,
}) {
  const player = useAudioPlayer(url || null);

  const status = useAudioPlayerStatus(player);

  const playing = Boolean(status?.playing);

  const currentTime =
    Number(status?.currentTime) || 0;

  const playerDuration =
    Number(status?.duration) || 0;

  const actualDuration =
    playerDuration ||
    Number(duration) ||
    0;

  /*
  |--------------------------------------------------------------------------
  | WAVEFORM
  |--------------------------------------------------------------------------
  */

  const waveformHeights = useMemo(
    () => [
      8, 14, 20, 11, 17,
      24, 13, 20, 9, 16,
      22, 12, 18, 25, 14,
      21, 10, 17, 23, 13,
      19, 9, 15, 22, 12,
      18, 14, 10,
    ],
    []
  );

  /*
  |--------------------------------------------------------------------------
  | TIME
  |--------------------------------------------------------------------------
  */

  const formatTime = useCallback(
    (seconds) => {
      const value = Math.max(
        0,
        Math.floor(
          Number(seconds) || 0
        )
      );

      const minutes = Math.floor(
        value / 60
      );

      const secondsRemaining =
        value % 60;

      return `${minutes}:${String(
        secondsRemaining
      ).padStart(2, "0")}`;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const progress = useMemo(() => {
    if (
      !actualDuration ||
      actualDuration <= 0
    ) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(
        0,
        currentTime / actualDuration
      )
    );
  }, [
    actualDuration,
    currentTime,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PLAYBACK FINISHED
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!status?.didJustFinish) {
      return;
    }

    try {
      player?.seekTo?.(0);
    } catch (error) {
      console.warn(
        "VOICE RESET ERROR:",
        error
      );
    }
  }, [
    status?.didJustFinish,
    player,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PLAY / PAUSE
  |--------------------------------------------------------------------------
  */

  const togglePlayback =
    useCallback(() => {
      if (!player || !url) {
        return;
      }

      try {
        if (playing) {
          player.pause();
          return;
        }

        if (
          actualDuration > 0 &&
          currentTime >=
            actualDuration - 0.1
        ) {
          player.seekTo(0);
        }

        player.play();
      } catch (error) {
        console.error(
          "VOICE PLAYBACK ERROR:",
          error
        );
      }
    }, [
      player,
      url,
      playing,
      actualDuration,
      currentTime,
    ]);

  /*
  |--------------------------------------------------------------------------
  | NO URL
  |--------------------------------------------------------------------------
  */

  if (!url) {
    return (
      <View
        style={[
          styles.container,
          isMine
            ? styles.mineContainer
            : styles.otherContainer,
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={18}
          color={
            isMine
              ? "rgba(255,255,255,0.8)"
              : "#8E8E93"
          }
        />

        <Text
          style={[
            styles.unavailableText,
            isMine
              ? styles.mineText
              : styles.otherText,
          ]}
        >
          Voice message unavailable
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isMine
          ? styles.mineContainer
          : styles.otherContainer,
      ]}
    >
      {/* PLAY BUTTON */}

      <TouchableOpacity
        style={[
          styles.playButton,
          isMine
            ? styles.minePlayButton
            : styles.otherPlayButton,
        ]}
        onPress={togglePlayback}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          playing
            ? "Pause voice message"
            : "Play voice message"
        }
      >
        <Ionicons
          name={
            playing
              ? "pause"
              : "play"
          }
          size={18}
          color={
            isMine
              ? "#0095F6"
              : "#111111"
          }
        />
      </TouchableOpacity>

      {/* WAVEFORM */}

      <View style={styles.content}>
        <View style={styles.waveform}>
          {waveformHeights.map(
            (height, index) => {
              const filled =
                progress > 0 &&
                index /
                  waveformHeights.length <
                  progress;

              return (
                <View
                  key={`bar-${index}`}
                  style={[
                    styles.bar,
                    {
                      height,
                    },
                    isMine
                      ? filled
                        ? styles.mineBarActive
                        : styles.mineBar
                      : filled
                      ? styles.otherBarActive
                      : styles.otherBar,
                  ]}
                />
              );
            }
          )}
        </View>

        {/* TIME */}

        <Text
          style={[
            styles.duration,
            isMine
              ? styles.mineText
              : styles.otherText,
          ]}
        >
          {formatTime(
            playing
              ? currentTime
              : actualDuration
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | CONTAINER
  |--------------------------------------------------------------------------
  */

  container: {
    width: 230,
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 2,
  },

  mineContainer: {
    backgroundColor: "transparent",
  },

  otherContainer: {
    backgroundColor: "transparent",
  },

  /*
  |--------------------------------------------------------------------------
  | PLAY BUTTON
  |--------------------------------------------------------------------------
  */

  playButton: {
    width: 39,
    height: 39,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  minePlayButton: {
    backgroundColor: "#FFFFFF",
  },

  otherPlayButton: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#D9D9DE",
  },

  /*
  |--------------------------------------------------------------------------
  | CONTENT
  |--------------------------------------------------------------------------
  */

  content: {
    flex: 1,
    justifyContent: "center",
  },

  /*
  |--------------------------------------------------------------------------
  | WAVEFORM
  |--------------------------------------------------------------------------
  */

  waveform: {
    height: 28,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    width: "100%",
  },

  bar: {
    width: 2.2,
    borderRadius: 3,
  },

  /*
  |--------------------------------------------------------------------------
  | MY MESSAGE
  |--------------------------------------------------------------------------
  */

  mineBar: {
    backgroundColor:
      "rgba(255,255,255,0.45)",
  },

  mineBarActive: {
    backgroundColor: "#FFFFFF",
  },

  /*
  |--------------------------------------------------------------------------
  | OTHER MESSAGE
  |--------------------------------------------------------------------------
  */

  otherBar: {
    backgroundColor: "#B8B8BD",
  },

  otherBarActive: {
    backgroundColor: "#0095F6",
  },

  /*
  |--------------------------------------------------------------------------
  | DURATION
  |--------------------------------------------------------------------------
  */

  duration: {
    marginTop: 2,

    fontSize: 10,
    lineHeight: 13,

    fontWeight: "600",
  },

  mineText: {
    color: "rgba(255,255,255,0.85)",
  },

  otherText: {
    color: "#777777",
  },

  /*
  |--------------------------------------------------------------------------
  | UNAVAILABLE
  |--------------------------------------------------------------------------
  */

  unavailableText: {
    marginLeft: 7,
    fontSize: 12,
  },
});