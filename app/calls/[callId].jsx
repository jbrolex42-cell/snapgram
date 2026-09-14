import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import CallControls from "../../components/calls/CallControls";
import LocalVideo from "../../components/calls/LocalVideo";
import RemoteVideo from "../../components/calls/RemoteVideo";

import { useAuth } from "../../context/AuthContext";

import { waitForSocket } from "../../services/socket";

import { updateCall } from "../../services/callService";

import {
  getLocalStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  stopLocalStream,
} from "../../services/webrtcService";

const CALL_SETUP_TIMEOUT = 30000;

export default function CallScreen() {
  const { user } = useAuth();

  const params = useLocalSearchParams();

  const callId = String(params?.callId || "");

  const username = String(
    params?.username || "Snapgram User"
  );

  const avatar = String(
    params?.avatar || ""
  );

  const type = String(
    params?.type || "voice"
  ).toLowerCase();

  const caller =
    String(params?.isCaller) === "true";

  const isVideo = type === "video";

  const callerId = String(
    params?.callerId || ""
  );

  const otherUserId = String(
    params?.otherUserId || ""
  );

  const remoteUserId =
    otherUserId || callerId;

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const mountedRef = useRef(true);

  const initializingRef = useRef(false);

  const cleanedUpRef = useRef(false);

  const endingRef = useRef(false);

  const offerSentRef = useRef(false);

  const acceptedRef = useRef(
    caller === false
  );

  const readySentRef = useRef(false);

  const remoteDescriptionSetRef =
    useRef(false);

  const peerRef = useRef(null);

  const socketRef = useRef(null);

  const localStreamRef = useRef(null);

  const remoteStreamRef = useRef(null);

  const pendingIceCandidatesRef =
    useRef([]);

  const setupTimeoutRef =
    useRef(null);

  const [localStream, setLocalStream] =
    useState(null);

  const [remoteStream, setRemoteStream] =
    useState(null);

  const [muted, setMuted] =
    useState(false);

  const [speaker, setSpeaker] =
    useState(false);

  const [videoEnabled, setVideoEnabled] =
    useState(isVideo);

  const [connected, setConnected] =
    useState(false);

  const [initializing, setInitializing] =
    useState(true);

  const [callStatus, setCallStatus] =
    useState(
      caller
        ? "Calling..."
        : "Connecting..."
    );

  const [connectionError, setConnectionError] =
    useState("");

  const displayName =
    username.trim() || "Snapgram User";

  const avatarUri =
    avatar.trim();

  const initials = useMemo(() => {
    const parts = displayName
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return "S";
    }

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [displayName]);

  const renderAvatar = useCallback(
    (size = 120) => {
      return (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {avatarUri ? (
            <Image
              source={{
                uri: avatarUri,
              }}
              style={[
                styles.avatarImage,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            />
          ) : (
            <Text
              style={[
                styles.avatarInitials,
                {
                  fontSize: size * 0.31,
                },
              ]}
            >
              {initials}
            </Text>
          )}
        </View>
      );
    },
    [avatarUri, initials]
  );

  const isCurrentCall = useCallback(
    (data) => {
      if (!data) {
        return false;
      }

      if (
        data?.callId &&
        callId &&
        String(data.callId) !== callId
      ) {
        return false;
      }

      return true;
    },
    [callId]
  );

  const clearSetupTimeout =
    useCallback(() => {
      if (setupTimeoutRef.current) {
        clearTimeout(
          setupTimeoutRef.current
        );

        setupTimeoutRef.current = null;
      }
    }, []);

  const cleanupCall = useCallback(() => {
    if (cleanedUpRef.current) {
      return;
    }

    cleanedUpRef.current = true;

    clearSetupTimeout();

    offerSentRef.current = false;
    acceptedRef.current = false;
    readySentRef.current = false;

    remoteDescriptionSetRef.current =
      false;

    pendingIceCandidatesRef.current = [];

    const socket = socketRef.current;

    if (socket) {
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off(
        "webrtc:ice-candidate"
      );

      socket.off("call:accepted");
      socket.off("call:ready");

      socket.off("call:ended");
      socket.off("call:cancelled");
      socket.off("call:rejected");
      socket.off("call:missed");
    }

    socketRef.current = null;

    const peer = peerRef.current;

    peerRef.current = null;

    if (peer) {
      try {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onconnectionstatechange =
          null;
        peer.oniceconnectionstatechange =
          null;
        peer.onicecandidateerror = null;
      } catch {}

      try {
        peer.close?.();
      } catch (error) {
        console.warn(
          "PEER CLOSE ERROR:",
          error?.message || error
        );
      }
    }

    const stream =
      localStreamRef.current;

    localStreamRef.current = null;

    if (stream) {
      try {
        stopLocalStream(stream);
      } catch (error) {
        console.warn(
          "LOCAL STREAM CLEANUP ERROR:",
          error?.message || error
        );
      }
    }

    remoteStreamRef.current = null;

    if (mountedRef.current) {
      setLocalStream(null);
      setRemoteStream(null);
      setConnected(false);
    }
  }, [clearSetupTimeout]);

  const handleRemoteEnd =
    useCallback(
      (data) => {
        if (
          !mountedRef.current ||
          endingRef.current
        ) {
          return;
        }

        if (!isCurrentCall(data)) {
          return;
        }

        endingRef.current = true;

        setCallStatus("Call ended");

        cleanupCall();

        setTimeout(() => {
          if (mountedRef.current) {
            router.back();
          }
        }, 200);
      },
      [
        cleanupCall,
        isCurrentCall,
      ]
    );

  const handleCallAccepted =
    useCallback(
      (data) => {
        if (!isCurrentCall(data)) {
          return;
        }

        acceptedRef.current = true;

        console.log(
          "CALL ACCEPTED:",
          data
        );

        if (mountedRef.current) {
          setCallStatus(
            "Connecting..."
          );
        }
      },
      [isCurrentCall]
    );

  const createAndSendOffer =
    useCallback(async () => {
      if (
        !caller ||
        offerSentRef.current ||
        !acceptedRef.current
      ) {
        return;
      }

      const peer = peerRef.current;

      const socket = socketRef.current;

      if (!peer || !socket) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      if (
        peer.signalingState !==
        "stable"
      ) {
        console.log(
          "SKIPPING OFFER:",
          peer.signalingState
        );

        return;
      }

      offerSentRef.current = true;

      try {
        console.log(
          "CREATING WEBRTC OFFER..."
        );

        const offer =
          await createOffer(peer);

        if (!mountedRef.current) {
          return;
        }

        socket.emit("webrtc:offer", {
          callId,
          targetUserId: remoteUserId,
          senderId: currentUserId,
          offer,
        });

        setCallStatus(
          "Connecting..."
        );

        console.log(
          "WEBRTC OFFER SENT"
        );
      } catch (error) {
        offerSentRef.current = false;

        console.error(
          "CREATE OFFER ERROR:",
          error
        );

        if (mountedRef.current) {
          setConnectionError(
            error?.message ||
              "Unable to start the call."
          );
        }
      }
    }, [
      caller,
      callId,
      currentUserId,
      remoteUserId,
    ]);

  const handleCallReady =
    useCallback(
      async (data) => {
        if (
          !caller ||
          !isCurrentCall(data)
        ) {
          return;
        }

        console.log(
          "REMOTE CALL SCREEN READY"
        );

        acceptedRef.current = true;

        await createAndSendOffer();
      },
      [
        caller,
        createAndSendOffer,
        isCurrentCall,
      ]
    );

  const handleOffer =
    useCallback(
      async (data) => {
        if (
          !mountedRef.current ||
          !isCurrentCall(data)
        ) {
          return;
        }

        if (!data?.offer) {
          return;
        }

        const peer = peerRef.current;

        if (!peer) {
          console.warn(
            "OFFER RECEIVED BEFORE PEER READY"
          );

          return;
        }

        try {
          setCallStatus(
            "Connecting..."
          );

          await setRemoteDescription(
            peer,
            data.offer
          );

          remoteDescriptionSetRef.current =
            true;

          const queued =
            pendingIceCandidatesRef.current;

          pendingIceCandidatesRef.current =
            [];

          for (
            const candidate of queued
          ) {
            try {
              await addIceCandidate(
                peer,
                candidate
              );
            } catch (error) {
              console.warn(
                "QUEUED ICE ERROR:",
                error?.message || error
              );
            }
          }

          const answer =
            await createAnswer(peer);

          const socket =
            socketRef.current;

          if (!socket?.connected) {
            throw new Error(
              "Snapgram connection was lost."
            );
          }

          socket.emit(
            "webrtc:answer",
            {
              callId,
              targetUserId:
                data?.senderId ||
                remoteUserId,
              senderId: currentUserId,
              answer,
            }
          );

          console.log(
            "WEBRTC ANSWER SENT"
          );
        } catch (error) {
          console.error(
            "HANDLE OFFER ERROR:",
            error
          );

          if (mountedRef.current) {
            setConnectionError(
              error?.message ||
                "Unable to connect the call."
            );
          }
        }
      },
      [
        callId,
        currentUserId,
        isCurrentCall,
        remoteUserId,
      ]
    );

  const handleAnswer =
    useCallback(
      async (data) => {
        if (
          !mountedRef.current ||
          !isCurrentCall(data)
        ) {
          return;
        }

        if (!data?.answer) {
          return;
        }

        const peer = peerRef.current;

        if (!peer) {
          return;
        }

        try {
          await setRemoteDescription(
            peer,
            data.answer
          );

          remoteDescriptionSetRef.current =
            true;

          const queued =
            pendingIceCandidatesRef.current;

          pendingIceCandidatesRef.current =
            [];

          for (
            const candidate of queued
          ) {
            try {
              await addIceCandidate(
                peer,
                candidate
              );
            } catch (error) {
              console.warn(
                "QUEUED ANSWER ICE ERROR:",
                error?.message || error
              );
            }
          }

          console.log(
            "REMOTE ANSWER INSTALLED"
          );
        } catch (error) {
          console.error(
            "HANDLE ANSWER ERROR:",
            error
          );

          if (mountedRef.current) {
            setConnectionError(
              error?.message ||
                "Unable to complete the call."
            );
          }
        }
      },
      [isCurrentCall]
    );

  const handleIceCandidate =
    useCallback(
      async (data) => {
        if (
          !mountedRef.current ||
          !isCurrentCall(data) ||
          !data?.candidate
        ) {
          return;
        }

        const peer = peerRef.current;

        if (!peer) {
          return;
        }

        try {
          if (
            !remoteDescriptionSetRef.current
          ) {
            pendingIceCandidatesRef.current.push(
              data.candidate
            );

            return;
          }

          await addIceCandidate(
            peer,
            data.candidate
          );
        } catch (error) {
          console.warn(
            "ICE CANDIDATE ERROR:",
            error?.message || error
          );
        }
      },
      [isCurrentCall]
    );

  const sendCallReady =
    useCallback(() => {
      if (
        caller ||
        readySentRef.current
      ) {
        return;
      }

      const socket =
        socketRef.current;

      if (!socket?.connected) {
        return;
      }

      readySentRef.current = true;

      socket.emit("call:ready", {
        callId,
        targetUserId: remoteUserId,
        receiverId: currentUserId,
      });

      console.log(
        "CALL READY SENT"
      );
    }, [
      caller,
      callId,
      currentUserId,
      remoteUserId,
    ]);

  const registerListeners =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (!socket) {
        return;
      }

      socket.off(
        "call:accepted",
        handleCallAccepted
      );

      socket.off(
        "call:ready",
        handleCallReady
      );

      socket.off(
        "call:ended",
        handleRemoteEnd
      );

      socket.off(
        "call:cancelled",
        handleRemoteEnd
      );

      socket.off(
        "call:rejected",
        handleRemoteEnd
      );

      socket.off(
        "call:missed",
        handleRemoteEnd
      );

      socket.off(
        "webrtc:offer",
        handleOffer
      );

      socket.off(
        "webrtc:answer",
        handleAnswer
      );

      socket.off(
        "webrtc:ice-candidate",
        handleIceCandidate
      );

      socket.on(
        "call:accepted",
        handleCallAccepted
      );

      socket.on(
        "call:ready",
        handleCallReady
      );

      socket.on(
        "call:ended",
        handleRemoteEnd
      );

      socket.on(
        "call:cancelled",
        handleRemoteEnd
      );

      socket.on(
        "call:rejected",
        handleRemoteEnd
      );

      socket.on(
        "call:missed",
        handleRemoteEnd
      );

      socket.on(
        "webrtc:offer",
        handleOffer
      );

      socket.on(
        "webrtc:answer",
        handleAnswer
      );

      socket.on(
        "webrtc:ice-candidate",
        handleIceCandidate
      );

      console.log(
        "CALL WEBRTC LISTENERS READY"
      );
    }, [
      handleCallAccepted,
      handleCallReady,
      handleRemoteEnd,
      handleOffer,
      handleAnswer,
      handleIceCandidate,
    ]);

  const initializeCall =
    useCallback(async () => {
      if (
        initializingRef.current ||
        cleanedUpRef.current
      ) {
        return;
      }

      initializingRef.current = true;

      try {
        if (!currentUserId) {
          throw new Error(
            "Your Snapgram account could not be identified."
          );
        }

        if (!remoteUserId) {
          throw new Error(
            "The other caller could not be identified."
          );
        }

        if (!callId) {
          throw new Error(
            "This call is missing its call ID."
          );
        }

        setInitializing(true);
        setConnectionError("");

        console.log(
          "INITIALIZING CALL:",
          {
            callId,
            currentUserId,
            remoteUserId,
            caller,
            isVideo,
          }
        );

        const socket =
          await waitForSocket(
            currentUserId,
            10000
          );

        if (!mountedRef.current) {
          return;
        }

        if (
          !socket ||
          !socket.connected
        ) {
          throw new Error(
            "Snapgram connection is not available."
          );
        }

        socketRef.current = socket;

        registerListeners();

        const stream =
          await getLocalStream(
            isVideo
          );

        if (!mountedRef.current) {
          stopLocalStream(stream);
          return;
        }

        localStreamRef.current =
          stream;

        setLocalStream(stream);

        const peer =
          await createPeerConnection();

        if (!mountedRef.current) {
          peer?.close?.();
          stopLocalStream(stream);
          return;
        }

        peerRef.current = peer;

        const tracks =
          typeof stream.getTracks ===
          "function"
            ? stream.getTracks()
            : [];

        for (
          const track of tracks
        ) {
          try {
            peer.addTrack(
              track,
              stream
            );
          } catch (error) {
            console.warn(
              "ADD TRACK ERROR:",
              error?.message || error
            );
          }
        }

        peer.ontrack = (event) => {
          if (!mountedRef.current) {
            return;
          }

          const stream =
            event?.streams?.[0];

          if (!stream) {
            return;
          }

          remoteStreamRef.current =
            stream;

          setRemoteStream(stream);

          setConnected(true);
          setCallStatus("Connected");
          setConnectionError("");
        };

        peer.onicecandidate = (
          event
        ) => {
          const candidate =
            event?.candidate;

          if (!candidate) {
            return;
          }

          const socket =
            socketRef.current;

          if (!socket?.connected) {
            return;
          }

          socket.emit(
            "webrtc:ice-candidate",
            {
              callId,
              targetUserId:
                remoteUserId,
              senderId:
                currentUserId,
              candidate,
            }
          );
        };

        peer.onconnectionstatechange =
          () => {
            if (!mountedRef.current) {
              return;
            }

            const state =
              peer.connectionState;

            console.log(
              "WEBRTC CONNECTION STATE:",
              state
            );

            switch (state) {
              case "new":
                setConnected(false);
                break;

              case "connecting":
                setConnected(false);
                setCallStatus(
                  "Connecting..."
                );
                break;

              case "connected":
                setConnected(true);
                setConnectionError("");
                setCallStatus(
                  "Connected"
                );
                break;

              case "disconnected":
                setConnected(false);
                setCallStatus(
                  "Reconnecting..."
                );
                break;

              case "failed":
                setConnected(false);
                setConnectionError(
                  "The call connection failed."
                );
                break;

              case "closed":
                setConnected(false);
                break;

              default:
                break;
            }
          };

        peer.oniceconnectionstatechange =
          () => {
            console.log(
              "WEBRTC ICE STATE:",
              peer.iceConnectionState
            );
          };

        peer.onicecandidateerror =
          (event) => {
            console.warn(
              "WEBRTC ICE ERROR:",
              event
            );
          };

        if (!caller) {
          sendCallReady();
        }

        if (caller) {
          setCallStatus(
            acceptedRef.current
              ? "Connecting..."
              : "Calling..."
          );

          if (
            acceptedRef.current
          ) {
            await createAndSendOffer();
          }
        } else {
          setCallStatus(
            "Connecting..."
          );
        }

        setInitializing(false);
      } catch (error) {
        console.error(
          "CALL INITIALIZATION ERROR:",
          error
        );

        if (mountedRef.current) {
          setInitializing(false);

          setConnectionError(
            error?.message ||
              "Unable to start the call."
          );
        }
      } finally {
        initializingRef.current =
          false;
      }
    }, [
      callId,
      caller,
      currentUserId,
      createAndSendOffer,
      isVideo,
      registerListeners,
      remoteUserId,
      sendCallReady,
    ]);

  useEffect(() => {
    mountedRef.current = true;

    cleanedUpRef.current = false;
    endingRef.current = false;
    initializingRef.current = false;

    acceptedRef.current =
      caller === false;

    offerSentRef.current = false;
    readySentRef.current = false;

    remoteDescriptionSetRef.current =
      false;

    pendingIceCandidatesRef.current =
      [];

    setupTimeoutRef.current =
      setTimeout(() => {
        if (
          mountedRef.current &&
          !connected
        ) {
          setConnectionError(
            "The call took too long to connect."
          );
        }
      }, CALL_SETUP_TIMEOUT);

    initializeCall();

    return () => {
      mountedRef.current = false;
      cleanupCall();
    };
  }, [
    initializeCall,
    cleanupCall,
  ]);

  const toggleMute = useCallback(() => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const tracks =
      stream.getAudioTracks?.() || [];

    if (!tracks.length) {
      return;
    }

    const nextMuted = !muted;

    tracks.forEach((track) => {
      track.enabled = !nextMuted;
    });

    setMuted(nextMuted);
  }, [muted]);

  const toggleVideo =
    useCallback(() => {
      if (!isVideo) {
        return;
      }

      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      const tracks =
        stream.getVideoTracks?.() || [];

      if (!tracks.length) {
        return;
      }

      const nextEnabled =
        !videoEnabled;

      tracks.forEach((track) => {
        track.enabled = nextEnabled;
      });

      setVideoEnabled(nextEnabled);
    }, [
      isVideo,
      videoEnabled,
    ]);

  const toggleSpeaker =
    useCallback(() => {
      setSpeaker((value) => !value);
    }, []);

  const switchCamera =
    useCallback(() => {
      if (!isVideo) {
        return;
      }

      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      const track =
        stream
          .getVideoTracks?.()
          ?.find(Boolean);

      if (!track) {
        return;
      }

      try {
        if (
          typeof track._switchCamera ===
          "function"
        ) {
          track._switchCamera();
        }
      } catch (error) {
        console.warn(
          "SWITCH CAMERA ERROR:",
          error?.message || error
        );
      }
    }, [isVideo]);

  const endCall = useCallback(
    async () => {
      if (endingRef.current) {
        return;
      }

      endingRef.current = true;

      try {
        if (callId) {
          await updateCall(
            callId,
            "ended"
          );
        }
      } catch (error) {
        console.warn(
          "END CALL UPDATE ERROR:",
          error?.message || error
        );
      }

      try {
        const socket =
          socketRef.current;

        if (socket?.connected) {
          socket.emit("call:end", {
            callId,
            otherUserId:
              remoteUserId,
            targetUserId:
              remoteUserId,
          });
        }
      } catch (error) {
        console.warn(
          "END CALL SOCKET ERROR:",
          error?.message || error
        );
      }

      cleanupCall();

      if (mountedRef.current) {
        router.back();
      }
    },
    [
      callId,
      cleanupCall,
      remoteUserId,
    ]
  );

  if (connectionError) {
    return (
      <SafeAreaView
        style={styles.blackScreen}
      >
        <View
          style={styles.errorContent}
        >
          {renderAvatar(96)}

          <Text
            style={styles.errorTitle}
          >
            Call failed
          </Text>

          <Text
            style={styles.errorMessage}
          >
            {connectionError}
          </Text>

          <Pressable
            style={styles.errorButton}
            onPress={() => {
              cleanupCall();
              router.back();
            }}
          >
            <Text
              style={
                styles.errorButtonText
              }
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
        style={styles.blackScreen}
      >
        <View
          style={styles.connectingScreen}
        >
          {renderAvatar(120)}

          <Text
            style={styles.connectingName}
          >
            {displayName}
          </Text>

          <Text
            style={
              styles.connectingStatus
            }
          >
            {callStatus}
          </Text>

          <ActivityIndicator
            size="small"
            color="#ffffff"
            style={
              styles.connectingSpinner
            }
          />

          <Pressable
            onPress={endCall}
            accessibilityRole="button"
            accessibilityLabel="End call"
            style={
              styles.cancelCallButton
            }
          >
            <MaterialCommunityIcons
              name="phone-hangup"
              size={26}
              color="#ffffff"
            />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isVideo) {
    return (
      <View style={styles.videoRoot}>
        <SafeAreaView
          style={styles.videoSafeArea}
          edges={["top", "bottom"]}
        >
          <View
            style={styles.videoStage}
          >
            {remoteStream ? (
              <RemoteVideo
                stream={remoteStream}
              />
            ) : (
              <View
                style={
                  styles.videoWaiting
                }
              >
                {renderAvatar(110)}

                <Text
                  style={styles.videoName}
                >
                  {displayName}
                </Text>

                <Text
                  style={
                    styles.videoStatus
                  }
                >
                  {callStatus}
                </Text>
              </View>
            )}

            <View
              style={
                styles.videoTopHeader
              }
            >
              <Pressable
                onPress={endCall}
                accessibilityRole="button"
                accessibilityLabel="Minimize call"
                style={
                  styles.headerButton
                }
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={28}
                  color="#ffffff"
                />
              </Pressable>

              <View
                style={
                  styles.videoHeaderCenter
                }
              >
                <Text
                  numberOfLines={1}
                  style={
                    styles.videoHeaderName
                  }
                >
                  {displayName}
                </Text>

                <Text
                  style={
                    styles.videoHeaderStatus
                  }
                >
                  {connected
                    ? "Connected"
                    : callStatus}
                </Text>
              </View>

              <View
                style={
                  styles.headerPlaceholder
                }
              />
            </View>

            {/* LOCAL VIDEO */}
            {localStream &&
            videoEnabled ? (
              <View
                style={
                  styles.localVideoContainer
                }
              >
                <LocalVideo
                  stream={localStream}
                />

                <View
                  style={
                    styles.localVideoBorder
                  }
                />
              </View>
            ) : (
              <View
                style={
                  styles.localVideoOff
                }
              >
                <MaterialCommunityIcons
                  name="video-off"
                  size={23}
                  color="#ffffff"
                />
              </View>
            )}

            {/* CONNECTED BADGE */}
            {connected && (
              <View
                style={
                  styles.connectedBadge
                }
              >
                <View
                  style={
                    styles.connectedDot
                  }
                />

                <Text
                  style={
                    styles.connectedText
                  }
                >
                  Connected
                </Text>
              </View>
            )}

            {/* CONTROLS */}
            <View
              style={
                styles.callControls
              }
            >
              <CallControls
                muted={muted}
                speaker={speaker}
                videoEnabled={
                  videoEnabled
                }
                isVideo
                connected={connected}
                onToggleMute={
                  toggleMute
                }
                onToggleSpeaker={
                  toggleSpeaker
                }
                onToggleVideo={
                  toggleVideo
                }
                onSwitchCamera={
                  switchCamera
                }
                onEndCall={endCall}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.voiceRoot}>
      <SafeAreaView
        style={styles.voiceSafeArea}
        edges={["top", "bottom"]}
      >
        {/* VOICE HEADER */}
        <View
          style={styles.voiceTopBar}
        >
          <Pressable
            onPress={endCall}
            accessibilityRole="button"
            accessibilityLabel="Minimize call"
            style={
              styles.voiceBackButton
            }
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={29}
              color="#ffffff"
            />
          </Pressable>

          <Text
            style={styles.voiceTopTitle}
          >
            Snapgram
          </Text>

          <View
            style={styles.topBarSpacer}
          />
        </View>

        {/* VOICE PROFILE */}
        <View
          style={styles.voiceProfile}
        >
          {renderAvatar(138)}

          <Text
            numberOfLines={1}
            style={styles.voiceName}
          >
            {displayName}
          </Text>

          <Text
            style={styles.voiceStatus}
          >
            {connected
              ? "Connected"
              : callStatus}
          </Text>

          {connected && (
            <View
              style={
                styles.voiceConnected
              }
            >
              <View
                style={
                  styles.connectedDot
                }
              />

              <Text
                style={
                  styles.voiceConnectedText
                }
              >
                Connected
              </Text>
            </View>
          )}
        </View>

        {/* VOICE CONTROLS */}
        <View
          style={styles.voiceControls}
        >
          <CallControls
            muted={muted}
            speaker={speaker}
            videoEnabled={false}
            isVideo={false}
            connected={connected}
            onToggleMute={toggleMute}
            onToggleSpeaker={
              toggleSpeaker
            }
            onToggleVideo={() => {}}
            onSwitchCamera={() => {}}
            onEndCall={endCall}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blackScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626",
    overflow: "hidden",
  },

  avatarImage: {
    resizeMode: "cover",
  },

  avatarInitials: {
    color: "#ffffff",
    fontWeight: "700",
  },

  connectingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  connectingName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 22,
    maxWidth: "80%",
  },

  connectingStatus: {
    color: "#a8a8a8",
    fontSize: 14,
    marginTop: 8,
  },

  connectingSpinner: {
    marginTop: 18,
  },

  cancelCallButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  errorContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  errorTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 22,
  },

  errorMessage: {
    color: "#a8a8a8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 340,
  },

  errorButton: {
    minWidth: 130,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 28,
  },

  errorButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },

  videoRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },

  videoSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },

  videoStage: {
    flex: 1,
    backgroundColor: "#000000",
  },

  videoWaiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },

  videoName: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "700",
    marginTop: 18,
    maxWidth: "80%",
  },

  videoStatus: {
    color: "#aaaaaa",
    fontSize: 14,
    marginTop: 7,
  },

  videoTopHeader: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    height: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 50,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.32)",
  },

  videoHeaderCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 15,
  },

  videoHeaderName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "100%",
  },

  videoHeaderStatus: {
    color: "#dddddd",
    fontSize: 12,
    marginTop: 2,
  },

  headerPlaceholder: {
    width: 44,
    height: 44,
  },

  localVideoContainer: {
    position: "absolute",
    top: 78,
    right: 14,
    width: 112,
    height: 158,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#202020",
    zIndex: 100,
    elevation: 10,
  },

  localVideoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",
  },

  localVideoOff: {
    position: "absolute",
    top: 78,
    right: 14,
    width: 112,
    height: 158,
    borderRadius: 14,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },

  connectedBadge: {
    position: "absolute",
    top: 250,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    zIndex: 40,
  },

  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34c759",
    marginRight: 6,
  },

  connectedText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },

  callControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 200,
  },

  voiceRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },

  voiceSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },

  voiceTopBar: {
    height: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voiceBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  voiceTopTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  topBarSpacer: {
    width: 44,
    height: 44,
  },

  voiceProfile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  voiceName: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "700",
    marginTop: 22,
    maxWidth: "80%",
  },

  voiceStatus: {
    color: "#a8a8a8",
    fontSize: 14,
    marginTop: 8,
  },

  voiceConnected: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  voiceConnectedText: {
    color: "#34c759",
    fontSize: 12,
    fontWeight: "600",
  },

  voiceControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
});