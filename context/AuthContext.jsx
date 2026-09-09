import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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

    const userId =
      user?._id ||
      user?.id;

    if (!userId) {
      disconnectSocket();
      return;
    }

    console.log(
      "AUTH SOCKET INITIALIZATION:",
      userId
    );

    connectSocket(userId);

  }, [
    user?._id,
    user?.id,
    loading,
  ]);

  async function restoreSession() {
    try {
      setLoading(true);
      setError(null);

      const currentUser =
        await getCurrentUser();

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

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        console.log(
          "NO VALID AUTH SESSION."
        );
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

  async function login(
    identifier,
    password
  ) {
    try {
      setError(null);

      const cleanIdentifier =
        identifier
          ?.trim() || "";

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

      let loginData = {
        password,
      };

      if (
        cleanIdentifier.includes("@")
      ) {
        loginData.email =
          cleanIdentifier
            .toLowerCase();
      } else if (
        /^[+0-9()\-\s]+$/.test(
          cleanIdentifier
        )
      ) {
        loginData.phone =
          cleanIdentifier;
      } else {
        loginData.username =
          cleanIdentifier
            .toLowerCase();
      }

      const result =
        await loginUser(
          loginData
        );

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

      setUser(result.user);

      console.log(
        "AUTH CONTEXT LOGIN:",
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
            data?.phone
              ?.trim() || "",

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

      const result =
        await logoutUser();

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
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}