import * as Crypto from "expo-crypto";

export function bytesToBase64(bytes) {
  if (!bytes) {
    return null;
  }

  const array =
    bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes);

  let binary = "";

  const chunkSize = 0x8000;

  for (
    let index = 0;
    index < array.length;
    index += chunkSize
  ) {
    const chunk = array.subarray(
      index,
      Math.min(
        index + chunkSize,
        array.length
      )
    );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  if (
    typeof globalThis.btoa ===
    "function"
  ) {
    return globalThis.btoa(binary);
  }

  return Buffer.from(
    binary,
    "binary"
  ).toString("base64");
}

export function base64ToBytes(value) {
  if (!value) {
    return new Uint8Array();
  }

  const binary =
    typeof globalThis.atob ===
    "function"
      ? globalThis.atob(value)
      : Buffer.from(
          value,
          "base64"
        ).toString("binary");

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return bytes;
}

export function encodeText(value) {
  return new TextEncoder().encode(
    String(value ?? "")
  );
}

export function decodeText(bytes) {
  return new TextDecoder().decode(
    bytes
  );
}

export function normalizeUserId(value) {
  const id =
    String(value ?? "").trim();

  if (!id) {
    throw new Error(
      "User id is required"
    );
  }

  return id;
}

export function normalizeDeviceId(value) {
  const deviceId = Number(value);

  if (
    !Number.isInteger(deviceId) ||
    deviceId < 1
  ) {
    throw new Error(
      "Invalid device id"
    );
  }

  return deviceId;
}

export async function generateRandomId(
  max = 16383
) {
  if (
    !Number.isInteger(max) ||
    max < 1 ||
    max > 2147483647
  ) {
    throw new Error(
      "Invalid random ID range"
    );
  }

  const bytes =
    await Crypto.getRandomBytesAsync(4);

  const array =
    new Uint8Array(bytes);

  const value =
    new DataView(
      array.buffer,
      array.byteOffset,
      array.byteLength
    ).getUint32(0, true);

  return (
    value % max
  ) + 1;
}