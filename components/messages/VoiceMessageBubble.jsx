import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

export default function VoiceMessageBubble({
  url,
  duration = 0,
  isMine = false,
}) {
  const [playbackError, setPlaybackError] = useState(false);

  const player = useAudioPlayer(
    typeof url === "string" && url.trim()
      ? url.trim()
      : undefined
  );

  const status = useAudioPlayerStatus(player);

  const playing = Boolean(status?.playing);
  const loading = Boolean(status?.isBuffering);

  const currentTime = Math.max(
    0,
    Number(status?.currentTime) || 0
  );

  const remoteDuration = Math.max(
    0,
    Number(status?.duration) || 0
  );

  const fallbackDuration = Math.max(
    0,
    Number(duration) || 0
  );

  const actualDuration =
    remoteDuration || fallbackDuration;

  useEffect(() => {
    setPlaybackError(false);
  }, [url]);

  useEffect(() => {
    if (!url) {
      return;
    }

    console.log("VOICE PLAYER:", {
      url,
      playing,
      loading,
      currentTime,
      remoteDuration,
      fallbackDuration,
      didJustFinish: status?.didJustFinish,
    });
  }, [
    url,
    playing,
    loading,
    currentTime,
    remoteDuration,
    fallbackDuration,
    status?.didJustFinish,
  ]);

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

  const waveformHeights = useMemo(
    () => [
      8,
      14,
      20,
      11,
      17,
      24,
      13,
      20,
      9,
      16,
      22,
      12,
      18,
      25,
      14,
      21,
      10,
      17,
      23,
      13,
      19,
      9,
      15,
      22,
      12,
      18,
      14,
      10,
    ],
    []
  );

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
    currentTime,
    actualDuration,
  ]);

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

  const togglePlayback = useCallback(() => {
    if (!player || !url) {
      return;
    }

    try {
      setPlaybackError(false);

      if (playing) {
        player.pause();
        return;
      }

      if (
        actualDuration > 0 &&
        currentTime >=
          actualDuration - 0.15
      ) {
        player.seekTo(0);
      }

      console.log(
        "VOICE PLAY:",
        url
      );

      player.play();
    } catch (error) {
      console.error(
        "VOICE PLAYBACK ERROR:",
        error
      );

      setPlaybackError(true);
    }
  }, [
    player,
    url,
    playing,
    currentTime,
    actualDuration,
  ]);

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
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={19}
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

  if (playbackError) {
    return (
      <View
        style={[
          styles.container,
          isMine
            ? styles.mineContainer
            : styles.otherContainer,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.playButton,
            isMine
              ? styles.minePlayButton
              : styles.otherPlayButton,
          ]}
          onPress={() => {
            setPlaybackError(false);

            try {
              player?.play?.();
            } catch (error) {
              console.error(
                "VOICE RETRY ERROR:",
                error
              );
              setPlaybackError(true);
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="reload"
            size={19}
            color={
              isMine
                ? "#0095F6"
                : "#111111"
            }
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.errorText,
              isMine
                ? styles.mineText
                : styles.otherText,
            ]}
          >
            Unable to play voice message
          </Text>

          <Text
            style={[
              styles.duration,
              isMine
                ? styles.mineText
                : styles.otherText,
            ]}
          >
            Tap to retry
          </Text>
        </View>
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
      <TouchableOpacity
        style={[
          styles.playButton,
          isMine
            ? styles.minePlayButton
            : styles.otherPlayButton,
        ]}
        onPress={togglePlayback}
        activeOpacity={0.75}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={
          playing
            ? "Pause voice message"
            : "Play voice message"
        }
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              isMine
                ? "#0095F6"
                : "#111111"
            }
          />
        ) : (
          <MaterialCommunityIcons
            name={
              playing
                ? "pause"
                : "play"
            }
            size={19}
            color={
              isMine
                ? "#0095F6"
                : "#111111"
            }
          />
        )}
      </TouchableOpacity>

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
                  key={`voice-bar-${index}`}
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

        <Text
          style={[
            styles.duration,
            isMine
              ? styles.mineText
              : styles.otherText,
          ]}
        >
          {playing
            ? formatTime(currentTime)
            : formatTime(actualDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  playButton: {
    width: 40,
    height: 40,

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

  content: {
    flex: 1,
    justifyContent: "center",
  },

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

  mineBar: {
    backgroundColor:
      "rgba(255,255,255,0.45)",
  },

  mineBarActive: {
    backgroundColor: "#FFFFFF",
  },

  otherBar: {
    backgroundColor: "#B8B8BD",
  },

  otherBarActive: {
    backgroundColor: "#0095F6",
  },

  duration: {
    marginTop: 2,

    fontSize: 10,
    lineHeight: 13,

    fontWeight: "600",
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },

  mineText: {
    color: "rgba(255,255,255,0.85)",
  },

  otherText: {
    color: "#777777",
  },

  unavailableText: {
    marginLeft: 7,

    fontSize: 12,
  },
});