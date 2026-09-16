import api from "./api";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function validateAuthResponse(data, provider) {
  if (!data?.token) {
    throw new Error(
      `${provider} authentication succeeded, but Snapgram did not return an authentication token.`
    );
  }

  if (!data?.user) {
    throw new Error(
      `${provider} authentication succeeded, but Snapgram did not return user information.`
    );
  }

  return data;
}

export async function loginWithGoogle() {
  try {
    console.log(
      "STARTING WEB GOOGLE LOGIN"
    );

    const clientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!clientId) {
      throw new Error(
        "Google Web Client ID is missing. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Expo environment configuration."
      );
    }

    if (
      typeof window === "undefined"
    ) {
      throw new Error(
        "Google web login can only run in a browser."
      );
    }

    await loadGoogleScript();

    if (
      !window.google ||
      !window.google.accounts ||
      !window.google.accounts.id
    ) {
      throw new Error(
        "Google Identity Services could not be initialized."
      );
    }

    return await new Promise(
      (resolve, reject) => {
        let completed = false;

        const finishSuccess = async (
          response
        ) => {
          if (completed) {
            return;
          }

          completed = true;

          try {
            const credential =
              response?.credential;

            if (!credential) {
              throw new Error(
                "Google did not return an ID token."
              );
            }

            console.log(
              "GOOGLE WEB ID TOKEN RECEIVED: YES"
            );

            const result =
              await authenticateGoogle(
                credential
              );

            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        const finishError = (
          error
        ) => {
          if (completed) {
            return;
          }

          completed = true;

          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Unable to sign in with Google."
                )
          );
        };

        try {
          window.google.accounts.id.initialize(
            {
              client_id: clientId,

              callback:
                finishSuccess,

              auto_select: false,

              cancel_on_tap_outside: true,
            }
          );

          const container =
            document.createElement(
              "div"
            );

          container.style.position =
            "fixed";

          container.style.left =
            "-10000px";

          container.style.top =
            "-10000px";

          container.style.width =
            "1px";

          container.style.height =
            "1px";

          container.style.overflow =
            "hidden";

          document.body.appendChild(
            container
          );

          window.google.accounts.id.renderButton(
            container,
            {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: 300,
            }
          );

          const button =
            container.querySelector(
              "div[role='button']"
            );

          if (!button) {
            throw new Error(
              "Google Sign-In button could not be initialized."
            );
          }

          button.click();

          const cleanup = () => {
            try {
              container.remove();
            } catch {}
          };

          const originalResolve =
            resolve;

          const originalReject =
            reject;

          void originalResolve;
          void originalReject;

          setTimeout(
            cleanup,
            120000
          );
        } catch (error) {
          finishError(error);
        }
      }
    );
  } catch (error) {
    console.error(
      "GOOGLE WEB AUTH ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to sign in with Google."
      )
    );
  }
}

function loadGoogleScript() {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window !==
          "undefined" &&
        window.google?.accounts?.id
      ) {
        resolve();
        return;
      }

      const existing =
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );

      if (existing) {
        existing.addEventListener(
          "load",
          resolve,
          {
            once: true,
          }
        );

        existing.addEventListener(
          "error",
          () =>
            reject(
              new Error(
                "Unable to load Google Identity Services."
              )
            ),
          {
            once: true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://accounts.google.com/gsi/client";

      script.async = true;

      script.defer = true;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(
          new Error(
            "Unable to load Google Identity Services."
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}

export async function authenticateGoogle(
  idToken
) {
  try {
    if (!idToken) {
      throw new Error(
        "Google ID token is missing."
      );
    }

    console.log(
      "AUTHENTICATING WEB GOOGLE WITH SNAPGRAM BACKEND"
    );

    const response = await api.post(
      "/auth/google",
      {
        idToken,
      }
    );

    const data = response?.data;

    console.log(
      "GOOGLE WEB BACKEND AUTH SUCCESS"
    );

    return validateAuthResponse(
      data,
      "Google"
    );
  } catch (error) {
    console.error(
      "GOOGLE WEB BACKEND AUTH ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to authenticate your Google account with Snapgram."
      )
    );
  }
}

export async function loginWithFacebook() {
  throw new Error(
    "Facebook login is currently available only on Android and iOS."
  );
}

export default {
  loginWithFacebook,
  loginWithGoogle,
  authenticateGoogle,
};