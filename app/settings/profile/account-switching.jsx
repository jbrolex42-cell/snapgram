import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
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
  SettingItem,
  PrimaryButton,
  Notice,
  PageLoading,
} from "../../../components/settings/SettingsUI";

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
    useState(null);

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  const loadAccounts =
    useCallback(async () => {
      try {
        setError(null);

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
          error?.message || error
        );

        setError(
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
      String(accountId) ===
      currentUserId
    ) {
      return;
    }

    try {
      setError(null);
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
        error?.message || error
      );

      Alert.alert(
        "Unable to switch account",
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
      return;
    }

    const isCurrent =
      String(accountId) ===
      currentUserId;

    Alert.alert(
      isCurrent
        ? "Remove current account?"
        : "Remove account?",
      isCurrent
        ? "This will remove the current account from this device. If another account is saved, Snapgram will switch to it."
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
      setError(null);
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
        error?.message || error
      );

      Alert.alert(
        "Unable to remove account",
        error?.message ||
          "The account could not be removed from this device."
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <Page
        title="Account switching"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Account switching"
      onBack={() => router.back()}
    >
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
        <InfoCard
          icon="swap-horizontal-outline"
          title="Account switching"
          text="Switch between Snapgram accounts saved on this device. Each account keeps its own authenticated session."
        />

        {error ? (
          <Notice>
            {error}
          </Notice>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Saved accounts
          </Text>

          {accounts.length === 0 ? (
            <Notice>
              No accounts are saved on this
              device yet. Add another account
              by logging in.
            </Notice>
          ) : (
            accounts.map((account) => {
              const accountId =
                getAccountId(account);

              const isCurrent =
                accountId ===
                currentUserId;

              const isSwitching =
                switchingId === accountId;

              const isRemoving =
                removingId === accountId;

              return (
                <View
                  key={accountId}
                  style={styles.accountCard}
                >
                  {account?.avatar ? (
                    <Image
                      source={{
                        uri: account.avatar,
                      }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={styles.avatarFallback}
                    >
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {(
                          account?.username ||
                          account?.name ||
                          account?.email ||
                          "S"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View
                    style={styles.accountInfo}
                  >
                    <Text
                      style={styles.accountName}
                      numberOfLines={1}
                    >
                      {getDisplayName(
                        account
                      )}
                    </Text>

                    {!!getUsername(
                      account
                    ) && (
                      <Text
                        style={
                          styles.accountUsername
                        }
                        numberOfLines={1}
                      >
                        {getUsername(
                          account
                        )}
                      </Text>
                    )}

                    {!!account?.email && (
                      <Text
                        style={
                          styles.accountEmail
                        }
                        numberOfLines={1}
                      >
                        {account.email}
                      </Text>
                    )}

                    {isCurrent && (
                      <Text
                        style={
                          styles.currentLabel
                        }
                      >
                        Current account
                      </Text>
                    )}
                  </View>

                  <View
                    style={styles.actions}
                  >
                    {!isCurrent && (
                      <SettingItem
                        title={
                          isSwitching
                            ? "Switching..."
                            : "Switch"
                        }
                        subtitle="Use this account"
                        onPress={() =>
                          handleSwitch(
                            account
                          )
                        }
                        disabled={
                          Boolean(
                            switchingId
                          ) ||
                          Boolean(
                            removingId
                          )
                        }
                      />
                    )}

                    <SettingItem
                      title={
                        isRemoving
                          ? "Removing..."
                          : "Remove"
                      }
                      subtitle="Remove from this device"
                      onPress={() =>
                        handleRemove(
                          account
                        )
                      }
                      disabled={
                        Boolean(
                          switchingId
                        ) ||
                        Boolean(
                          removingId
                        )
                      }
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <PrimaryButton
          text="Add account"
          onPress={() =>
            router.push(
              "/settings/profile/add-account"
            )
          }
        />

        <View style={styles.securityBox}>
          <Text
            style={styles.securityTitle}
          >
            Security
          </Text>

          <Text
            style={styles.securityText}
          >
            Snapgram does not save your
            password for account switching.
            Your authenticated session is
            saved on this device so you can
            switch accounts without signing in
            again.
          </Text>

          <Text
            style={styles.securityText}
          >
            Only save accounts on a device
            that you control. Remove an
            account if you are using a shared
            or public device.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  accountCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
  },

  accountInfo: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 2,
  },

  accountName: {
    fontSize: 16,
    fontWeight: "700",
  },

  accountUsername: {
    fontSize: 14,
    marginTop: 2,
  },

  accountEmail: {
    fontSize: 13,
    marginTop: 2,
  },

  currentLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  actions: {
    width: 115,
    marginLeft: 8,
  },

  securityBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  securityTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  securityText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
});