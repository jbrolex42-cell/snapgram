import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const TOKEN_KEY = "snapgram_token";
const USER_KEY = "snapgram_user";
const ACCOUNTS_KEY = "snapgram_saved_accounts";

function getUserId(user) {
  return String(
    user?._id ||
      user?.id ||
      ""
  );
}

function normalizeAccount(user, token) {
  return {
    id: getUserId(user),
    username: user?.username || "",
    email: user?.email || "",
    name:
      user?.fullName ||
      user?.name ||
      "",
    avatar: user?.avatar || "",
    token,
  };
}

export async function saveAuthSession(
  user,
  token
) {
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

  await AsyncStorage.multiSet([
    [
      TOKEN_KEY,
      token,
    ],
    [
      USER_KEY,
      JSON.stringify(user),
    ],
  ]);

  await saveLoggedInAccount(
    user,
    token
  );

  const storedToken =
    await AsyncStorage.getItem(
      TOKEN_KEY
    );

  if (!storedToken) {
    throw new Error(
      "Authentication succeeded, but the token could not be saved."
    );
  }

  console.log(
    "AUTH SESSION SAVED:",
    user?.username ||
      user?.email ||
      user?._id ||
      user?.id ||
      "unknown"
  );

  return {
    token,
    user,
  };
}

async function getStoredAccounts() {
  try {
    const raw =
      await AsyncStorage.getItem(
        ACCOUNTS_KEY
      );

    if (!raw) {
      return [];
    }

    const accounts =
      JSON.parse(raw);

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
      "GET STORED ACCOUNTS ERROR:",
      error?.message ||
        error
    );

    return [];
  }
  }

async function saveStoredAccounts(
  accounts
) {
  await AsyncStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify(accounts)
  );
}

async function saveLoggedInAccount(
  user,
  token
) {
  const account =
    normalizeAccount(
      user,
      token
    );

  if (
    !account.id ||
    !account.token
  ) {
    throw new Error(
      "Unable to save account because authentication data is incomplete."
    );
  }

  const accounts =
    await getStoredAccounts();

  const existingIndex =
    accounts.findIndex(
      (item) =>
        String(item.id) ===
        String(account.id)
    );

  if (existingIndex >= 0) {
    accounts[existingIndex] = {
      ...accounts[existingIndex],
      ...account,
    };
  } else {
    accounts.push(account);
  }

  await saveStoredAccounts(
    accounts
  );
}

export async function registerUser(
  data
) {
  const payload = {
    username:
      data?.username
        ?.trim()
        .toLowerCase() || "",

    email:
      data?.email
        ?.trim()
        .toLowerCase() || "",

    password:
      data?.password || "",

    phone:
      data?.phone
        ?.trim() || "",

    fullName:
      data?.fullName?.trim() ||
      data?.name?.trim() ||
      "",
  };

  const response =
    await api.post(
      "/auth/register",
      payload
    );

  return response.data;
}


export async function loginUser(
  data
) {
  const email =
    data?.email
      ?.trim()
      .toLowerCase() || "";

  const phone =
    data?.phone
      ?.trim() || "";

  const username =
    data?.username
      ?.trim()
      .toLowerCase() || "";

  const password =
    data?.password || "";

  if (
    !email &&
    !phone &&
    !username
  ) {
    throw new Error(
      "Email, username, or phone number is required."
    );
  }

  if (!password) {
    throw new Error(
      "Password is required."
    );
  }

  const payload = {
    password,
  };

  if (email) {
    payload.email = email;
  }

  if (phone) {
    payload.phone = phone;
  }

  if (username) {
    payload.username = username;
  }

  const response =
    await api.post(
      "/auth/login",
      payload
    );

  const {
    token,
    user,
  } =
    response.data || {};

  if (!token) {
    throw new Error(
      "Login succeeded but no authentication token was returned."
    );
  }

  if (!user) {
    throw new Error(
      "Login succeeded but no user information was returned."
    );
  }

  await saveAuthSession(
    user,
    token
  );

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "LOGIN SUCCESS"
  );

  console.log(
    "AUTH TOKEN SAVED:",
    true
  );

  console.log(
    "AUTH USER:",
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
}

export async function loginWithGoogle(
  idToken
) {
  if (!idToken) {
    throw new Error(
      "Google authentication token is missing."
    );
  }

  const response =
    await api.post(
      "/auth/google",
      {
        idToken,
      }
    );

  const {
    token,
    user,
  } =
    response.data || {};

  if (!token) {
    throw new Error(
      "Google login succeeded but no authentication token was returned."
    );
  }

  if (!user) {
    throw new Error(
      "Google login succeeded but no user information was returned."
    );
  }

  await saveAuthSession(
    user,
    token
  );

  console.log(
    "GOOGLE LOGIN SUCCESS:",
    user?.username ||
      user?.email ||
      user?._id ||
      user?.id
  );

  return response.data;
}

export async function loginWithFacebook(
  accessToken
) {
  if (!accessToken) {
    throw new Error(
      "Facebook access token is missing."
    );
  }

  const response =
    await api.post(
      "/auth/facebook",
      {
        accessToken,
      }
    );

  const {
    token,
    user,
  } =
    response.data || {};

  if (!token) {
    throw new Error(
      "Facebook login succeeded but no authentication token was returned."
    );
  }

  if (!user) {
    throw new Error(
      "Facebook login succeeded but no user information was returned."
    );
  }

  await saveAuthSession(
    user,
    token
  );

  console.log(
    "FACEBOOK LOGIN SUCCESS:",
    user?.username ||
      user?.email ||
      user?._id ||
      user?.id
  );

  return response.data;
}

export async function getCurrentUser() {
  const response =
    await api.get(
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
    await saveLoggedInAccount(
      user,
      token
    );
  }

  return user;
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
  } catch {
    return null;
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

  await AsyncStorage.setItem(
    TOKEN_KEY,
    account.token
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

    return user;
  } catch (error) {
    
    const previousUserRaw =
      await AsyncStorage.getItem(
        USER_KEY
      );

    let previousUser = null;

    try {
      previousUser =
        previousUserRaw
          ? JSON.parse(
              previousUserRaw
            )
          : null;
    } catch {
      previousUser = null;
    }

    const previousUserId =
      getUserId(
        previousUser
      );

    const previousAccount =
      accounts.find(
        (item) =>
          String(item.id) ===
          String(previousUserId)
      );

    if (
      previousAccount?.token
    ) {
      await AsyncStorage.setItem(
        TOKEN_KEY,
        previousAccount.token
      );
    } else {
      await AsyncStorage.removeItem(
        TOKEN_KEY
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

  if (
    String(currentUserId) !==
    String(accountId)
  ) {
    return {
      removed: true,
      switched: false,
      user: currentUser,
    };
  }

  const nextAccount =
    remainingAccounts[0];

  if (nextAccount) {
    await AsyncStorage.setItem(
      TOKEN_KEY,
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

      throw error;
    }
  }

  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);

  return {
    removed: true,
    switched: false,
    user: null,
  };
}

export async function logoutUser() {
  
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);

  return {
    switched: false,
    user: null,
  };
}