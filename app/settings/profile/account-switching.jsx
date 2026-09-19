import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  getSavedAccounts,
  removeSavedAccount,
} from "../../../services/authService";

import { useAuth } from "../../../context/AuthContext";

function getAccountId(account) {
  return String(
    account?._id ||
      account?.id ||
      ""
  );
}

function getDisplayName(account) {
  return (
    account?.name ||
    account?.fullName ||
    account?.username ||
    account?.email ||
    "Snapgram account"
  );
}

function getUsername(account) {
  if (!account?.username) {
    return "";
  }

  return `@${account.username}`;
}

function getInitial(account) {
  const value =
    account?.username ||
    account?.name ||
    account?.fullName ||
    account?.email ||
    "S";

  return String(value)
    .trim()
    .charAt(0)
    .toUpperCase();
}

function AccountAvatar({ account, large = false }) {
  const size = large ? 64 : 54;

  if (account?.avatar) {
    return (
      <Image
        source={{
          uri: account.avatar,
        }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          large && styles.avatarTextLarge,
        ]}
      >
        {getInitial(account)}
      </Text>
    </View>
  );
}

function AccountRow({
  account,
  isCurrent,
  switching,
  removing,
  disabled,
  onSwitch,
  onRemove,
}) {
  return (
    <View
      style={[
        styles.accountRow,
        isCurrent && styles.currentAccountRow,
      ]}
    >
      <AccountAvatar account={account} />

      <View style={styles.accountInfo}>
        <Text
          style={styles.accountName}
          numberOfLines={1}
        >
          {getDisplayName(account)}
        </Text>

        {!!getUsername(account) && (
          <Text
            style={styles.username}
            numberOfLines={1}
          >
            {getUsername(account)}
          </Text>
        )}

        {isCurrent ? (
          <View style={styles.currentBadge}>
            <View style={styles.currentDot} />

            <Text style={styles.currentBadgeText}>
              Current account
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rowActions}>
        {!isCurrent ? (
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={disabled}
            onPress={onSwitch}
            style={[
              styles.switchButton,
              disabled &&
                styles.disabledButton,
            ]}
          >
            {switching ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <Text style={styles.switchText}>
                Switch
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={disabled}
          onPress={onRemove}
          style={[
            styles.removeButton,
            disabled &&
              styles.disabledRemoveButton,
          ]}
        >
          {removing ? (
            <ActivityIndicator
              size="small"
              color="#ed4956"
            />
          ) : (
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color="#555"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccountSwitchingScreen() {
  const {
    user,
    switchAccount,
  } = useAuth();

  const [accounts, setAccounts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [switchingId, setSwitchingId] =
    useState(null);

  const [removingId, setRemovingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const loadAccounts =
    useCallback(async () => {
      try {
        setError("");

        const savedAccounts =
          await getSavedAccounts();

        setAccounts(
          Array.isArray(savedAccounts)
            ? savedAccounts
            : []
        );
      } catch (error) {
        console.error(
          "LOAD SAVED ACCOUNTS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load saved accounts."
        );
      }
    }, []);

  useEffect(() => {
    loadAccounts().finally(() => {
      setLoading(false);
    });
  }, [loadAccounts]);

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);
        await loadAccounts();
      } finally {
        setRefreshing(false);
      }
    }, [loadAccounts]);

  async function handleSwitch(account) {
    const accountId =
      getAccountId(account);

    if (!accountId) {
      Alert.alert(
        "Unable to switch",
        "This saved account does not contain a valid account ID."
      );
      return;
    }

    if (
      accountId === currentUserId
    ) {
      return;
    }

    if (
      switchingId ||
      removingId
    ) {
      return;
    }

    try {
      setError("");
      setSwitchingId(accountId);

      await switchAccount(accountId);

      Alert.alert(
        "Account switched",
        `You are now using ${getDisplayName(
          account
        )}.`,
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace("/"),
          },
        ]
      );
    } catch (error) {
      console.error(
        "SWITCH ACCOUNT ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Unable to switch account",
        error?.response?.data?.message ||
          error?.message ||
          "The selected account could not be activated."
      );
    } finally {
      setSwitchingId(null);
    }
  }

  function handleRemove(account) {
    const accountId =
      getAccountId(account);

    if (!accountId) {
      Alert.alert(
        "Unable to remove",
        "This account does not contain a valid account ID."
      );
      return;
    }

    if (
      switchingId ||
      removingId
    ) {
      return;
    }

    const isCurrent =
      accountId === currentUserId;

    Alert.alert(
      isCurrent
        ? "Remove current account?"
        : "Remove account?",
      isCurrent
        ? "This will remove the current account from this device. If another saved account is available, Snapgram may switch to it."
        : `Remove ${getDisplayName(
            account
          )} from this device?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            performRemove(
              accountId,
              isCurrent
            ),
        },
      ]
    );
  }

  async function performRemove(
    accountId,
    isCurrent
  ) {
    try {
      setError("");
      setRemovingId(accountId);

      const result =
        await removeSavedAccount(
          accountId
        );

      if (result?.switched) {
        Alert.alert(
          "Account removed",
          "The account was removed and another saved account is now active.",
          [
            {
              text: "Continue",
              onPress: () =>
                router.replace("/"),
            },
          ]
        );

        return;
      }

      setAccounts((previous) =>
        previous.filter(
          (account) =>
            getAccountId(account) !==
            String(accountId)
        )
      );

      if (isCurrent) {
        router.replace("/login");
      }
    } catch (error) {
      console.error(
        "REMOVE SAVED ACCOUNT ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Unable to remove account",
        error?.response?.data?.message ||
          error?.message ||
          "The account could not be removed from this device."
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color="#111"
        />
      </View>
    );
  }

  const hasAccounts =
    accounts.length > 0;

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Account switching
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="swap-horizontal-outline"
              size={34}
              color="#111"
            />
          </View>

          <Text style={styles.heroTitle}>
            Switch accounts
          </Text>

          <Text style={styles.heroText}>
            Quickly switch between Snapgram
            accounts saved on this device.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#d93025"
            />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Something went wrong
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={loadAccounts}
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          Saved accounts
        </Text>

        {hasAccounts ? (
          <View style={styles.accountsCard}>
            {accounts.map(
              (account, index) => {
                const accountId =
                  getAccountId(account);

                const isCurrent =
                  accountId ===
                  currentUserId;

                const switching =
                  switchingId ===
                  accountId;

                const removing =
                  removingId ===
                  accountId;

                const disabled =
                  Boolean(switchingId) ||
                  Boolean(removingId);

                return (
                  <React.Fragment
                    key={
                      accountId ||
                      `account-${index}`
                    }
                  >
                    <AccountRow
                      account={account}
                      isCurrent={
                        isCurrent
                      }
                      switching={
                        switching
                      }
                      removing={
                        removing
                      }
                      disabled={
                        disabled
                      }
                      onSwitch={() =>
                        handleSwitch(
                          account
                        )
                      }
                      onRemove={() =>
                        handleRemove(
                          account
                        )
                      }
                    />

                    {index <
                    accounts.length - 1 ? (
                      <View
                        style={
                          styles.divider
                        }
                      />
                    ) : null}
                  </React.Fragment>
                );
              }
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={30}
                color="#777"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No saved accounts
            </Text>

            <Text style={styles.emptyText}>
              Accounts you save on this device
              will appear here so you can switch
              between them quickly.
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={
            Boolean(switchingId) ||
            Boolean(removingId)
          }
          onPress={() =>
            router.push(
              "/settings/profile/add-account"
            )
          }
          style={[
            styles.addButton,
            (switchingId ||
              removingId) &&
              styles.disabledButton,
          ]}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={22}
              color="#0095f6"
            />
          </View>

          <Text style={styles.addText}>
            Add account
          </Text>
        </TouchableOpacity>

        <View style={styles.securityBox}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#555"
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Account security
            </Text>

            <Text style={styles.securityText}>
              Snapgram does not save your
              password for account switching.
              Saved accounts use their
              authenticated session on this
              device.
            </Text>

            <Text style={styles.securityText}>
              Only save accounts on a device you
              control. Remove saved accounts when
              using a shared or public device.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Pull down to refresh your saved accounts.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  headerSpacer: {
    width: 44,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 50,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  heroText: {
    maxWidth: 340,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#737373",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#fff2f2",
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    marginBottom: 3,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#d93025",
  },

  errorText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#b3261e",
  },

  retryText: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "700",
    color: "#0095f6",
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  accountsCard: {
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },

  accountRow: {
    minHeight: 82,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  currentAccountRow: {
    backgroundColor: "#fff",
  },

  avatar: {
    backgroundColor: "#eee",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efefef",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },

  avatarTextLarge: {
    fontSize: 23,
  },

  accountInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  accountName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  username: {
    marginTop: 2,
    fontSize: 13,
    color: "#737373",
  },

  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },

  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0095f6",
  },

  currentBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0095f6",
  },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  switchButton: {
    minWidth: 68,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  switchText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#fff",
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },

  disabledRemoveButton: {
    opacity: 0.55,
  },

  disabledButton: {
    opacity: 0.55,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
    backgroundColor: "#e5e5e5",
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
  },

  emptyTitle: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    maxWidth: 310,
    textAlign: "center",
    fontSize: 12.5,
    lineHeight: 18,
    color: "#737373",
  },

  addButton: {
    height: 48,
    marginTop: 22,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  addIcon: {
    marginRight: 7,
  },

  addText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginTop: 24,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },

  securityIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  securityText: {
    marginBottom: 8,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#666",
  },

  footerText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#8a8a8a",
  },
});