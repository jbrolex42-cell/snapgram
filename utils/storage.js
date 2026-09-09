import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "@snapgram_session";

export async function saveSession(session) {
  try {
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

export async function getSession() {
  try {
    const session = await AsyncStorage.getItem(SESSION_KEY);

    if (!session) {
      return null;
    }

    return JSON.parse(session);
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}