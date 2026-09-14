import {
  getTurnCredentials,
} from "./callService";

const DEFAULT_STUN_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
];

const groupPeers = new Map();

function getRTCPeerConnection() {
  if (
    typeof window === "undefined" ||
    typeof window.RTCPeerConnection !== "function"
  ) {
    throw new Error(
      "WebRTC is not supported by this browser."
    );
  }

  return window.RTCPeerConnection;
}

function getMediaDevices() {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !==
      "function"
  ) {
    throw new Error(
      "Camera and microphone access is unavailable in this browser."
    );
  }

  return navigator.mediaDevices;
}

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

    return {
      iceServers: [
        ...DEFAULT_STUN_SERVERS,
        ...normalizedTurnServers,
      ],
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
  const RTCPeerConnectionClass =
    getRTCPeerConnection();

  const configuration =
    await getWebRTCConfiguration();

  console.log(
    "CREATING WEB RTCPeerConnection..."
  );

  const peer =
    new RTCPeerConnectionClass(
      configuration
    );

  if (!peer) {
    throw new Error(
      "Failed to create RTCPeerConnection."
    );
  }

  console.log(
    "WEB RTCPeerConnection CREATED"
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

  const RTCPeerConnectionClass =
    getRTCPeerConnection();

  const configuration =
    await getWebRTCConfiguration();

  const peer =
    new RTCPeerConnectionClass(
      configuration
    );

  groupPeers.set(
    key,
    peer
  );

  return peer;
}

export async function getLocalStream(
  video = false
) {
  const mediaDevices =
    getMediaDevices();

  const constraints = {
    audio: true,
    video: Boolean(video),
  };

  console.log(
    "REQUESTING WEB LOCAL MEDIA:",
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
      "WEB LOCAL MEDIA STREAM CREATED"
    );

    return stream;
  } catch (error) {
    console.error(
      "WEB GET LOCAL MEDIA ERROR:",
      error
    );

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
      "Local media stream is required."
    );
  }

  if (
    typeof peer.addTrack !== "function"
  ) {
    throw new Error(
      "WebRTC addTrack is unavailable."
    );
  }

  const tracks =
    typeof stream.getTracks === "function"
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

  if (!offer) {
    throw new Error(
      "RTCPeerConnection returned an empty offer."
    );
  }

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

  if (!answer) {
    throw new Error(
      "RTCPeerConnection returned an empty answer."
    );
  }

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
    return;
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
      typeof stream.getTracks === "function"
        ? stream.getTracks()
        : [];

    tracks.forEach((track) => {
      try {
        if (
          track &&
          typeof track.stop === "function"
        ) {
          track.stop();
        }
      } catch (error) {
        console.warn(
          "WEB TRACK STOP ERROR:",
          error?.message || error
        );
      }
    });
  } catch (error) {
    console.warn(
      "WEB STREAM CLEANUP ERROR:",
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

  tracks.forEach((track) => {
    track.enabled = Boolean(enabled);
  });

  return tracks.length > 0;
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

  tracks.forEach((track) => {
    track.enabled = Boolean(enabled);
  });

  return tracks.length > 0;
}

export function switchCamera() {
  console.warn(
    "Camera switching is handled by browser device selection on web."
  );

  return false;
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

  handlers.forEach((handler) => {
    try {
      peer[handler] = null;
    } catch {}
  });
}

export function closePeerConnection(
  peer
) {
  if (!peer) {
    return;
  }

  try {
    detachPeerHandlers(peer);
  } catch {}

  try {
    if (
      typeof peer.getSenders === "function"
    ) {
      peer
        .getSenders()
        .forEach((sender) => {
          try {
            sender?.track?.stop?.();
          } catch {}
        });
    }
  } catch {}

  try {
    peer.close();
  } catch (error) {
    console.warn(
      "WEB PEER CLOSE ERROR:",
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