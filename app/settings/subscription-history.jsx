import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
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
  Notice,
  PageLoading,
  SettingItem,
} from "../../components/settings/SettingsUI";

import {
  getSubscriptionHistory,
} from "../../services/subscriptionService";

function formatCurrency(
  amount,
  currency = "KES"
) {
  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }
  ).format(
    Number(amount || 0)
  );
}

function formatStatus(status) {
  switch (status) {
    case "completed":
      return "Paid";

    case "pending":
      return "Pending";

    case "failed":
      return "Failed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
}

export default function SubscriptionHistoryScreen() {
  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const loadHistory =
    useCallback(
      async ({
        refresh = false,
      } = {}) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError(null);

          const data =
            await getSubscriptionHistory();

          setPayments(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (requestError) {
          console.error(
            "SUBSCRIPTION HISTORY ERROR:",
            requestError
          );

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Unable to load payment history."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <Page
        title="Payment history"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Payment history"
      onBack={() => router.back()}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadHistory({
                refresh: true,
              })
            }
          />
        }
      >
        <InfoCard
          icon="receipt-outline"
          title="Payment history"
          text="View subscription payments confirmed by the Snapgram backend."
        />

        {error ? (
          <Notice tone="danger">
            {error}
          </Notice>
        ) : null}

        {!error &&
        payments.length ===
          0 ? (
          <Notice>
            You do not have any subscription
            payments yet.
          </Notice>
        ) : null}

        {payments.map(
          (payment) => (
            <View
              key={String(
                payment._id ||
                  payment.id
              )}
              style={
                styles.paymentCard
              }
            >
              <SettingItem
                title={
                  payment.plan ===
                  "premium"
                    ? "Snapgram Premium"
                    : payment.plan ===
                      "plus"
                    ? "Snapgram Plus"
                    : payment.plan ===
                      "snapgram"
                    ? "Snapgram"
                    : "Snapgram Free"
                }
                subtitle={`${formatCurrency(
                  payment.amount,
                  payment.currency
                )} • ${formatStatus(
                  payment.status
                )}`}
              />

              <Text
                style={
                  styles.date
                }
              >
                {payment.createdAt
                  ? new Date(
                      payment.createdAt
                    ).toLocaleString()
                  : "Date unavailable"}
              </Text>

              {payment.mpesaReceiptNumber ? (
                <Text
                  style={
                    styles.receipt
                  }
                >
                  M-PESA receipt:{" "}
                  {
                    payment.mpesaReceiptNumber
                  }
                </Text>
              ) : null}
            </View>
          )
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  paymentCard: {
    marginBottom: 12,
  },

  date: {
    fontSize: 12,
    opacity: 0.6,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 6,
  },

  receipt: {
    fontSize: 12,
    opacity: 0.75,
    marginHorizontal: 16,
  },
});