import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import AuthButton from "../../components/auth/AuthButton";
import AuthInput from "../../components/auth/AuthInput";
import Colors from "../../constants/Colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert(
        "Email required",
        "Enter your email address."
      );
      return;
    }

    setLoading(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    );

    setLoading(false);

    Alert.alert(
      "Check your email",
      "If an account exists for this email, reset instructions will be sent."
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>Snapgram</Text>

        <Text style={styles.title}>
          Reset your password
        </Text>

        <Text style={styles.description}>
          Enter the email address associated with your
          Snapgram account.
        </Text>

        <AuthInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <AuthButton
          title="Send reset link"
          onPress={handleReset}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    justifyContent: "center",
  },

  back: {
    position: "absolute",
    top: 20,
    left: 25,
  },

  backText: {
    fontSize: 17,
    color: Colors.primary,
  },

  logo: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -2,
    marginBottom: 20,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },

  description: {
    textAlign: "center",
    color: Colors.secondaryText,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 25,
  },
});