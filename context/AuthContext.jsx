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

const AuthContext = createContext(null);

const TOKEN_KEY = "snapgram_token";

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

    console.log("AUTH SOCKET INITIALIZATION:", userId);

    connectSocket(userId);
  }, [user, loading]);

  async function restoreSession() {
    try {
      setLoading(true);
      setError(null);

      /*
       * Do not call /auth/me when there is no token.
       * This prevents the unnecessary 401 shown in Metro.
       */
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      console.log(
        "RESTORING AUTH SESSION — TOKEN EXISTS:",
        !!token
      );

      if (!token) {
        console.log("NO SAVED AUTH TOKEN.");
        setUser(null);
        disconnectSocket();
        return;
      }

      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error(
          "Unable to restore authenticated user."
        );
      }

      setUser(currentUser);

      console.log(
        "SESSION RESTORED:",
        currentUser?.username ||
          currentUser?.email ||
          currentUser?._id ||
          currentUser?.id
      );
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        console.log("SAVED AUTH TOKEN IS INVALID.");

        /*
         * Remove an invalid/expired token.
         */
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        console.error(
          "RESTORE SESSION ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      }

      disconnectSocket();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(identifier, password) {
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
        throw new Error("Enter your password.");
      }

      let loginData = {
        password,
      };

      /*
       * Email
       */
      if (cleanIdentifier.includes("@")) {
        loginData.email =
          cleanIdentifier.toLowerCase();
      }

      /*
       * Phone
       */
      else if (
        /^[+0-9()\-\s]+$/.test(cleanIdentifier)
      ) {
        loginData.phone = cleanIdentifier;
      }

      /*
       * Username
       */
      else {
        loginData.username =
          cleanIdentifier.toLowerCase();
      }

      console.log(
        "AUTH LOGIN REQUEST:",
        Object.keys(loginData).filter(
          (key) => key !== "password"
        )
      );

      const result = await loginUser(loginData);

      /*
       * Backend MUST return:
       *
       * {
       *   token: "...",
       *   user: {...}
       * }
       */
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

      /*
       * Explicitly guarantee the token is saved.
       *
       * This protects us even if authService's loginUser
       * does not save it itself.
       */
      await AsyncStorage.setItem(
        TOKEN_KEY,
        result.token
      );

      setUser(result.user);

      console.log(
        "AUTH LOGIN SUCCESS:",
        result.user?.username ||
          result.user?.email ||
          result.user?._id ||
          result.user?.id
      );

      console.log(
        "AUTH TOKEN SAVED:",
        true
      );

      return result;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to login.";

      setError(message);

      throw new Error(message);
    }
  }

  async function loginWithSocial(result) {
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

      /*
       * Guarantee same token key used by api.js.
       */
      await AsyncStorage.setItem(
        TOKEN_KEY,
        result.token
      );

      setUser(result.user);

      console.log(
        "SOCIAL LOGIN SUCCESS:",
        result.user?.username ||
          result.user?.email ||
          result.user?._id ||
          result.user?.id
      );

      return result;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to complete social login.";

      setError(message);

      throw new Error(message);
    }
  }

  async function register(data) {
    try {
      setError(null);

      const result = await registerUser({
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
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create account.";

      setError(message);

      throw new Error(message);
    }
  }

  async function switchAccount(accountId) {
    try {
      setError(null);

      if (!accountId) {
        throw new Error(
          "Account ID is required."
        );
      }

      disconnectSocket();

      const switchedUser =
        await switchSavedAccount(accountId);

      if (!switchedUser) {
        throw new Error(
          "The selected account could not be activated."
        );
      }

      setUser(switchedUser);

      console.log(
        "ACCOUNT SWITCHED:",
        switchedUser?.username ||
          switchedUser?.email ||
          switchedUser?._id ||
          switchedUser?.id
      );

      return switchedUser;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to switch account.";

      setError(message);

      throw new Error(message);
    }
  }

  async function logout() {
    try {
      setError(null);

      disconnectSocket();

      /*
       * Remove local session immediately.
       */
      await AsyncStorage.removeItem(TOKEN_KEY);

      const result = await logoutUser();

      setUser(null);

      console.log(
        "SNAPGRAM LOGOUT SUCCESS"
      );

      return result;
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      /*
       * Always clear local authentication.
       */
      await AsyncStorage.removeItem(
        TOKEN_KEY
      );

      disconnectSocket();
      setUser(null);

      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithSocial,
        register,
        switchAccount,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}