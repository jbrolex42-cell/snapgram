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
import api from "../../../services/api";

function formatCurrency(amount, currency = "USD") {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}

function getStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "approved":
    case "eligible":
    case "active":
      return "Eligible";

    case "pending":
      return "Under review";

    case "rejected":
    case "disabled":
    case "suspended":
      return "Not eligible";

    default:
      return "Not checked";
  }
}

function getStatusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "approved":
    case "eligible":
    case "active":
      return "success";

    case "pending":
      return "warning";

    case "rejected":
    case "disabled":
    case "suspended":
      return "danger";

    default:
      return "default";
  }
}

export default function MonetizationScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMonetization = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response =
          await api.get("/monetization");

        setData(
          response?.data?.monetization ||
            response?.data ||
            null
        );
      } catch (requestError) {
        console.error(
          "MONETIZATION LOAD ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
        );

        const status =
          requestError?.response?.status;

        if (
          status === 404 ||
          status === 405
        ) {
          setError(
            "Monetization has not been enabled on the server yet."
          );
        } else {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load monetization information."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMonetization();
  }, [loadMonetization]);

  function openEarnings() {
    router.push("/settings/monetization-earnings");
  }

  function openPayouts() {
    router.push("/settings/monetization-payouts");
  }

  function openEligibility() {
    router.push("/settings/monetization-eligibility");
  }

  function openSubscriptions() {
    router.push("/settings/subscriptions");
  }

  function openGifts() {
    router.push("/settings/gifts");
  }

  function handleSetup() {
    router.push("/settings/monetization-setup");
  }

  async function handleDisable() {
    Alert.alert(
      "Turn off monetization?",
      "Turning off monetization may stop eligible monetization features from being available on your account.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Turn off",
          style: "destructive",
          onPress: async () => {
            try {
              setRefreshing(true);

              await api.patch(
                "/monetization",
                {
                  enabled: false,
                }
              );

              await loadMonetization({
                refresh: true,
              });
            } catch (requestError) {
              Alert.alert(
                "Unable to update",
                requestError?.response?.data
                  ?.message ||
                  requestError?.message ||
                  "The monetization setting could not be updated."
              );

              setRefreshing(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <Page
        title="Monetization"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  const eligibility =
    data?.eligibility ||
    data?.status ||
    "unknown";

  const eligibilityLabel =
    getStatusLabel(eligibility);

  const eligibilityTone =
    getStatusTone(eligibility);

  const enabled =
    Boolean(data?.enabled);

  const setupComplete =
    Boolean(
      data?.setupComplete ||
        data?.payouts?.setupComplete
    );

  const currency =
    data?.currency ||
    data?.payouts?.currency ||
    "USD";

  const availableBalance =
    data?.earnings?.available ??
    data?.availableBalance ??
    0;

  const totalEarnings =
    data?.earnings?.total ??
    data?.totalEarnings ??
    0;

  const pendingBalance =
    data?.earnings?.pending ??
    data?.pendingBalance ??
    0;

  return (
    <Page
      title="Monetization"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadMonetization({
                refresh: true,
              })
            }
          />
        }
      >
        <InfoCard
          icon="cash-outline"
          title="Monetization"
          text="Manage creator monetization, earnings, payouts, and eligibility from one place."
        />

        {error ? (
          <Notice tone="danger">
            {error}
          </Notice>
        ) : null}

        {!error ? (
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={
                    enabled
                      ? "checkmark-circle"
                      : "information-circle"
                  }
                  size={28}
                />
              </View>

              <View style={styles.statusContent}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusTitleWrap}>
                    <SettingItem
                      title="Monetization status"
                      subtitle={
                        enabled
                          ? "Monetization is currently enabled for this account."
                          : "Monetization is not currently enabled."
                      }
                    />
                  </View>
                </View>

                <Notice tone={eligibilityTone}>
                  Eligibility:{" "}
                  {eligibilityLabel}
                </Notice>
              </View>
            </View>

            {eligibilityLabel ===
            "Eligible" &&
            !enabled ? (
              <PrimaryButton
                text={
                  setupComplete
                    ? "Enable monetization"
                    : "Set up monetization"
                }
                onPress={handleSetup}
                disabled={refreshing}
              />
            ) : null}

            {enabled ? (
              <>
                <SettingItem
                  title="Earnings"
                  subtitle={`Available ${formatCurrency(
                    availableBalance,
                    currency
                  )} • Total ${formatCurrency(
                    totalEarnings,
                    currency
                  )}`}
                  onPress={openEarnings}
                />

                <SettingItem
                  title="Payouts"
                  subtitle={
                    pendingBalance > 0
                      ? `${formatCurrency(
                          pendingBalance,
                          currency
                        )} pending`
                      : "Manage your payout account and payment history."
                  }
                  onPress={openPayouts}
                />

                <SettingItem
                  title="Monetization eligibility"
                  subtitle="Review eligibility requirements, account status, and available creator programs."
                  onPress={openEligibility}
                />

                <SettingItem
                  title="Subscriptions"
                  subtitle="Manage creator subscriptions when subscriptions are available for your account."
                  onPress={openSubscriptions}
                />

                <SettingItem
                  title="Gifts"
                  subtitle="Manage gifts and creator earnings when this feature is available."
                  onPress={openGifts}
                />

                <SettingItem
                  title="Turn off monetization"
                  subtitle="Disable monetization features for this account."
                  onPress={handleDisable}
                  danger
                  disabled={refreshing}
                />
              </>
            ) : (
              <>
                <SettingItem
                  title="Check eligibility"
                  subtitle="See whether your account meets the requirements for available monetization programs."
                  onPress={openEligibility}
                />

                <SettingItem
                  title="Creator subscriptions"
                  subtitle="Subscriptions can become available after your account meets the required eligibility criteria."
                  onPress={openSubscriptions}
                />

                <SettingItem
                  title="Gifts"
                  subtitle="Creator gifts may be available after your account becomes eligible."
                  onPress={openGifts}
                />
              </>
            )}

            <Notice>
              Monetization availability depends on your account,
              region, content, age, policy compliance, and
              backend eligibility checks. Earnings and payouts
              shown here must come from the server.
            </Notice>
          </>
        ) : (
          <PrimaryButton
            text="Try again"
            onPress={() =>
              loadMonetization()
            }
            disabled={refreshing}
          />
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    marginBottom: 16,
  },

  statusIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  statusContent: {
    width: "100%",
  },

  statusHeader: {
    width: "100%",
  },

  statusTitleWrap: {
    width: "100%",
  },
});