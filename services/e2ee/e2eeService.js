import {
  IdentityKeyPair,
  ProtocolAddress,
  SessionBuilder,
  SessionCipher,
} from "expo-libsignal";

import api from "../api";

import {
  getE2EEStore,
} from "./e2eeStore";

import {
  E2EE_VERSION,
  DEFAULT_DEVICE_ID,
  PREKEY_BATCH_SIZE,
  PREKEY_REPLENISH_THRESHOLD,
  ENVELOPE_TYPES,
} from "./e2eeTypes";

import {
  bytesToBase64,
  base64ToBytes,
  encodeText,
  decodeText,
  normalizeUserId,
  normalizeDeviceId,
} from "./e2eeUtils";

let initialized = false;

let localIdentity = null;

async function getStore() {
  return getE2EEStore();
}

async function createRegistrationId() {

  return (
    Math.floor(
      Math.random() * 16383
    ) + 1
  );
}

export async function initializeDevice() {
  if (initialized) {
    return localIdentity;
  }

  const store = await getStore();

  if (
    await store.hasLocalIdentity()
  ) {
    localIdentity = {
      initialized: true,
    };

    initialized = true;

    return localIdentity;
  }

  const identityKeyPair =
    await IdentityKeyPair.generate();

  const registrationId =
    await createRegistrationId();

  await store.initializeLocalIdentity(
    identityKeyPair,
    registrationId
  );

  localIdentity = {
    initialized: true,
    registrationId,
    deviceId: DEFAULT_DEVICE_ID,
  };

  initialized = true;

  return localIdentity;
}

export async function publishPreKeys() {
  await initializeDevice();

  const store = await getStore();

  const registrationId =
    await store.getLocalRegistrationId();

  const identity =
    await store.getLocalIdentityKeyPair();

  const signedPreKey =
    await store.generateAndStoreSignedPreKey();

  const preKeys =
    await store.generateAndStorePreKeys(
      PREKEY_BATCH_SIZE
    );

  await api.post(
    "/devices",
    {
      deviceId: DEFAULT_DEVICE_ID,

      registrationId,

      identityKey: bytesToBase64(
        identity.publicKey().serialize()
      ),

      signedPreKey: {
        keyId:
          signedPreKey.id,

        publicKey:
          bytesToBase64(
            signedPreKey.publicKey
          ),

        signature:
          bytesToBase64(
            signedPreKey.signature
          ),
      },

      preKeys:
        preKeys.map((key) => ({
          keyId: key.id,
          publicKey:
            bytesToBase64(
              key.publicKey
            ),
        })),
    }
  );

  return true;
}

export async function fetchPreKeyBundle(
  userId,
  deviceId = DEFAULT_DEVICE_ID
) {
  const response =
    await api.get(
      `/devices/user/${encodeURIComponent(
        userId
      )}/bundle`,
      {
        params: {
          deviceId,
        },
      }
    );

  return response.data?.bundle;
}

export async function establishSession({
  userId,
  deviceId = DEFAULT_DEVICE_ID,
}) {
  await initializeDevice();

  const normalizedUserId =
    normalizeUserId(userId);

  const normalizedDeviceId =
    normalizeDeviceId(deviceId);

  if (!normalizedUserId) {
    throw new Error(
      "Recipient user id is required"
    );
  }

  const bundle =
    await fetchPreKeyBundle(
      normalizedUserId,
      normalizedDeviceId
    );

  if (!bundle) {
    throw new Error(
      "Recipient encryption bundle not found"
    );
  }

  const store =
    await getStore();

  const remoteAddress =
    await ProtocolAddress.create(
      normalizedUserId,
      normalizedDeviceId
    );

  const localAddress =
    await ProtocolAddress.create(
      "local",
      DEFAULT_DEVICE_ID
    );

  const builder =
    new SessionBuilder(
      {
        sessionStore:
          store,

        identityStore:
          store,
      },
      remoteAddress,
      localAddress
    );

  const preKeyBundle = {
    registrationId:
      bundle.registrationId,

    deviceId:
      bundle.deviceId,

    identityKey:
      base64ToBytes(
        bundle.identityKey
      ),

    signedPreKey: {
      keyId:
        bundle.signedPreKey.keyId,

      publicKey:
        base64ToBytes(
          bundle.signedPreKey.publicKey
        ),

      signature:
        base64ToBytes(
          bundle.signedPreKey.signature
        ),
    },

    preKey: bundle.preKey
      ? {
          keyId:
            bundle.preKey.keyId,

          publicKey:
            base64ToBytes(
              bundle.preKey.publicKey
            ),
        }
      : null,
  };

  await builder.processPreKeyBundle(
    preKeyBundle
  );

  return {
    userId: normalizedUserId,
    deviceId: normalizedDeviceId,
  };
}

export async function encryptMessage({
  recipientUserId,
  recipientDeviceId = DEFAULT_DEVICE_ID,
  text,
}) {
  if (
    text === null ||
    text === undefined
  ) {
    throw new Error(
      "Message text is required"
    );
  }

  await initializeDevice();

  const userId =
    normalizeUserId(
      recipientUserId
    );

  const deviceId =
    normalizeDeviceId(
      recipientDeviceId
    );

  const store =
    await getStore();

  const remoteAddress =
    await ProtocolAddress.create(
      userId,
      deviceId
    );

  const localAddress =
    await ProtocolAddress.create(
      "local",
      DEFAULT_DEVICE_ID
    );

  const cipher =
    new SessionCipher(
      {
        sessionStore:
          store,

        identityStore:
          store,

        preKeyStore:
          store,

        signedPreKeyStore:
          store,

        kyberPreKeyStore:
          store,
      },
      remoteAddress,
      localAddress
    );

  const plaintext =
    encodeText(text);

  const result =
    await store.runExclusive(
      () =>
        cipher.encrypt(
          plaintext
        )
    );

  return {
    ciphertext:
      bytesToBase64(
        result.bytes
      ),

    envelopeType:
      result.type ===
      "preKeySignal"
        ? ENVELOPE_TYPES.PREKEY
        : ENVELOPE_TYPES.SIGNAL,

    encryptionVersion:
      E2EE_VERSION,

    senderDeviceId:
      DEFAULT_DEVICE_ID,
  };
}

export async function decryptMessage({
  senderUserId,
  senderDeviceId = DEFAULT_DEVICE_ID,
  ciphertext,
  envelopeType,
}) {
  await initializeDevice();

  const userId =
    normalizeUserId(
      senderUserId
    );

  const deviceId =
    normalizeDeviceId(
      senderDeviceId
    );

  const store =
    await getStore();

  const remoteAddress =
    await ProtocolAddress.create(
      userId,
      deviceId
    );

  const localAddress =
    await ProtocolAddress.create(
      "local",
      DEFAULT_DEVICE_ID
    );

  const cipher =
    new SessionCipher(
      {
        sessionStore:
          store,

        identityStore:
          store,

        preKeyStore:
          store,

        signedPreKeyStore:
          store,

        kyberPreKeyStore:
          store,
      },
      remoteAddress,
      localAddress
    );

  const bytes =
    base64ToBytes(
      ciphertext
    );

  let plaintext;

  await store.runExclusive(
    async () => {
      if (
        envelopeType ===
        ENVELOPE_TYPES.PREKEY
      ) {
        plaintext =
          await cipher.decryptPreKeySignal(
            bytes
          );
      } else {
        plaintext =
          await cipher.decryptSignal(
            bytes
          );
      }
    }
  );

  return {
    text:
      decodeText(plaintext),
  };
}

export async function hasSession({
  userId,
  deviceId = DEFAULT_DEVICE_ID,
}) {
  await initializeDevice();

  const store =
    await getStore();

  const address =
    await ProtocolAddress.create(
      normalizeUserId(userId),
      normalizeDeviceId(deviceId)
    );

  return store.containsSession(
    address
  );
}

export async function rotateKeys() {
  await initializeDevice();

  const store =
    await getStore();

  const count =
    await store.countAvailablePreKeys();

  if (
    count >
    PREKEY_REPLENISH_THRESHOLD
  ) {
    return {
      rotated: false,
      count,
    };
  }

  const preKeys =
    await store.generateAndStorePreKeys(
      PREKEY_BATCH_SIZE
    );

  if (!preKeys?.length) {
    return {
      rotated: false,
      count,
    };
  }

  await api.post(
    "/devices/prekeys",
    {
      deviceId:
        DEFAULT_DEVICE_ID,

      preKeys:
        preKeys.map((key) => ({
          keyId: key.id,

          publicKey:
            bytesToBase64(
              key.publicKey
            ),
        })),
    }
  );

  return {
    rotated: true,
    added: preKeys.length,
  };
}