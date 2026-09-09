import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";

import {
  loginWithGoogle,
  loginWithFacebook,
} from "../../services/socialAuth";

const PRIMARY_COLOR =
  Colors?.primary || "#0095F6";

export default function LoginScreen() {
  const {
    login,
    loginWithSocial,
    loading: authLoading,
  } = useAuth();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const isLoading =
    loading || authLoading;

  async function handleLogin() {
    if (isLoading) {
      return;
    }

    const cleanIdentifier =
      identifier.trim();

    if (!cleanIdentifier) {
      Alert.alert(
        "Enter your information",
        "Enter your email address, username, or phone number."
      );

      return;
    }

    if (!password) {
      Alert.alert(
        "Enter your password",
        "Please enter your password."
      );

      return;
    }

    try {
      setLoading(true);

      await login(
        cleanIdentifier,
        password
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      Alert.alert(
        "Login failed",
        error?.message ||
          "Incorrect username, email, phone number, or password."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (isLoading) {
      return;
    }

    try {
      setLoading(true);

      const result =
        await loginWithGoogle();

      if (!result?.token) {
        throw new Error(
          "Google login did not return an authentication token."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Google login did not return user information."
        );
      }

      await loginWithSocial(
        result
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error
      );

      Alert.alert(
        "Google login failed",
        error?.message ||
          "Unable to sign in with Google."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
    if (isLoading) {
      return;
    }

    try {
      setLoading(true);

      const result =
        await loginWithFacebook();

      if (!result?.token) {
        throw new Error(
          "Facebook login did not return an authentication token."
        );
      }

      if (!result?.user) {
        throw new Error(
          "Facebook login did not return user information."
        );
      }

      await loginWithSocial(
        result
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.error(
        "FACEBOOK LOGIN ERROR:",
        error
      );

      Alert.alert(
        "Facebook login failed",
        error?.message ||
          "Unable to sign in with Facebook."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    if (isLoading) {
      return;
    }

    router.push(
      "/(auth)/forgot-password"
    );
  }

  function handleRegister() {
    if (isLoading) {
      return;
    }

    router.push(
      "/(auth)/register"
    );
  }

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>
          Snapgram
        </Text>

        <ActivityIndicator
          size="small"
          color="#262626"
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.container}>

            <View style={styles.loginCard}>

              <View
                style={
                  styles.logoContainer
                }
              >
                <Text style={styles.logo}>
                  Snapgram
                </Text>
              </View>

              <View style={styles.form}>

                <TextInput
                  value={identifier}
                  onChangeText={
                    setIdentifier
                  }
                  placeholder="Phone number, username, or email"
                  placeholderTextColor="#8E8E8E"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  textContentType="username"
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <View
                  style={
                    styles.passwordWrapper
                  }
                >
                  <TextInput
                    value={password}
                    onChangeText={
                      setPassword
                    }
                    placeholder="Password"
                    placeholderTextColor="#8E8E8E"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={
                      !showPassword
                    }
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={
                      handleLogin
                    }
                    style={
                      styles.passwordInput
                    }
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(
                        (value) =>
                          !value
                      )
                    }
                    disabled={isLoading}
                    style={
                      styles.showButton
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={
                        styles.showText
                      }
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={[
                    styles.loginButton,
                    isLoading &&
                      styles.loginButtonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      Log in
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={
                    handleForgotPassword
                  }
                  disabled={isLoading}
                  style={
                    styles.forgotButton
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.forgotText
                    }
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>

              </View>

              <View
                style={
                  styles.dividerContainer
                }
              >
                <View
                  style={styles.divider}
                />

                <Text
                  style={styles.orText}
                >
                  OR
                </Text>

                <View
                  style={styles.divider}
                />
              </View>

              <TouchableOpacity
                style={
                  styles.socialButton
                }
                onPress={
                  handleFacebookLogin
                }
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <View
                  style={
                    styles.facebookIcon
                  }
                >
                  <Text
                    style={
                      styles.facebookLetter
                    }
                  >
                    f
                  </Text>
                </View>

                <Text
                  style={
                    styles.facebookText
                  }
                >
                  Log in with Facebook
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.googleButton,
                ]}
                onPress={
                  handleGoogleLogin
                }
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <View
                  style={
                    styles.googleIcon
                  }
                >
                  <Text
                    style={styles.googleG}
                  >
                    G
                  </Text>
                </View>

                <Text
                  style={
                    styles.googleText
                  }
                >
                  Log in with Google
                </Text>
              </TouchableOpacity>

            </View>

            <View
              style={styles.signupCard}
            >
              <Text
                style={styles.signupText}
              >
                Don't have an account?
              </Text>

              <TouchableOpacity
                onPress={
                  handleRegister
                }
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.signupLink
                  }
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.getAppContainer
              }
            >
              <Text
                style={styles.getAppText}
              >
                Get the app.
              </Text>

              <View
                style={
                  styles.storeButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.storeButton
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="logo-google-playstore"
                    size={19}
                    color="#111111"
                  />

                  <Text
                    style={
                      styles.storeText
                    }
                  >
                    Google Play
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.storeButton
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color="#111111"
                  />

                  <Text
                    style={
                      styles.storeText
                    }
                  >
                    App Store
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={styles.footer}
            >
              <Text
                style={styles.footerText}
              >
                © 2026 Snapgram
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  loginCard: {
    width: "100%",
    maxWidth: 350,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 38,
    paddingTop: 38,
    paddingBottom: 28,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 38,
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: -1.8,
  },

  form: {
    width: "100%",
  },

  input: {
    width: "100%",
    height: 42,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    backgroundColor: "#FAFAFA",
    borderRadius: 3,
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#262626",
    marginBottom: 7,
  },

  passwordWrapper: {
    width: "100%",
    height: 42,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    backgroundColor: "#FAFAFA",
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#262626",
  },

  showButton: {
    paddingHorizontal: 10,
    height: "100%",
    justifyContent: "center",
  },

  showText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#262626",
  },

  loginButton: {
    width: "100%",
    height: 34,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  forgotButton: {
    alignItems: "center",
    marginTop: 17,
  },

  forgotText: {
    color: "#00376B",
    fontSize: 12,
    fontWeight: "600",
  },

  dividerContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#DBDBDB",
  },

  orText: {
    marginHorizontal: 15,
    fontSize: 11,
    color: "#8E8E8E",
    fontWeight: "700",
  },

  socialButton: {
    width: "100%",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  facebookIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  facebookLetter: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "900",
    color: "#1877F2",
  },

  facebookText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#385185",
  },

  googleButton: {
    marginTop: 2,
    marginBottom: 0,
  },

  googleIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  googleG: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4285F4",
  },

  googleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#262626",
  },

  signupCard: {
    width: "100%",
    maxWidth: 350,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    marginTop: 10,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  signupText: {
    color: "#262626",
    fontSize: 13,
  },

  signupLink: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  getAppContainer: {
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    marginTop: 24,
  },

  getAppText: {
    color: "#262626",
    fontSize: 12,
    marginBottom: 14,
  },

  storeButtons: {
    flexDirection: "row",
    gap: 8,
  },

  storeButton: {
    minWidth: 125,
    height: 38,
    borderRadius: 5,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  storeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },

  footer: {
    marginTop: 30,
    alignItems: "center",
  },

  footerText: {
    color: "#8E8E8E",
    fontSize: 10,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingLogo: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: "#111111",
    marginBottom: 20,
  },
});