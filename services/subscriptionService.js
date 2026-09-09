import api from "./api";

export async function getSubscriptionPlans() {
  const response =
    await api.get(
      "/subscriptions/plans"
    );

  return (
    response.data?.plans || []
  );
}

export async function getSubscriptionStatus() {
  const response =
    await api.get(
      "/subscriptions/status"
    );

  return (
    response.data?.subscription ||
    null
  );
}

export async function startSubscriptionCheckout(
  planId,
  phoneNumber
) {
  const response =
    await api.post(
      "/subscriptions/checkout",
      {
        planId,
        phoneNumber,
      }
    );

  return response.data;
}

export async function getPaymentStatus(
  paymentId
) {
  const response =
    await api.get(
      `/subscriptions/payments/${paymentId}`
    );

  return (
    response.data?.payment ||
    null
  );
}

export async function getSubscriptionHistory() {
  const response =
    await api.get(
      "/subscriptions/history"
    );

  return (
    response.data?.payments || []
  );
}

export async function cancelSubscription() {
  const response =
    await api.post(
      "/subscriptions/cancel"
    );

  return (
    response.data?.subscription ||
    null
  );
}