import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Page,
  InfoCard,
  Notice,
  SectionHeading,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getEarningsSummary,
  getEarningsHistory,
  getEarningsActivity,
} from "../../../services/earningsApi";

function formatMoney(
  amount = 0,
  currency = "USD"
) {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getStatusLabel(status) {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "paid":
      return "Paid";

    case "completed":
      return "Completed";

    case "pending":
      return "Pending";

    case "processing":
      return "Processing";

    case "failed":
      return "Failed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Completed";
  }
}

function getStatusStyle(
  status,
  colors
) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (
    normalized === "pending" ||
    normalized === "processing"
  ) {
    return {
      color: "#f59e0b",
      backgroundColor: "#fef3c7",
    };
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled"
  ) {
    return {
      color: "#dc2626",
      backgroundColor: "#fee2e2",
    };
  }

  return {
    color: "#16a34a",
    backgroundColor: "#dcfce7",
  };
}

function EarningsRow({
  item,
  colors,
}) {
  const amount = Number(
    item?.amount ??
      item?.earnings ??
      item?.value ??
      0
  );

  const currency =
    item?.currency || "USD";

  const title =
    item?.title ||
    item?.source ||
    item?.type ||
    "Monetization";

  const description =
    item?.description ||
    item?.subtitle ||
    "";

  const status =
    item?.status || "completed";

  const statusStyle = getStatusStyle(
    status,
    colors
  );

  return (
    <View
      style={[
        styles.earningRow,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.earningIcon,
          {
            backgroundColor:
              colors.card,
          },
        ]}
      >
        <Text style={styles.earningEmoji}>
          $
        </Text>
      </View>

      <View style={styles.earningContent}>
        <Text
          style={[
            styles.earningTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {!!description && (
          <Text
            style={[
              styles.earningDescription,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {description}
          </Text>
        )}

        {!!item?.createdAt && (
          <Text
            style={[
              styles.earningDate,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {formatDate(item.createdAt)}
          </Text>
        )}
      </View>

      <View style={styles.earningRight}>
        <Text
          style={[
            styles.amount,
            {
              color: colors.text,
            },
          ]}
        >
          {formatMoney(
            amount,
            currency
          )}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                statusStyle.backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  statusStyle.color,
              },
            ]}
          >
            {getStatusLabel(status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MonetizationEarningsScreen() {
  const { colors } =
    useSettingsTheme();

  const [summary, setSummary] =
    useState({
      totalEarnings: 0,
      availableBalance: 0,
      pendingEarnings: 0,
      currency: "USD",
    });

  const [history, setHistory] =
    useState([]);

  const [activity, setActivity] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadEarnings =
    useCallback(
      async ({ refresh = false } = {}) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const [
            summaryResult,
            historyResult,
            activityResult,
          ] = await Promise.all([
            getEarningsSummary(),

            getEarningsHistory({
              page: 1,
              limit: 20,
            }),

            getEarningsActivity({
              page: 1,
              limit: 20,
            }),
          ]);

          setSummary({
            totalEarnings:
              Number(
                summaryResult
                  ?.totalEarnings || 0
              ),

            availableBalance:
              Number(
                summaryResult
                  ?.availableBalance || 0
              ),

            pendingEarnings:
              Number(
                summaryResult
                  ?.pendingEarnings || 0
              ),

            currency:
              summaryResult
                ?.currency || "USD",
          });

          setHistory(
            historyResult?.history ||
              historyResult?.items ||
              []
          );

          setActivity(
            activityResult?.activity ||
              activityResult?.items ||
              []
          );
        } catch (err) {
          console.error(
            "EARNINGS LOAD ERROR:",
            err
          );

          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Unable to load earnings."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  if (loading) {
    return (
      <Page
        title="Earnings"
        scroll={false}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Loading earnings...
          </Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      title="Earnings"
      scroll={false}
      refreshing={refreshing}
      onRefresh={() =>
        loadEarnings({
          refresh: true,
        })
      }
    >
      {!!error && (
        <Notice
          type="error"
          title="Earnings"
          text={error}
          actionText="Retry"
          onAction={() =>
            loadEarnings()
          }
        />
      )}

      <InfoCard>
        <View
          style={styles.hero}
        >
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Text
              style={styles.heroIconText}
            >
              $
            </Text>
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Your earnings
          </Text>

          <Text
            style={[
              styles.heroAmount,
              {
                color: colors.text,
              },
            ]}
          >
            {formatMoney(
              summary.totalEarnings,
              summary.currency
            )}
          </Text>

          <Text
            style={[
              styles.heroSubtitle,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Total earnings from eligible
            monetization features
          </Text>
        </View>
      </InfoCard>

      <SectionHeading>
        BALANCE
      </SectionHeading>

      <InfoCard>
        <View
          style={styles.statsRow}
        >
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {formatMoney(
                summary.availableBalance,
                summary.currency
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Available
            </Text>
          </View>

          <View
            style={[
              styles.statDivider,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {formatMoney(
                summary.pendingEarnings,
                summary.currency
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Pending
            </Text>
          </View>
        </View>
      </InfoCard>

      <SectionHeading>
        EARNINGS HISTORY
      </SectionHeading>

      <InfoCard>
        {history.length === 0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={styles.emptyIcon}
            >
              $
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No earnings yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Your monetization earnings
              will appear here once you
              start earning.
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.id ||
                  item?._id ||
                  index
              )
            }
            renderItem={({
              item,
            }) => (
              <EarningsRow
                item={item}
                colors={colors}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </InfoCard>

      <SectionHeading>
        RECENT ACTIVITY
      </SectionHeading>

      <InfoCard>
        {activity.length === 0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={styles.emptyIcon}
            >
              📊
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No recent activity
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Monetization activity will
              appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activity}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.id ||
                  item?._id ||
                  index
              )
            }
            renderItem={({
              item,
            }) => (
              <EarningsRow
                item={item}
                colors={colors}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </InfoCard>

      <View
        style={styles.bottomSpace}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  hero: {
    alignItems: "center",
    paddingVertical: 8,
  },

  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  heroIconText: {
    fontSize: 28,
    fontWeight: "700",
  },

  heroTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  heroAmount: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "800",
  },

  heroSubtitle: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 17,
    fontWeight: "700",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
  },

  statDivider: {
    width: 1,
    height: 40,
  },

  earningRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  earningIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  earningEmoji: {
    fontSize: 21,
    fontWeight: "700",
  },

  earningContent: {
    flex: 1,
    minWidth: 0,
  },

  earningTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  earningDescription: {
    marginTop: 2,
    fontSize: 12,
  },

  earningDate: {
    marginTop: 3,
    fontSize: 11,
  },

  earningRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
  },

  statusBadge: {
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyIcon: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  emptyText: {
    maxWidth: 280,
    marginTop: 5,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },

  bottomSpace: {
    height: 40,
  },
});