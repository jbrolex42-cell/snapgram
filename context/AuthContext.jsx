import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  loginWithGoogle,
  loginWithFacebook,
  restoreAuthSession,
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

const AuthContext = createContext(null);

function getUserId(user) {
  return (
    user?._id?.toString() ||
    user?.id?.toString() ||
    null
  );
}

function getAuthErrorMessage(
  error,
  fallback = "Something went wrong."
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getUserLabel(user) {
  return (
    user?.username ||
    user?.email ||
    user?._id ||
    user?.id ||
    "unknown"
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeE2EE = useCallback(
    async (authenticatedUser) => {
      const userId = getUserId(
        authenticatedUser
      );

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

        const result =
          await initializeDevice(userId);

        console.log(
          "[E2EE] DEVICE READY:",
          {
            userId,
            deviceId: result?.deviceId,
            registrationId:
              result?.registrationId,
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
    },
    []
  );

  const safelyCloseE2EE = useCallback(
    async (label = "CLOSE") => {
      try {
        await closeE2EEStore();
      } catch (e2eeCloseError) {
        console.warn(
          `[E2EE] STORE CLOSE ${label}:`,
          e2eeCloseError?.message ||
            e2eeCloseError
        );
      }
    },
    []
  );

  const restoreSession = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const session =
          await restoreAuthSession();

        const token = session?.token;

        console.log(
          "[AUTH] RESTORING SESSION — TOKEN:",
          Boolean(token)
        );

        if (!token) {
          console.log(
            "[AUTH] NO SAVED AUTH TOKEN."
          );

          disconnectSocket();

          await safelyCloseE2EE(
            "WHEN NO SESSION"
          );

          setUser(null);

          return null;
        }

        console.log(
          "[AUTH] VALIDATING SAVED SESSION..."
        );

        const currentUser =
          await getCurrentUser();

        if (!currentUser) {
          throw new Error(
            "Unable to restore authenticated user."
          );
        }

        console.log(
          "[AUTH] AUTHENTICATED USER:",
          getUserLabel(currentUser)
        );

        await initializeE2EE(
          currentUser
        );

        setUser(currentUser);

        console.log(
          "[AUTH] SESSION RESTORED:",
          getUserLabel(currentUser)
        );

        return currentUser;
      } catch (restoreError) {
        const status =
          restoreError?.response?.status;

        const message =
          getAuthErrorMessage(
            restoreError,
            "Unable to restore your session."
          );


        if (
          status === 401 ||
          status === 403
        ) {
          console.log(
            "[AUTH] SAVED AUTH TOKEN IS INVALID OR EXPIRED."
          );
        } else {

          console.error(
            "[AUTH] RESTORE SESSION ERROR:",
            restoreError
          );

          console.error(
            "[AUTH] ERROR MESSAGE:",
            restoreError?.message
          );

          console.error(
            "[AUTH] ERROR CODE:",
            restoreError?.code
          );

          console.error(
            "[AUTH] ERROR STATUS:",
            restoreError?.response?.status
          );

          console.error(
            "[AUTH] ERROR DATA:",
            restoreError?.response?.data
          );

          console.error(
            "[AUTH] ERROR URL:",
            restoreError?.config?.url
          );

          console.error(
            "[AUTH] ERROR BASE URL:",
            restoreError?.config?.baseURL
          );
        }

        disconnectSocket();

        await safelyCloseE2EE(
          "AFTER SESSION RESTORE ERROR"
        );

        setUser(null);
        setError(message);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      initializeE2EE,
      safelyCloseE2EE,
    ]
  );

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const userId = getUserId(user);

    if (!userId) {
      disconnectSocket();
      return undefined;
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
          String(
            identifier || ""
          ).trim();

        const cleanPassword =
          String(
            password || ""
          );

        if (!cleanIdentifier) {
          throw new Error(
            "Enter your email, username, or phone number."
          );
        }

        if (!cleanPassword) {
          throw new Error(
            "Enter your password."
          );
        }

        console.log(
          "[AUTH] LOGIN REQUEST"
        );

        const result =
          await loginUser({
            identifier:
              cleanIdentifier,
            password:
              cleanPassword,
          });

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

        await initializeE2EE(
          result.user
        );

        setUser(result.user);

        console.log(
          "[AUTH] LOGIN SUCCESS:",
          getUserLabel(result.user)
        );

        return result;
      } catch (loginError) {
        const message =
          getAuthErrorMessage(
            loginError,
            "Unable to login."
          );

        setError(message);

        console.error(
          "[AUTH] LOGIN ERROR:",
          loginError?.response?.data ||
            loginError?.message ||
            loginError
        );

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const loginWithGoogleAccount =
    useCallback(
      async (idToken) => {
        try {
          setError(null);

          if (!idToken) {
            throw new Error(
              "Google authentication token is missing."
            );
          }

          console.log(
            "[AUTH] GOOGLE LOGIN REQUEST"
          );

          const result =
            await loginWithGoogle(
              idToken
            );

          if (!result?.token) {
            throw new Error(
              "Google login succeeded but no authentication token was returned."
            );
          }

          if (!result?.user) {
            throw new Error(
              "Google login succeeded but no user information was returned."
            );
          }

          await initializeE2EE(
            result.user
          );

          setUser(result.user);

          console.log(
            "[AUTH] GOOGLE LOGIN COMPLETE:",
            getUserLabel(result.user)
          );

          return result;
        } catch (googleError) {
          const message =
            getAuthErrorMessage(
              googleError,
              "Unable to complete Google login."
            );

          setError(message);

          console.error(
            "[AUTH] GOOGLE LOGIN ERROR:",
            googleError?.response?.data ||
              googleError?.message ||
              googleError
          );

          throw new Error(message);
        }
      },
      [initializeE2EE]
    );

  const loginWithFacebookAccount =
    useCallback(
      async (accessToken) => {
        try {
          setError(null);

          if (!accessToken) {
            throw new Error(
              "Facebook access token is missing."
            );
          }

          console.log(
            "[AUTH] FACEBOOK LOGIN REQUEST"
          );

          const result =
            await loginWithFacebook(
              accessToken
            );

          if (!result?.token) {
            throw new Error(
              "Facebook login succeeded but no authentication token was returned."
            );
          }

          if (!result?.user) {
            throw new Error(
              "Facebook login succeeded but no user information was returned."
            );
          }

          await initializeE2EE(
            result.user
          );

          setUser(result.user);

          console.log(
            "[AUTH] FACEBOOK LOGIN COMPLETE:",
            getUserLabel(result.user)
          );

          return result;
        } catch (facebookError) {
          const message =
            getAuthErrorMessage(
              facebookError,
              "Unable to complete Facebook login."
            );

          setError(message);

          console.error(
            "[AUTH] FACEBOOK LOGIN ERROR:",
            facebookError?.response?.data ||
              facebookError?.message ||
              facebookError
          );

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

        await initializeE2EE(
          result.user
        );

        setUser(result.user);

        console.log(
          "[AUTH] SOCIAL LOGIN SUCCESS:",
          getUserLabel(result.user)
        );

        return result;
      } catch (socialError) {
        const message =
          getAuthErrorMessage(
            socialError,
            "Unable to complete social login."
          );

        setError(message);

        console.error(
          "[AUTH] SOCIAL LOGIN ERROR:",
          socialError?.response?.data ||
            socialError?.message ||
            socialError
        );

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const register = useCallback(
    async (data = {}) => {
      try {
        setError(null);

        const result =
          await registerUser({
            fullName:
              String(
                data?.fullName ||
                  data?.name ||
                  ""
              ).trim(),

            username:
              String(
                data?.username || ""
              )
                .trim()
                .toLowerCase(),

            email:
              String(
                data?.email || ""
              )
                .trim()
                .toLowerCase(),

            phone:
              String(
                data?.phone || ""
              ).trim(),

            password:
              String(
                data?.password || ""
              ),
          });

        return result;
      } catch (registerError) {
        const message =
          getAuthErrorMessage(
            registerError,
            "Unable to create account."
          );

        setError(message);

        console.error(
          "[AUTH] REGISTER ERROR:",
          registerError?.response?.data ||
            registerError?.message ||
            registerError
        );

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

        console.log(
          "[AUTH] SWITCHING ACCOUNT:",
          accountId
        );

        disconnectSocket();

        await safelyCloseE2EE(
          "DURING ACCOUNT SWITCH"
        );

        const switchedUser =
          await switchSavedAccount(
            accountId
          );

        if (!switchedUser) {
          throw new Error(
            "The selected account could not be activated."
          );
        }

        await initializeE2EE(
          switchedUser
        );

        setUser(switchedUser);

        console.log(
          "[AUTH] ACCOUNT SWITCHED:",
          getUserLabel(switchedUser)
        );

        return switchedUser;
      } catch (switchError) {
        const message =
          getAuthErrorMessage(
            switchError,
            "Unable to switch account."
          );

        setError(message);

        console.error(
          "[AUTH] ACCOUNT SWITCH ERROR:",
          switchError?.response?.data ||
            switchError?.message ||
            switchError
        );

        throw new Error(message);
      }
    },
    [
      initializeE2EE,
      safelyCloseE2EE,
    ]
  );

  const logout = useCallback(
    async () => {
      try {
        setError(null);

        disconnectSocket();

        let result = null;

        try {
          result =
            await logoutUser();
        } catch (logoutRequestError) {
          console.warn(
            "[AUTH] LOGOUT SERVICE WARNING:",
            logoutRequestError?.response
              ?.data ||
              logoutRequestError?.message ||
              logoutRequestError
          );
        }

        await safelyCloseE2EE(
          "DURING LOGOUT"
        );

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

        disconnectSocket();

        await safelyCloseE2EE(
          "AFTER LOGOUT ERROR"
        );

        setUser(null);

        throw logoutError;
      }
    },
    [safelyCloseE2EE]
  );

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,

      login,

      loginWithSocial,

      loginWithGoogle:
        loginWithGoogleAccount,

      loginWithFacebook:
        loginWithFacebookAccount,

      register,

      switchAccount,

      logout,

      restoreSession,

      setUser,
      setError,
    }),
    [
      user,
      loading,
      error,
      login,
      loginWithSocial,
      loginWithGoogleAccount,
      loginWithFacebookAccount,
      register,
      switchAccount,
      logout,
      restoreSession,
    ]
  );

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