import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import {
  applyForVerification,
  getVerificationStatus,
} from "../../../services/verificationService";
import {
  ChoiceSettings,
  InfoCard,
  Notice,
  Page,
  PageLoading,
  PrimaryButton,
  TextField,
} from "../../../components/settings/SettingsUI";

const CATEGORIES = [
  "Creator",
  "Business",
  "Public figure",
  "Organization",
  "Brand",
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeStatus(value) {
  const status = String(value || "none").toLowerCase().trim();

  if (["approved", "verified", "accepted"].includes(status)) {
    return "approved";
  }

  if (["pending", "submitted", "under_review", "review"].includes(status)) {
    return "pending";
  }

  if (["rejected", "declined", "denied"].includes(status)) {
    return "rejected";
  }

  return "none";
}

export default function VerificationScreen() {
  const { user } = useAuth();

  const [status, setStatus] = useState("loading");
  const [request, setRequest] = useState(null);

  const [category, setCategory] = useState("Creator");
  const [reason, setReason] = useState("");
  const [website, setWebsite] = useState(user?.website || "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWebsite(user?.website || "");
  }, [user?.website]);

  const loadStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await getVerificationStatus();

      setStatus(normalizeStatus(result?.status));
      setRequest(result?.request || null);

      if (result?.request?.category) {
        setCategory(result.request.category);
      }
    } catch (requestError) {
      console.error(
        "VERIFICATION STATUS ERROR:",
        requestError?.response?.data || requestError?.message || requestError
      );

      setStatus("none");
      setRequest(null);
      setError(
        getErrorMessage(
          requestError,
          "Unable to load your verification status."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const normalizedWebsite = useMemo(
    () => website.trim(),
    [website]
  );

  const normalizedReason = useMemo(
    () => reason.trim(),
    [reason]
  );

  const canSubmit =
    !submitting &&
    category.trim().length > 0 &&
    normalizedReason.length > 0;

  async function submitApplication() {
    if (submitting) {
      return;
    }

    if (!category.trim()) {
      Alert.alert(
        "Category required",
        "Please select a verification category."
      );
      return;
    }

    if (!normalizedReason) {
      Alert.alert(
        "Reason required",
        "Please explain why you are requesting verification."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await applyForVerification({
        category: category.trim(),
        reason: normalizedReason,
        website: normalizedWebsite,
      });

      setReason("");

      await loadStatus();

      Alert.alert(
        "Application submitted",
        "Your verification request has been submitted successfully. We will review your application and update its status."
      );
    } catch (requestError) {
      console.error(
        "VERIFICATION APPLICATION ERROR:",
        requestError?.response?.data ||
          requestError?.message ||
          requestError
      );

      const message = getErrorMessage(
        requestError,
        "Unable to submit your verification request."
      );

      setError(message);

      Alert.alert("Verification", message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <Page
        title="Verification"
        onBack={() => router.back()}
      >
        <PageLoading />
      </Page>
    );
  }

  return (
    <Page
      title="Verification"
      onBack={() => router.back()}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStatus(true)}
            />
          }
          contentContainerStyle={styles.content}
        >
          {error ? (
            <Notice tone="error">
              {error}
            </Notice>
          ) : null}

          {status === "approved" ? (
            <VerifiedState user={user} request={request} />
          ) : null}

          {status === "pending" ? (
            <PendingState request={request} />
          ) : null}

          {status === "rejected" ? (
            <>
              <InfoCard
                icon="close-circle-outline"
                title="Verification not approved"
                text="Your previous verification request was not approved. You can review your information and submit a new application."
              />

              {request ? (
                <RequestSummary request={request} />
              ) : null}

              <ApplicationForm
                category={category}
                setCategory={setCategory}
                reason={reason}
                setReason={setReason}
                website={website}
                setWebsite={setWebsite}
                submitting={submitting}
                canSubmit={canSubmit}
                onSubmit={submitApplication}
              />
            </>
          ) : null}

          {status === "none" ? (
            <>
              <InfoCard
                icon="checkmark-circle-outline"
                title="Snapgram verification"
                text="Apply for verification to help people recognize your authentic identity, organization, business or public presence."
              />

              <Notice>
                Verification is reviewed by Snapgram. Providing accurate,
                relevant information helps us evaluate your application.
              </Notice>

              <ApplicationForm
                category={category}
                setCategory={setCategory}
                reason={reason}
                setReason={setReason}
                website={website}
                setWebsite={setWebsite}
                submitting={submitting}
                canSubmit={canSubmit}
                onSubmit={submitApplication}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

function VerifiedState({ user, request }) {
  const displayName =
    user?.name ||
    user?.username ||
    "Snapgram User";

  const username = user?.username
    ? `@${user.username}`
    : "";

  return (
    <>
      <InfoCard
        icon="checkmark-circle"
        title="Verified account"
        text="Your Snapgram account has been verified."
      />

      <View style={styles.verifiedCard}>
        <View style={styles.verifiedIcon}>
          <Text style={styles.verifiedIconText}>✓</Text>
        </View>

        <View style={styles.verifiedIdentity}>
          <Text style={styles.verifiedName}>
            {displayName}
          </Text>

          {username ? (
            <Text style={styles.verifiedUsername}>
              {username}
            </Text>
          ) : null}

          <Text style={styles.verifiedStatus}>
            Verified on Snapgram
          </Text>
        </View>
      </View>

      {request?.category ? (
        <Notice tone="success">
          Verification category: {request.category}
        </Notice>
      ) : null}

      {request?.approvedAt ? (
        <Notice tone="success">
          Verified {formatDate(request.approvedAt)}
        </Notice>
      ) : null}
    </>
  );
}

function PendingState({ request }) {
  return (
    <>
      <InfoCard
        icon="time-outline"
        title="Verification pending"
        text="Your verification application is currently under review. You don't need to submit another application while this one is pending."
      />

      <RequestSummary request={request} />

      <Notice>
        We will update your verification status when the review is complete.
      </Notice>
    </>
  );
}

function RequestSummary({ request }) {
  if (!request) {
    return null;
  }

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>
        Application details
      </Text>

      {request.category ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Category
          </Text>

          <Text style={styles.summaryValue}>
            {request.category}
          </Text>
        </View>
      ) : null}

      {request.status ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Status
          </Text>

          <Text style={styles.summaryValue}>
            {String(request.status)
              .replace(/_/g, " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </Text>
        </View>
      ) : null}

      {request.createdAt ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Submitted
          </Text>

          <Text style={styles.summaryValue}>
            {formatDate(request.createdAt)}
          </Text>
        </View>
      ) : null}

      {request.reason ? (
        <View style={styles.reasonContainer}>
          <Text style={styles.summaryLabel}>
            Reason provided
          </Text>

          <Text style={styles.reasonText}>
            {request.reason}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ApplicationForm({
  category,
  setCategory,
  reason,
  setReason,
  website,
  setWebsite,
  submitting,
  canSubmit,
  onSubmit,
}) {
  return (
    <>
      <ChoiceSettings
        title="Category"
        options={CATEGORIES}
        selected={category}
        onSelect={setCategory}
      />

      <TextField
        label="Why should Snapgram verify you?"
        value={reason}
        onChangeText={setReason}
        placeholder="Tell us about yourself, your work, brand, audience or public presence."
        multiline
        maxLength={2000}
      />

      <View style={styles.characterCountContainer}>
        <Text style={styles.characterCount}>
          {reason.length}/2000
        </Text>
      </View>

      <TextField
        label="Website"
        value={website}
        onChangeText={setWebsite}
        placeholder="https://example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <PrimaryButton
        text={
          submitting
            ? "Submitting..."
            : "Apply for verification"
        }
        disabled={!canSubmit}
        onPress={onSubmit}
      />

      {submitting ? (
        <Text style={styles.submittingText}>
          Sending your application securely...
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  content: {
    paddingBottom: 40,
  },

  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#f5f7fa",
  },

  verifiedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0095f6",
  },

  verifiedIconText: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "800",
  },

  verifiedIdentity: {
    flex: 1,
    marginLeft: 14,
  },

  verifiedName: {
    fontSize: 16,
    fontWeight: "700",
  },

  verifiedUsername: {
    marginTop: 2,
    fontSize: 14,
    opacity: 0.65,
  },

  verifiedStatus: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.55,
  },

  summaryCard: {
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#f5f7fa",
  },

  summaryTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.10)",
  },

  summaryLabel: {
    flex: 1,
    fontSize: 13,
    opacity: 0.6,
  },

  summaryValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
  },

  reasonContainer: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.10)",
  },

  reasonText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.8,
  },

  characterCountContainer: {
    alignItems: "flex-end",
    marginTop: -8,
    marginBottom: 12,
  },

  characterCount: {
    fontSize: 12,
    opacity: 0.5,
  },

  submittingText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.55,
  },
});

