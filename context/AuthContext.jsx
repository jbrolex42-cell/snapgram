import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  switchSavedAccount,
  saveAuthSession,
} from "../services/authService";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

const TOKEN_KEY = "snapgram_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const userId = user?._id || user?.id;

    if (!userId) {
      disconnectSocket();
      return;
    }

    let cancelled = false;

    async function initializeSocket() {
      try {
        console.log(
          "[AUTH] SOCKET INITIALIZATION:",
          userId
        );

        const connectedSocket =
          await connectSocket(userId);

        if (cancelled) {
          return;
        }

        if (!connectedSocket) {
          console.warn(
            "[AUTH] Socket connection was not created."
          );

          return;
        }

        console.log(
          "[AUTH] SOCKET READY:",
          connectedSocket.id
        );
      } catch (socketError) {
        if (cancelled) {
          return;
        }

        console.error(
          "[AUTH] SOCKET INITIALIZATION ERROR:",
          socketError?.message ||
            socketError
        );
      }
    }

    initializeSocket();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  async function restoreSession() {
    try {
      setLoading(true);
      setError(null);

      const token =
        await AsyncStorage.getItem(
          TOKEN_KEY
        );

      console.log(
        "[AUTH] RESTORING SESSION — TOKEN:",
        Boolean(token)
      );

      if (!token) {
        console.log(
          "[AUTH] NO SAVED AUTH TOKEN."
        );

        disconnectSocket();
        setUser(null);

        return;
      }

      const currentUser =
        await getCurrentUser();

      if (!currentUser) {
        throw new Error(
          "Unable to restore authenticated user."
        );
      }

      setUser(currentUser);

      console.log(
        "[AUTH] SESSION RESTORED:",
        currentUser?.username ||
          currentUser?.email ||
          currentUser?._id ||
          currentUser?.id
      );
    } catch (restoreError) {
      const status =
        restoreError?.response?.status;

      if (
        status === 401 ||
        status === 403
      ) {
        console.log(
          "[AUTH] SAVED AUTH TOKEN IS INVALID."
        );

        await AsyncStorage.removeItem(
          TOKEN_KEY
        );
      } else {
        console.error(
          "[AUTH] RESTORE SESSION ERROR:",
          restoreError?.response?.data ||
            restoreError?.message ||
            restoreError
        );
      }

      disconnectSocket();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(
    identifier,
    password
  ) {
    try {
      setError(null);

      const cleanIdentifier =
        identifier?.trim() || "";

      if (!cleanIdentifier) {
        throw new Error(
          "Enter your email, username, or phone number."
        );
      }

      if (!password) {
        throw new Error(
          "Enter your password."
        );
      }

      const loginData = {
        password,
      };

      if (
        cleanIdentifier.includes("@")
      ) {
        loginData.email =
          cleanIdentifier.toLowerCase();
      } else if (
        /^[+0-9()\-\s]+$/.test(
          cleanIdentifier
        )
      ) {
        loginData.phone =
          cleanIdentifier;
      } else {
        loginData.username =
          cleanIdentifier.toLowerCase();
      }

      console.log(
        "[AUTH] LOGIN REQUEST:",
        Object.keys(loginData).filter(
          (key) => key !== "password"
        )
      );

      const result =
        await loginUser(loginData);

      if (!result?.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Login succeeded but no user information was returned."
        );
      }

      await AsyncStorage.setItem(
        TOKEN_KEY,
        result.token
      );

      setUser(result.user);

      console.log(
        "[AUTH] LOGIN SUCCESS:",
        result.user?.username ||
          result.user?.email ||
          result.user?._id ||
          result.user?.id
      );

      console.log(
        "[AUTH] TOKEN SAVED: true"
      );

      return result;
    } catch (loginError) {
      const message =
        loginError?.response?.data
          ?.message ||
        loginError?.message ||
        "Unable to login.";

      setError(message);

      throw new Error(message);
    }
  }

  async function loginWithSocial(
    result
  ) {
    try {
      setError(null);

      if (!result?.token) {
        throw new Error(
          "Social login did not return an authentication token."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Social login did not return user information."
        );
      }

      await saveAuthSession(
        result.user,
        result.token
      );

      await AsyncStorage.setItem(
        TOKEN_KEY,
        result.token
      );

      setUser(result.user);

      console.log(
        "[AUTH] SOCIAL LOGIN SUCCESS:",
        result.user?.username ||
          result.user?.email ||
          result.user?._id ||
          result.user?.id
      );

      return result;
    } catch (socialError) {
      const message =
        socialError?.response?.data
          ?.message ||
        socialError?.message ||
        "Unable to complete social login.";

      setError(message);

      throw new Error(message);
    }
  }

  async function register(data) {
    try {
      setError(null);

      const result =
        await registerUser({
          fullName:
            data?.fullName?.trim() ||
            data?.name?.trim() ||
            "",

          username:
            data?.username
              ?.trim()
              .toLowerCase() || "",

          email:
            data?.email
              ?.trim()
              .toLowerCase() || "",

          phone:
            data?.phone?.trim() || "",

          password:
            data?.password || "",
        });

      return result;
    } catch (registerError) {
      const message =
        registerError?.response?.data
          ?.message ||
        registerError?.message ||
        "Unable to create account.";

      setError(message);

      throw new Error(message);
    }
  }

  async function switchAccount(
    accountId
  ) {
    try {
      setError(null);

      if (!accountId) {
        throw new Error(
          "Account ID is required."
        );
      }

      disconnectSocket();

      const switchedUser =
        await switchSavedAccount(
          accountId
        );

      if (!switchedUser) {
        throw new Error(
          "The selected account could not be activated."
        );
      }

      setUser(switchedUser);

      console.log(
        "[AUTH] ACCOUNT SWITCHED:",
        switchedUser?.username ||
          switchedUser?.email ||
          switchedUser?._id ||
          switchedUser?.id
      );

      return switchedUser;
    } catch (switchError) {
      const message =
        switchError?.response?.data
          ?.message ||
        switchError?.message ||
        "Unable to switch account.";

      setError(message);

      throw new Error(message);
    }
  }

  async function logout() {
    try {
      setError(null);

      disconnectSocket();

      await AsyncStorage.removeItem(
        TOKEN_KEY
      );

      const result =
        await logoutUser();

      setUser(null);

      console.log(
        "[AUTH] SNAPGRAM LOGOUT SUCCESS"
      );

      return result;
    } catch (logoutError) {
      console.error(
        "[AUTH] LOGOUT ERROR:",
        logoutError?.response?.data ||
          logoutError?.message ||
          logoutError
      );

      await AsyncStorage.removeItem(
        TOKEN_KEY
      );

      disconnectSocket();
      setUser(null);

      throw logoutError;
    }
  }

  const contextValue = {
    user,
    loading,
    error,

    login,
    loginWithSocial,
    register,
    switchAccount,
    logout,

    restoreSession,
  };

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}