import {
  AccessToken,
  LoginManager,
} from "react-native-fbsdk-next";

import api from "./api";

/* ============================================================
   FACEBOOK LOGIN
============================================================ */

export async function loginWithFacebook() {
  try {
    /*
     * Open native Facebook login.
     */
    const result =
      await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

    /*
     * User cancelled Facebook login.
     */
    if (result.isCancelled) {
      throw new Error(
        "Facebook login was cancelled."
      );
    }

    /*
     * Get Facebook access token.
     */
    const tokenData =
      await AccessToken.getCurrentAccessToken();

    if (!tokenData?.accessToken) {
      throw new Error(
        "Facebook did not return an access token."
      );
    }

    const accessToken =
      tokenData.accessToken.toString();

    /*
     * Send Facebook token to Snapgram backend.
     *
     * Backend:
     * POST /api/auth/facebook
     *
     * Backend verifies Facebook and returns:
     *
     * {
     *   token,
     *   user
     * }
     */
    const response =
      await api.post(
        "/auth/facebook",
        {
          accessToken,
        }
      );

    const data =
      response.data;

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

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Unable to sign in with Facebook."
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

    const response =
      await api.post(
        "/auth/google",
        {
          idToken,
        }
      );

    const data =
      response.data;

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