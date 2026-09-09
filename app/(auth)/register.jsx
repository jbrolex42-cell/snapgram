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

const PRIMARY_COLOR = Colors?.primary || "#0095F6";

export default function RegisterScreen() {
  const { register, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const isLoading = loading || authLoading;

  async function handleRegister() {
    if (isLoading) return;

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanUsername ||
      !cleanEmail ||
      !cleanPhone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing information",
        "Please complete all fields."
      );
      return;
    }

    if (cleanUsername.length < 3) {
      Alert.alert(
        "Invalid username",
        "Username must contain at least 3 characters."
      );
      return;
    }

    if (!/^[a-z0-9._]+$/.test(cleanUsername)) {
      Alert.alert(
        "Invalid username",
        "Use only lowercase letters, numbers, periods, and underscores."
      );
      return;
    }

    if (!cleanEmail.includes("@")) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password too short",
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure both passwords are the same."
      );
      return;
    }

    try {
      setLoading(true);

      const fullName =
        `${cleanFirstName} ${cleanLastName}`.trim();

      await register({
        name: fullName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      Alert.alert(
        "Account created",
        "Your Snapgram account has been created successfully.",
        [
          {
            text: "Log in",
            onPress: () => {
              router.replace("/(auth)/login");
            },
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Registration failed",
        error?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (isLoading) return;

    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            
            <View style={styles.card}>
            
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>Snapgram</Text>

                <Text style={styles.subtitle}>
                  Sign up to see photos and videos from your
                  friends.
                </Text>
              </View>

              
              <View style={styles.form}>
                
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#8E8E8E"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#8E8E8E"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <TextInput
                  value={username}
                  onChangeText={(value) =>
                    setUsername(value.toLowerCase())
                  }
                  placeholder="Username"
                  placeholderTextColor="#8E8E8E"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#8E8E8E"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="next"
                    style={styles.passwordInput}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    disabled={isLoading}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#262626"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#8E8E8E"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    style={styles.passwordInput}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    disabled={isLoading}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#262626"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.signupButton,
                    isLoading &&
                      styles.signupButtonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.signupButtonText}>
                      Sign up
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.infoText}>
                People who use our service may have uploaded
                your contact information to Snapgram.
              </Text>

              <Text style={styles.termsText}>
                By signing up, you agree to our Terms, Privacy
                Policy and Cookies Policy.
              </Text>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />

                <Text style={styles.orText}>OR</Text>

                <View style={styles.divider} />
              </View>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Have an account?
                </Text>

                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
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
    paddingVertical: 24,
  },

  container: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 350,
    paddingHorizontal: 28,
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: "#111111",
  },

  subtitle: {
    marginTop: 10,
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#737373",
    fontSize: 13,
    lineHeight: 18,
  },

  form: {
    width: "100%",
  },

  input: {
    width: "100%",
    height: 40,
    marginBottom: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 3,
    backgroundColor: "#FAFAFA",
    color: "#262626",
    fontSize: 12,
  },

  passwordContainer: {
    width: "100%",
    height: 40,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 3,
    backgroundColor: "#FAFAFA",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    color: "#262626",
    fontSize: 12,
  },

  eyeButton: {
    width: 42,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  signupButton: {
    width: "100%",
    height: 36,
    marginTop: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
  },

  signupButtonDisabled: {
    opacity: 0.6,
  },

  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  infoText: {
    marginTop: 18,
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#737373",
    fontSize: 11,
    lineHeight: 16,
  },

  termsText: {
    marginTop: 12,
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#737373",
    fontSize: 11,
    lineHeight: 16,
  },

  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#DBDBDB",
  },

  orText: {
    marginHorizontal: 18,
    color: "#737373",
    fontSize: 11,
    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    color: "#737373",
    fontSize: 13,
  },

  loginLink: {
    marginLeft: 5,
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: "700",
  },

  footerContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  footerText: {
    color: "#8E8E8E",
    fontSize: 11,
  },
});