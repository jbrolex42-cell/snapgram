import api from "./api";

export async function loginWithFacebook() {
  try {
    
    let FacebookSDK;

    try {
      FacebookSDK = await import(
        "react-native-fbsdk-next"
      );
    } catch (sdkError) {
      console.error(
        "FACEBOOK SDK LOAD ERROR:",
        sdkError
      );

      throw new Error(
        "Facebook login is not available on this build. Please configure the Facebook Android SDK first."
      );
    }

    const {
      AccessToken,
      LoginManager,
    } = FacebookSDK;

    if (!AccessToken || !LoginManager) {
      throw new Error(
        "Facebook SDK is unavailable."
      );
    }

    const result =
      await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

    if (result?.isCancelled) {
      throw new Error(
        "Facebook login was cancelled."
      );
    }

    const tokenData =
      await AccessToken.getCurrentAccessToken();

    if (!tokenData?.accessToken) {
      throw new Error(
        "Facebook did not return an access token."
      );
    }

    const accessToken =
      typeof tokenData.accessToken === "string"
        ? tokenData.accessToken
        : tokenData.accessToken.toString();

    const response =
      await api.post(
        "/auth/facebook",
        {
          accessToken,
        }
      );

    const data =
      response?.data;

    if (!data?.token) {
      throw new Error(
        "Facebook authentication succeeded but Snapgram did not return a token."
      );
    }

    if (!data?.user) {
      throw new Error(
        "Facebook authentication succeeded but Snapgram did not return user information."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "FACEBOOK AUTH ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to sign in with Facebook.";

    throw new Error(message);
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

    const response =
      await api.post(
        "/auth/google",
        {
          idToken,
        }
      );

    const data =
      response?.data;

    if (!data?.token) {
      throw new Error(
        "Google authentication succeeded but Snapgram did not return a token."
      );
    }

    if (!data?.user) {
      throw new Error(
        "Google authentication succeeded but Snapgram did not return user information."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "GOOGLE AUTH ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to sign in with Google."
    );
  }
}