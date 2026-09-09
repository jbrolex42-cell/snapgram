import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Page,
  InfoCard,
  Notice,
  SwitchRow,
  PageLoading,
} from "../../../components/settings/SettingsUI";

import {
  loadSettings,
  saveSettings,
} from "../../../services/settingsApi";

const USAGE_STORAGE_KEY = "snapgram_time_spent";

const LIMIT_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

export default function TimeSpentScreen() {
  const [dailyLimit, setDailyLimit] = useState(0);
  const [reminders, setReminders] = useState(true);

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [settings, usageRaw] = await Promise.all([
        loadSettings(),
        AsyncStorage.getItem(USAGE_STORAGE_KEY),
      ]);

      const preferences = settings?.preferences?.timeSpent || {};

      setDailyLimit(
        Number(preferences.dailyLimitMinutes || 0)
      );

      setReminders(
        preferences.reminders ?? true
      );

      let usage = {};

      try {
        usage = usageRaw ? JSON.parse(usageRaw) : {};
      } catch {
        usage = {};
      }

      const days = getLastSevenDays();

      const values = days.map((day) => {
        return Number(usage[day.key] || 0);
      });

      const todayKey = getDateKey(new Date());

      setTodayMinutes(
        Number(usage[todayKey] || 0)
      );

      setWeeklyMinutes(
        values.reduce((total, value) => total + value, 0)
      );

      setWeeklyData(
        days.map((day, index) => ({
          ...day,
          minutes: values[index],
        }))
      );
    } catch (error) {
      console.error(
        "TIME SPENT LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const averageMinutes = useMemo(() => {
    if (!weeklyData.length) return 0;

    return Math.round(
      weeklyMinutes / weeklyData.length
    );
  }, [weeklyMinutes, weeklyData]);

  const progress = useMemo(() => {
    if (!dailyLimit) return 0;

    return Math.min(
      todayMinutes / dailyLimit,
      1
    );
  }, [todayMinutes, dailyLimit]);

  const remainingMinutes = useMemo(() => {
    if (!dailyLimit) return null;

    return Math.max(
      dailyLimit - todayMinutes,
      0
    );
  }, [dailyLimit, todayMinutes]);

  async function updatePreference(key, value) {
    try {
      setSaving(true);

      if (key === "dailyLimitMinutes") {
        setDailyLimit(value);
      }

      if (key === "reminders") {
        setReminders(value);
      }

      await saveSettings({
        timeSpent: {
          [key]: value,
        },
      });
    } catch (error) {
      console.error(
        "TIME SPENT SAVE ERROR:",
        error
      );

      await load();

      Alert.alert(
        "Couldn't save",
        "Your time-spent preference could not be updated. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function chooseLimit() {
    Alert.alert(
      "Daily time limit",
      "Choose how much time you want to spend on Snapgram each day.",
      LIMIT_OPTIONS.map((option) => ({
        text:
          option.value === dailyLimit
            ? `✓ ${option.label}`
            : option.label,
        onPress: () =>
          updatePreference(
            "dailyLimitMinutes",
            option.value
          ),
      }))
    );
  }

  function formatMinutes(minutes) {
    const value = Number(minutes || 0);

    if (value < 60) {
      return `${value} min`;
    }

    const hours = Math.floor(value / 60);
    const mins = value % 60;

    if (!mins) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }

  if (loading) {
    return (
      <Page
        title="Time spent"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Time spent"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <InfoCard
          icon="time-outline"
          title="Time spent"
          text="Manage how much time you spend on Snapgram and set reminders to help you take breaks."
        />

        {/* Today's usage */}
        <View style={styles.usageCard}>
          <Text style={styles.sectionLabel}>
            TODAY
          </Text>

          <Text style={styles.todayValue}>
            {formatMinutes(todayMinutes)}
          </Text>

          <Text style={styles.todaySubtitle}>
            Time spent on Snapgram today
          </Text>

          {dailyLimit > 0 ? (
            <>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.remainingText}>
                {remainingMinutes > 0
                  ? `${formatMinutes(
                      remainingMinutes
                    )} remaining today`
                  : "You've reached your daily limit"}
              </Text>
            </>
          ) : (
            <Text style={styles.remainingText}>
              No daily limit is currently set.
            </Text>
          )}
        </View>

        {/* Weekly overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Your weekly activity
          </Text>

          <Text style={styles.cardSubtitle}>
            Average {formatMinutes(averageMinutes)} per day
          </Text>

          <View style={styles.chart}>
            {weeklyData.map((day) => {
              const maxMinutes = Math.max(
                ...weeklyData.map(
                  (item) => item.minutes
                ),
                30
              );

              const height = Math.max(
                8,
                (day.minutes / maxMinutes) * 90
              );

              return (
                <View
                  key={day.key}
                  style={styles.chartColumn}
                >
                  <Text style={styles.chartValue}>
                    {day.minutes}
                  </Text>

                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                      },
                    ]}
                  />

                  <Text style={styles.dayLabel}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.weekSummary}>
            <View>
              <Text style={styles.summaryLabel}>
                TOTAL
              </Text>
              <Text style={styles.summaryValue}>
                {formatMinutes(weeklyMinutes)}
              </Text>
            </View>

            <View>
              <Text style={styles.summaryLabel}>
                DAILY AVERAGE
              </Text>
              <Text style={styles.summaryValue}>
                {formatMinutes(averageMinutes)}
              </Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <Text style={styles.sectionHeading}>
          Manage your time
        </Text>

        <Pressable
          style={styles.settingRow}
          onPress={chooseLimit}
          disabled={saving}
        >
          <View style={styles.settingIcon}>
            <Text style={styles.iconText}>
              ⏱
            </Text>
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>
              Daily time limit
            </Text>

            <Text style={styles.settingSubtitle}>
              {dailyLimit
                ? `Remind me after ${formatMinutes(
                    dailyLimit
                  )} each day.`
                : "No daily time limit"}
            </Text>
          </View>

          <Text style={styles.chevron}>
            ›
          </Text>
        </Pressable>

        <SwitchRow
          title="Daily reminder"
          subtitle={
            reminders
              ? "You'll receive reminders about your daily time limit."
              : "Daily time reminders are turned off."
          }
          value={reminders}
          onChange={(value) =>
            updatePreference(
              "reminders",
              value
            )
          }
        />

        {/* Break reminder */}
        <SwitchRow
          title="Take a break reminder"
          subtitle="Get occasional reminders to step away from Snapgram."
          value={
            false
          }
          onChange={() =>
            Alert.alert(
              "Coming next",
              "Break reminders will be connected to the notification service in the next step."
            )
          }
        />

        {/* Information */}
        <Notice>
          Time-spent totals on this screen are tracked locally on this
          device. For account-wide usage across multiple devices, the
          backend needs a dedicated time-tracking service.
        </Notice>
      </ScrollView>
    </Page>
  );
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLastSevenDays() {
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();

    date.setDate(
      date.getDate() - index
    );

    days.push({
      key: getDateKey(date),
      label: date.toLocaleDateString(
        undefined,
        {
          weekday: "short",
        }
      ).slice(0, 1),
    });
  }

  return days;
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },

  usageCard: {
    marginTop: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#f7f7f7",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.55,
  },

  todayValue: {
    marginTop: 8,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },

  todaySubtitle: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.6,
  },

  progressTrack: {
    height: 8,
    marginTop: 20,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "#dedede",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#111",
  },

  remainingText: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.65,
  },

  card: {
    marginTop: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#f7f7f7",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.55,
  },

  chart: {
    height: 145,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  chartColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  chartValue: {
    marginBottom: 5,
    fontSize: 9,
    opacity: 0.45,
  },

  bar: {
    width: 18,
    minHeight: 8,
    borderRadius: 10,
    backgroundColor: "#111",
  },

  dayLabel: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.55,
  },

  weekSummary: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    opacity: 0.45,
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700",
  },

  sectionHeading: {
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.55,
  },

  settingRow: {
    minHeight: 76,
    paddingVertical: 14,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 42,
    height: 42,
    marginRight: 12,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
  },

  iconText: {
    fontSize: 20,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  settingSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
  },

  chevron: {
    marginLeft: 8,
    fontSize: 28,
    fontWeight: "300",
    opacity: 0.4,
  },
});

