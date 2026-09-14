import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import { router } from "expo-router";

import {
  Page,
  InfoCard,
  SettingItem,
  PageLoading,
  Notice,
} from "../../../components/settings/SettingsUI";
import { loadSettings } from "../../../services/settingsApi";

export default function AccountStatusScreen() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAccountStatus = useCallback(async () => {
    try {
      setLoading(true);

      const data = await loadSettings();

      setSettings(data || {});
    } catch (error) {
      console.error(
        "ACCOUNT STATUS LOAD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setSettings({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccountStatus();
  }, [loadAccountStatus]);

  if (loading) {
    return (
      <Page
        title="Account status"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  const accountStatus =
    settings?.accountStatus || "Active";

  const normalizedStatus =
    String(accountStatus)
      .trim()
      .toLowerCase();

  const isActive =
    normalizedStatus === "active";

  const accountStanding =
    settings?.accountStanding ||
    "No current restrictions are shown on your account.";

  const recommendationEligibility =
    settings?.recommendationEligibility ||
    "Your recommendation eligibility information is not currently available.";

  return (
    <Page
      title="Account status"
      onBack={() => router.back()}
    >
      <InfoCard
        icon="shield-checkmark-outline"
        title="Account status"
        text="Review your account standing, recommendation eligibility, and any restrictions that may affect your Snapgram experience."
      />

      <Notice
        tone={
          isActive
            ? "success"
            : "danger"
        }
      >
        Current status: {accountStatus}
      </Notice>

      <SettingItem
        title="Account standing"
        subtitle={accountStanding}
      />

      <SettingItem
        title="Recommendation eligibility"
        subtitle={recommendationEligibility}
      />

      <SettingItem
        title="Removed content"
        subtitle={
          settings?.removedContentSummary ||
          "Removed-content details will appear here when they are provided by the backend."
        }
      />
    </Page>
  );
}