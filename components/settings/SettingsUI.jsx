import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export const ACCENT = "#0095F6";
export const DANGER = "#ED4956";
export const SUCCESS = "#34C759";

const LIGHT_THEME = {
  mode: "light",

  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F7F7F7",
  inputBackground: "#FAFAFA",

  text: "#111111",
  textSecondary: "#737373",
  textMuted: "#999999",

  border: "#EFEFEF",
  borderStrong: "#DBDBDB",

  iconBackground: "#F5F5F5",
  icon: "#111111",

  disabled: "#E5E5E5",

  infoBackground: "#F0F8FF",
  successBackground: "#EFFAF2",
  dangerBackground: "#FFF2F3",
};

const DARK_THEME = {
  mode: "dark",

  background: "#000000",
  surface: "#000000",
  surfaceSecondary: "#121212",
  inputBackground: "#181818",

  text: "#F5F5F5",
  textSecondary: "#A8A8A8",
  textMuted: "#737373",

  border: "#262626",
  borderStrong: "#363636",

  iconBackground: "#1C1C1C",
  icon: "#F5F5F5",

  disabled: "#303030",

  infoBackground: "#071923",
  successBackground: "#071A0D",
  dangerBackground: "#210B0E",
};

function getTheme(mode, systemScheme) {
  if (mode === "dark") {
    return DARK_THEME;
  }

  if (mode === "light") {
    return LIGHT_THEME;
  }

  return systemScheme === "dark"
    ? DARK_THEME
    : LIGHT_THEME;
}

const ThemeContext = createContext({
  appearance: "system",
  theme: LIGHT_THEME,
  setAppearance: () => {},
});

export function SettingsThemeProvider({
  appearance = "system",
  children,
}) {
  const systemScheme = useColorScheme();

  const theme = useMemo(
    () =>
      getTheme(
        appearance,
        systemScheme
      ),
    [appearance, systemScheme]
  );

  const setAppearance = useCallback(
    () => {},
    []
  );

  const value = useMemo(
    () => ({
      appearance,
      theme,
      setAppearance,
    }),
    [appearance, theme, setAppearance]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useSettingsTheme() {
  return useContext(ThemeContext);
}

export function Page({
  children,
  title,
  onBack,
  scroll = true,
  loading = false,
}) {
  const { theme } = useSettingsTheme();

  const body = loading ? (
    <PageLoading />
  ) : (
    children
  );

  return (
    <View
      style={[
        styles.page,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      {title ? (
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                theme.surface,
              borderBottomColor:
                theme.border,
            },
          ]}
        >
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </Pressable>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {title}
          </Text>

          <View style={styles.headerSpace} />
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              backgroundColor:
                theme.background,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

export function PageLoading({
  text = "Loading settings...",
}) {
  const { theme } = useSettingsTheme();

  return (
    <View
      style={[
        styles.loading,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <ActivityIndicator
        size="small"
        color={ACCENT}
      />

      <Text
        style={[
          styles.loadingText,
          {
            color: theme.textSecondary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function InfoCard({
  icon = "settings-outline",
  title,
  text,
}) {
  const { theme } = useSettingsTheme();

  return (
    <View style={styles.infoBlock}>
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor:
              theme.iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={27}
          color={theme.icon}
        />
      </View>

      <Text
        style={[
          styles.infoTitle,
          {
            color: theme.text,
          },
        ]}
      >
        {title}
      </Text>

      {text ? (
        <Text
          style={[
            styles.infoText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {text}
        </Text>
      ) : null}
    </View>
  );
}

export function SettingItem({
  title,
  subtitle,
  icon,
  onPress,
  danger = false,
  right,
}) {
  const { theme } = useSettingsTheme();

  const content = (
    <>
      {icon ? (
        <View style={styles.itemIcon}>
          <Ionicons
            name={icon}
            size={20}
            color={
              danger
                ? DANGER
                : theme.icon
            }
          />
        </View>
      ) : null}

      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemTitle,
            {
              color: danger
                ? DANGER
                : theme.text,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.itemSubtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ||
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textMuted}
          />
        ) : null)}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.row,
          {
            borderBottomColor:
              theme.border,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor:
            theme.border,
        },
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
}) {
  const { theme } = useSettingsTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor:
            theme.border,
        },
      ]}
    >
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemTitle,
            {
              color: theme.text,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.itemSubtitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{
          false: theme.disabled,
          true: ACCENT,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={
          theme.disabled
        }
      />
    </View>
  );
}

export function ChoiceSettings({
  title,
  options,
  selected,
  onSelect,
}) {
  const { theme } = useSettingsTheme();

  return (
    <View>
      {title ? (
        <Text
          style={[
            styles.choiceTitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}

      <View
        style={[
          styles.choiceContainer,
          {
            backgroundColor:
              theme.surface,
            borderColor:
              theme.borderStrong,
          },
        ]}
      >
        {options.map(
          (option, index) => {
            const isSelected =
              selected === option;

            return (
              <React.Fragment key={option}>
                <Pressable
                  onPress={() =>
                    onSelect(option)
                  }
                  style={({ pressed }) => [
                    styles.choiceRow,
                    {
                      backgroundColor:
                        theme.surface,
                    },
                    pressed &&
                      styles.choicePressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected:
                      isSelected,
                  }}
                  accessibilityLabel={
                    option
                  }
                >
                  <Text
                    style={[
                      styles.itemTitle,
                      {
                        color:
                          isSelected
                            ? ACCENT
                            : theme.text,
                        fontWeight:
                          isSelected
                            ? "700"
                            : "500",
                      },
                    ]}
                  >
                    {option}
                  </Text>

                  <Ionicons
                    name={
                      isSelected
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={23}
                    color={
                      isSelected
                        ? ACCENT
                        : theme.textMuted
                    }
                  />
                </Pressable>

                {index <
                options.length - 1 ? (
                  <View
                    style={[
                      styles.choiceSeparator,
                      {
                        backgroundColor:
                          theme.border,
                      },
                    ]}
                  />
                ) : null}
              </React.Fragment>
            );
          }
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({
  text,
  onPress,
  disabled = false,
  danger = false,
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        danger && styles.dangerButton,
        disabled &&
          styles.disabledButton,
      ]}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
    >
      <Text style={styles.buttonText}>
        {text}
      </Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  ...props
}) {
  const { theme } = useSettingsTheme();

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: theme.text,
          },
        ]}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          theme.textMuted
        }
        multiline={multiline}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor:
              theme.inputBackground,
            borderColor:
              theme.borderStrong,
          },
          multiline &&
            styles.multiline,
        ]}
        {...props}
      />
    </View>
  );
}

export function SectionHeading({
  children,
}) {
  const { theme } = useSettingsTheme();

  return (
    <Text
      style={[
        styles.sectionHeading,
        {
          color:
            theme.textSecondary,
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function Notice({
  children,
  tone = "neutral",
  type,
  title,
  text,
  actionText,
  onAction,
}) {
  const { theme } = useSettingsTheme();

  const resolvedTone =
    type === "error"
      ? "danger"
      : type === "success"
      ? "success"
      : type === "info"
      ? "info"
      : tone;

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor:
            theme.surfaceSecondary,
        },
        resolvedTone ===
          "danger" && {
          backgroundColor:
            theme.dangerBackground,
        },
        resolvedTone ===
          "success" && {
          backgroundColor:
            theme.successBackground,
        },
        resolvedTone ===
          "info" && {
          backgroundColor:
            theme.infoBackground,
        },
      ]}
    >
      {title ? (
        <Text
          style={[
            styles.noticeTitle,
            {
              color: theme.text,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}

      {text ? (
        <Text
          style={[
            styles.noticeText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {text}
        </Text>
      ) : null}

      {children ? (
        <Text
          style={[
            styles.noticeText,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {children}
        </Text>
      ) : null}

      {actionText && onAction ? (
        <Pressable
          onPress={onAction}
          style={styles.noticeAction}
          accessibilityRole="button"
        >
          <Text
            style={styles.noticeActionText}
          >
            {actionText}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorText({
  children,
}) {
  return (
    <Text style={styles.errorText}>
      {children}
    </Text>
  );
}

export function capitalizeChoice(value) {
  if (!value) return "Everyone";

  if (value === "no_one") {
    return "No one";
  }

  if (value === "following") {
    return "Following";
  }

  return "Everyone";
}

export function toSettingValue(value) {
  if (value === "No one") {
    return "no_one";
  }

  if (value === "Following") {
    return "following";
  }

  return "everyone";
}

export const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  header: {
    height: 54,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },

  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpace: {
    width: 40,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  infoBlock: {
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: 24,
  },

  infoIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  infoText: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },

  row: {
    minHeight: 64,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rowPressed: {
    opacity: 0.55,
  },

  itemIcon: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  itemContent: {
    flex: 1,
    paddingRight: 12,
  },

  itemTitle: {
    fontSize: 15,
  },

  itemSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
  },

  danger: {
    color: DANGER,
  },

  sectionHeading: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  choiceTitle: {
    marginBottom: 8,
    fontSize: 13,
  },

  choiceContainer: {
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },

  choiceRow: {
    minHeight: 56,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  choicePressed: {
    opacity: 0.65,
  },

  choiceSeparator: {
    height:
      StyleSheet.hairlineWidth,
    marginLeft: 15,
  },

  button: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  dangerButton: {
    backgroundColor: DANGER,
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  field: {
    marginTop: 14,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "700",
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },

  multiline: {
    minHeight: 130,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  notice: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
  },

  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  noticeText: {
    fontSize: 13,
    lineHeight: 19,
  },

  noticeAction: {
    marginTop: 9,
    alignSelf: "flex-start",
  },

  noticeActionText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },

  errorText: {
    marginTop: 7,
    color: DANGER,
    fontSize: 13,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
});