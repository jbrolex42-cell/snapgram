import api from "./api";

export async function getVerificationStatus() {
  const response =
    await api.get(
      "/verification/status"
    );

  return (
    response.data || {
      isVerified: false,
      status: "none",
      request: null,
    }
  );
}

export async function applyForVerification({
  category,
  reason,
  website = "",
}) {
  if (!category?.trim()) {
    throw new Error(
      "Verification category is required."
    );
  }

  if (!reason?.trim()) {
    throw new Error(
      "Please explain why you are requesting verification."
    );
  }

  const response =
    await api.post(
      "/verification/apply",
      {
        category:
          category.trim(),

        reason:
          reason.trim(),

        website:
          website.trim(),
      }
    );

  return (
    response.data || {}
  );
}