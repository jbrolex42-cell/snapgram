import React, {
  useCallback,
  useEffect,
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
  Page,
  InfoCard,
  Notice,
  SectionHeading,
  SettingItem,
  SwitchRow,
  useSettingsTheme,
} from "../../../components/settings/SettingsUI";

import {
  getGiftSettings,
  updateGiftSettings,
  getGiftSummary,
  getGiftActivity,
} from "../../../services/giftsApi";

function formatNumber(value) {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function GiftActivityItem({
  item,
  colors,
}) {
  const username =
    item?.sender?.username ||
    item?.from?.username ||
    item?.username ||
    "Someone";

  const giftName =
    item?.gift?.name ||
    item?.giftName ||
    "Gift";

  const amount =
    Number(
      item?.amount ??
        item?.value ??
        item?.coins ??
        0
    );

  return (
    <View
      style={[
        styles.activityItem,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.giftIcon,
          {
            backgroundColor:
              colors.card,
          },
        ]}
      >
        <Text style={styles.giftEmoji}>
          🎁
        </Text>
      </View>

      <View style={styles.activityContent}>
        <Text
          style={[
            styles.activityTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {username}
        </Text>

        <Text
          style={[
            styles.activitySubtitle,
            {
              color: colors.secondaryText,
            },
          ]}
        >
          Sent you {giftName}
        </Text>

        {!!item?.createdAt && (
          <Text
            style={[
              styles.activityDate,
              {
                color: colors.secondaryText,
              },
            ]}
          >
            {formatDate(item.createdAt)}
          </Text>
        )}
      </View>

      {amount > 0 && (
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>
            {formatNumber(amount)}
          </Text>

          <Text
            style={[
              styles.amountLabel,
              {
                color: colors.secondaryText,
              },
            ]}
          >
            coins
          </Text>
        </View>
      )}
    </View>
  );
}

export default function GiftsScreen() {
  const { colors } = useSettingsTheme();

  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalCoins: 0,
    availableBalance: 0,
  });

  const [giftSettings, setGiftSettings] =
    useState({
      enabled: true,
      allowGifts: true,
      showGiftButton: true,
    });

  const [activity, setActivity] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadGifts = useCallback(
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
          settingsResult,
          activityResult,
        ] = await Promise.all([
          getGiftSummary(),
          getGiftSettings(),
          getGiftActivity({
            page: 1,
            limit: 30,
          }),
        ]);

        setSummary({
          totalReceived:
            Number(
              summaryResult?.totalReceived ||
                0
            ),
          totalCoins:
            Number(
              summaryResult?.totalCoins ||
                0
            ),
          availableBalance:
            Number(
              summaryResult?.availableBalance ||
                0
            ),
        });

        setGiftSettings({
          enabled:
            settingsResult?.enabled !== false,

          allowGifts:
            settingsResult?.allowGifts !== false,

          showGiftButton:
            settingsResult?.showGiftButton !==
            false,
        });

        setActivity(
          activityResult?.activity ||
            activityResult?.items ||
            []
        );
      } catch (err) {
        console.error(
          "GIFTS LOAD ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load gifts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const updateGiftPreference = useCallback(
    async (field, value) => {
      const previous = {
        ...giftSettings,
      };

      setGiftSettings((current) => ({
        ...current,
        [field]: value,
      }));

      try {
        setSaving(true);
        setError("");

        await updateGiftSettings({
          [field]: value,
        });
      } catch (err) {
        console.error(
          "GIFTS SETTINGS ERROR:",
          err
        );

        setGiftSettings(previous);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update gift settings."
        );
      } finally {
        setSaving(false);
      }
    },
    [giftSettings]
  );

  if (loading) {
    return (
      <Page
        title="Gifts"
        scroll={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.secondaryText,
              },
            ]}
          >
            Loading gifts...
          </Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      title="Gifts"
      scroll={false}
      refreshing={refreshing}
      onRefresh={() =>
        loadGifts({ refresh: true })
      }
    >
      {!!error && (
        <Notice
          type="error"
          title="Gifts"
          text={error}
          actionText="Retry"
          onAction={() => loadGifts()}
        />
      )}

      <InfoCard>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>
              🎁
            </Text>
          </View>

          <View style={styles.headerContent}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Gifts
            </Text>

            <Text
              style={[
                styles.headerDescription,
                {
                  color: colors.secondaryText,
                },
              ]}
            >
              Receive gifts from your audience
              on eligible professional content.
            </Text>
          </View>
        </View>
      </InfoCard>

      <SectionHeading>
        YOUR GIFTS
      </SectionHeading>

      <InfoCard>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {formatNumber(
                summary.totalReceived
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.secondaryText,
                },
              ]}
            >
              Received
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
                  color: colors.text,
                },
              ]}
            >
              {formatNumber(
                summary.totalCoins
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.secondaryText,
                },
              ]}
            >
              Coins
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
                  color: colors.text,
                },
              ]}
            >
              {formatNumber(
                summary.availableBalance
              )}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.secondaryText,
                },
              ]}
            >
              Balance
            </Text>
          </View>
        </View>
      </InfoCard>

      <SectionHeading>
        GIFT SETTINGS
      </SectionHeading>

      <InfoCard>
        <SwitchRow
          title="Allow gifts"
          description="Let eligible viewers send you gifts."
          value={giftSettings.allowGifts}
          onValueChange={(value) =>
            updateGiftPreference(
              "allowGifts",
              value
            )
          }
          disabled={saving}
        />

        <SwitchRow
          title="Show gift button"
          description="Show the gift option on eligible content."
          value={giftSettings.showGiftButton}
          onValueChange={(value) =>
            updateGiftPreference(
              "showGiftButton",
              value
            )
          }
          disabled={
            saving ||
            !giftSettings.allowGifts
          }
        />

        <SwitchRow
          title="Gifts"
          description="Turn the gifts feature on or off."
          value={giftSettings.enabled}
          onValueChange={(value) =>
            updateGiftPreference(
              "enabled",
              value
            )
          }
          disabled={saving}
        />
      </InfoCard>

      <SectionHeading>
        RECENT GIFT ACTIVITY
      </SectionHeading>

      <InfoCard>
        {activity.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              🎁
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              No gifts yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.secondaryText,
                },
              ]}
            >
              Gifts from your audience will
              appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activity}
            keyExtractor={(item, index) =>
              String(
                item?.id ||
                  item?._id ||
                  index
              )
            }
            renderItem={({ item }) => (
              <GiftActivityItem
                item={item}
                colors={colors}
              />
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={null}
          />
        )}
      </InfoCard>

      <View style={styles.bottomSpace} />
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3e8ff",
    marginRight: 14,
  },

  headerEmoji: {
    fontSize: 26,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  headerDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 11,
  },

  statDivider: {
    width: 1,
    height: 36,
  },

  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  giftIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  giftEmoji: {
    fontSize: 20,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  activitySubtitle: {
    marginTop: 2,
    fontSize: 13,
  },

  activityDate: {
    marginTop: 3,
    fontSize: 11,
  },

  amountContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  amountText: {
    color: "#8b5cf6",
    fontSize: 14,
    fontWeight: "700",
  },

  amountLabel: {
    marginTop: 2,
    fontSize: 10,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },

  bottomSpace: {
    height: 40,
  },
});