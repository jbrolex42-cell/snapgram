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
    let i = 0;
    i < array.length;
    i += chunkSize
  ) {
    const chunk = array.subarray(
      i,
      Math.min(
        i + chunkSize,
        array.length
      )
    );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  return globalThis.btoa
    ? globalThis.btoa(binary)
    : Buffer.from(binary, "binary").toString(
        "base64"
      );
}

export function base64ToBytes(value) {
  if (!value) {
    return new Uint8Array();
  }

  const binary = globalThis.atob
    ? globalThis.atob(value)
    : Buffer.from(
        value,
        "base64"
      ).toString("binary");

  const bytes = new Uint8Array(
    binary.length
  );

  for (
    let i = 0;
    i < binary.length;
    i += 1
  ) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function encodeText(value) {
  return new TextEncoder().encode(
    String(value ?? "")
  );
}

export function decodeText(bytes) {
  return new TextDecoder().decode(bytes);
}

export function normalizeUserId(id) {
  return String(id || "").trim();
}

export function normalizeDeviceId(id) {
  const value = Number(id);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      "Invalid device id"
    );
  }

  return value;
}