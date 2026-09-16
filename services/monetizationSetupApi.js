import api from "./api";

export async function getMonetizationSetup() {
  const response = await api.get(
    "/monetization/setup"
  );

  return (
    response.data?.setup || {
      setupStarted: false,
      setupComplete: false,

      paymentInformationComplete:
        false,

      taxInformationComplete:
        false,

      preferencesComplete:
        false,

      payoutCurrency: "KES",

      taxCountry: null,

      taxStatus: "not_started",

      preferences: {
        giftsEnabled: true,
        subscriptionsEnabled: false,
        adsEnabled: false,
        notificationsEnabled: true,
      },

      payoutMethod: null,

      progress: {
        completed: 0,
        total: 4,
        percentage: 0,
        steps: [],
      },
    }
  );
}

export async function updateMonetizationSetup(
  patch = {}
) {
  const response = await api.patch(
    "/monetization/setup",
    patch
  );

  return (
    response.data?.setup ||
    response.data
  );
}

export async function completeMonetizationSetup() {
  const response = await api.post(
    "/monetization/setup/complete"
  );

  return (
    response.data?.setup ||
    response.data
  );
}