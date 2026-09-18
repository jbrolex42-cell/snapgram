import * as FileSystem from "expo-file-system";

const TEMP_DIR =
  `${FileSystem.cacheDirectory}snapgram-encrypted/`;

async function ensureDirectory() {
  const info =
    await FileSystem.getInfoAsync(
      TEMP_DIR
    );

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(
      TEMP_DIR,
      {
        intermediates: true,
      }
    );
  }
}

export async function prepareEncryptedMedia(
  uri
) {
  if (!uri) {
    throw new Error(
      "Media URI is required"
    );
  }

  await ensureDirectory();

  const extension =
    uri.includes(".")
      ? uri.substring(
          uri.lastIndexOf(".")
        )
      : ".bin";

  const outputUri =
    `${TEMP_DIR}${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${extension}.encrypted`;

  throw new Error(
    "Encrypted media pipeline is not enabled yet. Do not upload plaintext media."
  );
}

export async function deleteEncryptedMedia(
  uri
) {
  if (!uri) return;

  try {
    const info =
      await FileSystem.getInfoAsync(
        uri
      );

    if (info.exists) {
      await FileSystem.deleteAsync(
        uri,
        {
          idempotent: true,
        }
      );
    }
  } catch (error) {
    console.warn(
      "[MEDIA] Cleanup failed:",
      error?.message
    );
  }
}