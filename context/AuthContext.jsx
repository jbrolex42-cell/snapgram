import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  const restoreSession = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const session =
          await restoreAuthSession();

        const token = session?.token;
        const storedUser = session?.user;

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

        const currentUser =
          await getCurrentUser();

        if (!currentUser) {
          throw new Error(
            "Unable to restore authenticated user."
          );
        }

        await initializeE2EE(
          currentUser
        );

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
          getAuthErrorMessage(
            restoreError,
            "Unable to restore your session."
          );

        if (
          status === 401 ||
          status === 403
        ) {
          console.log(
            "[AUTH] SAVED AUTH TOKEN IS INVALID."
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
    },
    [initializeE2EE]
  );

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
          result.user?.username ||
            result.user?.email ||
            result.user?._id ||
            result.user?.id
        );

        return result;
      } catch (loginError) {
        const message =
          getAuthErrorMessage(
            loginError,
            "Unable to login."
          );

        setError(message);

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
            result.user?.username ||
              result.user?.email ||
              result.user?._id ||
              result.user?.id
          );

          return result;
        } catch (googleError) {
          const message =
            getAuthErrorMessage(
              googleError,
              "Unable to complete Google login."
            );

          setError(message);

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
            result.user?.username ||
              result.user?.email ||
              result.user?._id ||
              result.user?.id
          );

          return result;
        } catch (facebookError) {
          const message =
            getAuthErrorMessage(
              facebookError,
              "Unable to complete Facebook login."
            );

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

        const {
          saveAuthSession,
        } = await import(
          "../services/authService"
        );

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
          result.user?.username ||
            result.user?.email ||
            result.user?._id ||
            result.user?.id
        );

        return result;
      } catch (socialError) {
        const message =
          getAuthErrorMessage(
            socialError,
            "Unable to complete social login."
          );

        setError(message);

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

        await initializeE2EE(
          switchedUser
        );

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
          getAuthErrorMessage(
            switchError,
            "Unable to switch account."
          );

        setError(message);

        throw new Error(message);
      }
    },
    [initializeE2EE]
  );

  const logout = useCallback(
    async () => {
      try {
        setError(null);

        disconnectSocket();

        let result = null;

        try {
          result = await logoutUser();
        } catch (logoutRequestError) {

          console.warn(
            "[AUTH] LOGOUT SERVICE WARNING:",
            logoutRequestError?.response
              ?.data ||
              logoutRequestError?.message ||
              logoutRequestError
          );
        }

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
    },
    []
  );

  const contextValue = {
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