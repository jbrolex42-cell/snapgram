import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
  getMonetizationEligibility,
} from "../../../services/monetizationApi";

function getStatusConfig(status) {
  const normalized = String(
    status || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "eligible" ||
    normalized === "approved" ||
    normalized === "available" ||
    normalized === "passed"
  ) {
    return {
      label: "Eligible",
      icon: "✓",
      background: "#dcfce7",
      color: "#15803d",
    };
  }

  if (
    normalized === "pending" ||
    normalized === "review"
  ) {
    return {
      label: "Under review",
      icon: "•",
      background: "#fef3c7",
      color: "#b45309",
    };
  }

  if (
    normalized === "restricted" ||
    normalized === "limited"
  ) {
    return {
      label: "Limited",
      icon: "!",
      background: "#fef3c7",
      color: "#b45309",
    };
  }

  if (
    normalized === "ineligible" ||
    normalized === "rejected" ||
    normalized === "failed"
  ) {
    return {
      label: "Not eligible",
      icon: "!",
      background: "#fee2e2",
      color: "#dc2626",
    };
  }

  return {
    label: "Not checked",
    icon: "•",
    background: "#f3f4f6",
    color: "#6b7280",
  };
}

function StatusBadge({
  status,
}) {
  const config =
    getStatusConfig(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            config.background,
        },
      ]}
    >
      <View
        style={[
          styles.statusIcon,
          {
            backgroundColor:
              config.color,
          },
        ]}
      >
        <Text
          style={styles.statusIconText}
        >
          {config.icon}
        </Text>
      </View>

      <Text
        style={[
          styles.statusBadgeText,
          {
            color: config.color,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

function FeatureRow({
  feature,
  colors,
}) {
  const status =
    feature?.status ||
    (feature?.eligible
      ? "eligible"
      : "ineligible");

  const config =
    getStatusConfig(status);

  return (
    <View
      style={[
        styles.featureRow,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          {
            backgroundColor:
              colors.card,
          },
        ]}
      >
        <Text style={styles.featureIconText}>
          {feature?.icon || "✓"}
        </Text>
      </View>

      <View style={styles.featureContent}>
        <Text
          style={[
            styles.featureTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {feature?.name ||
            feature?.title ||
            "Monetization feature"}
        </Text>

        {!!feature?.description && (
          <Text
            style={[
              styles.featureDescription,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {feature.description}
          </Text>
        )}

        {!!feature?.reason && (
          <Text
            style={[
              styles.featureReason,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {feature.reason}
          </Text>
        )}
      </View>

      <StatusBadge status={status} />
    </View>
  );
}

function RequirementRow({
  requirement,
  colors,
}) {
  const passed =
    requirement?.passed === true ||
    requirement?.completed === true ||
    requirement?.status ===
      "passed";

  return (
    <View
      style={[
        styles.requirementRow,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.requirementIcon,
          {
            backgroundColor: passed
              ? "#dcfce7"
              : "#f3f4f6",
          },
        ]}
      >
        <Text
          style={[
            styles.requirementIconText,
            {
              color: passed
                ? "#15803d"
                : "#737373",
            },
          ]}
        >
          {passed ? "✓" : "•"}
        </Text>
      </View>

      <View
        style={styles.requirementContent}
      >
        <Text
          style={[
            styles.requirementTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {requirement?.title ||
            requirement?.name ||
            "Requirement"}
        </Text>

        {!!requirement?.description && (
          <Text
            style={[
              styles.requirementDescription,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {requirement.description}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.requirementStatus,
          {
            color: passed
              ? "#15803d"
              : colors.secondaryText,
          },
        ]}
      >
        {passed
          ? "Complete"
          : "Incomplete"}
      </Text>
    </View>
  );
}

export default function MonetizationEligibilityScreen() {
  const { colors } =
    useSettingsTheme();

  const [eligibility, setEligibility] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadEligibility =
    useCallback(
      async ({ refresh = false } = {}) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const data =
            await getMonetizationEligibility();

          setEligibility(
            data || {
              status: "unknown",
              features: [],
              requirements: [],
              policyStatus: "unknown",
            }
          );
        } catch (err) {
          console.error(
            "MONETIZATION ELIGIBILITY ERROR:",
            err
          );

          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Unable to check monetization eligibility."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  if (loading) {
    return (
      <Page
        title="Monetization eligibility"
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
            Checking eligibility...
          </Text>
        </View>
      </Page>
    );
  }

  const overallStatus =
    eligibility?.status ||
    "unknown";

  const features =
    Array.isArray(
      eligibility?.features
    )
      ? eligibility.features
      : [];

  const requirements =
    Array.isArray(
      eligibility?.requirements
    )
      ? eligibility.requirements
      : [];

  const policyStatus =
    eligibility?.policyStatus ||
    "unknown";

  const statusConfig =
    getStatusConfig(
      overallStatus
    );

  const completedRequirements =
    requirements.filter(
      (item) =>
        item?.passed === true ||
        item?.completed === true ||
        item?.status === "passed"
    ).length;

  return (
    <Page
      title="Monetization eligibility"
      scroll={false}
      refreshing={refreshing}
      onRefresh={() =>
        loadEligibility({
          refresh: true,
        })
      }
    >
      {!!error && (
        <Notice
          type="error"
          title="Eligibility check failed"
          text={error}
          actionText="Retry"
          onAction={() =>
            loadEligibility()
          }
        />
      )}

      <InfoCard>
        <View
          style={styles.overview}
        >
          <View
            style={[
              styles.overviewIcon,
              {
                backgroundColor:
                  statusConfig.background,
              },
            ]}
          >
            <Text
              style={[
                styles.overviewIconText,
                {
                  color:
                    statusConfig.color,
                },
              ]}
            >
              {statusConfig.icon}
            </Text>
          </View>

          <Text
            style={[
              styles.overviewTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Monetization status
          </Text>

          <StatusBadge
            status={overallStatus}
          />

          <Text
            style={[
              styles.overviewDescription,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {eligibility?.message ||
              "Your eligibility is based on your account, content, and compliance with applicable monetization requirements."}
          </Text>
        </View>
      </InfoCard>

      <SectionHeading>
        MONETIZATION FEATURES
      </SectionHeading>

      <InfoCard>
        {features.length === 0 ? (
          <View
            style={styles.emptyContainer}
          >
            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No monetization features
              are currently available for
              your account.
            </Text>
          </View>
        ) : (
          features.map(
            (feature, index) => (
              <FeatureRow
                key={
                  feature?.id ||
                  feature?._id ||
                  feature?.name ||
                  index
                }
                feature={feature}
                colors={colors}
              />
            )
          )
        )}
      </InfoCard>

      <SectionHeading>
        REQUIREMENTS
      </SectionHeading>

      <InfoCard>
        {requirements.length === 0 ? (
          <View
            style={styles.emptyContainer}
          >
            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No requirements are
              available right now.
            </Text>
          </View>
        ) : (
          <>
            <View
              style={styles.progressHeader}
            >
              <Text
                style={[
                  styles.progressTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Requirements completed
              </Text>

              <Text
                style={[
                  styles.progressCount,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                {completedRequirements}/
                {requirements.length}
              </Text>
            </View>

            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      requirements.length
                        ? Math.round(
                            (completedRequirements /
                              requirements.length) *
                              100
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            {requirements.map(
              (
                requirement,
                index
              ) => (
                <RequirementRow
                  key={
                    requirement?.id ||
                    requirement?._id ||
                    requirement?.title ||
                    index
                  }
                  requirement={
                    requirement
                  }
                  colors={colors}
                />
              )
            )}
          </>
        )}
      </InfoCard>

      <SectionHeading>
        POLICY STATUS
      </SectionHeading>

      <InfoCard>
        <View
          style={styles.policyHeader}
        >
          <View
            style={styles.policyContent}
          >
            <Text
              style={[
                styles.policyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Account policy status
            </Text>

            <Text
              style={[
                styles.policyDescription,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Monetization features may
              depend on your account
              remaining compliant with
              Snapgram's applicable policies.
            </Text>
          </View>

          <StatusBadge
            status={policyStatus}
          />
        </View>

        {!!eligibility?.policyMessage && (
          <View
            style={[
              styles.policyMessage,
              {
                borderTopColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.policyMessageText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              {eligibility.policyMessage}
            </Text>
          </View>
        )}
      </InfoCard>

      <View
        style={styles.footerSpace}
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

  overview: {
    alignItems: "center",
    paddingVertical: 8,
  },

  overviewIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  overviewIconText: {
    fontSize: 28,
    fontWeight: "800",
  },

  overviewTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },

  overviewDescription: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  statusIconText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  featureIconText: {
    fontSize: 17,
    fontWeight: "700",
  },

  featureContent: {
    flex: 1,
    minWidth: 0,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  featureDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },

  featureReason: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  requirementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  requirementIconText: {
    fontSize: 16,
    fontWeight: "700",
  },

  requirementContent: {
    flex: 1,
  },

  requirementTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  requirementDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },

  requirementStatus: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: "600",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  progressTitle: {
    fontSize: 13,
    fontWeight: "600",
  },

  progressCount: {
    fontSize: 12,
    fontWeight: "600",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#0095F6",
  },

  policyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  policyContent: {
    flex: 1,
    marginRight: 10,
  },

  policyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  policyDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },

  policyMessage: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  policyMessageText: {
    fontSize: 12,
    lineHeight: 18,
  },

  emptyContainer: {
    paddingVertical: 22,
    alignItems: "center",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },

  footerSpace: {
    height: 40,
  },
});