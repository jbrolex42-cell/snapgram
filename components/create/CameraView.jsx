import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  CameraView as ExpoCameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";

import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

const MODES = [
  {
    id: "live",
    label: "LIVE",
  },
  {
    id: "story",
    label: "STORY",
  },
  {
    id: "post",
    label: "POST",
  },
  {
    id: "reel",
    label: "REEL",
  },
];

const VALID_MODES = new Set([
  "post",
  "story",
  "reel",
  "live",
  "video",
]);

function normalizeMode(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (VALID_MODES.has(normalized)) {
    return normalized;
  }

  return "post";
}

export default function CameraView({
  mode: initialMode = "post",
  onCaptured,
  onClose,
}) {
  const cameraRef = useRef(null);

  const mountedRef = useRef(true);

  const cameraReadyRef = useRef(false);

  const captureLockedRef = useRef(false);

  const recordingRef = useRef(false);

  const recordingStartedAtRef = useRef(0);

  const cameraKeyRef = useRef(0);

  const parentLayoutRef = useRef({
    width: 0,
    height: 0,
  });

  const cameraLayoutRef = useRef({
    width: 0,
    height: 0,
  });

  const pictureSizeRef = useRef(null);

  const [cameraPermission, requestCameraPermission] =
    useCameraPermissions();

  const [
    microphonePermission,
    requestMicrophonePermission,
  ] = useMicrophonePermissions();

  const [cameraReady, setCameraReady] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [facing, setFacing] =
    useState("back");

  const [flash, setFlash] =
    useState("off");

  const [mode, setMode] = useState(
    normalizeMode(initialMode)
  );

  const [recording, setRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const isVideoMode =
    mode === "reel" ||
    mode === "live" ||
    mode === "video";

  const recordingLimit = useMemo(() => {
    if (mode === "live") {
      return 60 * 60;
    }

    if (mode === "reel") {
      return 90;
    }

    return 60;
  }, [mode]);

  const hasParentLayout =
    parentLayoutRef.current.width > 1 &&
    parentLayoutRef.current.height > 1;

  const hasCameraLayout =
    cameraLayoutRef.current.width > 1 &&
    cameraLayoutRef.current.height > 1;

  const ready =
    cameraReady &&
    cameraReadyRef.current &&
    !!cameraRef.current &&
    hasParentLayout &&
    hasCameraLayout;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cameraReadyRef.current = false;
      captureLockedRef.current = false;
      recordingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const nextMode = normalizeMode(initialMode);

    setMode(nextMode);

    if (
      nextMode === "live" ||
      nextMode === "reel"
    ) {
      setFlash("off");
    }
  }, [initialMode]);

  useEffect(() => {
    if (!cameraPermission) {
      return;
    }

    if (cameraPermission.granted) {
      return;
    }

    requestCameraPermission().catch((error) => {
      console.error(
        "CAMERA PERMISSION ERROR:",
        error
      );
    });
  }, [
    cameraPermission,
    requestCameraPermission,
  ]);

  useEffect(() => {
    if (!isVideoMode) {
      return;
    }

    if (!microphonePermission) {
      return;
    }

    if (microphonePermission.granted) {
      return;
    }

    requestMicrophonePermission().catch((error) => {
      console.error(
        "MICROPHONE PERMISSION ERROR:",
        error
      );
    });
  }, [
    isVideoMode,
    microphonePermission,
    requestMicrophonePermission,
  ]);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return undefined;
    }

    const interval = setInterval(() => {
      if (!mountedRef.current) {
        return;
      }

      const startedAt =
        recordingStartedAtRef.current;

      if (!startedAt) {
        return;
      }

      const elapsed = Math.floor(
        (Date.now() - startedAt) / 1000
      );

      setRecordingSeconds(elapsed);
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [recording]);

  useEffect(() => {
    if (!recording) {
      return;
    }

    if (
      recordingSeconds <
      recordingLimit
    ) {
      return;
    }

    const camera = cameraRef.current;

    if (!camera) {
      return;
    }

    try {
      camera.stopRecording();
    } catch (error) {
      console.error(
        "AUTO STOP RECORDING ERROR:",
        error
      );
    }
  }, [
    recording,
    recordingSeconds,
    recordingLimit,
  ]);

  const handleParentLayout = useCallback(
    (event) => {
      const width =
        event?.nativeEvent?.layout?.width;

      const height =
        event?.nativeEvent?.layout?.height;

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        return;
      }

      parentLayoutRef.current = {
        width,
        height,
      };
    },
    []
  );

  const handleCameraLayout = useCallback(
    (event) => {
      const width =
        event?.nativeEvent?.layout?.width;

      const height =
        event?.nativeEvent?.layout?.height;

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        return;
      }

      cameraLayoutRef.current = {
        width,
        height,
      };
    },
    []
  );

  const resetCameraReadiness =
    useCallback(() => {
      cameraReadyRef.current = false;

      pictureSizeRef.current = null;

      setCameraReady(false);

      setCameraError("");

      cameraLayoutRef.current = {
        width: 0,
        height: 0,
      };
    }, []);

  const getPictureSize =
    useCallback(async (camera) => {
      if (!camera) {
        return null;
      }

      try {
        if (
          typeof camera.getAvailablePictureSizesAsync !==
          "function"
        ) {
          return null;
        }

        const sizes =
          await camera.getAvailablePictureSizesAsync();

        if (
          !Array.isArray(sizes) ||
          sizes.length === 0
        ) {
          return null;
        }

        const validSizes = sizes
          .filter(
            (size) =>
              typeof size === "string" &&
              /^\d+:\d+$/.test(size)
          )
          .map((size) => {
            const parts = size.split(":");

            const width = Number(parts[0]);
            const height = Number(parts[1]);

            return {
              value: size,
              width,
              height,
              pixels:
                width * height,
            };
          })
          .filter(
            (item) =>
              item.width > 0 &&
              item.height > 0 &&
              item.pixels > 0
          );

        if (!validSizes.length) {
          return null;
        }

        validSizes.sort(
          (a, b) =>
            b.pixels - a.pixels
        );

        /*
         * Use a high-quality supported size,
         * but avoid blindly trusting an invalid
         * native value.
         */
        const selected =
          validSizes[0];

        if (
          !selected?.value ||
          selected.width <= 0 ||
          selected.height <= 0
        ) {
          return null;
        }

        return selected.value;
      } catch (error) {
        console.warn(
          "GET PICTURE SIZE ERROR:",
          error
        );

        return null;
      }
    }, []);

  const handleCameraReady =
    useCallback(async () => {
      if (!mountedRef.current) {
        return;
      }

      const camera = cameraRef.current;

      if (!camera) {
        return;
      }

      cameraReadyRef.current = true;

      setCameraError("");

      /*
       * Do not make pictureSize mandatory.
       * If Android does not provide a usable
       * size, native Expo Camera can use its
       * default configuration.
       */
      const selectedSize =
        await getPictureSize(camera);

      if (!mountedRef.current) {
        return;
      }

      if (
        selectedSize &&
        /^\d+:\d+$/.test(selectedSize)
      ) {
        pictureSizeRef.current =
          selectedSize;
      } else {
        pictureSizeRef.current = null;
      }

      setCameraReady(true);
    }, [getPictureSize]);

  const handleCameraMountError =
    useCallback((event) => {
      const message =
        event?.nativeEvent?.message ||
        "Unable to start the camera.";

      console.error(
        "CAMERA MOUNT ERROR:",
        message
      );

      cameraReadyRef.current = false;

      pictureSizeRef.current = null;

      setCameraReady(false);

      setCameraError(message);
    }, []);

  const waitForCamera =
    useCallback(async () => {
      const maximumAttempts = 60;

      for (
        let attempt = 0;
        attempt < maximumAttempts;
        attempt += 1
      ) {
        if (!mountedRef.current) {
          return false;
        }

        const parent =
          parentLayoutRef.current;

        const camera =
          cameraLayoutRef.current;

        const nativeCamera =
          cameraRef.current;

        if (
          nativeCamera &&
          cameraReadyRef.current &&
          parent.width > 1 &&
          parent.height > 1 &&
          camera.width > 1 &&
          camera.height > 1
        ) {
          return true;
        }

        await new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      }

      return false;
    }, []);

  const ensureMicrophone =
    useCallback(async () => {
      if (
        microphonePermission?.granted
      ) {
        return true;
      }

      try {
        const result =
          await requestMicrophonePermission();

        if (result?.granted) {
          return true;
        }

        Alert.alert(
          "Microphone permission",
          "Snapgram needs microphone access to record videos with sound."
        );

        return false;
      } catch (error) {
        console.error(
          "MICROPHONE PERMISSION ERROR:",
          error
        );

        Alert.alert(
          "Microphone permission",
          "Unable to access the microphone."
        );

        return false;
      }
    }, [
      microphonePermission,
      requestMicrophonePermission,
    ]);

  const takePicture =
    useCallback(async () => {
      if (
        captureLockedRef.current ||
        recordingRef.current
      ) {
        return;
      }

      captureLockedRef.current = true;

      try {
        const cameraIsReady =
          await waitForCamera();

        if (!cameraIsReady) {
          console.warn(
            "PHOTO BLOCKED - CAMERA NOT READY",
            {
              parent:
                parentLayoutRef.current,
              camera:
                cameraLayoutRef.current,
              nativeReady:
                cameraReadyRef.current,
            }
          );

          Alert.alert(
            "Camera",
            "The camera is still starting. Please try again."
          );

          return;
        }

        const camera =
          cameraRef.current;

        if (!camera) {
          return;
        }

        /*
         * Give the native camera one more
         * frame to settle before capture.
         */
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });

        if (!mountedRef.current) {
          return;
        }

        const options = {
          quality: 0.9,
          exif: false,
        };

        /*
         * Only send pictureSize if we have
         * verified a valid native value.
         */
        if (
          pictureSizeRef.current &&
          /^\d+:\d+$/.test(
            pictureSizeRef.current
          )
        ) {
          options.pictureSize =
            pictureSizeRef.current;
        }

        console.log(
          "TAKING PHOTO",
          {
            pictureSize:
              options.pictureSize ||
              "native-default",
            parent:
              parentLayoutRef.current,
            camera:
              cameraLayoutRef.current,
          }
        );

        const photo =
          await camera.takePictureAsync(
            options
          );

        if (!photo?.uri) {
          throw new Error(
            "Camera returned no photo URI."
          );
        }

        if (!mountedRef.current) {
          return;
        }

        console.log(
          "PHOTO CAPTURED:",
          photo.uri
        );

        onCaptured?.({
          uri: photo.uri,
          type: "image",
          mimeType:
            photo.mimeType ||
            "image/jpeg",
          fileName:
            `snapgram-${Date.now()}.jpg`,
          width:
            typeof photo.width === "number"
              ? photo.width
              : undefined,
          height:
            typeof photo.height === "number"
              ? photo.height
              : undefined,
          duration: 0,
        });
      } catch (error) {
        console.error(
          "TAKE PHOTO ERROR:",
          error
        );

        if (mountedRef.current) {
          Alert.alert(
            "Camera error",
            "Unable to take the photo. Please try again."
          );
        }
      } finally {
        setTimeout(() => {
          if (mountedRef.current) {
            captureLockedRef.current =
              false;
          }
        }, 400);
      }
    }, [
      onCaptured,
      waitForCamera,
    ]);

  const startRecording =
    useCallback(async () => {
      if (
        captureLockedRef.current ||
        recordingRef.current
      ) {
        return;
      }

      const cameraIsReady =
        await waitForCamera();

      if (!cameraIsReady) {
        Alert.alert(
          "Camera",
          "The camera is still starting. Please try again."
        );

        return;
      }

      const microphoneAllowed =
        await ensureMicrophone();

      if (!microphoneAllowed) {
        return;
      }

      if (!mountedRef.current) {
        return;
      }

      const camera =
        cameraRef.current;

      if (!camera) {
        return;
      }

      captureLockedRef.current = true;

      recordingRef.current = true;

      recordingStartedAtRef.current =
        Date.now();

      setRecording(true);

      setRecordingSeconds(0);

      try {
        const video =
          await camera.recordAsync({
            maxDuration:
              recordingLimit,
          });

        if (!mountedRef.current) {
          return;
        }

        if (!video?.uri) {
          throw new Error(
            "Camera returned no video URI."
          );
        }

        const elapsed = Math.max(
          0,
          Math.floor(
            (Date.now() -
              recordingStartedAtRef.current) /
              1000
          )
        );

        console.log(
          "VIDEO CAPTURED:",
          video.uri
        );

        onCaptured?.({
          uri: video.uri,
          type: "video",
          mimeType:
            video.mimeType ||
            "video/mp4",
          fileName:
            `snapgram-${Date.now()}.mp4`,
          width:
            typeof video.width === "number"
              ? video.width
              : undefined,
          height:
            typeof video.height === "number"
              ? video.height
              : undefined,
          duration:
            typeof video.duration === "number"
              ? video.duration
              : elapsed,
        });
      } catch (error) {
        console.error(
          "VIDEO RECORDING ERROR:",
          error
        );

        if (mountedRef.current) {
          Alert.alert(
            "Camera error",
            "Unable to record the video. Please try again."
          );
        }
      } finally {
        recordingRef.current = false;

        captureLockedRef.current = false;

        recordingStartedAtRef.current = 0;

        if (mountedRef.current) {
          setRecording(false);
          setRecordingSeconds(0);
        }
      }
    }, [
      ensureMicrophone,
      onCaptured,
      recordingLimit,
      waitForCamera,
    ]);

  const stopRecording =
    useCallback(() => {
      if (!recordingRef.current) {
        return;
      }

      const camera =
        cameraRef.current;

      if (!camera) {
        return;
      }

      try {
        camera.stopRecording();
      } catch (error) {
        console.error(
          "STOP RECORDING ERROR:",
          error
        );
      }
    }, []);

  const handleCapture =
    useCallback(() => {
      if (
        mode === "post" ||
        mode === "story"
      ) {
        takePicture();
        return;
      }

      if (
        mode === "reel" ||
        mode === "live" ||
        mode === "video"
      ) {
        if (recordingRef.current) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    }, [
      mode,
      startRecording,
      stopRecording,
      takePicture,
    ]);

  const switchCamera =
    useCallback(() => {
      if (recordingRef.current) {
        return;
      }

      resetCameraReadiness();

      setFacing((current) =>
        current === "back"
          ? "front"
          : "back"
      );

      setFlash("off");

      /*
       * Force the native CameraView to
       * completely remount.
       *
       * This is important on Android when
       * switching cameras after a previous
       * native surface existed.
       */
      cameraKeyRef.current += 1;
    }, [resetCameraReadiness]);

  const toggleFlash =
    useCallback(() => {
      if (
        recordingRef.current ||
        facing === "front"
      ) {
        return;
      }

      setFlash((current) =>
        current === "off"
          ? "on"
          : "off"
      );
    }, [facing]);

  const changeMode =
    useCallback(
      (nextMode) => {
        if (recordingRef.current) {
          return;
        }

        const normalized =
          normalizeMode(nextMode);

        if (normalized === mode) {
          return;
        }

        resetCameraReadiness();

        setMode(normalized);

        if (
          normalized === "live" ||
          normalized === "reel"
        ) {
          setFlash("off");
        }
      },
      [
        mode,
        resetCameraReadiness,
      ]
    );

  const openGallery =
    useCallback(async () => {
      if (recordingRef.current) {
        return;
      }

      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Photos permission",
            "Snapgram needs access to your photos and videos."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
                "videos",
              ],
              allowsMultipleSelection: false,
              quality: 1,
            }
          );

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const asset =
          result.assets[0];

        if (!asset?.uri) {
          return;
        }

        const isVideo =
          asset.type === "video";

        onCaptured?.({
          uri: asset.uri,

          type: isVideo
            ? "video"
            : "image",

          mimeType:
            asset.mimeType ||
            (isVideo
              ? "video/mp4"
              : "image/jpeg"),

          fileName:
            asset.fileName ||
            `snapgram-${Date.now()}.${
              isVideo
                ? "mp4"
                : "jpg"
            }`,

          width:
            typeof asset.width === "number"
              ? asset.width
              : undefined,

          height:
            typeof asset.height === "number"
              ? asset.height
              : undefined,

          duration:
            typeof asset.duration === "number"
              ? asset.duration
              : 0,
        });
      } catch (error) {
        console.error(
          "OPEN GALLERY ERROR:",
          error
        );

        Alert.alert(
          "Gallery error",
          "Unable to open your gallery."
        );
      }
    }, [onCaptured]);

  const handleClose =
    useCallback(() => {
      if (recordingRef.current) {
        stopRecording();
        return;
      }

      if (
        typeof onClose === "function"
      ) {
        onClose();
      }
    }, [
      onClose,
      stopRecording,
    ]);

  const formattedTimer =
    useMemo(() => {
      const minutes =
        Math.floor(
          recordingSeconds / 60
        );

      const seconds =
        recordingSeconds % 60;

      return `${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }, [recordingSeconds]);

  if (!cameraPermission) {
    return (
      <View
        style={styles.permissionScreen}
      >
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
        />

        <Text
          style={styles.permissionLoading}
        >
          Opening camera…
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View
        style={styles.permissionScreen}
      >
        <Ionicons
          name="camera-outline"
          size={52}
          color="#FFFFFF"
        />

        <Text
          style={styles.permissionTitle}
        >
          Allow camera access
        </Text>

        <Text
          style={styles.permissionText}
        >
          Snapgram needs access to
          your camera to take photos
          and videos.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={() =>
            requestCameraPermission()
          }
        >
          <Text
            style={
              styles.permissionButtonText
            }
          >
            Allow camera
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={handleParentLayout}
    >
      <View
        style={styles.cameraContainer}
      >
        <ExpoCameraView
          key={cameraKeyRef.current}
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={
            facing === "front"
              ? "off"
              : flash
          }
          mode={
            isVideoMode
              ? "video"
              : "picture"
          }
          pictureSize={
            pictureSizeRef.current ||
            undefined
          }
          onLayout={
            handleCameraLayout
          }
          onCameraReady={
            handleCameraReady
          }
          onMountError={
            handleCameraMountError
          }
        />
      </View>

      <View
        pointerEvents="none"
        style={styles.topShade}
      />

      <View
        pointerEvents="none"
        style={styles.bottomShade}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={handleClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
        >
          <Ionicons
            name="close"
            size={31}
            color="#FFFFFF"
          />
        </Pressable>

        <View
          style={styles.topRight}
        >
          <Pressable
            style={styles.iconButton}
            onPress={toggleFlash}
            disabled={
              recording ||
              facing === "front"
            }
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Toggle flash"
          >
            <Ionicons
              name={
                flash === "on"
                  ? "flash"
                  : "flash-outline"
              }
              size={25}
              color={
                facing === "front"
                  ? "rgba(255,255,255,0.35)"
                  : "#FFFFFF"
              }
            />
          </Pressable>
        </View>
      </View>

      {!ready && !cameraError && (
        <View
          pointerEvents="none"
          style={styles.loadingOverlay}
        >
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
          />
        </View>
      )}

      {cameraError ? (
        <View
          pointerEvents="none"
          style={styles.errorOverlay}
        >
          <Ionicons
            name="camera-outline"
            size={38}
            color="#FFFFFF"
          />

          <Text
            style={styles.errorTitle}
          >
            Camera could not start
          </Text>

          <Text
            style={styles.errorMessage}
          >
            Please close and reopen the
            camera.
          </Text>
        </View>
      ) : null}

      {recording ? (
        <View
          style={styles.recordingStatus}
        >
          <View
            style={styles.recordingDot}
          />

          <Text
            style={styles.recordingTime}
          >
            {formattedTimer}
          </Text>
        </View>
      ) : null}

      {mode === "live" &&
      !recording ? (
        <View
          style={styles.liveBadge}
        >
          <View
            style={styles.liveDot}
          />

          <Text
            style={styles.liveText}
          >
            LIVE
          </Text>
        </View>
      ) : null}

      <View
        style={styles.bottomControls}
      >
        <Pressable
          style={styles.sideButton}
          onPress={openGallery}
          disabled={recording}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open gallery"
        >
          <View
            style={styles.galleryPreview}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color="#FFFFFF"
            />
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.shutterButton,
            !ready &&
              styles.shutterDisabled,
          ]}
          onPress={handleCapture}
          disabled={!ready}
          accessibilityRole="button"
          accessibilityLabel={
            recording
              ? "Stop recording"
              : isVideoMode
                ? "Record video"
                : "Take photo"
          }
        >
          <View
            style={[
              styles.shutterInner,
              recording &&
                styles.shutterRecording,
            ]}
          />
        </Pressable>

        <Pressable
          style={styles.sideButton}
          onPress={switchCamera}
          disabled={recording}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
        >
          <Ionicons
            name="camera-reverse-outline"
            size={31}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <View
        style={styles.modeSelector}
      >
        {MODES.map((item) => {
          const active =
            mode === item.id;

          return (
            <Pressable
              key={item.id}
              style={styles.modeButton}
              onPress={() =>
                changeMode(item.id)
              }
              disabled={recording}
              hitSlop={7}
              accessibilityRole="button"
              accessibilityState={{
                selected: active,
              }}
            >
              <Text
                style={[
                  styles.modeText,
                  active &&
                    styles.modeTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    overflow: "hidden",
  },

  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor:
      "rgba(0,0,0,0.20)",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 270,
    backgroundColor:
      "rgba(0,0,0,0.32)",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 94,
    paddingTop: 45,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 50,
  },

  topRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },

  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    zIndex: 20,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center",
  },

  errorMessage: {
    color: "#BBBBBB",
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
  },

  recordingStatus: {
    position: "absolute",
    top: 49,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
  },

  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF3040",
    marginRight: 7,
  },

  recordingTime: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  liveBadge: {
    position: "absolute",
    top: 99,
    alignSelf: "center",
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 5,
    backgroundColor:
      "rgba(0,0,0,0.70)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3040",
    marginRight: 6,
  },

  liveText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 88,
    height: 105,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
  },

  sideButton: {
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  galleryPreview: {
    width: 43,
    height: 43,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor:
      "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  shutterButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor:
      "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  shutterDisabled: {
    opacity: 0.45,
  },

  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
  },

  shutterRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FF3040",
  },

  modeSelector: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 42,
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    zIndex: 50,
  },

  modeButton: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  modeText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.15,
  },

  modeTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  permissionScreen: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  permissionLoading: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 14,
  },

  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 20,
  },

  permissionText: {
    color: "#A8A8A8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 310,
    marginTop: 10,
  },

  permissionButton: {
    minWidth: 150,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#0095F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});