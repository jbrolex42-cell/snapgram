import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
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

import CallControls from "../../components/calls/CallControls";
import LocalVideo from "../../components/calls/LocalVideo";
import RemoteVideo from "../../components/calls/RemoteVideo";

import {
  waitForSocket,
} from "../../services/socket";

import { useAuth } from "../../context/AuthContext";

import {
  updateCall,
} from "../../services/callService";

import {
  getLocalStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteDescription,
  addIceCandidate,
  stopLocalStream,
} from "../../services/webrtcService";

export default function CallScreen() {
  const { user } = useAuth();

  const {
    callId,
    username,
    avatar,
    type,
    otherUserId,
    callerId,
    isCaller,
  } = useLocalSearchParams();

  const isVideo =
    String(type) === "video";

  const caller =
    String(isCaller) === "true";

  /*
   * Remote participant.
   *
   * Caller:
   *   otherUserId = receiver
   *
   * Receiver:
   *   callerId = caller
   */
  const remoteUserId =
    String(
      otherUserId ||
        callerId ||
        ""
    );

  /*
   * --------------------------------------------------
   * REFS
   * --------------------------------------------------
   */

  const peerRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const remoteStreamRef =
    useRef(null);

  const socketRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const initializingRef =
    useRef(false);

  const cleanedUpRef =
    useRef(false);

  const callActiveRef =
    useRef(false);

  const remoteDescriptionSetRef =
    useRef(false);

  /*
   * ICE candidates can arrive before
   * the remote SDP is installed.
   */
  const pendingIceCandidatesRef =
    useRef([]);

  const remoteEndHandledRef =
    useRef(false);

  /*
   * --------------------------------------------------
   * STATE
   * --------------------------------------------------
   */

  const [
    localStream,
    setLocalStream,
  ] = useState(null);

  const [
    remoteStream,
    setRemoteStream,
  ] = useState(null);

  const [
    muted,
    setMuted,
  ] = useState(false);

  const [
    speaker,
    setSpeaker,
  ] = useState(false);

  const [
    videoEnabled,
    setVideoEnabled,
  ] = useState(isVideo);

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    initializing,
    setInitializing,
  ] = useState(true);

  const [
    connectionError,
    setConnectionError,
  ] = useState(null);

  /*
   * --------------------------------------------------
   * DISPLAY HELPERS
   * --------------------------------------------------
   */

  const displayName =
    username ||
    "Snapgram User";

  const avatarUri =
    typeof avatar === "string" &&
    avatar.trim().length > 0
      ? avatar
      : null;

  const getInitials =
    useCallback(() => {
      const parts =
        displayName
          .trim()
          .split(/\s+/)
          .filter(Boolean);

      if (parts.length === 0) {
        return "S";
      }

      if (parts.length === 1) {
        return parts[0]
          .charAt(0)
          .toUpperCase();
      }

      return (
        parts[0].charAt(0) +
        parts[
          parts.length - 1
        ].charAt(0)
      ).toUpperCase();
    }, [displayName]);

  /*
   * --------------------------------------------------
   * SOCKET HANDLERS
   * --------------------------------------------------
   */

  const handleCallAccepted =
    useCallback((data) => {
      console.log(
        "CALL ACCEPTED:",
        data
      );
    }, []);

  const handleRemoteEnd =
    useCallback(
      (data) => {
        if (
          remoteEndHandledRef.current
        ) {
          return;
        }

        remoteEndHandledRef.current =
          true;

        console.log(
          "REMOTE CALL ENDED:",
          data
        );

        cleanupCall();

        if (
          mountedRef.current
        ) {
          router.back();
        }
      },
      []
    );

  const handleOffer =
    useCallback(
      async (data) => {
        try {
          if (
            !mountedRef.current
          ) {
            return;
          }

          const peer =
            peerRef.current;

          if (!peer) {
            console.warn(
              "OFFER RECEIVED BUT PEER IS NOT READY"
            );

            return;
          }

          if (!data?.offer) {
            console.warn(
              "WEBRTC OFFER IS MISSING"
            );

            return;
          }

          console.log(
            "WEBRTC OFFER RECEIVED FROM:",
            data.senderId
          );

          /*
           * Install remote SDP.
           */
          await setRemoteDescription(
            peer,
            data.offer
          );

          remoteDescriptionSetRef.current =
            true;

          /*
           * Process ICE candidates that
           * arrived before the remote SDP.
           */
          const pendingCandidates =
            pendingIceCandidatesRef.current;

          pendingIceCandidatesRef.current =
            [];

          for (
            const candidate of
            pendingCandidates
          ) {
            try {
              await addIceCandidate(
                peer,
                candidate
              );
            } catch (error) {
              console.warn(
                "PENDING ICE CANDIDATE ERROR:",
                error?.message ||
                  error
              );
            }
          }

          if (
            !mountedRef.current
          ) {
            return;
          }

          /*
           * Receiver creates answer.
           */
          const answer =
            await createAnswer(
              peer
            );

          const socket =
            socketRef.current;

          if (
            !socket ||
            !socket.connected
          ) {
            throw new Error(
              "Socket disconnected while sending the WebRTC answer."
            );
          }

          socket.emit(
            "webrtc:answer",
            {
              targetUserId:
                data.senderId,

              answer,
            }
          );

          console.log(
            "WEBRTC ANSWER SENT"
          );
        } catch (error) {
          console.error(
            "OFFER ERROR:",
            error
          );

          if (
            mountedRef.current
          ) {
            setConnectionError(
              error?.message ||
                "Unable to process the call offer."
            );
          }
        }
      },
      []
    );

  const handleAnswer =
    useCallback(
      async (data) => {
        try {
          if (
            !mountedRef.current
          ) {
            return;
          }

          const peer =
            peerRef.current;

          if (!peer) {
            console.warn(
              "ANSWER RECEIVED BUT PEER IS NOT READY"
            );

            return;
          }

          if (!data?.answer) {
            console.warn(
              "WEBRTC ANSWER IS MISSING"
            );

            return;
          }

          console.log(
            "WEBRTC ANSWER RECEIVED FROM:",
            data.senderId
          );

          await setRemoteDescription(
            peer,
            data.answer
          );

          remoteDescriptionSetRef.current =
            true;

          /*
           * Process queued ICE.
           */
          const pendingCandidates =
            pendingIceCandidatesRef.current;

          pendingIceCandidatesRef.current =
            [];

          for (
            const candidate of
            pendingCandidates
          ) {
            try {
              await addIceCandidate(
                peer,
                candidate
              );
            } catch (error) {
              console.warn(
                "PENDING ICE CANDIDATE ERROR:",
                error?.message ||
                  error
              );
            }
          }

          console.log(
            "REMOTE ANSWER INSTALLED"
          );
        } catch (error) {
          console.error(
            "ANSWER ERROR:",
            error
          );

          if (
            mountedRef.current
          ) {
            setConnectionError(
              error?.message ||
                "Unable to process the call answer."
            );
          }
        }
      },
      []
    );

  const handleIceCandidate =
    useCallback(
      async (data) => {
        try {
          if (
            !mountedRef.current
          ) {
            return;
          }

          if (!data?.candidate) {
            return;
          }

          const peer =
            peerRef.current;

          if (!peer) {
            return;
          }

          /*
           * If remote SDP is not installed yet,
           * queue the candidate.
           */
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
            error?.message ||
              error
          );
        }
      },
      []
    );

  /*
   * --------------------------------------------------
   * REGISTER SOCKET LISTENERS
   * --------------------------------------------------
   */

  const registerSocketListeners =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (!socket) {
        return;
      }

      /*
       * Remove old listeners first.
       */
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

      socket.off(
        "call:accepted",
        handleCallAccepted
      );

      socket.off(
        "call:ended",
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

      /*
       * Register current listeners.
       */
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

      socket.on(
        "call:accepted",
        handleCallAccepted
      );

      socket.on(
        "call:ended",
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

      console.log(
        "CALL SOCKET LISTENERS REGISTERED"
      );
    }, [
      handleOffer,
      handleAnswer,
      handleIceCandidate,
      handleCallAccepted,
      handleRemoteEnd,
    ]);

  /*
   * --------------------------------------------------
   * INITIALIZE CALL
   * --------------------------------------------------
   */

  const initializeCall =
    useCallback(
      async () => {
        if (
          initializingRef.current
        ) {
          return;
        }

        initializingRef.current =
          true;

        try {
          if (
            !mountedRef.current
          ) {
            return;
          }

          setInitializing(true);
          setConnectionError(null);

          const currentUserId =
            user?._id ||
            user?.id;

          if (!currentUserId) {
            throw new Error(
              "Authenticated user is not available."
            );
          }

          if (!remoteUserId) {
            throw new Error(
              "The other call participant could not be identified."
            );
          }

          if (!callId) {
            throw new Error(
              "Call ID is missing."
            );
          }

          console.log(
            "CALL INITIALIZATION",
            {
              callId,
              currentUserId,
              remoteUserId,
              caller,
              isVideo,
            }
          );

          /*
           * ------------------------------------------------
           * SOCKET
           * ------------------------------------------------
           */

          const socket =
            await waitForSocket(
              currentUserId,
              10000
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          if (!socket) {
            throw new Error(
              "Unable to establish Socket.IO connection."
            );
          }

          if (!socket.connected) {
            throw new Error(
              "Socket connection was not established."
            );
          }

          socketRef.current =
            socket;

          console.log(
            "CALL SOCKET READY:",
            socket.id
          );

          /*
           * ------------------------------------------------
           * LOCAL MEDIA
           * ------------------------------------------------
           */

          const stream =
            await getLocalStream(
              isVideo
            );

          if (
            !mountedRef.current
          ) {
            stopLocalStream(
              stream
            );

            return;
          }

          if (!stream) {
            throw new Error(
              "Unable to obtain local media stream."
            );
          }

          localStreamRef.current =
            stream;

          setLocalStream(
            stream
          );

          /*
           * ------------------------------------------------
           * PEER CONNECTION
           * ------------------------------------------------
           *
           * IMPORTANT:
           *
           * createPeerConnection() is async.
           *
           * The previous code was:
           *
           *   const peer = createPeerConnection();
           *
           * which returned a Promise.
           *
           * That caused:
           *
           *   undefined is not a function
           *
           * when addTrack() or close() was called.
           */

          const peer =
            await createPeerConnection();

          if (
            !mountedRef.current
          ) {
            try {
              if (
                peer &&
                typeof peer.close ===
                  "function"
              ) {
                peer.close();
              }
            } catch {}

            stopLocalStream(
              stream
            );

            return;
          }

          if (!peer) {
            throw new Error(
              "Unable to create WebRTC peer connection."
            );
          }

          peerRef.current =
            peer;

          console.log(
            "WEBRTC PEER READY"
          );

          /*
           * ------------------------------------------------
           * ADD LOCAL TRACKS
           * ------------------------------------------------
           */

          if (
            typeof peer.addTrack !==
            "function"
          ) {
            throw new Error(
              "WebRTC addTrack() is unavailable."
            );
          }

          const tracks =
            typeof stream.getTracks ===
            "function"
              ? stream.getTracks()
              : [];

          tracks.forEach(
            (track) => {
              if (!track) {
                return;
              }

              peer.addTrack(
                track,
                stream
              );
            }
          );

          console.log(
            "LOCAL MEDIA TRACKS ADDED:",
            tracks.length
          );

          /*
           * Call is now active.
           */
          callActiveRef.current =
            true;

          /*
           * ------------------------------------------------
           * REMOTE TRACK
           * ------------------------------------------------
           */

          peer.ontrack =
            (event) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              const incomingStream =
                event?.streams?.[0];

              if (
                !incomingStream
              ) {
                return;
              }

              console.log(
                "REMOTE MEDIA STREAM RECEIVED"
              );

              remoteStreamRef.current =
                incomingStream;

              setRemoteStream(
                incomingStream
              );
            };

          /*
           * ------------------------------------------------
           * ICE CANDIDATES
           * ------------------------------------------------
           */

          peer.onicecandidate =
            (event) => {
              if (
                !event?.candidate
              ) {
                console.log(
                  "ICE GATHERING COMPLETE"
                );

                return;
              }

              if (
                !callActiveRef.current
              ) {
                return;
              }

              const activeSocket =
                socketRef.current;

              if (
                !activeSocket ||
                !activeSocket.connected
              ) {
                console.warn(
                  "ICE GENERATED BUT SOCKET IS UNAVAILABLE"
                );

                return;
              }

              activeSocket.emit(
                "webrtc:ice-candidate",
                {
                  targetUserId:
                    remoteUserId,

                  candidate:
                    event.candidate,
                }
              );
            };

          /*
           * ------------------------------------------------
           * CONNECTION STATE
           * ------------------------------------------------
           */

          peer.onconnectionstatechange =
            () => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              const state =
                peer.connectionState;

              console.log(
                "WEBRTC CONNECTION STATE:",
                state
              );

              if (
                state === "connected"
              ) {
                setConnected(
                  true
                );

                setConnectionError(
                  null
                );

                return;
              }

              if (
                state === "connecting"
              ) {
                setConnected(
                  false
                );

                return;
              }

              if (
                state === "disconnected"
              ) {
                console.warn(
                  "WEBRTC TEMPORARILY DISCONNECTED"
                );

                setConnected(
                  false
                );

                return;
              }

              if (
                state === "failed"
              ) {
                console.error(
                  "WEBRTC CONNECTION FAILED"
                );

                setConnected(
                  false
                );

                setConnectionError(
                  "The call connection failed."
                );

                return;
              }

              if (
                state === "closed"
              ) {
                setConnected(
                  false
                );
              }
            };

          /*
           * ------------------------------------------------
           * ICE CONNECTION STATE
           * ------------------------------------------------
           */

          peer.oniceconnectionstatechange =
            () => {
              console.log(
                "WEBRTC ICE STATE:",
                peer.iceConnectionState
              );
            };

          /*
           * ------------------------------------------------
           * ICE ERROR
           * ------------------------------------------------
           */

          peer.onicecandidateerror =
            (event) => {
              console.warn(
                "ICE CANDIDATE ERROR:",
                event
              );
            };

          /*
           * ------------------------------------------------
           * SOCKET LISTENERS
           * ------------------------------------------------
           */

          registerSocketListeners();

          /*
           * ------------------------------------------------
           * CALLER → OFFER
           * ------------------------------------------------
           */

          if (caller) {
            console.log(
              "CREATING WEBRTC OFFER..."
            );

            const offer =
              await createOffer(
                peer
              );

            if (
              !mountedRef.current
            ) {
              return;
            }

            const activeSocket =
              socketRef.current;

            if (
              !activeSocket ||
              !activeSocket.connected
            ) {
              throw new Error(
                "Socket disconnected before the call offer could be sent."
              );
            }

            console.log(
              "SENDING WEBRTC OFFER TO:",
              remoteUserId
            );

            activeSocket.emit(
              "webrtc:offer",
              {
                targetUserId:
                  remoteUserId,

                offer,
              }
            );

            console.log(
              "WEBRTC OFFER SENT"
            );
          }

          if (
            mountedRef.current
          ) {
            setInitializing(
              false
            );
          }
        } catch (error) {
          console.error(
            "CALL INITIALIZATION ERROR:",
            error?.message ||
              error
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setInitializing(
            false
          );

          setConnectionError(
            error?.message ||
              "Unable to initialize the call."
          );
        } finally {
          initializingRef.current =
            false;
        }
      },
      [
        user?._id,
        user?.id,
        callId,
        remoteUserId,
        caller,
        isVideo,
        registerSocketListeners,
      ]
    );

  /*
   * --------------------------------------------------
   * START CALL
   * --------------------------------------------------
   */

  useEffect(() => {
    mountedRef.current =
      true;

    cleanedUpRef.current =
      false;

    remoteEndHandledRef.current =
      false;

    initializeCall();

    return () => {
      mountedRef.current =
        false;

      cleanupCall();
    };
  }, [
    initializeCall,
  ]);

  /*
   * --------------------------------------------------
   * MUTE
   * --------------------------------------------------
   */

  function toggleMute() {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const audioTracks =
      typeof stream.getAudioTracks ===
      "function"
        ? stream.getAudioTracks()
        : [];

    if (
      audioTracks.length === 0
    ) {
      return;
    }

    const newMuted =
      !muted;

    audioTracks.forEach(
      (track) => {
        track.enabled =
          !newMuted;
      }
    );

    setMuted(
      newMuted
    );
  }

  /*
   * --------------------------------------------------
   * VIDEO
   * --------------------------------------------------
   */

  function toggleVideo() {
    if (!isVideo) {
      return;
    }

    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const videoTracks =
      typeof stream.getVideoTracks ===
      "function"
        ? stream.getVideoTracks()
        : [];

    const newEnabled =
      !videoEnabled;

    videoTracks.forEach(
      (track) => {
        track.enabled =
          newEnabled;
      }
    );

    setVideoEnabled(
      newEnabled
    );
  }

  /*
   * --------------------------------------------------
   * SPEAKER
   * --------------------------------------------------
   */

  function toggleSpeaker() {
    setSpeaker(
      (value) => !value
    );
  }

  /*
   * --------------------------------------------------
   * CAMERA SWITCH
   * --------------------------------------------------
   */

  function switchCamera() {
    if (!isVideo) {
      return;
    }

    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const videoTracks =
      typeof stream.getVideoTracks ===
      "function"
        ? stream.getVideoTracks()
        : [];

    if (
      videoTracks.length === 0
    ) {
      return;
    }

    const track =
      videoTracks[0];

    /*
     * _switchCamera is provided by
     * react-native-webrtc on native platforms.
     */
    if (
      typeof track._switchCamera ===
      "function"
    ) {
      try {
        track._switchCamera();
      } catch (error) {
        console.warn(
          "SWITCH CAMERA ERROR:",
          error?.message ||
            error
        );
      }
    }
  }

  /*
   * --------------------------------------------------
   * END CALL
   * --------------------------------------------------
   */

  async function endCall() {
    if (
      remoteEndHandledRef.current
    ) {
      return;
    }

    remoteEndHandledRef.current =
      true;

    try {
      if (callId) {
        await updateCall(
          callId,
          "ended"
        );
      }
    } catch (error) {
      console.warn(
        "CALL DATABASE UPDATE ERROR:",
        error?.message ||
          error
      );
    }

    try {
      const socket =
        socketRef.current;

      if (
        socket &&
        socket.connected
      ) {
        socket.emit(
          "call:end",
          {
            callId,
            otherUserId:
              remoteUserId,
          }
        );
      }
    } catch (error) {
      console.warn(
        "CALL END SOCKET ERROR:",
        error?.message ||
          error
      );
    }

    cleanupCall();

    if (
      mountedRef.current
    ) {
      router.back();
    }
  }

  /*
   * --------------------------------------------------
   * CLEANUP
   * --------------------------------------------------
   */

  function cleanupCall() {
    if (
      cleanedUpRef.current
    ) {
      return;
    }

    cleanedUpRef.current =
      true;

    callActiveRef.current =
      false;

    remoteDescriptionSetRef.current =
      false;

    pendingIceCandidatesRef.current =
      [];

    /*
     * Remove only call-specific
     * Socket.IO listeners.
     *
     * DO NOT disconnect the global socket.
     */
    const socket =
      socketRef.current;

    if (socket) {
      try {
        socket.off(
          "webrtc:offer",
          handleOffer
        );
      } catch {}

      try {
        socket.off(
          "webrtc:answer",
          handleAnswer
        );
      } catch {}

      try {
        socket.off(
          "webrtc:ice-candidate",
          handleIceCandidate
        );
      } catch {}

      try {
        socket.off(
          "call:accepted",
          handleCallAccepted
        );
      } catch {}

      try {
        socket.off(
          "call:ended",
          handleRemoteEnd
        );
      } catch {}

      try {
        socket.off(
          "call:rejected",
          handleRemoteEnd
        );
      } catch {}

      try {
        socket.off(
          "call:missed",
          handleRemoteEnd
        );
      } catch {}
    }

    socketRef.current =
      null;

    /*
     * Close peer safely.
     */
    const peer =
      peerRef.current;

    peerRef.current =
      null;

    if (peer) {
      try {
        peer.ontrack =
          null;
      } catch {}

      try {
        peer.onicecandidate =
          null;
      } catch {}

      try {
        peer.onconnectionstatechange =
          null;
      } catch {}

      try {
        peer.oniceconnectionstatechange =
          null;
      } catch {}

      try {
        peer.onicecandidateerror =
          null;
      } catch {}

      try {
        if (
          typeof peer.close ===
          "function"
        ) {
          peer.close();
        }
      } catch (error) {
        console.warn(
          "PEER CLEANUP ERROR:",
          error?.message ||
            error
        );
      }
    }

    /*
     * Stop microphone/camera.
     */
    const stream =
      localStreamRef.current;

    localStreamRef.current =
      null;

    if (stream) {
      try {
        stopLocalStream(
          stream
        );
      } catch (error) {
        console.warn(
          "LOCAL STREAM CLEANUP ERROR:",
          error?.message ||
            error
        );
      }
    }

    remoteStreamRef.current =
      null;

    if (
      mountedRef.current
    ) {
      setLocalStream(
        null
      );

      setRemoteStream(
        null
      );

      setConnected(
        false
      );
    }
  }

  /*
   * --------------------------------------------------
   * AVATAR
   * --------------------------------------------------
   */

  function renderAvatar(
    size = 120
  ) {
    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius:
              size / 2,
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
                borderRadius:
                  size / 2,
              },
            ]}
          />
        ) : (
          <Text
            style={[
              styles.avatarInitials,
              {
                fontSize:
                  size * 0.32,
              },
            ]}
          >
            {getInitials()}
          </Text>
        )}
      </View>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR SCREEN
   * --------------------------------------------------
   */

  if (connectionError) {
    return (
      <View
        style={styles.errorScreen}
      >
        {renderAvatar(96)}

        <Text
          style={styles.errorTitle}
        >
          Call failed
        </Text>

        <Text
          style={styles.errorText}
        >
          {connectionError}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => {
            cleanupCall();
            router.back();
          }}
        >
          <Text
            style={styles.backButtonText}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * --------------------------------------------------
   * LOADING SCREEN
   * --------------------------------------------------
   */

  if (initializing) {
    return (
      <View
        style={styles.loadingScreen}
      >
        {renderAvatar(110)}

        <Text
          style={styles.username}
        >
          {displayName}
        </Text>

        <Text
          style={styles.status}
        >
          {caller
            ? "Calling..."
            : "Connecting..."}
        </Text>
      </View>
    );
  }

  /*
   * --------------------------------------------------
   * MAIN CALL UI
   * --------------------------------------------------
   */

  return (
    <View
      style={styles.container}
    >
      {isVideo ? (
        <View
          style={styles.videoContainer}
        >
          {remoteStream ? (
            <RemoteVideo
              stream={
                remoteStream
              }
            />
          ) : (
            <View
              style={
                styles.videoWaiting
              }
            >
              {renderAvatar(
                104
              )}

              <Text
                style={
                  styles.videoWaitingName
                }
              >
                {displayName}
              </Text>

              <Text
                style={
                  styles.videoWaitingStatus
                }
              >
                {connected
                  ? "Connecting..."
                  : caller
                  ? "Calling..."
                  : "Connecting..."}
              </Text>
            </View>
          )}

          {videoEnabled &&
            localStream && (
              <View
                style={
                  styles.localVideo
                }
              >
                <LocalVideo
                  stream={
                    localStream
                  }
                />
              </View>
            )}

          <View
            style={styles.videoHeader}
          >
            <Text
              style={
                styles.headerName
              }
            >
              {displayName}
            </Text>

            <Text
              style={
                styles.headerStatus
              }
            >
              {connected
                ? "Connected"
                : caller
                ? "Calling..."
                : "Connecting..."}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={styles.voiceScreen}
        >
          {renderAvatar(132)}

          <Text
            style={styles.username}
          >
            {displayName}
          </Text>

          <Text
            style={styles.status}
          >
            {connected
              ? "Connected"
              : caller
              ? "Calling..."
              : "Connecting..."}
          </Text>
        </View>
      )}

      <View
        style={styles.controls}
      >
        <CallControls
          muted={muted}
          speaker={speaker}
          videoEnabled={
            videoEnabled
          }
          videoCall={isVideo}
          onMute={
            toggleMute
          }
          onSpeaker={
            toggleSpeaker
          }
          onVideo={
            toggleVideo
          }
          onSwitchCamera={
            switchCamera
          }
          onEnd={endCall}
        />
      </View>
    </View>
  );
}

/*
 * ----------------------------------------------------
 * STYLES
 * ----------------------------------------------------
 */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#000",
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        "#000",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    voiceScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingBottom:
        100,
    },

    avatar: {
      backgroundColor:
        "#262626",
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
    },

    avatarImage: {
      resizeMode:
        "cover",
    },

    avatarInitials: {
      color: "#fff",
      fontWeight:
        "700",
    },

    username: {
      color: "#fff",
      fontSize: 22,
      fontWeight:
        "700",
      marginTop: 20,
    },

    status: {
      color: "#a8a8a8",
      fontSize: 14,
      marginTop: 8,
    },

    videoContainer: {
      flex: 1,
      backgroundColor:
        "#000",
    },

    videoWaiting: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111",
    },

    videoWaitingName: {
      color: "#fff",
      fontSize: 21,
      fontWeight:
        "700",
      marginTop: 18,
    },

    videoWaitingStatus: {
      color: "#aaa",
      fontSize: 14,
      marginTop: 7,
    },

    localVideo: {
      position:
        "absolute",
      top: 92,
      right: 14,
      width: 112,
      height: 158,
      borderRadius: 14,
      overflow:
        "hidden",
      backgroundColor:
        "#202020",
      zIndex: 10,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.15)",
    },

    videoHeader: {
      position:
        "absolute",
      top: 52,
      left: 0,
      right: 0,
      alignItems:
        "center",
      zIndex: 20,
    },

    headerName: {
      color: "#fff",
      fontSize: 16,
      fontWeight:
        "700",
    },

    headerStatus: {
      color: "#ccc",
      fontSize: 12,
      marginTop: 4,
    },

    controls: {
      position:
        "absolute",
      bottom: 32,
      left: 0,
      right: 0,
      zIndex: 30,
      alignItems:
        "center",
    },

    errorScreen: {
      flex: 1,
      backgroundColor:
        "#000",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal:
        32,
    },

    errorTitle: {
      color: "#fff",
      fontSize: 22,
      fontWeight:
        "700",
      marginTop: 22,
    },

    errorText: {
      color: "#a8a8a8",
      fontSize: 14,
      textAlign:
        "center",
      lineHeight: 21,
      marginTop: 10,
    },

    backButton: {
      marginTop: 26,
      minWidth: 130,
      height: 44,
      borderRadius: 10,
      backgroundColor:
        "#fff",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal:
        22,
    },

    backButtonText: {
      color: "#000",
      fontSize: 14,
      fontWeight:
        "700",
    },
  });