import {
  IdentityKeyPair,
  IdentityKey,
  PublicKey,
  PreKeyBundle,
  PreKeyRecord,
  ProtocolAddress,
  SessionBuilder,
  SessionCipher,
  SignedPreKeyRecord,
  KyberPreKeyRecord,
  PreKeySignalMessage,
  SignalMessage,
} from "expo-libsignal";

import api from "../api";

import { getE2EEStore } from "./e2eeStore";

import {
  E2EE_VERSION,
  DEFAULT_DEVICE_ID,
  PREKEY_BATCH_SIZE,
  PREKEY_REPLENISH_THRESHOLD,
  SIGNED_PREKEY_ID,
  KYBER_PREKEY_ID,
  ENVELOPE_TYPES,
} from "./e2eeTypes";

import {
  bytesToBase64,
  base64ToBytes,
  encodeText,
  decodeText,
  normalizeUserId,
  normalizeDeviceId,
  generateRandomId,
} from "./e2eeUtils";

let initialized = false;
let initializationPromise = null;

let localUserId = null;

function requireLocalUserId() {
  if (!localUserId) {
    throw new Error(
      "E2EE local user ID is not initialized"
    );
  }

  return localUserId;
}

async function getStore() {
  return getE2EEStore();
}

async function createRegistrationId() {

  return generateRandomId(16383);
}


async function createLocalKeys(store) {
  const identityKeyPair =
    await IdentityKeyPair.generate();

  const registrationId =
    await createRegistrationId();

  await store.initializeLocalIdentity(
    identityKeyPair,
    registrationId
  );

  return {
    identityKeyPair,
    registrationId,
  };
}

async function ensureSignedPreKey(
  store,
  identityKeyPair
) {
  const existing =
    await store.loadSignedPreKeys();

  if (existing?.length) {
    return existing[existing.length - 1];
  }

  const signedPreKey =
    await SignedPreKeyRecord.generate(
      SIGNED_PREKEY_ID,
      identityKeyPair,
      Date.now()
    );

  await store.storeSignedPreKey(
    signedPreKey.id(),
    signedPreKey
  );

  return signedPreKey;
}

async function ensureKyberPreKey(
  store,
  identityKeyPair
) {
  const existing =
    await store.loadKyberPreKeys();

  if (existing?.length) {
    return existing[existing.length - 1];
  }

  const kyberPreKey =
    await KyberPreKeyRecord.generate(
      KYBER_PREKEY_ID,
      identityKeyPair,
      Date.now()
    );

  await store.storeKyberPreKey(
    kyberPreKey.id(),
    kyberPreKey
  );

  return kyberPreKey;
}


async function createPreKeys(store) {
  const existing =
    await store.loadPreKeys();

  const existingIds = new Set(
    (existing || []).map(
      (record) => record.id()
    )
  );

  const records = [];

  let nextId = 1;

  while (
    records.length <
    PREKEY_BATCH_SIZE
  ) {
    if (!existingIds.has(nextId)) {
      const record =
        await PreKeyRecord.generate(
          nextId
        );

      await store.storePreKey(
        record.id(),
        record
      );

      records.push(record);
    }

    nextId += 1;
  }

  return records;
}

export async function initializeDevice(
  userId
) {
  if (userId) {
    localUserId =
      normalizeUserId(userId);
  }

  requireLocalUserId();

  if (initialized) {
    const store =
      await getStore();

    return {
      registrationId:
        await store.getLocalRegistrationId(),

      deviceId:
        DEFAULT_DEVICE_ID,
    };
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise =
    (async () => {
      const store =
        await getStore();

      let identityKeyPair;
      let registrationId;

      if (
        await store.hasLocalIdentity()
      ) {
        identityKeyPair =
          await store.getIdentityKeyPair();

        registrationId =
          await store.getLocalRegistrationId();
      } else {

        const created =
          await createLocalKeys(
            store
          );

        identityKeyPair =
          created.identityKeyPair;

        registrationId =
          created.registrationId;
      }

      await ensureSignedPreKey(
        store,
        identityKeyPair
      );

      await ensureKyberPreKey(
        store,
        identityKeyPair
      );

      const existingPreKeys =
        await store.loadPreKeys();

      if (
        !existingPreKeys ||
        existingPreKeys.length <
          PREKEY_REPLENISH_THRESHOLD
      ) {
        await createPreKeys(
          store
        );
      }

      initialized = true;

      return {
        registrationId,
        deviceId:
          DEFAULT_DEVICE_ID,
      };
    })();

  try {
    return await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

export async function publishPreKeys(
  userId
) {
  await initializeDevice(
    userId
  );

  const store =
    await getStore();

  const identityKeyPair =
    await store.getIdentityKeyPair();

  const registrationId =
    await store.getLocalRegistrationId();

  const signedPreKeys =
    await store.loadSignedPreKeys();

  if (!signedPreKeys?.length) {
    throw new Error(
      "Local signed pre-key is missing"
    );
  }

  const signedPreKey =
    signedPreKeys[
      signedPreKeys.length - 1
    ];

  const kyberPreKeys =
    await store.loadKyberPreKeys();

  if (!kyberPreKeys?.length) {
    throw new Error(
      "Local Kyber pre-key is missing"
    );
  }

  const kyberPreKey =
    kyberPreKeys[
      kyberPreKeys.length - 1
    ];

  let preKeys =
    await store.loadPreKeys();

  if (
    !preKeys ||
    preKeys.length <
      PREKEY_REPLENISH_THRESHOLD
  ) {
    preKeys =
      await createPreKeys(
        store
      );
  }

  const identityKey =
    identityKeyPair.publicKey();

  await api.post(
    "/devices",
    {
      deviceId:
        DEFAULT_DEVICE_ID,

      registrationId,

      identityKey:
        bytesToBase64(
          identityKey.serialize()
        ),

      signedPreKey: {
        keyId:
          signedPreKey.id(),

        publicKey:
          bytesToBase64(
            signedPreKey
              .publicKey()
              .serialize()
          ),

        signature:
          bytesToBase64(
            signedPreKey.signature()
          ),
      },

      kyberPreKey: {
        keyId:
          kyberPreKey.id(),

        publicKey:
          bytesToBase64(
            kyberPreKey
              .kyberPublicKey()
          ),

        signature:
          bytesToBase64(
            kyberPreKey.signature()
          ),
      },

      preKeys:
        preKeys.map(
          (record) => ({
            keyId:
              record.id(),

            publicKey:
              bytesToBase64(
                record
                  .publicKey()
                  .serialize()
              ),
          })
        ),
    }
  );

  return true;
}

export async function fetchPreKeyBundle(
  userId,
  deviceId = DEFAULT_DEVICE_ID
) {
  const normalizedUserId =
    normalizeUserId(userId);

  const normalizedDeviceId =
    normalizeDeviceId(deviceId);

  const response =
    await api.get(
      `/devices/user/${encodeURIComponent(
        normalizedUserId
      )}/bundle`,
      {
        params: {
          deviceId:
            normalizedDeviceId,
        },
      }
    );

  return (
    response.data?.bundle ||
    null
  );
}

export async function establishSession({
  userId,
  deviceId = DEFAULT_DEVICE_ID,
  localUserId: suppliedLocalUserId,
}) {
  const effectiveLocalUserId =
    suppliedLocalUserId ||
    localUserId;

  await initializeDevice(
    effectiveLocalUserId
  );

  const normalizedUserId =
    normalizeUserId(userId);

  const normalizedDeviceId =
    normalizeDeviceId(deviceId);

  if (
    normalizedUserId ===
    effectiveLocalUserId
  ) {
    throw new Error(
      "Cannot establish a session with the same device identity"
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

  if (!bundle.identityKey) {
    throw new Error(
      "Recipient identity key is missing"
    );
  }

  if (!bundle.signedPreKey) {
    throw new Error(
      "Recipient signed pre-key is missing"
    );
  }

  if (!bundle.kyberPreKey) {
    throw new Error(
      "Recipient Kyber pre-key is missing"
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
      effectiveLocalUserId,
      DEFAULT_DEVICE_ID
    );

  const identityKey =
    await IdentityKey.deserialize(
      base64ToBytes(
        bundle.identityKey
      )
    );

  const signedPreKeyPublic =
    await PublicKey.deserialize(
      base64ToBytes(
        bundle.signedPreKey.publicKey
      )
    );

  let preKeyPublic = null;

  if (
    bundle.preKey?.publicKey
  ) {
    preKeyPublic =
      await PublicKey.deserialize(
        base64ToBytes(
          bundle.preKey.publicKey
        )
      );
  }

  const preKeyBundle =
    await PreKeyBundle.create({
      registrationId:
        Number(
          bundle.registrationId
        ),

      deviceId:
        Number(
          bundle.deviceId
        ),

      identityKey,

      signedPreKeyId:
        Number(
          bundle.signedPreKey.keyId
        ),

      signedPreKeyPublic,

      signedPreKeySignature:
        base64ToBytes(
          bundle.signedPreKey
            .signature
        ),

      kyberPreKeyId:
        Number(
          bundle.kyberPreKey.keyId
        ),

      kyberPreKeyPublic:
        base64ToBytes(
          bundle.kyberPreKey
            .publicKey
        ),

      kyberPreKeySignature:
        base64ToBytes(
          bundle.kyberPreKey
            .signature
        ),

      ...(preKeyPublic
        ? {
            preKeyId:
              Number(
                bundle.preKey
                  .keyId
              ),

            preKeyPublic,
          }
        : {}),
    });

  const builder =
    new SessionBuilder(
      {
        sessionStore: store,
        identityStore: store,
      },
      remoteAddress,
      localAddress
    );

  await store.runExclusive(
    () =>
      builder.processPreKeyBundle(
        preKeyBundle
      )
  );

  return {
    userId:
      normalizedUserId,

    deviceId:
      normalizedDeviceId,
  };
}

async function createCipher({
  userId,
  deviceId,
}) {
  const store =
    await getStore();

  const remoteAddress =
    await ProtocolAddress.create(
      normalizeUserId(userId),
      normalizeDeviceId(deviceId)
    );

  const localAddress =
    await ProtocolAddress.create(
      requireLocalUserId(),
      DEFAULT_DEVICE_ID
    );

  const cipher =
    new SessionCipher(
      {
        sessionStore: store,
        identityStore: store,
        preKeyStore: store,
        signedPreKeyStore: store,
        kyberPreKeyStore: store,
      },
      remoteAddress,
      localAddress
    );

  return {
    store,
    cipher,
  };
}

export async function encryptMessage({
  recipientUserId,
  recipientDeviceId =
    DEFAULT_DEVICE_ID,
  text,
  localUserId:
    suppliedLocalUserId,
}) {
  if (
    text === null ||
    text === undefined
  ) {
    throw new Error(
      "Message text is required"
    );
  }

  await initializeDevice(
    suppliedLocalUserId
  );

  const userId =
    normalizeUserId(
      recipientUserId
    );

  const deviceId =
    normalizeDeviceId(
      recipientDeviceId
    );

  const sessionExists =
    await hasSession({
      userId,
      deviceId,
    });

  if (!sessionExists) {
    throw new Error(
      "Encryption session does not exist"
    );
  }

  const {
    store,
    cipher,
  } =
    await createCipher({
      userId,
      deviceId,
    });

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
        result.serialize()
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
  senderDeviceId =
    DEFAULT_DEVICE_ID,
  ciphertext,
  envelopeType,
  localUserId:
    suppliedLocalUserId,
}) {
  if (!ciphertext) {
    throw new Error(
      "Ciphertext is required"
    );
  }

  await initializeDevice(
    suppliedLocalUserId
  );

  const userId =
    normalizeUserId(
      senderUserId
    );

  const deviceId =
    normalizeDeviceId(
      senderDeviceId
    );

  const {
    store,
    cipher,
  } =
    await createCipher({
      userId,
      deviceId,
    });

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
        const message =
          await PreKeySignalMessage.deserialize(
            bytes
          );

        plaintext =
          await cipher.decryptPreKeySignal(
            message
          );
      } else if (
        envelopeType ===
        ENVELOPE_TYPES.SIGNAL
      ) {
        const message =
          await SignalMessage.deserialize(
            bytes
          );

        plaintext =
          await cipher.decryptSignal(
            message
          );
      } else {
        throw new Error(
          "Unsupported encryption envelope"
        );
      }
    }
  );

  return {
    text:
      decodeText(
        plaintext
      ),
  };
}

export async function hasSession({
  userId,
  deviceId = DEFAULT_DEVICE_ID,
  localUserId:
    suppliedLocalUserId,
}) {
  await initializeDevice(
    suppliedLocalUserId
  );

  const store =
    await getStore();

  const address =
    await ProtocolAddress.create(
      normalizeUserId(userId),
      normalizeDeviceId(deviceId)
    );

  const session =
    await store.loadSession(
      address
    );

  return Boolean(session);
}

export async function rotateKeys(
  suppliedLocalUserId
) {
  await initializeDevice(
    suppliedLocalUserId
  );

  const store =
    await getStore();

  let preKeys =
    await store.loadPreKeys();

  const count =
    preKeys?.length || 0;

  if (
    count >
    PREKEY_REPLENISH_THRESHOLD
  ) {
    return {
      rotated: false,
      count,
    };
  }

  const additional =
    await createPreKeys(
      store
    );

  await api.post(
    "/devices/prekeys",
    {
      deviceId:
        DEFAULT_DEVICE_ID,

      preKeys:
        additional.map(
          (record) => ({
            keyId:
              record.id(),

            publicKey:
              bytesToBase64(
                record
                  .publicKey()
                  .serialize()
              ),
          })
        ),
    }
  );

  return {
    rotated: true,

    added:
      additional.length,

    count:
      count +
      additional.length,
  };
}