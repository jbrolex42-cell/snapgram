import {
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";

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

function normalizeIceServers(turnServers) {
  if (!Array.isArray(turnServers)) {
    return [];
  }

  return turnServers
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
        return server;
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

    const iceServers = [
      ...DEFAULT_STUN_SERVERS,
      ...normalizedTurnServers,
    ];

    console.log(
      "WEBRTC ICE SERVERS:",
      iceServers.length
    );

    return {
      iceServers,

      iceCandidatePoolSize: 10,
    };
  } catch (error) {
    console.warn(
      "TURN CREDENTIALS FAILED — USING STUN:",
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

  console.log(
    "CREATING RTCPeerConnection..."
  );

  const peer =
    new RTCPeerConnection(
      configuration
    );

  if (!peer) {
    throw new Error(
      "Failed to create RTCPeerConnection."
    );
  }

  console.log(
    "RTCPeerConnection CREATED"
  );

  return peer;
}

export async function createGroupPeer(
  userId
) {
  if (!userId) {
    throw new Error(
      "Group peer user ID is required."
    );
  }

  const key = String(userId);

  const existing =
    groupPeers.get(key);

  if (existing) {
    return existing;
  }

  const configuration =
    await getWebRTCConfiguration();

  const peer =
    new RTCPeerConnection(
      configuration
    );

  if (!peer) {
    throw new Error(
      "Failed to create group RTCPeerConnection."
    );
  }

  groupPeers.set(
    key,
    peer
  );

  return peer;
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
      "Camera and microphone access is unavailable on this device."
    );
  }

  const constraints = {
    audio: true,
    video: Boolean(video),
  };

  console.log(
    "REQUESTING LOCAL MEDIA:",
    constraints
  );

  try {
    const stream =
      await mediaDevices.getUserMedia(
        constraints
      );

    if (!stream) {
      throw new Error(
        "Unable to create local media stream."
      );
    }

    console.log(
      "LOCAL MEDIA STREAM CREATED"
    );

    return stream;
  } catch (error) {
    console.error(
      "GET LOCAL MEDIA ERROR:",
      error
    );

    const message =
      error?.message ||
      "";

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
      "Local media stream is required."
    );
  }

  if (
    typeof peer.addTrack !==
    "function"
  ) {
    throw new Error(
      "WebRTC addTrack is unavailable."
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
        "ADD LOCAL TRACK ERROR:",
        error?.message || error
      );
    }
  }

  console.log(
    "LOCAL TRACKS ADDED:",
    tracks.length
  );

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

  if (
    typeof peer.createOffer !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.createOffer is unavailable."
    );
  }

  if (
    typeof peer.setLocalDescription !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.setLocalDescription is unavailable."
    );
  }

  console.log(
    "CREATING WEBRTC OFFER..."
  );

  const offer =
    await peer.createOffer();

  if (!offer) {
    throw new Error(
      "RTCPeerConnection returned an empty offer."
    );
  }

  await peer.setLocalDescription(
    offer
  );

  console.log(
    "LOCAL OFFER SET"
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

  if (
    typeof peer.createAnswer !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.createAnswer is unavailable."
    );
  }

  if (
    typeof peer.setLocalDescription !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.setLocalDescription is unavailable."
    );
  }

  console.log(
    "CREATING WEBRTC ANSWER..."
  );

  const answer =
    await peer.createAnswer();

  if (!answer) {
    throw new Error(
      "RTCPeerConnection returned an empty answer."
    );
  }

  await peer.setLocalDescription(
    answer
  );

  console.log(
    "LOCAL ANSWER SET"
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

  if (
    typeof peer.setRemoteDescription !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.setRemoteDescription is unavailable."
    );
  }

  console.log(
    "SETTING REMOTE DESCRIPTION:",
    description?.type
  );

  await peer.setRemoteDescription(
    description
  );

  console.log(
    "REMOTE DESCRIPTION SET"
  );
}

export async function addIceCandidate(
  peer,
  candidate
) {
  if (!peer || !candidate) {
    return;
  }

  if (
    typeof peer.addIceCandidate !==
    "function"
  ) {
    throw new Error(
      "RTCPeerConnection.addIceCandidate is unavailable."
    );
  }

  await peer.addIceCandidate(
    candidate
  );
}

export function stopLocalStream(
  stream
) {
  if (!stream) {
    return;
  }

  try {
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
        if (
          typeof track.stop ===
          "function"
        ) {
          track.stop();
        }
      } catch (error) {
        console.warn(
          "LOCAL TRACK STOP ERROR:",
          error?.message || error
        );
      }
    }
  } catch (error) {
    console.warn(
      "LOCAL STREAM CLEANUP ERROR:",
      error?.message || error
    );
  }
}

export function stopMediaStream(
  stream
) {
  stopLocalStream(stream);
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
    track.enabled = Boolean(
      enabled
    );
  });

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
    track.enabled = Boolean(
      enabled
    );
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

  const videoTrack =
    tracks[0];

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

    console.warn(
      "Camera switching is not supported by this WebRTC implementation."
    );

    return false;
  } catch (error) {
    console.warn(
      "SWITCH CAMERA ERROR:",
      error?.message || error
    );

    return false;
  }
}

function detachPeerHandlers(
  peer
) {
  if (!peer) {
    return;
  }

  const handlers = [
    "ontrack",
    "onicecandidate",
    "onconnectionstatechange",
    "oniceconnectionstatechange",
    "onsignalingstatechange",
    "onicegatheringstatechange",
    "ondatachannel",
    "onnegotiationneeded",
    "onicecandidateerror",
  ];

  handlers.forEach(
    (handler) => {
      try {
        peer[handler] = null;
      } catch {}
    }
  );
}

export function closePeerConnection(
  peer
) {
  if (!peer) {
    return;
  }

  try {
    detachPeerHandlers(
      peer
    );
  } catch (error) {
    console.warn(
      "PEER HANDLER CLEANUP ERROR:",
      error?.message || error
    );
  }

  try {
    if (
      typeof peer.getSenders ===
      "function"
    ) {
      const senders =
        peer.getSenders();

      senders.forEach(
        (sender) => {
          try {
            if (
              sender?.track &&
              typeof sender.track.stop ===
                "function"
            ) {
              sender.track.stop();
            }
          } catch {}
        }
      );
    }
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
      "PEER CLOSE ERROR:",
      error?.message || error
    );
  }
}

export function removeGroupPeer(
  userId
) {
  if (!userId) {
    return;
  }

  const key = String(userId);

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

export function getGroupPeer(
  userId
) {
  if (!userId) {
    return null;
  }

  return (
    groupPeers.get(
      String(userId)
    ) || null
  );
}

export function getGroupPeerCount() {
  return groupPeers.size;
}