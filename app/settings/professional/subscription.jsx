import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  Page,
  InfoCard,
  Notice,
  PageLoading,
  PrimaryButton,
  SettingItem,
} from "../../../components/settings/SettingsUI";

import {
  cancelSubscription,
  getPaymentStatus,
  getSubscriptionPlans,
  getSubscriptionStatus,
  startSubscriptionCheckout,
} from "../../../services/subscriptionService";

const PLAN_ORDER = [
  "free",
  "plus",
  "pro",
  "premium",
];

function formatCurrency(
  amount,
  currency = "KES"
) {
  const value = Number(amount || 0);

  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function cleanPhone(value) {
  return String(value || "").replace(
    /[^\d+]/g,
    ""
  );
}

function normalizeKenyanPhone(value) {
  let phone = cleanPhone(value);

  if (!phone) {
    return "";
  }

  if (phone.startsWith("+")) {
    phone =
      "+" +
      phone
        .slice(1)
        .replace(/\D/g, "");
  } else {
    phone = phone.replace(/\D/g, "");
  }

  if (phone.startsWith("+254")) {
    return phone;
  }

  if (phone.startsWith("254")) {
    return `+${phone}`;
  }

  if (phone.startsWith("0")) {
    return `+254${phone.slice(1)}`;
  }

  return phone;
}

function isValidKenyanPhone(value) {
  const phone =
    normalizeKenyanPhone(value);

  if (!/^\+254\d{9}$/.test(phone)) {
    return false;
  }

  const localNumber =
    phone.slice(4);

  if (!/^[17]\d{8}$/.test(localNumber)) {
    return false;
  }

  return true;
}

function formatPhoneInput(value) {
  const raw = String(value || "");

  if (!raw) {
    return "";
  }

  const hasPlus = raw.trim().startsWith("+");

  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return hasPlus ? "+" : "";
  }

  if (
    hasPlus ||
    digits.startsWith("254")
  ) {
    if (
      hasPlus ||
      digits.startsWith("254")
    ) {
      let international = digits;

      if (
        international.startsWith("254")
      ) {
        international =
          international.slice(0, 12);
      } else {
        international =
          international.slice(0, 12);
      }

      if (
        international.length <= 3
      ) {
        return `+${international}`;
      }

      if (
        international.length <= 6
      ) {
        return `+${international.slice(
          0,
          3
        )} ${international.slice(3)}`;
      }

      if (
        international.length <= 9
      ) {
        return `+${international.slice(
          0,
          3
        )} ${international.slice(
          3,
          6
        )} ${international.slice(6)}`;
      }

      return `+${international.slice(
        0,
        3
      )} ${international.slice(
        3,
        6
      )} ${international.slice(
        6,
        9
      )} ${international.slice(9, 12)}`;
    }
  }

  const local = digits.slice(0, 10);

  if (local.length <= 4) {
    return local;
  }

  if (local.length <= 7) {
    return `${local.slice(
      0,
      4
    )} ${local.slice(4)}`;
  }

  return `${local.slice(
    0,
    4
  )} ${local.slice(
    4,
    7
  )} ${local.slice(7, 10)}`;
}

function planDescription(planId) {
  switch (planId) {
    case "plus":
      return "More creator tools and advanced Snapgram features.";

    case "pro":
      return "Professional tools and enhanced creator features.";

    case "premium":
      return "The complete premium creator experience.";

    case "free":
    default:
      return "The standard Snapgram experience.";
  }
}

export default function SubscriptionScreen() {
  const [plans, setPlans] =
    useState([]);

  const [subscription, setSubscription] =
    useState(null);

  const [selectedPlan, setSelectedPlan] =
    useState("plus");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const loadData = useCallback(
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

        const [
          planData,
          subscriptionData,
        ] = await Promise.all([
          getSubscriptionPlans(),
          getSubscriptionStatus(),
        ]);

        const sortedPlans =
          [...planData].sort(
            (a, b) => {
              const aIndex =
                PLAN_ORDER.indexOf(
                  a.id
                );

              const bIndex =
                PLAN_ORDER.indexOf(
                  b.id
                );

              return (
                (aIndex === -1
                  ? 999
                  : aIndex) -
                (bIndex === -1
                  ? 999
                  : bIndex)
              );
            }
          );

        setPlans(sortedPlans);

        setSubscription(
          subscriptionData
        );

        const currentPlan =
          String(
            subscriptionData?.plan ||
              ""
          )
            .trim()
            .toLowerCase();

        const firstPaidPlan =
          sortedPlans.find(
            (plan) =>
              Number(plan.price) > 0
          );

        if (
          currentPlan &&
          currentPlan !== "free" &&
          sortedPlans.some(
            (plan) =>
              plan.id === currentPlan
          )
        ) {
          setSelectedPlan(
            currentPlan
          );
        } else {
          setSelectedPlan(
            firstPaidPlan?.id ||
              "plus"
          );
        }
      } catch (requestError) {
        console.error(
          "SUBSCRIPTION LOAD ERROR:",
          requestError?.response
            ?.data ||
            requestError?.message ||
            requestError
        );

        setError(
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Unable to load subscription information."
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

  async function waitForPayment(
    paymentId
  ) {
    const maxAttempts = 20;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt += 1
    ) {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            3000
          )
      );

      const payment =
        await getPaymentStatus(
          paymentId
        );

      if (
        payment?.status ===
        "completed"
      ) {
        return payment;
      }

      if (
        payment?.status ===
          "failed" ||
        payment?.status ===
          "cancelled"
      ) {
        throw new Error(
          payment?.resultDescription ||
            "The M-PESA payment was not completed."
        );
      }
    }

    throw new Error(
      "Payment confirmation is taking longer than expected. Check your subscription again in a moment."
    );
  }

  async function subscribe() {
    if (processing) {
      return;
    }

    const plan =
      plans.find(
        (item) =>
          item.id ===
          selectedPlan
      );

    if (!plan) {
      Alert.alert(
        "Select a plan",
        "Choose a subscription plan first."
      );

      return;
    }

    if (
      Number(plan.price) <= 0
    ) {
      Alert.alert(
        "Free plan",
        "The Free plan does not require payment."
      );

      return;
    }

    const phone =
      normalizeKenyanPhone(
        phoneNumber
      );

    if (
      !isValidKenyanPhone(
        phoneNumber
      )
    ) {
      Alert.alert(
        "Invalid M-PESA number",
        "Enter a valid Phone number ."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await startSubscriptionCheckout(
          plan.id,
          phone
        );

      const paymentId =
        result?.payment?.id;

      if (!paymentId) {
        throw new Error(
          "The server did not return a payment ID."
        );
      }

      Alert.alert(
        "M-PESA request sent",
        `Check ${phone} and enter your M-PESA PIN to complete the ${plan.name} payment of ${formatCurrency(
          plan.price,
          plan.currency
        )}.`
      );

      await waitForPayment(
        paymentId
      );

      const latest =
        await getSubscriptionStatus();

      setSubscription(
        latest
      );

      Alert.alert(
        "Subscription active",
        `Your ${plan.name} subscription is now active.`
      );
    } catch (requestError) {
      console.error(
        "SUBSCRIPTION CHECKOUT ERROR:",
        requestError?.response
          ?.data ||
          requestError?.message ||
          requestError
      );

      Alert.alert(
        "Payment not completed",
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to complete the subscription payment."
      );
    } finally {
      setProcessing(false);
    }
  }

  function confirmCancel() {
    Alert.alert(
      "Cancel subscription?",
      "Your paid access will remain available until the current expiry date. No new renewal will be scheduled.",
      [
        {
          text: "Keep subscription",
          style: "cancel",
        },
        {
          text: "Cancel subscription",
          style: "destructive",
          onPress:
            performCancel,
        },
      ]
    );
  }

  async function performCancel() {
    try {
      setProcessing(true);

      const updated =
        await cancelSubscription();

      setSubscription(
        updated
      );

      Alert.alert(
        "Subscription cancelled",
        "Your current paid access remains active until its expiry date."
      );
    } catch (requestError) {
      console.error(
        "SUBSCRIPTION CANCEL ERROR:",
        requestError?.response
          ?.data ||
          requestError?.message ||
          requestError
      );

      Alert.alert(
        "Unable to cancel",
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to cancel the subscription."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <Page
        title="Subscription"
        onBack={() =>
          router.back()
        }
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Subscription"
      onBack={() =>
        router.back()
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              loadData({
                refresh: true,
              })
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <InfoCard
          icon="card-outline"
          title="Snapgram subscriptions"
          text="Choose the Snapgram experience that fits you."
        />

        {error ? (
          <>
            <Notice tone="danger">
              {error}
            </Notice>

            <PrimaryButton
              text="Try again"
              onPress={() =>
                loadData()
              }
            />
          </>
        ) : null}

        {subscription ? (
          <Notice tone="success">
            Current plan:{" "}
            {subscription.planName ||
              subscription.plan ||
              "Free"}

            {subscription.expiresAt
              ? ` • Expires ${new Date(
                  subscription.expiresAt
                ).toLocaleDateString()}`
              : ""}
          </Notice>
        ) : null}

        <View
          style={styles.plans}
        >
          {plans.map((plan) => {
            const isCurrent =
              subscription?.plan ===
              plan.id;

            const isSelected =
              selectedPlan ===
              plan.id;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected &&
                    styles.selectedCard,
                  isCurrent &&
                    styles.currentCard,
                ]}
              >
                <View
                  style={
                    styles.planHeader
                  }
                >
                  <View
                    style={
                      styles.planTitleArea
                    }
                  >
                    <Text
                      style={
                        styles.planName
                      }
                    >
                      {plan.name}
                    </Text>

                    <Text
                      style={
                        styles.planDescription
                      }
                    >
                      {planDescription(
                        plan.id
                      )}
                    </Text>
                  </View>

                  {isCurrent ? (
                    <View
                      style={
                        styles.badge
                      }
                    >
                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        CURRENT
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={
                    styles.planPrice
                  }
                >
                  {formatCurrency(
                    plan.price,
                    plan.currency
                  )}

                  <Text
                    style={
                      styles.interval
                    }
                  >
                    {" "}
                    / month
                  </Text>
                </Text>

                <View
                  style={
                    styles.featureList
                  }
                >
                  {(
                    plan.features ||
                    []
                  ).map(
                    (feature) => (
                      <View
                        key={
                          feature
                        }
                        style={
                          styles.featureRow
                        }
                      >
                        <Text
                          style={
                            styles.check
                          }
                        >
                          ✓
                        </Text>

                        <Text
                          style={
                            styles.featureText
                          }
                        >
                          {
                            feature
                          }
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {isCurrent ? (
                  <PrimaryButton
                    text="Current plan"
                    disabled
                    onPress={() => {}}
                  />
                ) : (
                  <PrimaryButton
                    text={
                      isSelected
                        ? "Selected"
                        : `Choose ${plan.shortName}`
                    }
                    disabled={
                      processing
                    }
                    onPress={() =>
                      setSelectedPlan(
                        plan.id
                      )
                    }
                  />
                )}
              </View>
            );
          })}
        </View>

        {selectedPlan !==
        "free" ? (
          <>
            <SettingItem
              title="M-PESA payment"
              subtitle="Enter the M-PESA number you want to use for payment."
            />

            <TextInput
              value={
                phoneNumber
              }
              onChangeText={(
                value
              ) =>
                setPhoneNumber(
                  formatPhoneInput(
                    value
                  )
                )
              }
              placeholder=""
              keyboardType="phone-pad"
              editable={
                !processing
              }
              style={
                styles.phoneInput
              }
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={17}
            />

            <PrimaryButton
              text={
                processing
                  ? "Processing..."
                  : `Pay for ${
                      plans.find(
                        (item) =>
                          item.id ===
                          selectedPlan
                      )?.shortName ||
                      "plan"
                    }`
              }
              disabled={
                processing ||
                !phoneNumber
              }
              onPress={
                subscribe
              }
            />
          </>
        ) : null}

        {subscription &&
        subscription.plan !==
          "free" ? (
          <>
            <SettingItem
              title="Payment history"
              subtitle="View your previous subscription payments."
              onPress={() =>
                router.push(
                  "/settings/subscription-history"
                )
              }
            />

            <SettingItem
              title="Cancel subscription"
              subtitle="Stop future renewal while keeping your current access until expiry."
              onPress={
                confirmCancel
              }
              danger
              disabled={
                processing
              }
            />
          </>
        ) : null}

        {processing ? (
          <View
            style={
              styles.loading
            }
          >
            <ActivityIndicator />
          </View>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles =
  StyleSheet.create({
    content: {
      paddingBottom: 32,
    },

    plans: {
      gap: 16,
      marginVertical: 16,
    },

    planCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      marginBottom: 4,
    },

    selectedCard: {
      borderWidth: 2,
    },

    currentCard: {
      borderWidth: 2,
    },

    planHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      gap: 12,
    },

    planTitleArea: {
      flex: 1,
    },

    planName: {
      fontSize: 20,
      fontWeight: "800",
    },

    planDescription: {
      marginTop: 5,
      fontSize: 13,
      opacity: 0.7,
      lineHeight: 18,
    },

    badge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 10,
      alignSelf:
        "flex-start",
    },

    badgeText: {
      fontSize: 10,
      fontWeight: "800",
    },

    planPrice: {
      fontSize: 27,
      fontWeight: "900",
      marginTop: 18,
    },

    interval: {
      fontSize: 13,
      fontWeight: "500",
      opacity: 0.65,
    },

    featureList: {
      marginVertical: 18,
      gap: 9,
    },

    featureRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 9,
    },

    check: {
      fontSize: 16,
      fontWeight: "800",
    },

    featureText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },

    phoneInput: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 13,
      fontSize: 16,
      marginBottom: 6,
      minHeight: 50,
    },

    phoneHint: {
      fontSize: 12,
      lineHeight: 18,
      opacity: 0.65,
      marginBottom: 12,
    },

    loading: {
      alignItems:
        "center",
      paddingVertical: 20,
    },
  });