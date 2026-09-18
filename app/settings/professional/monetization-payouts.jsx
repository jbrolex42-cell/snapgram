import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  InfoCard,
  Notice,
  Page,
  SectionHeading,
  SettingItem,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getPayoutSummary,
  getPayoutMethod,
  getPayoutHistory,
  getPayoutStatus,
} from "../../../services/payoutsApi";

function formatCurrency(amount, currency = "USD") {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (!normalized) return "Unknown";

  return normalized
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    ["paid", "completed", "success", "successful"].includes(
      normalized
    )
  ) {
    return "success";
  }

  if (
    ["pending", "processing", "in_review", "review"].includes(
      normalized
    )
  ) {
    return "pending";
  }

  if (
    ["failed", "cancelled", "canceled", "rejected"].includes(
      normalized
    )
  ) {
    return "danger";
  }

  return "neutral";
}

function maskAccount(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (text.length <= 4) {
    return text;
  }

  return `•••• ${text.slice(-4)}`;
}

function getPayoutMethodLabel(method) {
  if (!method) return "No payout method";

  const type = String(
    method.type ||
      method.method ||
      method.provider ||
      ""
  ).toLowerCase();

  if (type.includes("bank")) {
    return "Bank account";
  }

  if (type.includes("paypal")) {
    return "PayPal";
  }

  if (type.includes("mobile")) {
    return "Mobile money";
  }

  if (type.includes("card")) {
    return "Card";
  }

  return method.name || "Payout method";
}

function StatusBadge({ status, theme }) {
  const tone = getStatusTone(status);

  const colors = {
    success: {
      backgroundColor: "#e8f7ee",
      color: "#168a45",
    },
    pending: {
      backgroundColor: "#fff6df",
      color: "#9a6b00",
    },
    danger: {
      backgroundColor: "#ffeded",
      color: "#d93025",
    },
    neutral: {
      backgroundColor: theme.cardMuted,
      color: theme.secondaryText,
    },
  };

  const selected = colors[tone];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: selected.backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: selected.color,
          },
        ]}
      >
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

function PayoutRow({ item, theme }) {
  const amount = item?.amount ?? item?.value ?? 0;

  const currency =
    item?.currency ||
    item?.currencyCode ||
    "USD";

  const status =
    item?.status ||
    item?.state ||
    "pending";

  const reference =
    item?.reference ||
    item?.payoutId ||
    item?._id ||
    item?.id;

  return (
    <View
      style={[
        styles.historyRow,
        {
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.historyMain}>
        <Text
          style={[
            styles.historyAmount,
            {
              color: theme.text,
            },
          ]}
        >
          {formatCurrency(amount, currency)}
        </Text>

        <Text
          style={[
            styles.historyDate,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          {formatDate(
            item?.createdAt ||
              item?.processedAt ||
              item?.paidAt ||
              item?.date
          )}
        </Text>

        {reference ? (
          <Text
            numberOfLines={1}
            style={[
              styles.historyReference,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {String(reference)}
          </Text>
        ) : null}
      </View>

      <StatusBadge
        status={status}
        theme={theme}
      />
    </View>
  );
}

export default function MonetizationPayoutsScreen() {
  const { theme } = useSettingsTheme();

  const [summary, setSummary] = useState(null);
  const [method, setMethod] = useState(null);
  const [history, setHistory] = useState([]);
  const [latestStatus, setLatestStatus] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          summaryData,
          methodData,
          historyData,
          statusData,
        ] = await Promise.all([
          getPayoutSummary(),
          getPayoutMethod(),
          getPayoutHistory({
            page: 1,
            limit: 20,
          }),
          getPayoutStatus(),
        ]);

        setSummary(summaryData || null);
        setMethod(methodData || null);
        setHistory(
          Array.isArray(historyData?.history)
            ? historyData.history
            : []
        );
        setLatestStatus(statusData || null);
      } catch (err) {
        console.error(
          "PAYOUTS LOAD ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load payout information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currency = useMemo(
    () =>
      summary?.currency ||
      summary?.currencyCode ||
      "USD",
    [summary]
  );

  const availableBalance =
    summary?.availableBalance ??
    summary?.available ??
    0;

  const pendingBalance =
    summary?.pendingBalance ??
    summary?.pending ??
    0;

  const lifetimePaid =
    summary?.totalPaid ??
    summary?.lifetimePaid ??
    summary?.totalPayouts ??
    0;

  const hasMethod = Boolean(
    method &&
      (
        method.type ||
        method.method ||
        method.provider ||
        method.name
      )
  );

  const status =
    latestStatus?.status ||
    latestStatus?.state ||
    summary?.status ||
    "unknown";

  const statusMessage =
    latestStatus?.message ||
    latestStatus?.description ||
    "";

  if (loading) {
    return (
      <Page
        title="Payouts"
        scroll={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text
            style={[
              styles.loadingText,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Loading payouts...
          </Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      title="Payouts"
      scroll={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() =>
            loadData({ refresh: true })
          }
          tintColor={theme.text}
        />
      }
    >
      {error ? (
        <Notice
          type="error"
          title="Couldn't load payouts"
          text={error}
          actionText="Retry"
          onAction={() => loadData()}
        />
      ) : null}

      <InfoCard>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIcon}>
            <Text style={styles.balanceIconText}>
              $
            </Text>
          </View>

          <View style={styles.balanceHeaderText}>
            <Text
              style={[
                styles.balanceTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Available for payout
            </Text>

            <Text
              style={[
                styles.balanceAmount,
                {
                  color: theme.text,
                },
              ]}
            >
              {formatCurrency(
                availableBalance,
                currency
              )}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.balanceDivider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {formatCurrency(
                pendingBalance,
                currency
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Pending
            </Text>
          </View>

          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: theme.border,
              },
            ]}
          />

          <View style={styles.balanceStat}>
            <Text
              style={[
                styles.statValue,
                {
                  color: theme.text,
                },
              ]}
            >
              {formatCurrency(
                lifetimePaid,
                currency
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Paid out
            </Text>
          </View>
        </View>
      </InfoCard>

      <SectionHeading>
        Payout account
      </SectionHeading>

      <InfoCard>
        <SettingItem
          title={
            hasMethod
              ? getPayoutMethodLabel(method)
              : "Add payout method"
          }
          subtitle={
            hasMethod
              ? method?.accountNumber
                ? maskAccount(
                    method.accountNumber
                  )
                : method?.last4
                ? `•••• ${method.last4}`
                : method?.email ||
                  method?.accountName ||
                  "Manage your payout account"
              : "Choose where your earnings are sent"
          }
          icon="card-outline"
          onPress={() => {
          }}
        />
      </InfoCard>

      <SectionHeading>
        Payout status
      </SectionHeading>

      <InfoCard>
        <View style={styles.statusHeader}>
          <View style={styles.statusTitleContainer}>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Latest payout
            </Text>

            {latestStatus?.updatedAt ? (
              <Text
                style={[
                  styles.statusDate,
                  {
                    color: theme.secondaryText,
                  },
                ]}
              >
                Updated{" "}
                {formatDate(
                  latestStatus.updatedAt
                )}
              </Text>
            ) : null}
          </View>

          <StatusBadge
            status={status}
            theme={theme}
          />
        </View>

        {statusMessage ? (
          <Text
            style={[
              styles.statusMessage,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {statusMessage}
          </Text>
        ) : null}
      </InfoCard>

      <SectionHeading>
        Payout history
      </SectionHeading>

      <InfoCard>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                $
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              No payouts yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Your completed and pending payouts
              will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) =>
              String(
                item?._id ||
                  item?.id ||
                  item?.reference ||
                  index
              )
            }
            renderItem={({ item }) => (
              <PayoutRow
                item={item}
                theme={theme}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </InfoCard>

      <View style={styles.footerSpace} />
    </Page>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  balanceIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },

  balanceIconText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },

  balanceHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  balanceTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  balanceAmount: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: "800",
  },

  balanceDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },

  balanceStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  balanceStat: {
    flex: 1,
  },

  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    marginHorizontal: 16,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 12,
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusTitleContainer: {
    flex: 1,
    marginRight: 12,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  statusDate: {
    marginTop: 4,
    fontSize: 12,
  },

  statusMessage: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  historyRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  historyMain: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
  },

  historyAmount: {
    fontSize: 15,
    fontWeight: "700",
  },

  historyDate: {
    marginTop: 3,
    fontSize: 12,
  },

  historyReference: {
    marginTop: 2,
    fontSize: 11,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  emptyIconText: {
    color: "#111111",
    fontSize: 22,
    fontWeight: "800",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  footerSpace: {
    height: 30,
  },
});