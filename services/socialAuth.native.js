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

let googleConfigured = false;

function configureGoogle(GoogleSignin) {
  if (googleConfigured) {
    return;
  }

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!webClientId) {
    throw new Error(
      "Google Web Client ID is missing. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Expo environment configuration."
    );
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });

  googleConfigured = true;

  console.log(
    "GOOGLE SIGN-IN CONFIGURED"
  );
}

export async function loginWithFacebook() {
  try {
    console.log(
      "STARTING FACEBOOK LOGIN"
    );

    const FacebookSDK = await import(
      "react-native-fbsdk-next"
    );

    const {
      LoginManager,
      AccessToken,
    } = FacebookSDK;

    if (!LoginManager || !AccessToken) {
      throw new Error(
        "Facebook SDK is unavailable. Please check the native Facebook configuration."
      );
    }

    const loginResult =
      await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

    if (loginResult?.isCancelled) {
      throw new Error(
        "Facebook login was cancelled."
      );
    }

    const tokenResult =
      await AccessToken.getCurrentAccessToken();

    if (!tokenResult?.accessToken) {
      throw new Error(
        "Facebook did not return an access token."
      );
    }

    const accessToken =
      typeof tokenResult.accessToken === "string"
        ? tokenResult.accessToken
        : tokenResult.accessToken.toString();

    console.log(
      "FACEBOOK ACCESS TOKEN RECEIVED: YES"
    );

    const response = await api.post(
      "/auth/facebook",
      {
        accessToken,
      }
    );

    const data = response?.data;

    return validateAuthResponse(
      data,
      "Facebook"
    );
  } catch (error) {
    console.error(
      "FACEBOOK AUTH ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to sign in with Facebook."
      )
    );
  }
}

export async function loginWithGoogle() {
  try {
    console.log(
      "STARTING GOOGLE LOGIN"
    );

    const GoogleSDK = await import(
      "@react-native-google-signin/google-signin"
    );

    const GoogleSignin =
      GoogleSDK?.GoogleSignin;

    if (!GoogleSignin) {
      throw new Error(
        "Google Sign-In SDK is unavailable. Please check @react-native-google-signin/google-signin."
      );
    }

    configureGoogle(GoogleSignin);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    } catch (error) {
      console.error(
        "GOOGLE PLAY SERVICES ERROR:",
        error
      );

      throw new Error(
        "Google Play Services are required for Google login."
      );
    }

    const signInResult =
      await GoogleSignin.signIn();

    console.log(
      "GOOGLE SIGN-IN COMPLETED"
    );

    let idToken =
      signInResult?.data?.idToken ||
      signInResult?.idToken ||
      null;

    if (!idToken) {
      try {
        const tokens =
          await GoogleSignin.getTokens();

        idToken =
          tokens?.idToken ||
          null;
      } catch (error) {
        console.error(
          "GOOGLE TOKEN ERROR:",
          error
        );
      }
    }

    if (!idToken) {
      console.error(
        "GOOGLE SIGN-IN RESULT:",
        signInResult
      );

      throw new Error(
        "Google sign-in completed, but Google did not return an ID token."
      );
    }

    console.log(
      "GOOGLE ID TOKEN RECEIVED: YES"
    );

    return await authenticateGoogle(
      idToken
    );
  } catch (error) {
    console.error(
      "GOOGLE AUTH ERROR:",
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
      "AUTHENTICATING GOOGLE WITH SNAPGRAM BACKEND"
    );

    const response = await api.post(
      "/auth/google",
      {
        idToken,
      }
    );

    const data = response?.data;

    console.log(
      "GOOGLE BACKEND AUTH SUCCESS"
    );

    return validateAuthResponse(
      data,
      "Google"
    );
  } catch (error) {
    console.error(
      "GOOGLE BACKEND AUTH ERROR:",
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

export default {
  loginWithFacebook,
  loginWithGoogle,
  authenticateGoogle,
};