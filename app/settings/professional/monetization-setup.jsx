import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Page,
  InfoCard,
  SettingItem,
  Notice,
  PageLoading,
  PrimaryButton,
} from "../../../components/settings/SettingsUI";

import {
  getMonetizationSetup,
  updateMonetizationSetup,
  completeMonetizationSetup,
} from "../../../services/monetizationSetupApi";

export default function MonetizationSetupScreen() {
  const [setup, setSetup] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadSetup = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data =
          await getMonetizationSetup();

        setSetup(data);
      } catch (requestError) {
        console.error(
          "MONETIZATION SETUP LOAD ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        setError(
          requestError?.response?.data
            ?.message ||
            requestError?.message ||
            "Unable to load monetization setup."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  const progress =
    setup?.progress || {
      completed: 0,
      total: 4,
      percentage: 0,
    };

  const paymentComplete =
    Boolean(
      setup?.paymentInformationComplete
    );

  const taxComplete =
    Boolean(
      setup?.taxInformationComplete
    );

  const preferencesComplete =
    Boolean(
      setup?.preferencesComplete
    );

  const setupComplete =
    Boolean(
      setup?.setupComplete
    );

  const payoutMethod =
    setup?.payoutMethod;

  const taxStatus =
    setup?.taxStatus ||
    "not_started";

  const progressText =
    `${progress.completed}/${progress.total} steps completed`;

  async function startSetup() {
    try {
      setSaving(true);

      const updated =
        await updateMonetizationSetup({
          setupStarted: true,
        });

      setSetup((current) => ({
        ...current,
        ...updated,
      }));
    } catch (requestError) {
      Alert.alert(
        "Unable to start setup",
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openPaymentInformation() {
    router.push(
      "/settings/monetization-payouts"
    );
  }

  async function markPaymentComplete() {
    try {
      setSaving(true);

      const updated =
        await updateMonetizationSetup({
          setupStarted: true,
          paymentInformationComplete:
            true,
        });

      setSetup((current) => ({
        ...current,
        ...updated,
      }));
    } catch (requestError) {
      Alert.alert(
        "Unable to update payment setup",
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openTaxInformation() {
    Alert.alert(
      "Tax information",
      "Your tax country and tax status can be completed here. Actual tax identification information should be handled through a secure tax/payment provider rather than stored directly in the mobile app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as complete",
          onPress: async () => {
            try {
              setSaving(true);

              const updated =
                await updateMonetizationSetup(
                  {
                    setupStarted: true,
                    taxInformationComplete:
                      true,
                    taxStatus:
                      "complete",
                  }
                );

              setSetup((current) => ({
                ...current,
                ...updated,
              }));
            } catch (requestError) {
              Alert.alert(
                "Unable to update tax setup",
                requestError?.response?.data
                  ?.message ||
                  requestError?.message ||
                  "Please try again."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  async function openPreferences() {
    router.push(
      "/settings/monetization"
    );
  }

  async function togglePreferencesComplete() {
    try {
      setSaving(true);

      const updated =
        await updateMonetizationSetup({
          setupStarted: true,
          preferencesComplete:
            !preferencesComplete,
        });

      setSetup((current) => ({
        ...current,
        ...updated,
      }));
    } catch (requestError) {
      Alert.alert(
        "Unable to update preferences",
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function finishSetup() {
    try {
      setSaving(true);

      const result =
        await completeMonetizationSetup();

      setSetup((current) => ({
        ...current,
        ...result,
        setupComplete: true,
      }));

      Alert.alert(
        "Setup complete",
        "Your monetization setup has been completed. Eligibility and available programs are controlled by the server.",
        [
          {
            text: "Done",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (requestError) {
      Alert.alert(
        "Setup is incomplete",
        requestError?.response?.data
          ?.message ||
          requestError?.message ||
          "Complete all required steps first."
      );

      if (
        requestError?.response?.data
          ?.progress
      ) {
        await loadSetup({
          refresh: true,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Page
        title="Monetization setup"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Monetization setup"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadSetup({
                refresh: true,
              })
            }
          />
        }
      >
        <InfoCard
          icon="rocket-outline"
          title="Get started"
          text="Set up the account information required for Snapgram professional monetization features."
        />

        {error ? (
          <>
            <Notice tone="danger">
              {error}
            </Notice>

            <PrimaryButton
              text="Try again"
              onPress={() =>
                loadSetup()
              }
              disabled={saving}
            />
          </>
        ) : null}

        {!error ? (
          <>
            <View style={styles.progressCard}>
              <View style={styles.progressIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                />
              </View>

              <Notice>
                {progressText} •{" "}
                {progress.percentage || 0}%
              </Notice>
            </View>

            <SettingItem
              title="Get started"
              subtitle={
                setup?.setupStarted
                  ? "Monetization setup has been started."
                  : "Begin setting up monetization on your account."
              }
              icon="rocket-outline"
              onPress={startSetup}
              disabled={
                saving ||
                Boolean(
                  setup?.setupStarted
                )
              }
            />

            <SettingItem
              title="Payment information"
              subtitle={
                paymentComplete
                  ? payoutMethod
                    ? `Payout method: ${
                        payoutMethod.provider ||
                        payoutMethod.type ||
                        "Configured"
                      }`
                    : "Payment information is marked complete."
                  : "Add and verify the payout method used for eligible earnings."
              }
              icon="card-outline"
              onPress={
                paymentComplete
                  ? openPaymentInformation
                  : openPaymentInformation
              }
              disabled={saving}
            />

            {!paymentComplete ? (
              <PrimaryButton
                text="Mark payment setup complete"
                onPress={
                  markPaymentComplete
                }
                disabled={saving}
              />
            ) : null}

            <SettingItem
              title="Tax information"
              subtitle={
                taxComplete
                  ? `Tax status: ${taxStatus}`
                  : "Provide the tax information required before eligible payouts."
              }
              icon="document-text-outline"
              onPress={
                openTaxInformation
              }
              disabled={saving}
            />

            <SettingItem
              title="Monetization preferences"
              subtitle={
                preferencesComplete
                  ? "Your monetization preferences have been configured."
                  : "Choose which professional monetization features you want to use."
              }
              icon="options-outline"
              onPress={
                openPreferences
              }
              disabled={saving}
            />

            {!preferencesComplete ? (
              <PrimaryButton
                text="Mark preferences complete"
                onPress={
                  togglePreferencesComplete
                }
                disabled={saving}
              />
            ) : null}

            {setupComplete ? (
              <Notice>
                Your setup is complete. Available
                monetization programs still depend
                on server-side eligibility checks.
              </Notice>
            ) : (
              <PrimaryButton
                text="Complete monetization setup"
                onPress={finishSetup}
                disabled={
                  saving ||
                  !setup?.setupStarted ||
                  !paymentComplete ||
                  !taxComplete ||
                  !preferencesComplete
                }
              />
            )}

            <Notice>
              Snapgram should never trust the mobile
              app to determine eligibility, earnings,
              or payout amounts. Those decisions are
              verified by the backend.
            </Notice>
          </>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  progressIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});