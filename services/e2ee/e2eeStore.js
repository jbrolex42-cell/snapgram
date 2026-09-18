import {
  SQLCipherProtocolStore,
} from "expo-libsignal/stores";

let storePromise = null;

export async function getE2EEStore() {
  if (!storePromise) {
    storePromise =
      SQLCipherProtocolStore.open();
  }

  return storePromise;
}

export async function closeE2EEStore() {
  storePromise = null;
}