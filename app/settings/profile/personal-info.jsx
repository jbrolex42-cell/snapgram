import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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

  const [year, month, day] = value
    .split("-")
    .map(Number);

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

function SettingRow({
  icon,
  title,
  value,
  onPress,
  disabled = false,
  danger = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.row,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#ed4956" : "#111"}
        />
      </View>

      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowTitle,
            danger && styles.dangerText,
          ]}
        >
          {title}
        </Text>

        {value ? (
          <Text
            numberOfLines={1}
            style={styles.rowValue}
          >
            {value}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9a9a9a"
      />
    </TouchableOpacity>
  );
}

function InputRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
  editable = true,
}) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#111"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a3a3a3"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          editable={editable}
          style={styles.input}
          selectionColor="#0095f6"
        />
      </View>
    </View>
  );
}

export default function PersonalInfoScreen() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState(
    "Prefer not to say"
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [showGenderPicker, setShowGenderPicker] =
    useState(false);

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

      const savedGender =
        settings?.gender ||
        settings?.personalInfo?.gender;

      setGender(
        GENDER_OPTIONS.includes(savedGender)
          ? savedGender
          : "Prefer not to say"
      );
    } catch (err) {
      console.error(
        "PERSONAL INFORMATION LOAD ERROR:",
        err?.response?.data ||
          err?.message ||
          err
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

  const save = async () => {
    if (saving) {
      return;
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

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

    if (
      cleanBirthday &&
      !isValidBirthday(cleanBirthday)
    ) {
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

      setEmail(
        typeof serverEmail === "string"
          ? serverEmail
          : cleanEmail
      );

      setPhone(
        typeof serverPhone === "string"
          ? serverPhone
          : cleanPhone
      );

      setBirthday(
        serverBirthday
          ? normalizeDate(serverBirthday)
          : cleanBirthday
      );

      if (
        typeof serverGender === "string" &&
        GENDER_OPTIONS.includes(serverGender)
      ) {
        setGender(serverGender);
      }

      setEditing(null);

      Alert.alert(
        "Changes saved",
        "Your personal information has been updated successfully."
      );
    } catch (err) {
      console.error(
        "PERSONAL INFORMATION SAVE ERROR:",
        err?.response?.data ||
          err?.message ||
          err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to save your personal information.";

      setError(message);

      Alert.alert(
        "Update failed",
        message
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(null);
    setError("");
    load();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color="#111"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Personal information
        </Text>

        <View style={styles.headerRight}>
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#0095f6"
            />
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons
              name="person-circle-outline"
              size={48}
              color="#111"
            />
          </View>

          <Text style={styles.introTitle}>
            Personal information
          </Text>

          <Text style={styles.introText}>
            Manage the personal information
            associated with your Snapgram account.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#d93025"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          Contact information
        </Text>

        <Text style={styles.sectionDescription}>
          Your contact information helps keep
          your account secure and makes account
          recovery easier.
        </Text>

        <View style={styles.card}>
          {editing === "email" ? (
            <>
              <InputRow
                icon="mail-outline"
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={cancelEditing}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={save}
                  disabled={saving}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <SettingRow
              icon="mail-outline"
              title="Email address"
              value={
                email || "Add an email address"
              }
              onPress={() => setEditing("email")}
              disabled={saving}
            />
          )}

          <View style={styles.divider} />

          {editing === "phone" ? (
            <>
              <InputRow
                icon="call-outline"
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+254 700 000 000"
                keyboardType="phone-pad"
                editable={!saving}
              />

              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={cancelEditing}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={save}
                  disabled={saving}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <SettingRow
              icon="call-outline"
              title="Phone number"
              value={
                phone || "Add a phone number"
              }
              onPress={() => setEditing("phone")}
              disabled={saving}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Personal details
        </Text>

        <Text style={styles.sectionDescription}>
          Your birthday and gender help personalize
          your Snapgram experience.
        </Text>

        <View style={styles.card}>
          {editing === "birthday" ? (
            <>
              <InputRow
                icon="calendar-outline"
                label="Birthday"
                value={birthday}
                onChangeText={setBirthday}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                editable={!saving}
              />

              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={cancelEditing}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={save}
                  disabled={saving}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneText}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <SettingRow
              icon="calendar-outline"
              title="Birthday"
              value={
                birthday || "Add your birthday"
              }
              onPress={() => setEditing("birthday")}
              disabled={saving}
            />
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.65}
            disabled={saving}
            onPress={() =>
              setShowGenderPicker(
                !showGenderPicker
              )
            }
            style={styles.row}
          >
            <View style={styles.rowIcon}>
              <Ionicons
                name="male-female-outline"
                size={22}
                color="#111"
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>
                Gender
              </Text>

              <Text style={styles.rowValue}>
                {gender}
              </Text>
            </View>

            <Ionicons
              name={
                showGenderPicker
                  ? "chevron-up"
                  : "chevron-forward"
              }
              size={20}
              color="#9a9a9a"
            />
          </TouchableOpacity>

          {showGenderPicker ? (
            <View style={styles.genderPicker}>
              {GENDER_OPTIONS.map(
                (option, index) => (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.7}
                    disabled={saving}
                    onPress={() => {
                      setGender(option);
                      setShowGenderPicker(false);
                    }}
                    style={[
                      styles.genderOption,
                      index !==
                        GENDER_OPTIONS.length - 1 &&
                        styles.genderDivider,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === option &&
                          styles.genderSelectedText,
                      ]}
                    >
                      {option}
                    </Text>

                    {gender === option ? (
                      <Ionicons
                        name="checkmark"
                        size={21}
                        color="#0095f6"
                      />
                    ) : null}
                  </TouchableOpacity>
                )
              )}
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={save}
          disabled={saving}
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Save changes
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#555"
          />

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Your information and privacy
            </Text>

            <Text style={styles.infoText}>
              Your personal information is
              associated with your Snapgram
              account. Adding this information does
              not automatically make it public on
              your profile.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          You can manage additional privacy and
          security controls from Privacy and
          Password & Security.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  headerRight: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 50,
  },

  intro: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  introIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  introText: {
    maxWidth: 330,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#fff2f2",
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#d93025",
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  sectionDescription: {
    marginBottom: 10,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  card: {
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },

  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  rowDisabled: {
    opacity: 0.55,
  },

  rowIcon: {
    width: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
    paddingRight: 10,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },

  rowValue: {
    marginTop: 3,
    fontSize: 13,
    color: "#737373",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 42,
    backgroundColor: "#e5e5e5",
  },

  inputRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainer: {
    flex: 1,
  },

  inputLabel: {
    marginBottom: 1,
    fontSize: 12,
    color: "#737373",
  },

  input: {
    height: 36,
    padding: 0,
    fontSize: 15,
    color: "#111",
  },

  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingBottom: 12,
  },

  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#efefef",
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  doneButton: {
    paddingHorizontal: 17,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0095f6",
  },

  doneText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  genderPicker: {
    marginLeft: 42,
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
  },

  genderOption: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  genderDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dedede",
  },

  genderText: {
    fontSize: 14,
    color: "#222",
  },

  genderSelectedText: {
    fontWeight: "600",
    color: "#0095f6",
  },

  saveButton: {
    height: 46,
    marginTop: 24,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  infoBox: {
    flexDirection: "row",
    gap: 12,
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  infoText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  footerText: {
    marginTop: 16,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#8a8a8a",
  },

  dangerText: {
    color: "#ed4956",
  },
});