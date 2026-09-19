import api from "./api";

const VALID_CALL_TYPES = new Set([
"voice",
"video",
]);

function normalizeCallType(type) {
const normalized = String(type || "")
.trim()
.toLowerCase();

if (!VALID_CALL_TYPES.has(normalized)) {
throw new Error(
"Call type must be voice or video."
);
}

return normalized;
}

function normalizeId(value, label) {
const id = String(value || "").trim();

if (!id) {
throw new Error(`${label} is required.`);
}

return id;
}

function extractCall(response) {
return (
response?.data?.call ||
response?.data ||
null
);
}

export async function startCall({
receiverId,
type,
}) {
const normalizedReceiverId =
normalizeId(
receiverId,
"Receiver ID"
);

const normalizedType =
normalizeCallType(type);

const response =
await api.post("/calls", {
receiverId:
normalizedReceiverId,
type: normalizedType,
});

const call =
extractCall(response);

if (!call) {
throw new Error(
"The call could not be started."
);
}

return call;
}

export async function getCall(
callId
) {
const normalizedCallId =
normalizeId(
callId,
"Call ID"
);

const response =
await api.get(
`/calls/${encodeURIComponent(
        normalizedCallId
      )}`
);

const call =
extractCall(response);

if (!call) {
throw new Error(
"Call information was not returned."
);
}

return call;
}

export async function getCallHistory() {
const response =
await api.get(
"/calls/history"
);

return Array.isArray(
response?.data?.calls
)
? response.data.calls
: [];
}

export async function getTurnCredentials() {
const response =
await api.get(
"/calls/turn-credentials"
);

const iceServers =
response?.data?.iceServers;

return Array.isArray(iceServers)
? iceServers
: [];
}

export async function createGroupCall({
participantIds,
type,
}) {
if (
!Array.isArray(
participantIds
)
) {
throw new Error(
"Participant IDs must be an array."
);
}

const uniqueParticipantIds = [
...new Set(
participantIds
.map((id) =>
String(id || "").trim()
)
.filter(Boolean)
),
];

if (
uniqueParticipantIds.length === 0
) {
throw new Error(
"At least one participant is required."
);
}

const normalizedType =
normalizeCallType(type);

const response =
await api.post(
"/calls/group",
{
participantIds:
uniqueParticipantIds,
type: normalizedType,
}
);

const call =
extractCall(response);

if (!call) {
throw new Error(
"The group call could not be created."
);
}

return call;
}

export function isValidCallType(
type
) {
const normalized = String(
type || ""
)
.trim()
.toLowerCase();

return VALID_CALL_TYPES.has(
normalized
);
}

export function normalizeCallTypeForDisplay(
type
) {
return isValidCallType(type)
? String(type)
.trim()
.toLowerCase()
: "voice";
}