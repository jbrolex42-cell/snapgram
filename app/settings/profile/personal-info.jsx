import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  TextField,
  ChoiceSettings,
  PrimaryButton,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

function normalizeDate(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidBirthday(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();

  if (date > today) {
    return false;
  }

  const minimumYear = today.getFullYear() - 120;

  if (year < minimumYear) {
    return false;
  }

  return true;
}

export default function PersonalInfoScreen() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("Prefer not to say");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const settings = await loadSettings();

      setEmail(
        settings?.email ||
          settings?.personalInfo?.email ||
          ""
      );

      setPhone(
        settings?.phone ||
          settings?.personalInfo?.phone ||
          ""
      );

      setBirthday(
        normalizeDate(
          settings?.birthday ||
            settings?.personalInfo?.birthday ||
            ""
        )
      );

      setGender(
        settings?.gender ||
          settings?.personalInfo?.gender ||
          "Prefer not to say"
      );
    } catch (err) {
      console.error(
        "PERSONAL INFORMATION LOAD ERROR:",
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your personal information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  async function save() {
    if (saving) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanBirthday = birthday.trim();

    if (!cleanEmail) {
      Alert.alert(
        "Email required",
        "Please enter your email address."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert(
        "Invalid email",
        "Please enter a valid email address."
      );
      return;
    }

    if (cleanBirthday && !isValidBirthday(cleanBirthday)) {
      Alert.alert(
        "Invalid birthday",
        "Please enter a valid birthday using YYYY-MM-DD."
      );
      return;
    }

    if (!GENDER_OPTIONS.includes(gender)) {
      Alert.alert(
        "Invalid selection",
        "Please select a valid gender option."
      );
      return;
    }

    const previous = {
      email,
      phone,
      birthday,
      gender,
    };

    setSaving(true);
    setError("");

    try {
      const response = await saveSettings({
        email: cleanEmail,
        phone: cleanPhone,
        birthday: cleanBirthday,
        gender,
      });

      const updated =
        response?.settings ||
        response?.data?.settings ||
        response;

      const serverEmail =
        updated?.email ??
        updated?.personalInfo?.email;

      const serverPhone =
        updated?.phone ??
        updated?.personalInfo?.phone;

      const serverBirthday =
        updated?.birthday ??
        updated?.personalInfo?.birthday;

      const serverGender =
        updated?.gender ??
        updated?.personalInfo?.gender;

      if (typeof serverEmail === "string") {
        setEmail(serverEmail);
      } else {
        setEmail(cleanEmail);
      }

      if (typeof serverPhone === "string") {
        setPhone(serverPhone);
      } else {
        setPhone(cleanPhone);
      }

      if (serverBirthday) {
        setBirthday(normalizeDate(serverBirthday));
      } else {
        setBirthday(cleanBirthday);
      }

      if (
        typeof serverGender === "string" &&
        GENDER_OPTIONS.includes(serverGender)
      ) {
        setGender(serverGender);
      }

      Alert.alert(
        "Changes saved",
        "Your personal information has been updated successfully."
      );
    } catch (err) {
      console.error(
        "PERSONAL INFORMATION SAVE ERROR:",
        err?.response?.data || err?.message || err
      );

      setEmail(previous.email);
      setPhone(previous.phone);
      setBirthday(previous.birthday);
      setGender(previous.gender);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to save your personal information.";

      setError(message);

      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Page
        title="Personal information"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Personal information"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.content}
      >
        <InfoCard
          icon="person-circle-outline"
          title="Personal information"
          text="Manage the personal information associated with your Snapgram account."
        />

        {error ? (
          <Notice tone="error">
            {error}
          </Notice>
        ) : null}

        <Text style={styles.sectionTitle}>
          Contact information
        </Text>

        <Text style={styles.sectionDescription}>
          This information helps Snapgram keep your account secure and
          helps you recover access if you lose your login details.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+254 700 000 000"
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Personal details
        </Text>

        <Text style={styles.sectionDescription}>
          Your birthday and gender help personalize your Snapgram
          experience. You can choose not to provide information where
          appropriate.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Birthday"
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            editable={!saving}
            maxLength={10}
          />

          <ChoiceSettings
            title="Gender"
            options={GENDER_OPTIONS}
            selected={gender}
            onSelect={setGender}
          />
        </View>

        <PrimaryButton
          text={saving ? "Saving..." : "Save changes"}
          disabled={saving}
          onPress={save}
        />

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>
            Your information and privacy
          </Text>

          <Text style={styles.privacyText}>
            Your personal information is associated with your Snapgram
            account. Some information may be used for account security,
            recovery, and platform features.
          </Text>

          <Text style={styles.privacyText}>
            Snapgram will not display your private account information
            publicly simply because you add it here.
          </Text>
        </View>

        <Notice>
          You can manage additional privacy and security controls from
          the Privacy and Password & Security sections.
        </Notice>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 5,
    paddingHorizontal: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  sectionDescription: {
    paddingHorizontal: 4,
    marginBottom: 12,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#777",
  },

  form: {
    width: "100%",
  },

  privacyBox: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },

  privacyTitle: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  privacyText: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
});