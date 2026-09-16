import api from "./api";

export async function getMonetizationEligibility() {
  const response = await api.get(
    "/monetization/eligibility"
  );

  return (
    response.data?.eligibility || {
      status: "unknown",
      message:
        "Eligibility information is not available yet.",
      features: [],
      requirements: [],
      policyStatus: "unknown",
      policyMessage: "",
    }
  );
}