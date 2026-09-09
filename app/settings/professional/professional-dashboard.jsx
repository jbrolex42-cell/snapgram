import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
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

function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat(
    "en-US"
  ).format(number);
}

function formatCurrency(
  value,
  currency = "KES"
) {
  const number = Number(value || 0);

  try {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }
    ).format(number);
  } catch {
    return `${currency} ${number.toFixed(
      2
    )}`;
  }
}

export default function ProfessionalDashboardScreen() {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const loadDashboard =
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

          const response =
            await api.get(
              "/professional/dashboard"
            );

          setDashboard(
            response?.data?.dashboard ||
              response?.data ||
              null
          );
        } catch (requestError) {
          console.error(
            "PROFESSIONAL DASHBOARD LOAD ERROR:",
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
              "The professional dashboard is not available on the current backend yet."
            );
          } else {
            setError(
              requestError?.response?.data
                ?.message ||
                requestError?.message ||
                "Unable to load your professional dashboard."
            );
          }

          setDashboard(null);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function openSubscription() {
    router.push(
      "/settings/subscription"
    );
  }

  function openMonetization() {
    router.push(
      "/settings/monetization"
    );
  }

  function openInsights() {
    router.push(
      "/settings/professional-insights"
    );
  }

  function openContentTools() {
    router.push(
      "/settings/professional-content"
    );
  }

  function openProfileTools() {
    router.push(
      "/settings/professional-profile"
    );
  }

  if (loading) {
    return (
      <Page
        title="Professional dashboard"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  const accountType =
    dashboard?.accountType ||
    dashboard?.type ||
    "Professional";

  const followers =
    dashboard?.followers ??
    dashboard?.stats?.followers ??
    0;

  const following =
    dashboard?.following ??
    dashboard?.stats?.following ??
    0;

  const posts =
    dashboard?.posts ??
    dashboard?.stats?.posts ??
    0;

  const reach =
    dashboard?.reach ??
    dashboard?.stats?.reach ??
    0;

  const impressions =
    dashboard?.impressions ??
    dashboard?.stats?.impressions ??
    0;

  const profileViews =
    dashboard?.profileViews ??
    dashboard?.stats?.profileViews ??
    0;

  const engagementRate =
    dashboard?.engagementRate ??
    dashboard?.stats?.engagementRate ??
    null;

  const currency =
    dashboard?.currency ||
    dashboard?.monetization?.currency ||
    "KES";

  const availableEarnings =
    dashboard?.earnings?.available ??
    dashboard?.monetization?.earnings
      ?.available ??
    0;

  const monetizationEnabled =
    Boolean(
      dashboard?.monetization?.enabled
    );

  const monetizationEligible =
    Boolean(
      dashboard?.monetization
        ?.eligible
    );

  const subscriptionEnabled =
    Boolean(
      dashboard?.subscriptions
        ?.enabled
    );

  const subscriptionEligible =
    Boolean(
      dashboard?.subscriptions
        ?.eligible
    );

  return (
    <Page
      title="Professional dashboard"
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
              loadDashboard({
                refresh: true,
              })
            }
          />
        }
      >
        <InfoCard
          icon="analytics-outline"
          title="Professional dashboard"
          text="Manage your professional tools, understand your audience, and monitor the performance of your Snapgram account."
        />

        {error ? (
          <>
            <Notice tone="danger">
              {error}
            </Notice>

            <PrimaryButton
              text="Try again"
              onPress={() =>
                loadDashboard()
              }
              disabled={refreshing}
            />
          </>
        ) : null}

        {!error && dashboard ? (
          <>
            <View style={styles.accountCard}>
              <View style={styles.accountIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={28}
                />
              </View>

              <View
                style={styles.accountContent}
              >
                <View
                  style={styles.accountTitleRow}
                >
                  <View
                    style={
                      styles.accountText
                    }
                  >
                    <View>
                      <Ionicons
                        name="person-circle-outline"
                        size={16}
                      />
                    </View>
                  </View>
                </View>

                <Notice>
                  Account type:{" "}
                  {accountType}
                </Notice>
              </View>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.stat}>
                <Ionicons
                  name="people-outline"
                  size={22}
                />

                <View
                  style={styles.statText}
                >
                  <View>
                    <Ionicons
                      name="person-outline"
                      size={0}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="people-outline"
                    size={20}
                  />

                  <View
                    style={
                      styles.statValueWrap
                    }
                  >
                    <View
                      style={
                        styles.statNumber
                      }
                    >
                      <Notice>
                        {formatNumber(
                          followers
                        )}
                      </Notice>
                    </View>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                  />

                  <View
                    style={
                      styles.statValueWrap
                    }
                  >
                    <View
                      style={
                        styles.statNumber
                      }
                    >
                      <Notice>
                        {formatNumber(
                          following
                        )}
                      </Notice>
                    </View>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="images-outline"
                    size={20}
                  />

                  <View
                    style={
                      styles.statValueWrap
                    }
                  >
                    <View
                      style={
                        styles.statNumber
                      }
                    >
                      <Notice>
                        {formatNumber(posts)}
                      </Notice>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <SettingItem
              title="Insights"
              subtitle={
                reach > 0 ||
                impressions > 0 ||
                profileViews > 0
                  ? `${formatNumber(
                      reach
                    )} reach • ${formatNumber(
                      impressions
                    )} impressions • ${formatNumber(
                      profileViews
                    )} profile views`
                  : "View your content and audience performance."
              }
              onPress={openInsights}
            />

            <SettingItem
              title="Professional content"
              subtitle="Manage professional content tools and creator features."
              onPress={
                openContentTools
              }
            />

            <SettingItem
              title="Professional profile"
              subtitle="Manage professional profile information and creator settings."
              onPress={
                openProfileTools
              }
            />

            <SettingItem
              title="Monetization"
              subtitle={
                monetizationEnabled
                  ? `Available earnings: ${formatCurrency(
                      availableEarnings,
                      currency
                    )}`
                  : monetizationEligible
                  ? "You may be eligible for monetization. Review your available programs."
                  : "Review your monetization eligibility and available creator programs."
              }
              onPress={
                openMonetization
              }
            />

            <SettingItem
              title="Subscriptions"
              subtitle={
                subscriptionEnabled
                  ? "Manage your active creator subscription features."
                  : subscriptionEligible
                  ? "You may be eligible to offer subscriptions."
                  : "Review subscription eligibility and creator requirements."
              }
              onPress={
                openSubscription
              }
            />

            {engagementRate !==
            null ? (
              <Notice>
                Current engagement rate:{" "}
                {Number(
                  engagementRate
                ).toFixed(2)}
                %
              </Notice>
            ) : null}

            <Notice>
              Professional insights and
              monetization information are
              calculated by the backend.
              This screen does not generate
              or invent statistics locally.
            </Notice>
          </>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    marginBottom: 16,
  },

  accountIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  accountContent: {
    width: "100%",
  },

  accountTitleRow: {
    alignItems: "center",
    justifyContent: "center",
  },

  accountText: {
    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    marginBottom: 16,
  },

  stat: {
    alignItems: "center",
    justifyContent: "center",
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statValueWrap: {
    marginTop: 6,
  },

  statNumber: {
    alignItems: "center",
  },
});

