import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Page,
  InfoCard,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const OPTIONS = [
  {
    value: "System",
    apiValue: "system",
    title: "System default",
    description:
      "Use your device's appearance setting.",
    icon: "phone-portrait-outline",
  },
  {
    value: "Light",
    apiValue: "light",
    title: "Light",
    description:
      "Use a light appearance throughout Snapgram.",
    icon: "sunny-outline",
  },
  {
    value: "Dark",
    apiValue: "dark",
    title: "Dark",
    description:
      "Use a dark appearance throughout Snapgram.",
    icon: "moon-outline",
  },
];

function normalizeAppearance(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "light":
      return "Light";

    case "dark":
      return "Dark";

    case "system":
    default:
      return "System";
  }
}

export default function AppearanceScreen() {
  const [selected, setSelected] = useState("System");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAppearance = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await loadSettings();

        const appearance = normalizeAppearance(
          data?.preferences?.appearance
        );

        setSelected(appearance);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load appearance settings.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAppearance();
  }, [loadAppearance]);

  const chooseAppearance = useCallback(
    async (option) => {
      if (
        !option ||
        saving ||
        option.value === selected
      ) {
        return;
      }

      const previousValue = selected;

      setSelected(option.value);
      setSaving(true);
      setError("");

      try {
        await saveSettings({
          appearance: option.apiValue,
        });
      } catch (err) {
        setSelected(previousValue);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save your appearance preference.";

        setError(message);

        Alert.alert(
          "Couldn't save",
          message
        );
      } finally {
        setSaving(false);
      }
    },
    [saving, selected]
  );

  if (loading) {
    return (
      <Page
        title="Appearance"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Appearance"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadAppearance(true)
            }
          />
        }
        contentContainerStyle={styles.content}
      >
        <InfoCard
          icon="contrast-outline"
          title="Appearance"
          text="Choose how Snapgram looks on your device."
        />

        {error ? (
          <View style={styles.notice}>
            <Notice
              type="error"
              title="Something went wrong"
              text={error}
              actionText="Try again"
              onAction={() => loadAppearance()}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            THEME
          </Text>

          <View style={styles.optionsCard}>
            {OPTIONS.map((option, index) => {
              const isSelected =
                selected === option.value;

              return (
                <React.Fragment key={option.value}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={saving}
                    onPress={() =>
                      chooseAppearance(option)
                    }
                    style={[
                      styles.option,
                      saving &&
                        !isSelected &&
                        styles.disabledOption,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        isSelected &&
                          styles.selectedIconContainer,
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={
                          isSelected
                            ? "#0095F6"
                            : "#262626"
                        }
                      />
                    </View>

                    <View style={styles.optionText}>
                      <Text
                        style={styles.optionTitle}
                      >
                        {option.title}
                      </Text>

                      <Text
                        style={
                          styles.optionDescription
                        }
                      >
                        {option.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radio,
                        isSelected &&
                          styles.radioSelected,
                      ]}
                    >
                      {isSelected ? (
                        <View
                          style={styles.radioDot}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {index <
                  OPTIONS.length - 1 ? (
                    <View
                      style={styles.separator}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {saving ? (
          <View style={styles.savingNotice}>
            <Ionicons
              name="sync-outline"
              size={18}
              color="#0095F6"
            />

            <Text style={styles.savingText}>
              Saving your preference…
            </Text>
          </View>
        ) : null}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#737373"
          />

          <Text style={styles.infoText}>
            Your appearance preference is saved to
            your Snapgram account and can be used
            across your devices.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },

  notice: {
    marginTop: 12,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    marginLeft: 4,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#737373",
    letterSpacing: 0.4,
  },

  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DBDBDB",
  },

  option: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  disabledOption: {
    opacity: 0.55,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
    marginRight: 13,
  },

  selectedIconContainer: {
    backgroundColor: "#E8F5FF",
  },

  optionText: {
    flex: 1,
    paddingRight: 12,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#262626",
  },

  optionDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#737373",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#A8A8A8",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#0095F6",
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0095F6",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DBDBDB",
    marginLeft: 71,
  },

  savingNotice: {
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F0F8FF",
    flexDirection: "row",
    alignItems: "center",
  },

  savingText: {
    marginLeft: 9,
    fontSize: 13,
    fontWeight: "500",
    color: "#262626",
  },

  infoBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },
});