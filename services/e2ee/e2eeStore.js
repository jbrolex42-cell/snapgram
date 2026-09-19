import { SQLCipherProtocolStore } from "expo-libsignal/stores";

let storePromise = null;

export async function getE2EEStore() {
if (!storePromise) {
storePromise = SQLCipherProtocolStore.open({
databaseName: "snapgram-e2ee.db",
keyAlias: "snapgram-e2ee-key",
});
}

return storePromise;
}

export async function closeE2EEStore() {
if (!storePromise) {
return;
}

const store = await storePromise;

try {
await store.close();
} finally {
storePromise = null;
}
}

export async function wipeE2EEStore() {
if (!storePromise) {
const store = await getE2EEStore();

await store.wipe();

storePromise = null;

return;

}

const store = await storePromise;

try {
await store.wipe();
} finally {
storePromise = null;
}
}