import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export default function VoiceRecorder({
  onRecorded,
}) {
  const recorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  const recorderState =
    useAudioRecorderState(recorder);

  const [recording, setRecording] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const preparedRef = useRef(false);
  const recordingRef = useRef(false);
  const startingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    requestMicrophonePermission();

    return () => {
      mountedRef.current = false;

      preparedRef.current = false;
      recordingRef.current = false;
      startingRef.current = false;
      stopRequestedRef.current = true;
    };
  }, []);

  async function requestMicrophonePermission() {
    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        if (mountedRef.current) {
          Alert.alert(
            "Microphone permission",
            "Snapgram needs microphone access to record voice messages."
          );
        }
      }

      return permission.granted;
    } catch (error) {
      console.error(
        "MICROPHONE PERMISSION ERROR:",
        error
      );

      return false;
    }
  }

  async function startRecording() {
    if (
      startingRef.current ||
      recordingRef.current
    ) {
      return;
    }

    stopRequestedRef.current = false;

    /*
     * If the recorder is already prepared,
     * use the existing native session.
     */
    if (preparedRef.current) {
      try {
        recorder.record();

        recordingRef.current = true;

        if (mountedRef.current) {
          setRecording(true);
        }

        console.log(
          "VOICE RECORDING STARTED FROM EXISTING SESSION"
        );

        return;
      } catch (error) {
        console.error(
          "EXISTING SESSION RECORD ERROR:",
          error
        );

        preparedRef.current = false;
      }
    }

    startingRef.current = true;

    if (mountedRef.current) {
      setStarting(true);
    }

    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        if (mountedRef.current) {
          Alert.alert(
            "Permission required",
            "Please allow microphone access to record voice messages."
          );
        }

        return;
      }

      /*
       * User released the button while permission
       * was being requested.
       */
      if (stopRequestedRef.current) {
        return;
      }

      /*
       * Prepare only once.
       */
      if (!preparedRef.current) {
        await recorder.prepareToRecordAsync();

        preparedRef.current = true;

        console.log(
          "VOICE RECORDER PREPARED"
        );
      }

      /*
       * User released the button while preparation
       * was happening.
       */
      if (stopRequestedRef.current) {
        await safelyStopPreparedRecorder();
        return;
      }

      /*
       * Component disappeared while awaiting.
       */
      if (!mountedRef.current) {
        await safelyStopPreparedRecorder();
        return;
      }

      /*
       * Start native recording.
       */
      recorder.record();

      recordingRef.current = true;

      if (mountedRef.current) {
        setRecording(true);
      }

      console.log(
        "VOICE RECORDING STARTED"
      );
    } catch (error) {
      console.error(
        "START RECORDING ERROR:",
        error
      );

      preparedRef.current = false;
      recordingRef.current = false;

      if (mountedRef.current) {
        setRecording(false);

        Alert.alert(
          "Recording error",
          "Unable to start voice recording. Please try again."
        );
      }
    } finally {
      startingRef.current = false;

      if (mountedRef.current) {
        setStarting(false);
      }
    }

    /*
     * If the user released the microphone during
     * startup, finish the recording immediately.
     */
    if (
      stopRequestedRef.current &&
      recordingRef.current
    ) {
      await stopRecording();
    }
  }

  async function safelyStopPreparedRecorder() {
    try {
      if (recordingRef.current) {
        return;
      }

      try {
        await recorder.stop();
      } catch (error) {
        console.log(
          "PREPARED RECORDER STOP:",
          error?.message || error
        );
      }
    } finally {
      preparedRef.current = false;
      recordingRef.current = false;

      if (mountedRef.current) {
        setRecording(false);
      }
    }
  }

  async function stopRecording() {
    stopRequestedRef.current = true;

    /*
     * Don't call stop() while prepareToRecordAsync()
     * is still running.
     */
    if (startingRef.current) {
      return;
    }

    if (!recordingRef.current) {
      return;
    }

    /*
     * Prevent duplicate stop calls.
     */
    recordingRef.current = false;

    if (mountedRef.current) {
      setRecording(false);
    }

    try {
      await recorder.stop();

      preparedRef.current = false;

      /*
       * Get the final URI after stop().
       */
      const uri = recorder.uri;

      if (!uri) {
        console.warn(
          "VOICE RECORDING STOPPED WITHOUT URI"
        );

        stopRequestedRef.current = false;

        return;
      }

      /*
       * expo-audio reports duration in milliseconds.
       */
      const durationMillis =
        Number(
          recorderState?.durationMillis
        ) || 0;

      const duration = Math.max(
        0,
        Math.round(durationMillis / 1000)
      );

      console.log(
        "VOICE RECORDING COMPLETE:",
        {
          uri,
          duration,
        }
      );

      /*
       * Send recording back to ConversationScreen.
       */
      if (
        typeof onRecorded === "function" &&
        mountedRef.current
      ) {
        onRecorded({
          uri,
          duration,
        });
      }
    } catch (error) {
      console.error(
        "STOP RECORDING ERROR:",
        error
      );

      preparedRef.current = false;
      recordingRef.current = false;

      if (mountedRef.current) {
        setRecording(false);

        Alert.alert(
          "Recording error",
          "Unable to finish the voice recording. Please try again."
        );
      }
    } finally {
      stopRequestedRef.current = false;
    }
  }

  function handlePressIn() {
    if (
      startingRef.current ||
      recordingRef.current
    ) {
      return;
    }

    stopRequestedRef.current = false;

    startRecording();
  }

  function handlePressOut() {
    stopRequestedRef.current = true;

    /*
     * If preparation is still running,
     * startRecording() will finish the stop.
     */
    if (startingRef.current) {
      return;
    }

    stopRecording();
  }

  const active =
    recording || starting;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          active && styles.recordingButton,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          recording
            ? "Recording voice message"
            : "Record voice message"
        }
      >
        <Ionicons
          name={
            recording
              ? "mic"
              : "mic-outline"
          }
          size={25}
          color={
            recording
              ? "#ffffff"
              : "#111111"
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  recordingButton: {
    transform: [
      {
        scale: 1.12,
      },
    ],
  },
});