import React, {
  createContext,
  useCallback,
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
  saveAuthSession,
  switchSavedAccount,
} from "../services/authService";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

import {
  initializeDevice,
} from "../services/e2ee/e2eeService";

import {
  closeE2EEStore,
} from "../services/e2ee/e2eeStore";

const TOKEN_KEY = "snapgram_token";

const AuthContext = createContext(null);

function getUserId(user) {
  return (
    user?._id?.toString() ||
    user?.id?.toString() ||
    null
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializeE2EE = useCallback(async (authenticatedUser) => {
    const userId = getUserId(authenticatedUser);

    if (!userId) {
      console.warn(
        "[E2EE] Cannot initialize device: user ID is missing."
      );
      return null;
    }

    try {
      console.log(
        "[E2EE] INITIALIZING DEVICE:",
        userId
      );

      const result = await initializeDevice(userId);

      console.log(
        "[E2EE] DEVICE READY:",
        {
          userId,
          deviceId: result?.deviceId,
          registrationId: result?.registrationId,
        }
      );

      return result;
    } catch (e2eeError) {
      console.error(
        "[E2EE] DEVICE INITIALIZATION ERROR:",
        e2eeError?.response?.data ||
          e2eeError?.message ||
          e2eeError
      );

      throw e2eeError;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem(TOKEN_KEY);

      console.log(
        "[AUTH] RESTORING SESSION — TOKEN:",
        Boolean(token)
      );

      if (!token) {
        console.log(
          "[AUTH] NO SAVED AUTH TOKEN."
        );

        disconnectSocket();

        try {
          await closeE2EEStore();
        } catch (e2eeCloseError) {
          console.warn(
            "[E2EE] STORE CLOSE ERROR:",
            e2eeCloseError?.message ||
              e2eeCloseError
          );
        }

        setUser(null);
        return null;
      }

      const currentUser = await getCurrentUser();

      if (!currentUser) {
        throw new Error(
          "Unable to restore authenticated user."
        );
      }

      await initializeE2EE(currentUser);

      setUser(currentUser);

      console.log(
        "[AUTH] SESSION RESTORED:",
        currentUser?.username ||
          currentUser?.email ||
          currentUser?._id ||
          currentUser?.id
      );

      return currentUser;
    } catch (restoreError) {
      const status =
        restoreError?.response?.status;

      const message =
        restoreError?.response?.data?.message ||
        restoreError?.message ||
        "Unable to restore your session.";

      if (status === 401 || status === 403) {
        console.log(
          "[AUTH] SAVED AUTH TOKEN IS INVALID."
        );

        try {
          await AsyncStorage.removeItem(
            TOKEN_KEY
          );
        } catch (storageError) {
          console.error(
            "[AUTH] TOKEN CLEANUP ERROR:",
            storageError?.message ||
              storageError
          );
        }
      } else {
        console.error(
          "[AUTH] RESTORE SESSION ERROR:",
          restoreError?.response?.data ||
            restoreError?.message ||
            restoreError
        );
      }

      disconnectSocket();

      try {
        await closeE2EEStore();
      } catch (e2eeCloseError) {
        console.warn(
          "[E2EE] STORE CLOSE ERROR:",
          e2eeCloseError?.message ||
            e2eeCloseError
        );
      }

      setUser(null);
      setError(message);

      return null;
    } finally {
      setLoading(false);
    }
  }, [initializeE2EE]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!mounted) {
        return;
      }

      await restoreSession();
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [restoreSession]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const userId = getUserId(user);

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

        const socket =
          await connectSocket(userId);

        if (cancelled) {
          return;
        }

        if (!socket) {
          console.warn(
            "[AUTH] Socket connection was not created."
          );
          return;
        }

        console.log(
          "[AUTH] SOCKET READY:",
          socket.id
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

  const login = useCallback(
    async (identifier, password) => {
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

        if (cleanIdentifier.includes("@")) {
          loginData.email =
            cleanIdentifier.toLowerCase();
        }

        else if (
          /^[+0-9()\-\s]+$/.test(
            cleanIdentifier
          )
        ) {
          loginData.phone =
            cleanIdentifier;
        }

        else {
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
        
        await initializeE2EE(result.user);

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
          loginError?.response?.data?.message ||
          loginError?.message ||
          "Unable to login.";

        setError(message);

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const loginWithSocial = useCallback(
    async (result) => {
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

        await initializeE2EE(result.user);

        setUser(result.user);

        console.log(
          "[AUTH] SOCIAL LOGIN SUCCESS:",
          result.user?.username ||
            result.user?.email ||
            result.user?._id ||
            result.user?.id
        );

        console.log(
          "[AUTH] TOKEN SAVED: true"
        );

        return result;
      } catch (socialError) {
        const message =
          socialError?.response?.data?.message ||
          socialError?.message ||
          "Unable to complete social login.";

        setError(message);

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const register = useCallback(
    async (data) => {
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
          registerError?.response?.data?.message ||
          registerError?.message ||
          "Unable to create account.";

        setError(message);

        throw new Error(message);
      }
    },
    []
  );

  const switchAccount = useCallback(
    async (accountId) => {
      try {
        setError(null);

        if (!accountId) {
          throw new Error(
            "Account ID is required."
          );
        }

        disconnectSocket();

        try {
          await closeE2EEStore();
        } catch (e2eeCloseError) {
          console.warn(
            "[E2EE] STORE CLOSE DURING ACCOUNT SWITCH:",
            e2eeCloseError?.message ||
              e2eeCloseError
          );
        }

        const switchedUser =
          await switchSavedAccount(
            accountId
          );

        if (!switchedUser) {
          throw new Error(
            "The selected account could not be activated."
          );
        }

        await initializeE2EE(switchedUser);

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
          switchError?.response?.data?.message ||
          switchError?.message ||
          "Unable to switch account.";

        setError(message);

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const logout = useCallback(async () => {
    try {
      setError(null);

      disconnectSocket();

      let result = null;

      try {
        result = await logoutUser();
      } catch (logoutRequestError) {
        console.warn(
          "[AUTH] SERVER LOGOUT REQUEST FAILED:",
          logoutRequestError?.response?.data ||
            logoutRequestError?.message ||
            logoutRequestError
        );
      }

      await AsyncStorage.removeItem(
        TOKEN_KEY
      );

      try {
        await closeE2EEStore();
      } catch (e2eeCloseError) {
        console.warn(
          "[E2EE] STORE CLOSE DURING LOGOUT:",
          e2eeCloseError?.message ||
            e2eeCloseError
        );
      }

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

      try {
        await AsyncStorage.removeItem(
          TOKEN_KEY
        );
      } catch (storageError) {
        console.error(
          "[AUTH] LOGOUT TOKEN CLEANUP ERROR:",
          storageError?.message ||
            storageError
        );
      }

      disconnectSocket();

      try {
        await closeE2EEStore();
      } catch (e2eeCloseError) {
        console.warn(
          "[E2EE] STORE CLOSE ERROR:",
          e2eeCloseError?.message ||
            e2eeCloseError
        );
      }

      setUser(null);

      throw logoutError;
    }
  }, []);

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

    setUser,
    setError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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