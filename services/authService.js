import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setApiToken, clearApiToken } from "./api";

export const TOKEN_KEY = "snapgram_token";
export const USER_KEY = "snapgram_user";
export const ACCOUNTS_KEY = "snapgram_saved_accounts";

function getUserId(user) {
  return String(user?._id || user?.id || "");
}

function normalizeAccount(user, token) {
  return {
    id: getUserId(user),

    username: user?.username || "",

    email: user?.email || "",

    name: user?.fullName || user?.name || "",

    avatar: user?.avatar || "",

    token: String(token || ""),
  };
}

function getLoginIdentifierType(identifier) {
  const value = String(identifier || "").trim();

  if (value.includes("@")) {
    return "email";
  }

  if (/^[+0-9][0-9\s().-]*$/.test(value)) {
    return "phone";
  }

  return "username";
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function saveAuthSession(user, token) {
  if (!user) {
    throw new Error(
      "Unable to save session: user information is missing."
    );
  }

  if (!token) {
    throw new Error(
      "Unable to save session: authentication token is missing."
    );
  }

  const normalizedToken = String(token);

  await AsyncStorage.multiSet([
    [TOKEN_KEY, normalizedToken],
    [USER_KEY, JSON.stringify(user)],
  ]);

  setApiToken(normalizedToken);

  await saveLoggedInAccount(user, normalizedToken);

  const savedToken = await AsyncStorage.getItem(TOKEN_KEY);

  if (!savedToken) {
    throw new Error(
      "Authentication succeeded, but the token could not be saved."
    );
  }

  console.log(
    "[AUTH] SESSION SAVED:",
    user?.username ||
      user?.email ||
      user?._id ||
      user?.id ||
      "unknown"
  );

  return {
    token: normalizedToken,
    user,
  };
}

async function getStoredAccounts() {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);

    if (!raw) {
      return [];
    }

    const accounts = JSON.parse(raw);

    if (!Array.isArray(accounts)) {
      return [];
    }

    return accounts.filter(
      (account) =>
        account &&
        account.id &&
        account.token
    );
  } catch (error) {
    console.error(
      "[AUTH] GET STORED ACCOUNTS ERROR:",
      error?.message || error
    );

    return [];
  }
}

async function saveStoredAccounts(accounts) {
  await AsyncStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify(accounts)
  );
}

async function saveLoggedInAccount(user, token) {
  const account = normalizeAccount(user, token);

  if (!account.id || !account.token) {
    throw new Error(
      "Unable to save account because authentication data is incomplete."
    );
  }

  const accounts = await getStoredAccounts();

  const existingIndex = accounts.findIndex(
    (item) =>
      String(item.id) === String(account.id)
  );

  if (existingIndex >= 0) {
    accounts[existingIndex] = {
      ...accounts[existingIndex],
      ...account,
    };
  } else {
    accounts.push(account);
  }

  await saveStoredAccounts(accounts);
}

export async function registerUser(data = {}) {
  const payload = {
    username: String(data?.username || "")
      .trim()
      .toLowerCase(),

    email: String(data?.email || "")
      .trim()
      .toLowerCase(),

    password: String(data?.password || ""),

    phone: String(data?.phone || "").trim(),

    fullName: String(
      data?.fullName ||
        data?.name ||
        ""
    ).trim(),
  };

  if (!payload.username) {
    throw new Error("Username is required.");
  }

  if (!payload.email) {
    throw new Error("Email is required.");
  }

  if (!payload.password) {
    throw new Error("Password is required.");
  }

  try {
    const response = await api.post(
      "/auth/register",
      payload
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Registration failed."
    );

    console.error(
      "[AUTH] REGISTER FAILED:",
      message
    );

    throw new Error(message);
  }
}

export async function loginUser(data = {}) {
  const identifier = String(
    data?.identifier ||
      data?.email ||
      data?.phone ||
      data?.username ||
      ""
  ).trim();

  const password = String(
    data?.password || ""
  );

  if (!identifier) {
    throw new Error(
      "Email, username, or phone number is required."
    );
  }

  if (!password) {
    throw new Error(
      "Password is required."
    );
  }

  const type = getLoginIdentifierType(identifier);

  const payload = {
    password,
  };

  if (type === "email") {
    payload.email = identifier.toLowerCase();
  }

  if (type === "phone") {
    payload.phone = identifier;
  }

  if (type === "username") {
    payload.username = identifier.toLowerCase();
  }

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log("[AUTH] LOGIN START");
  console.log("[AUTH] IDENTIFIER TYPE:", type);
  console.log("[AUTH] IDENTIFIER:", identifier);

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  try {
    const response = await api.post(
      "/auth/login",
      payload
    );

    const {
      token,
      user,
    } = response.data || {};

    if (!token || !user) {
      throw new Error(
        "Invalid login response."
      );
    }

    await saveAuthSession(
      user,
      token
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log("[AUTH] LOGIN SUCCESS");
    console.log("[AUTH] TOKEN SAVED:", true);
    console.log(
      "[AUTH] API TOKEN SET:",
      true
    );

    console.log(
      "[AUTH] USER:",
      user?.username ||
        user?.email ||
        user?._id ||
        user?.id ||
        "unknown"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Login failed."
    );

    console.error(
      "[AUTH] LOGIN FAILED:",
      message
    );

    throw new Error(message);
  }
}

export async function loginWithGoogle(idToken) {
  if (!idToken) {
    throw new Error(
      "Google authentication token is missing."
    );
  }

  try {
    const response = await api.post(
      "/auth/google",
      {
        idToken,
      }
    );

    const {
      token,
      user,
    } = response.data || {};

    if (!token || !user) {
      throw new Error(
        "Invalid Google login response."
      );
    }

    await saveAuthSession(
      user,
      token
    );

    console.log(
      "[AUTH] GOOGLE LOGIN SUCCESS:",
      user?.username ||
        user?.email ||
        user?._id ||
        user?.id
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Google login failed."
    );

    console.error(
      "[AUTH] GOOGLE LOGIN FAILED:",
      message
    );

    throw new Error(message);
  }
}

export async function loginWithFacebook(
  accessToken
) {
  if (!accessToken) {
    throw new Error(
      "Facebook access token is missing."
    );
  }

  try {
    const response = await api.post(
      "/auth/facebook",
      {
        accessToken,
      }
    );

    const {
      token,
      user,
    } = response.data || {};

    if (!token || !user) {
      throw new Error(
        "Invalid Facebook login response."
      );
    }

    await saveAuthSession(
      user,
      token
    );

    console.log(
      "[AUTH] FACEBOOK LOGIN SUCCESS:",
      user?.username ||
        user?.email ||
        user?._id ||
        user?.id
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Facebook login failed."
    );

    console.error(
      "[AUTH] FACEBOOK LOGIN FAILED:",
      message
    );

    throw new Error(message);
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get(
      "/auth/me"
    );

    const user =
      response.data?.user;

    if (!user) {
      throw new Error(
        "The server did not return the current user."
      );
    }

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

    const token =
      await AsyncStorage.getItem(
        TOKEN_KEY
      );

    if (token) {
      setApiToken(token);

      await saveLoggedInAccount(
        user,
        token
      );
    }

    return user;
  } catch (error) {
    const status =
      error?.response?.status;

    if (
      status === 401 ||
      status === 403
    ) {
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        USER_KEY,
      ]);

      clearApiToken();
    }

    throw error;
  }
}

export async function getAuthToken() {
  return AsyncStorage.getItem(
    TOKEN_KEY
  );
}

export async function getStoredUser() {
  try {
    const raw =
      await AsyncStorage.getItem(
        USER_KEY
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      "[AUTH] GET STORED USER ERROR:",
      error?.message || error
    );

    return null;
  }
}

export async function restoreAuthSession() {
  try {
    const [
      token,
      user,
    ] = await Promise.all([
      AsyncStorage.getItem(
        TOKEN_KEY
      ),
      getStoredUser(),
    ]);

    if (token) {
      setApiToken(token);
    } else {
      clearApiToken();
    }

    return {
      token: token || null,
      user: user || null,
    };
  } catch (error) {
    console.error(
      "[AUTH] RESTORE SESSION ERROR:",
      error?.message || error
    );

    clearApiToken();

    return {
      token: null,
      user: null,
    };
  }
}

export async function getSavedAccounts() {
  return getStoredAccounts();
}

export async function switchSavedAccount(
  accountId
) {
  if (!accountId) {
    throw new Error(
      "Account ID is required."
    );
  }

  const accounts =
    await getStoredAccounts();

  const account =
    accounts.find(
      (item) =>
        String(item.id) ===
        String(accountId)
    );

  if (!account) {
    throw new Error(
      "Saved account could not be found."
    );
  }

  const previousToken =
    await AsyncStorage.getItem(
      TOKEN_KEY
    );

  const previousUserRaw =
    await AsyncStorage.getItem(
      USER_KEY
    );

  await AsyncStorage.setItem(
    TOKEN_KEY,
    account.token
  );

  setApiToken(account.token);

  try {
    const response =
      await api.get(
        "/auth/me"
      );

    const user =
      response.data?.user;

    if (!user) {
      throw new Error(
        "Unable to verify the selected account."
      );
    }

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

    await saveLoggedInAccount(
      user,
      account.token
    );

    console.log(
      "[AUTH] ACCOUNT SWITCHED:",
      user?.username ||
        user?.email ||
        user?._id ||
        user?.id
    );

    return user;
  } catch (error) {

    if (previousToken) {
      await AsyncStorage.setItem(
        TOKEN_KEY,
        previousToken
      );

      setApiToken(previousToken);
    } else {
      await AsyncStorage.removeItem(
        TOKEN_KEY
      );

      clearApiToken();
    }

    if (previousUserRaw) {
      await AsyncStorage.setItem(
        USER_KEY,
        previousUserRaw
      );
    } else {
      await AsyncStorage.removeItem(
        USER_KEY
      );
    }

    throw error;
  }
}

export async function removeSavedAccount(
  accountId
) {
  if (!accountId) {
    throw new Error(
      "Account ID is required."
    );
  }

  const accounts =
    await getStoredAccounts();

  const accountExists =
    accounts.some(
      (account) =>
        String(account.id) ===
        String(accountId)
    );

  if (!accountExists) {
    throw new Error(
      "Saved account could not be found."
    );
  }

  const currentUserRaw =
    await AsyncStorage.getItem(
      USER_KEY
    );

  let currentUser = null;

  try {
    currentUser =
      currentUserRaw
        ? JSON.parse(
            currentUserRaw
          )
        : null;
  } catch {
    currentUser = null;
  }

  const currentUserId =
    getUserId(
      currentUser
    );

  const remainingAccounts =
    accounts.filter(
      (account) =>
        String(account.id) !==
        String(accountId)
    );

  await saveStoredAccounts(
    remainingAccounts
  );

  const removingCurrentAccount =
    String(currentUserId) ===
    String(accountId);

  if (!removingCurrentAccount) {
    return {
      removed: true,
      switched: false,
      user: currentUser,
    };
  }

  const nextAccount =
    remainingAccounts[0];

  if (!nextAccount) {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      USER_KEY,
    ]);

    clearApiToken();

    return {
      removed: true,
      switched: false,
      user: null,
    };
  }

  await AsyncStorage.setItem(
    TOKEN_KEY,
    nextAccount.token
  );

  setApiToken(
    nextAccount.token
  );

  try {
    const response =
      await api.get(
        "/auth/me"
      );

    const user =
      response.data?.user;

    if (!user) {
      throw new Error(
        "Unable to activate the next saved account."
      );
    }

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

    await saveLoggedInAccount(
      user,
      nextAccount.token
    );

    console.log(
      "[AUTH] NEXT ACCOUNT ACTIVATED:",
      user?.username ||
        user?.email ||
        user?._id ||
        user?.id
    );

    return {
      removed: true,
      switched: true,
      user,
    };
  } catch (error) {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      USER_KEY,
    ]);

    clearApiToken();

    throw error;
  }
}

export async function logoutUser() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);

  clearApiToken();

  console.log(
    "[AUTH] LOGGED OUT"
  );

  return {
    switched: false,
    user: null,
  };
}