import {
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";

import { getTurnCredentials } from "./callService";

/**
 * Default public STUN servers.
 */
const DEFAULT_STUN_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
];

/**
 * Group-call peer connections.
 */
const groupPeers = new Map();

/**
 * Prevent malformed TURN responses from breaking
 * RTCPeerConnection configuration.
 */
function normalizeIceServers(turnServers) {
  const servers = [];

  for (const server of turnServers || []) {
    if (!server) continue;

    if (typeof server === "string") {
      servers.push({
        urls: server,
      });

      continue;
    }

    if (
      typeof server === "object" &&
      server.urls
    ) {
      servers.push(server);
    }
  }

  return servers;
}

/**
 * Get WebRTC ICE configuration.
 */
export async function getWebRTCConfiguration() {
  try {
    const turnServers =
      await getTurnCredentials();

    const validTurnServers =
      normalizeIceServers(turnServers);

    const iceServers = [
      ...DEFAULT_STUN_SERVERS,
      ...validTurnServers,
    ];

    console.log(
      "WEBRTC ICE SERVERS:",
      iceServers.length
    );

    return {
      iceServers,
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
    };
  }
}

/**
 * Create a WebRTC peer connection.
 */
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

/**
 * Create/reuse a group-call peer.
 */
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

/**
 * Request microphone/camera access.
 */
export async function getLocalStream(
  video = false
) {
  if (
    !mediaDevices ||
    typeof mediaDevices.getUserMedia !==
      "function"
  ) {
    throw new Error(
      "react-native-webrtc mediaDevices.getUserMedia is unavailable."
    );
  }

  console.log(
    "REQUESTING LOCAL MEDIA:",
    {
      audio: true,
      video: Boolean(video),
    }
  );

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

  console.log(
    "LOCAL MEDIA STREAM CREATED"
  );

  return stream;
}

/**
 * Create an SDP offer.
 */
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

/**
 * Create an SDP answer.
 */
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

/**
 * Set remote SDP description.
 *
 * react-native-webrtc accepts RTCSessionDescriptionInit,
 * so the plain { type, sdp } object can be passed directly.
 */
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

  await peer.setRemoteDescription(
    description
  );
}

/**
 * Add a remote ICE candidate.
 */
export async function addIceCandidate(
  peer,
  candidate
) {
  if (!peer) {
    return;
  }

  if (!candidate) {
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

/**
 * Safely stop every track in a media stream.
 */
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
      try {
        if (
          track &&
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

/**
 * Stop media stream.
 *
 * Kept as a separate exported helper because
 * existing screens may import this name.
 */
export function stopMediaStream(
  stream
) {
  stopLocalStream(stream);
}

/**
 * Safely detach WebRTC event handlers.
 *
 * IMPORTANT:
 * Do not call arbitrary WebRTC methods during cleanup.
 * Some react-native-webrtc versions expose slightly
 * different native implementations.
 */
function detachPeerHandlers(peer) {
  if (!peer) {
    return;
  }

  try {
    peer.ontrack = null;
  } catch {}

  try {
    peer.onicecandidate = null;
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
    peer.onsignalingstatechange =
      null;
  } catch {}

  try {
    peer.onicegatheringstatechange =
      null;
  } catch {}

  try {
    peer.ondatachannel = null;
  } catch {}

  try {
    peer.onnegotiationneeded = null;
  } catch {}
}

/**
 * Safely close a peer connection.
 */
export function closePeerConnection(
  peer
) {
  if (!peer) {
    return;
  }

  try {
    detachPeerHandlers(peer);
  } catch (error) {
    console.warn(
      "PEER HANDLER CLEANUP ERROR:",
      error?.message || error
    );
  }

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

/**
 * Remove one group peer.
 */
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

/**
 * Close all group peers.
 */
export function closeGroupPeers() {
  for (const peer of groupPeers.values()) {
    closePeerConnection(peer);
  }

  groupPeers.clear();
}

/**
 * Optional helper for debugging.
 */
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

/**
 * Optional helper for debugging.
 */
export function getGroupPeerCount() {
  return groupPeers.size;
}