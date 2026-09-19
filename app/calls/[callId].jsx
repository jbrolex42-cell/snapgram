import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

import {
  waitForSocket,
  onSocketEvent,
  sendCallReady,
  sendWebRTCOffer,
  sendWebRTCAnswer,
  sendICECandidate,
  endCall as socketEndCall,
  cancelCall as socketCancelCall,
} from "../../services/socket";

import {
  getLocalStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  stopLocalStream,
  setMicrophoneEnabled,
  setCameraEnabled,
  switchCamera,
  closePeerConnection,
  startAudioRouting,
  stopAudioRouting,
  setSpeakerEnabled as setNativeSpeakerEnabled,
} from "../../services/webrtcService";

function normalizeId(value) {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
}

export default function ActiveCallScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const callId = normalizeId(params.callId);

  const callerId = normalizeId(
    params.callerId || params.fromUserId
  );

  const receiverId = normalizeId(
    params.receiverId ||
      params.toUserId ||
      params.otherUserId
  );

  const type = String(params.type || "voice");

  const isVideoCall = type === "video";

  const currentUserId = normalizeId(
    user?._id || user?.id
  );

  const isCaller =
    Boolean(currentUserId && callerId) &&
    currentUserId === callerId;

  const remoteUserId = isCaller
    ? receiverId
    : callerId;

  const mountedRef = useRef(true);
  const cleanedRef = useRef(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const remoteDescriptionSetRef = useRef(false);
  const offerSentRef = useRef(false);
  const readySentRef = useRef(false);

  const callAcceptedRef = useRef(!isCaller);

  const pendingIceRef = useRef([]);

  const connectionTimeoutRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [muted, setMuted] = useState(false);

  const [videoEnabled, setVideoEnabled] = useState(
    isVideoCall
  );

  const [speakerEnabled, setSpeakerEnabled] = useState(
    isVideoCall
  );

  const [status, setStatus] = useState(
    isCaller ? "Calling..." : "Connecting..."
  );

  const [connected, setConnected] = useState(false);

  const [initializing, setInitializing] = useState(true);

  const [error, setError] = useState("");

  const isCurrentCall = useCallback(
    (data) => {
      return (
        Boolean(callId) &&
        normalizeId(data?.callId) === callId
      );
    },
    [callId]
  );

  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const cleanupCall = useCallback(() => {
    if (cleanedRef.current) {
      return;
    }

    cleanedRef.current = true;

    clearConnectionTimeout();

    try {
      stopLocalStream(localStreamRef.current);
    } catch (error) {
      console.warn(
        "[CALL] Failed to stop local stream:",
        error?.message || error
      );
    }

    localStreamRef.current = null;

    try {
      closePeerConnection(peerRef.current);
    } catch (error) {
      console.warn(
        "[CALL] Failed to close peer connection:",
        error?.message || error
      );
    }

    peerRef.current = null;

    try {
      stopAudioRouting();
    } catch (error) {
      console.warn(
        "[CALL] Failed to stop audio routing:",
        error?.message || error
      );
    }

    remoteStreamRef.current = null;

    pendingIceRef.current = [];

    if (mountedRef.current) {
      setLocalStream(null);
      setRemoteStream(null);
    }
  }, [clearConnectionTimeout]);

  const finishCall = useCallback(
    (shouldNavigate = true) => {
      cleanupCall();

      if (
        shouldNavigate &&
        mountedRef.current
      ) {
        router.back();
      }
    },
    [cleanupCall]
  );

  const applyPendingIce = useCallback(async () => {
    const peer = peerRef.current;

    if (
      !peer ||
      !remoteDescriptionSetRef.current
    ) {
      return;
    }

    const pending = [
      ...pendingIceRef.current,
    ];

    pendingIceRef.current = [];

    for (const candidate of pending) {
      try {
        await addIceCandidate(
          peer,
          candidate
        );
      } catch (error) {
        console.warn(
          "[CALL] Failed to apply ICE candidate:",
          error?.message || error
        );
      }
    }
  }, []);

  const setupPeer = useCallback(async () => {
    const peer =
      await createPeerConnection();

    peerRef.current = peer;

    peer.ontrack = (event) => {
      if (!mountedRef.current) {
        return;
      }

      const stream =
        event?.streams?.[0];

      if (!stream) {
        return;
      }

      remoteStreamRef.current = stream;

      setRemoteStream(stream);
    };

    peer.onicecandidate = (event) => {
      const candidate =
        event?.candidate;

      if (!candidate) {
        return;
      }

      try {
        sendICECandidate(
          callId,
          candidate
        );
      } catch (error) {
        console.warn(
          "[CALL] Failed to send ICE candidate:",
          error?.message || error
        );
      }
    };

    peer.onconnectionstatechange =
      () => {
        if (!mountedRef.current) {
          return;
        }

        const state =
          peer.connectionState;

        if (state === "connected") {
          clearConnectionTimeout();

          setConnected(true);
          setStatus("Connected");

          return;
        }

        if (state === "connecting") {
          setStatus("Connecting...");

          return;
        }

        if (state === "disconnected") {
          setStatus(
            "Connection interrupted"
          );

          return;
        }

        if (state === "failed") {
          setError(
            "The call connection failed."
          );

          setStatus(
            "Connection failed"
          );

          return;
        }

        if (state === "closed") {
          setStatus("Call ended");
        }
      };

    peer.oniceconnectionstatechange =
      () => {
        if (!mountedRef.current) {
          return;
        }

        if (
          peer.iceConnectionState ===
          "failed"
        ) {
          setError(
            "Unable to establish the call connection."
          );
        }
      };

    return peer;
  }, [
    callId,
    clearConnectionTimeout,
  ]);

  const startLocalMedia =
    useCallback(async () => {
      const stream =
        await getLocalStream(
          isVideoCall
        );

      localStreamRef.current =
        stream;

      setLocalStream(stream);

      return stream;
    }, [isVideoCall]);

  const prepareWebRTC =
    useCallback(async () => {
      const stream =
        await startLocalMedia();

      try {
        startAudioRouting({
          video: isVideoCall,
          speaker: isVideoCall,
        });
      } catch (error) {
        console.warn(
          "[CALL] Failed to start audio routing:",
          error?.message || error
        );
      }

      const peer =
        await setupPeer();

      if (stream) {
        const tracks =
          typeof stream.getTracks ===
          "function"
            ? stream.getTracks()
            : [];

        for (const track of tracks) {
          try {
            peer.addTrack(
              track,
              stream
            );
          } catch (error) {
            console.warn(
              "[CALL] Failed to add track:",
              error?.message || error
            );
          }
        }
      }

      return peer;
    }, [
      isVideoCall,
      setupPeer,
      startLocalMedia,
    ]);

  const handleOffer =
    useCallback(
      async (data) => {
        if (!isCurrentCall(data)) {
          return;
        }

        if (isCaller) {
          return;
        }

        const peer =
          peerRef.current;

        if (
          !peer ||
          !data.offer
        ) {
          return;
        }

        try {
          await setRemoteDescription(
            peer,
            data.offer
          );

          remoteDescriptionSetRef.current =
            true;

          await applyPendingIce();

          const answer =
            await createAnswer(
              peer
            );

          sendWebRTCAnswer(
            callId,
            answer
          );
        } catch (error) {
          console.error(
            "[CALL] Offer handling failed:",
            error
          );

          if (mountedRef.current) {
            setError(
              "Unable to establish the call."
            );
          }
        }
      },
      [
        applyPendingIce,
        callId,
        isCaller,
        isCurrentCall,
      ]
    );

  const handleAnswer =
    useCallback(
      async (data) => {
        if (!isCurrentCall(data)) {
          return;
        }

        if (!isCaller) {
          return;
        }

        const peer =
          peerRef.current;

        if (
          !peer ||
          !data.answer
        ) {
          return;
        }

        try {
          await setRemoteDescription(
            peer,
            data.answer
          );

          remoteDescriptionSetRef.current =
            true;

          await applyPendingIce();
        } catch (error) {
          console.error(
            "[CALL] Answer handling failed:",
            error
          );

          if (mountedRef.current) {
            setError(
              "Unable to complete the call connection."
            );
          }
        }
      },
      [
        applyPendingIce,
        isCaller,
        isCurrentCall,
      ]
    );

  const handleIceCandidate =
    useCallback(
      async (data) => {
        if (!isCurrentCall(data)) {
          return;
        }

        if (!data.candidate) {
          return;
        }

        const peer =
          peerRef.current;

        if (!peer) {
          return;
        }

        if (
          !remoteDescriptionSetRef.current
        ) {
          pendingIceRef.current.push(
            data.candidate
          );

          return;
        }

        try {
          await addIceCandidate(
            peer,
            data.candidate
          );
        } catch (error) {
          console.warn(
            "[CALL] Failed to add ICE candidate:",
            error?.message || error
          );
        }
      },
      [isCurrentCall]
    );

  const createCallerOffer =
    useCallback(async () => {
      if (!isCaller) {
        return;
      }

      if (offerSentRef.current) {
        return;
      }

      const peer =
        peerRef.current;

      if (!peer) {
        return;
      }

      if (!callAcceptedRef.current) {
        return;
      }

      offerSentRef.current = true;

      try {
        const offer =
          await createOffer(peer);

        sendWebRTCOffer(
          callId,
          offer
        );

        if (mountedRef.current) {
          setStatus(
            "Connecting..."
          );
        }
      } catch (error) {
        offerSentRef.current =
          false;

        console.error(
          "[CALL] Failed to create offer:",
          error
        );

        if (mountedRef.current) {
          setError(
            "Unable to start the call."
          );
        }
      }
    }, [
      callId,
      isCaller,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      cleanupCall();
    };
  }, [cleanupCall]);

  useEffect(() => {
    if (
      !callId ||
      !currentUserId
    ) {
      setError("Invalid call.");
      setInitializing(false);

      return;
    }

    let cancelled = false;

    const cleanupListeners = [];

    async function initialize() {
      try {
        setInitializing(true);
        setError("");

        const socket =
          await waitForSocket();

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        socketRef.current =
          socket;

        cleanupListeners.push(
          onSocketEvent(
            "call:accepted",
            async (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (!isCaller) {
                return;
              }

              callAcceptedRef.current =
                true;

              if (
                mountedRef.current
              ) {
                setStatus(
                  "Connecting..."
                );
              }

              await createCallerOffer();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:ready",
            async (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (isCaller) {
                callAcceptedRef.current =
                  true;

                await createCallerOffer();
              }
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "webrtc:offer",
            handleOffer
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "webrtc:answer",
            handleAnswer
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "webrtc:ice-candidate",
            handleIceCandidate
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:rejected",
            (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (
                mountedRef.current
              ) {
                setStatus(
                  "Call declined"
                );
              }

              finishCall();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:cancelled",
            (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (
                mountedRef.current
              ) {
                setStatus(
                  "Call cancelled"
                );
              }

              finishCall();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:missed",
            (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (
                mountedRef.current
              ) {
                setStatus(
                  "Call missed"
                );
              }

              finishCall();
            }
          )
        );

        cleanupListeners.push(
          onSocketEvent(
            "call:ended",
            (data) => {
              if (
                !isCurrentCall(data)
              ) {
                return;
              }

              if (
                mountedRef.current
              ) {
                setStatus(
                  "Call ended"
                );
              }

              finishCall();
            }
          )
        );

        await prepareWebRTC();

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        if (
          !isCaller &&
          !readySentRef.current
        ) {
          readySentRef.current =
            true;

          sendCallReady(callId);

          setStatus(
            "Connecting..."
          );
        }

        setInitializing(false);

        connectionTimeoutRef.current =
          setTimeout(() => {
            if (
              !mountedRef.current ||
              connected
            ) {
              return;
            }

            setError(
              "The call could not establish a connection."
            );

            setStatus(
              "Connection timed out"
            );
          }, 30000);
      } catch (error) {
        console.error(
          "[CALL] Initialization failed:",
          error
        );

        cleanupCall();

        if (
          mountedRef.current
        ) {
          setInitializing(false);

          setError(
            error?.message ||
              "Unable to start the call."
          );
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;

      for (
        const remove of cleanupListeners
      ) {
        try {
          remove?.();
        } catch {}
      }
    };
  }, [
    callId,
    currentUserId,
    cleanupCall,
    createCallerOffer,
    finishCall,
    handleAnswer,
    handleIceCandidate,
    handleOffer,
    isCaller,
    isCurrentCall,
    prepareWebRTC,
  ]);

  const handleEnd = useCallback(() => {
    if (!callId) {
      finishCall();

      return;
    }

    try {
      if (
        connected ||
        callAcceptedRef.current
      ) {
        socketEndCall(callId);
      } else if (isCaller) {
        socketCancelCall(callId);
      }
    } catch (error) {
      console.warn(
        "[CALL] End request failed:",
        error?.message || error
      );
    }

    finishCall();
  }, [
    callId,
    connected,
    finishCall,
    isCaller,
  ]);

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;

    try {
      setMicrophoneEnabled(
        localStreamRef.current,
        !nextMuted
      );
    } catch (error) {
      console.warn(
        "[CALL] Microphone toggle failed:",
        error?.message || error
      );

      return;
    }

    setMuted(nextMuted);
  }, [muted]);

  const toggleVideo = useCallback(() => {
    if (!isVideoCall) {
      return;
    }

    const nextEnabled =
      !videoEnabled;

    try {
      setCameraEnabled(
        localStreamRef.current,
        nextEnabled
      );
    } catch (error) {
      console.warn(
        "[CALL] Camera toggle failed:",
        error?.message || error
      );

      return;
    }

    setVideoEnabled(
      nextEnabled
    );
  }, [
    isVideoCall,
    videoEnabled,
  ]);

  const handleSwitchCamera =
    useCallback(() => {
      if (!isVideoCall) {
        return;
      }

      try {
        switchCamera(
          localStreamRef.current
        );
      } catch (error) {
        console.warn(
          "[CALL] Camera switch failed:",
          error?.message || error
        );
      }
    }, [isVideoCall]);

  const toggleSpeaker =
    useCallback(() => {
      const next =
        !speakerEnabled;

      try {
        const success =
          setNativeSpeakerEnabled(
            next
          );

        if (success === false) {
          console.warn(
            "[CALL] Native speaker routing failed."
          );

          return;
        }

        setSpeakerEnabled(next);
      } catch (error) {
        console.warn(
          "[CALL] Speaker toggle failed:",
          error?.message || error
        );
      }
    }, [speakerEnabled]);

  if (!callId || !currentUserId) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <Text
            style={styles.errorText}
          >
            Invalid call.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text
              style={styles.backButtonText}
            >
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (initializing) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#fff"
          />

          <Text
            style={styles.statusText}
          >
            {status}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
        >
          {isVideoCall
            ? "Video call"
            : "Voice call"}
        </Text>

        <Text
          style={styles.status}
        >
          {status}
        </Text>
      </View>

      <View style={styles.callArea}>
        {remoteStream ? (
          <View
            style={styles.remoteVideo}
          >
            <Text
              style={styles.videoLabel}
            >
              Remote video connected
            </Text>
          </View>
        ) : (
          <View
            style={styles.avatarArea}
          >
            <View
              style={styles.avatarCircle}
            >
              <MaterialCommunityIcons
                name={
                  isVideoCall
                    ? "video-outline"
                    : "phone-outline"
                }
                size={54}
                color="#fff"
              />
            </View>

            <Text
              style={styles.callingText}
            >
              {connected
                ? "Connected"
                : status}
            </Text>
          </View>
        )}

        {error ? (
          <View
            style={styles.errorBox}
          >
            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={styles.controls}
      >
        <Pressable
          style={[
            styles.control,
            muted &&
              styles.controlActive,
          ]}
          onPress={toggleMute}
        >
          <MaterialCommunityIcons
            name={
              muted
                ? "microphone-off"
                : "microphone"
            }
            size={26}
            color="#fff"
          />
        </Pressable>

        {isVideoCall ? (
          <>
            <Pressable
              style={[
                styles.control,
                !videoEnabled &&
                  styles.controlActive,
              ]}
              onPress={
                toggleVideo
              }
            >
              <MaterialCommunityIcons
                name={
                  videoEnabled
                    ? "video"
                    : "video-off"
                }
                size={26}
                color="#fff"
              />
            </Pressable>

            <Pressable
              style={styles.control}
              onPress={
                handleSwitchCamera
              }
            >
              <MaterialCommunityIcons
                name="camera-flip"
                size={26}
                color="#fff"
              />
            </Pressable>
          </>
        ) : null}

        <Pressable
          style={[
            styles.control,
            speakerEnabled &&
              styles.controlActive,
          ]}
          onPress={
            toggleSpeaker
          }
        >
          <MaterialCommunityIcons
            name={
              speakerEnabled
                ? "volume-high"
                : "volume-off"
            }
            size={26}
            color="#fff"
          />
        </Pressable>

        <Pressable
          style={styles.endButton}
          onPress={handleEnd}
        >
          <MaterialCommunityIcons
            name="phone-hangup"
            size={30}
            color="#fff"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  statusText: {
    marginTop: 16,
    color: "#fff",
    fontSize: 16,
  },

  header: {
    alignItems: "center",
    paddingTop: 12,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  status: {
    color: "#aaa",
    marginTop: 5,
    fontSize: 14,
  },

  callArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarArea: {
    alignItems: "center",
  },

  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },

  callingText: {
    color: "#fff",
    fontSize: 17,
    marginTop: 20,
  },

  remoteVideo: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  videoLabel: {
    color: "#aaa",
  },

  errorBox: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 30,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#251010",
  },

  errorText: {
    color: "#ff8a8a",
    textAlign: "center",
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#252525",
  },

  backButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  control: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },

  controlActive: {
    backgroundColor: "#3d3d3d",
  },

  endButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
  },
});