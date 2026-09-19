import {
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";

import InCallManager from "react-native-incall-manager";

import { getTurnCredentials } from "./callService";

const DEFAULT_STUN_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
];

const groupPeers = new Map();

let inCallActive = false;
let currentCallMedia = "audio";
let currentSpeakerEnabled = false;

function normalizeIceServers(servers) {
  if (!Array.isArray(servers)) {
    return [];
  }

  return servers
    .filter(Boolean)
    .map((server) => {
      if (typeof server === "string") {
        return {
          urls: server,
        };
      }

      if (
        typeof server === "object" &&
        server.urls
      ) {
        return {
          urls: server.urls,

          ...(server.username
            ? {
                username: server.username,
              }
            : {}),

          ...(server.credential
            ? {
                credential: server.credential,
              }
            : {}),
        };
      }

      return null;
    })
    .filter(Boolean);
}

export async function getWebRTCConfiguration() {
  try {
    const turnServers =
      await getTurnCredentials();

    const normalizedTurnServers =
      normalizeIceServers(turnServers);

    return {
      iceServers: [
        ...DEFAULT_STUN_SERVERS,
        ...normalizedTurnServers,
      ],

      iceCandidatePoolSize: 10,
    };
  } catch (error) {
    console.warn(
      "[WEBRTC] TURN unavailable; using STUN only.",
      error?.message || error
    );

    return {
      iceServers: [
        ...DEFAULT_STUN_SERVERS,
      ],

      iceCandidatePoolSize: 10,
    };
  }
}

export async function createPeerConnection() {
  const configuration =
    await getWebRTCConfiguration();

  const peer =
    new RTCPeerConnection(configuration);

  if (!peer) {
    throw new Error(
      "Unable to create peer connection."
    );
  }

  return peer;
}

export function startAudioRouting({
  video = false,
  speaker = false,
} = {}) {
  try {
    currentCallMedia =
      video ? "video" : "audio";

    currentSpeakerEnabled = Boolean(
      speaker || video
    );

    InCallManager.start({
      media: currentCallMedia,
      auto: true,
    });

    if (currentSpeakerEnabled) {
      InCallManager.setForceSpeakerphoneOn(
        true
      );
    } else {
      InCallManager.setForceSpeakerphoneOn(
        false
      );
    }

    inCallActive = true;

    return true;
  } catch (error) {
    console.warn(
      "[AUDIO] Failed to start audio routing:",
      error?.message || error
    );

    return false;
  }
}

export function stopAudioRouting() {
  if (!inCallActive) {
    return;
  }

  try {
    InCallManager.stop();
  } catch (error) {
    console.warn(
      "[AUDIO] Failed to stop audio routing:",
      error?.message || error
    );
  }

  inCallActive = false;
  currentSpeakerEnabled = false;
  currentCallMedia = "audio";
}

export function setSpeakerEnabled(
  enabled
) {
  const nextEnabled = Boolean(enabled);

  currentSpeakerEnabled =
    nextEnabled;

  if (!inCallActive) {
    return false;
  }

  try {

    InCallManager.setForceSpeakerphoneOn(
      nextEnabled
    );

    return true;
  } catch (error) {
    console.warn(
      "[AUDIO] Speaker routing failed:",
      error?.message || error
    );

    return false;
  }
}

export function isSpeakerEnabled() {
  return currentSpeakerEnabled;
}

export function enableSpeaker() {
  return setSpeakerEnabled(true);
}

export function disableSpeaker() {
  return setSpeakerEnabled(false);
}

export function startVoiceAudio({
  speaker = false,
} = {}) {
  return startAudioRouting({
    video: false,
    speaker,
  });
}

export function startVideoAudio() {
  return startAudioRouting({
    video: true,
    speaker: true,
  });
}

export async function getLocalStream(
  video = false
) {
  if (
    !mediaDevices ||
    typeof mediaDevices.getUserMedia !==
      "function"
  ) {
    throw new Error(
      "Camera and microphone access is unavailable."
    );
  }

  try {
    const stream =
      await mediaDevices.getUserMedia({
        audio: true,
        video: Boolean(video),
      });

    if (!stream) {
      throw new Error(
        "Unable to create local media stream."
      );
    }

    return stream;
  } catch (error) {
    const message =
      error?.message || "";

    if (
      message
        .toLowerCase()
        .includes("permission")
    ) {
      throw new Error(
        "Snapgram needs permission to use your microphone and camera."
      );
    }

    throw error;
  }
}

export function addLocalTracks(
  peer,
  stream
) {
  if (!peer) {
    throw new Error(
      "Peer connection is required."
    );
  }

  if (!stream) {
    throw new Error(
      "Local stream is required."
    );
  }

  const tracks =
    typeof stream.getTracks ===
    "function"
      ? stream.getTracks()
      : [];

  for (const track of tracks) {
    if (!track) {
      continue;
    }

    try {
      peer.addTrack(
        track,
        stream
      );
    } catch (error) {
      console.warn(
        "[WEBRTC] Failed to add local track:",
        error?.message || error
      );
    }
  }

  return tracks;
}

export async function createOffer(
  peer
) {
  if (!peer) {
    throw new Error(
      "Peer connection is required."
    );
  }

  const offer =
    await peer.createOffer();

  await peer.setLocalDescription(
    offer
  );

  return offer;
}

export async function createAnswer(
  peer
) {
  if (!peer) {
    throw new Error(
      "Peer connection is required."
    );
  }

  const answer =
    await peer.createAnswer();

  await peer.setLocalDescription(
    answer
  );

  return answer;
}

export async function setRemoteDescription(
  peer,
  description
) {
  if (!peer) {
    throw new Error(
      "Peer connection is required."
    );
  }

  if (!description) {
    throw new Error(
      "Remote description is required."
    );
  }

  await peer.setRemoteDescription(
    description
  );
}

export async function addIceCandidate(
  peer,
  candidate
) {
  if (!peer || !candidate) {
    return false;
  }

  try {
    await peer.addIceCandidate(
      candidate
    );

    return true;
  } catch (error) {
    console.warn(
      "[WEBRTC] Failed to add ICE candidate:",
      error?.message || error
    );

    return false;
  }
}

export function setMicrophoneEnabled(
  stream,
  enabled
) {
  if (!stream) {
    return false;
  }

  const tracks =
    typeof stream.getAudioTracks ===
    "function"
      ? stream.getAudioTracks()
      : [];

  if (!tracks.length) {
    return false;
  }

  tracks.forEach((track) => {
    track.enabled =
      Boolean(enabled);
  });

  try {
    InCallManager.setMicrophoneMute(
      !Boolean(enabled)
    );
  } catch (error) {
    console.warn(
      "[AUDIO] Native microphone mute failed:",
      error?.message || error
    );
  }

  return true;
}

export function setCameraEnabled(
  stream,
  enabled
) {
  if (!stream) {
    return false;
  }

  const tracks =
    typeof stream.getVideoTracks ===
    "function"
      ? stream.getVideoTracks()
      : [];

  if (!tracks.length) {
    return false;
  }

  tracks.forEach((track) => {
    track.enabled =
      Boolean(enabled);
  });

  return true;
}

export function switchCamera(
  stream
) {
  if (!stream) {
    return false;
  }

  const tracks =
    typeof stream.getVideoTracks ===
    "function"
      ? stream.getVideoTracks()
      : [];

  const videoTrack = tracks[0];

  if (!videoTrack) {
    return false;
  }

  try {
    if (
      typeof videoTrack._switchCamera ===
      "function"
    ) {
      videoTrack._switchCamera();

      return true;
    }
  } catch (error) {
    console.warn(
      "[WEBRTC] Camera switch failed:",
      error?.message || error
    );
  }

  return false;
}

export function stopLocalStream(
  stream
) {
  if (!stream) {
    return;
  }

  const tracks =
    typeof stream.getTracks ===
    "function"
      ? stream.getTracks()
      : [];

  for (const track of tracks) {
    try {
      track?.stop?.();
    } catch {}
  }
}

export function stopMediaStream(
  stream
) {
  stopLocalStream(stream);
}

export function closePeerConnection(
  peer
) {
  if (!peer) {
    return;
  }

  try {
    peer.ontrack = null;
    peer.onicecandidate = null;
    peer.onconnectionstatechange = null;
    peer.oniceconnectionstatechange = null;
    peer.onsignalingstatechange = null;
    peer.onicegatheringstatechange = null;
    peer.onnegotiationneeded = null;
    peer.ondatachannel = null;
    peer.onicecandidateerror = null;
  } catch {}

  try {
    peer
      .getSenders?.()
      ?.forEach((sender) => {
        try {
          sender?.track?.stop?.();
        } catch {}
      });
  } catch {}

  try {
    peer.close?.();
  } catch {}
}

export function cleanupCallMedia(
  stream,
  peer
) {
  try {
    stopLocalStream(stream);
  } catch {}

  try {
    closePeerConnection(peer);
  } catch {}

  stopAudioRouting();
}

export async function createGroupPeer(
  callId,
  userId
) {
  if (!callId || !userId) {
    throw new Error(
      "Call ID and user ID are required."
    );
  }

  const key =
    `${String(callId)}:${String(userId)}`;

  const existing =
    groupPeers.get(key);

  if (existing) {
    return existing;
  }

  const peer =
    await createPeerConnection();

  groupPeers.set(
    key,
    peer
  );

  return peer;
}

export function getGroupPeer(
  callId,
  userId
) {
  if (!callId || !userId) {
    return null;
  }

  const key =
    `${String(callId)}:${String(userId)}`;

  return (
    groupPeers.get(key) ||
    null
  );
}

export function removeGroupPeer(
  callId,
  userId
) {
  if (!callId || !userId) {
    return;
  }

  const key =
    `${String(callId)}:${String(userId)}`;

  const peer =
    groupPeers.get(key);

  if (!peer) {
    return;
  }

  closePeerConnection(peer);

  groupPeers.delete(key);
}

export function closeGroupPeers() {
  for (const peer of groupPeers.values()) {
    closePeerConnection(peer);
  }

  groupPeers.clear();
}

export function getGroupPeerCount() {
  return groupPeers.size;
}