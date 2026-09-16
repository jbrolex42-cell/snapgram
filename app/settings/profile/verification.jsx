import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "../../../context/AuthContext";

import {
  applyForVerification,
  getVerificationStatus,
} from "../../../services/verificationService";

const COLORS = {
  background: "#FFFFFF",
  card: "#F7F7F7",
  border: "#DBDBDB",
  text: "#111111",
  secondary: "#737373",
  muted: "#9A9A9A",
  blue: "#0095F6",
  blueDark: "#1877F2",
  green: "#2E7D32",
  greenBackground: "#EAF7EC",
  orange: "#C77700",
  orangeBackground: "#FFF4DF",
  red: "#D93025",
  redBackground: "#FDECEC",
};

const CATEGORIES = [
  "Creator",
  "Business",
  "Public figure",
  "Organization",
  "Brand",
];

const MAX_REASON_LENGTH = 2000;

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

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
  const status = String(value || "none")
    .toLowerCase()
    .trim();

  if (
    ["approved", "verified", "accepted"].includes(status)
  ) {
    return "approved";
  }

  if (
    ["pending", "submitted", "under_review", "review"].includes(
      status
    )
  ) {
    return "pending";
  }

  if (
    ["rejected", "declined", "denied"].includes(status)
  ) {
    return "rejected";
  }

  return "none";
}

function formatStatus(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function VerificationScreen() {
  const { user } = useAuth();

  const [status, setStatus] = useState("loading");
  const [request, setRequest] = useState(null);

  const [category, setCategory] = useState("Creator");
  const [reason, setReason] = useState("");
  const [website, setWebsite] = useState(
    user?.website || ""
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWebsite(user?.website || "");
  }, [user?.website]);

  const loadStatus = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result = await getVerificationStatus();

        const nextStatus = normalizeStatus(
          result?.status ||
            result?.request?.status
        );

        setStatus(nextStatus);
        setRequest(result?.request || null);

        if (result?.request?.category) {
          setCategory(result.request.category);
        }
      } catch (requestError) {
        console.error(
          "VERIFICATION STATUS ERROR:",
          requestError?.response?.data ||
            requestError?.message ||
            requestError
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
    },
    []
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const normalizedReason = useMemo(
    () => reason.trim(),
    [reason]
  );

  const normalizedWebsite = useMemo(
    () => website.trim(),
    [website]
  );

  const canSubmit =
    !submitting &&
    category.trim().length > 0 &&
    normalizedReason.length >= 10 &&
    normalizedReason.length <= MAX_REASON_LENGTH;

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

    if (normalizedReason.length < 10) {
      Alert.alert(
        "More information required",
        "Please provide at least 10 characters explaining why you should be verified."
      );
      return;
    }

    if (normalizedReason.length > MAX_REASON_LENGTH) {
      Alert.alert(
        "Reason too long",
        `Your explanation cannot exceed ${MAX_REASON_LENGTH} characters.`
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
        "Your verification application has been submitted successfully. Snapgram will review your application and update its status."
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
        "Unable to submit your verification application."
      );

      setError(message);

      Alert.alert(
        "Verification",
        message
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color={COLORS.blue}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerButton}
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color={COLORS.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Verification
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStatus(true)}
              tintColor={COLORS.blue}
            />
          }
          contentContainerStyle={styles.content}
        >
          {error ? (
            <ErrorCard
              message={error}
              onRetry={() => loadStatus()}
            />
          ) : null}

          {status === "approved" ? (
            <VerifiedState
              user={user}
              request={request}
            />
          ) : null}

          {status === "pending" ? (
            <PendingState
              request={request}
            />
          ) : null}

          {status === "rejected" ? (
            <RejectedState
              request={request}
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
          ) : null}

          {status === "none" ? (
            <ApplicationState
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
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function VerifiedState({ user, request }) {
  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Snapgram User";

  const username = user?.username
    ? `@${user.username}`
    : "";

  return (
    <>
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIcon,
            styles.heroIconSuccess,
          ]}
        >
          <Ionicons
            name="checkmark"
            size={32}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.heroTitle}>
          You're verified
        </Text>

        <Text style={styles.heroText}>
          Your account has been verified by
          Snapgram.
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {String(
              displayName
            )
              .trim()
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text
              style={styles.profileName}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.blue}
            />
          </View>

          {username ? (
            <Text style={styles.username}>
              {username}
            </Text>
          ) : null}

          <Text style={styles.verifiedLabel}>
            Verified account
          </Text>
        </View>
      </View>

      <SectionCard>
        <InfoRow
          icon="shield-checkmark-outline"
          title="Verification status"
          value="Verified"
          valueColor={COLORS.green}
        />

        {request?.category ? (
          <InfoRow
            icon="briefcase-outline"
            title="Category"
            value={request.category}
          />
        ) : null}

        {request?.approvedAt ? (
          <InfoRow
            icon="calendar-outline"
            title="Verified on"
            value={formatDate(
              request.approvedAt
            )}
            last
          />
        ) : null}
      </SectionCard>

      <NoticeCard
        icon="information-circle-outline"
        text="Verification helps people identify authentic accounts. It does not guarantee higher reach, engagement, or recommendations."
      />
    </>
  );
}

function PendingState({ request }) {
  return (
    <>
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIcon,
            styles.heroIconPending,
          ]}
        >
          <Ionicons
            name="time-outline"
            size={32}
            color={COLORS.orange}
          />
        </View>

        <Text style={styles.heroTitle}>
          Application under review
        </Text>

        <Text style={styles.heroText}>
          Your verification application has
          been received and is currently being
          reviewed.
        </Text>
      </View>

      <View style={styles.statusBanner}>
        <View style={styles.statusBannerIcon}>
          <Ionicons
            name="time-outline"
            size={19}
            color={COLORS.orange}
          />
        </View>

        <View style={styles.statusBannerContent}>
          <Text style={styles.statusBannerTitle}>
            Pending review
          </Text>

          <Text style={styles.statusBannerText}>
            You don't need to submit another
            application while this request is
            being reviewed.
          </Text>
        </View>
      </View>

      <RequestSummary request={request} />

      <NoticeCard
        icon="notifications-outline"
        text="Snapgram will update your verification status when the review is complete."
      />
    </>
  );
}

function RejectedState({
  request,
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
      <View style={styles.hero}>
        <View
          style={[
            styles.heroIcon,
            styles.heroIconRejected,
          ]}
        >
          <Ionicons
            name="close"
            size={32}
            color={COLORS.red}
          />
        </View>

        <Text style={styles.heroTitle}>
          Verification wasn't approved
        </Text>

        <Text style={styles.heroText}>
          You can review your information and
          submit a new application.
        </Text>
      </View>

      {request ? (
        <RequestSummary request={request} />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Submit a new application
        </Text>

        <Text style={styles.sectionSubtitle}>
          Make sure your information is accurate
          and clearly explains your public
          presence.
        </Text>
      </View>

      <ApplicationForm
        category={category}
        setCategory={setCategory}
        reason={reason}
        setReason={setReason}
        website={website}
        setWebsite={setWebsite}
        submitting={submitting}
        canSubmit={canSubmit}
        onSubmit={onSubmit}
      />
    </>
  );
}

function ApplicationState({
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
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons
            name="checkmark-circle-outline"
            size={34}
            color={COLORS.blue}
          />
        </View>

        <Text style={styles.heroTitle}>
          Request verification
        </Text>

        <Text style={styles.heroText}>
          Verification helps people recognize
          authentic creators, businesses,
          organizations and public figures.
        </Text>
      </View>

      <View style={styles.infoList}>
        <InfoFeature
          icon="person-outline"
          title="Authenticity"
          text="Tell us who you are and why your account represents a real public presence."
        />

        <InfoFeature
          icon="globe-outline"
          title="Public presence"
          text="A website or other relevant public information can help support your application."
        />

        <InfoFeature
          icon="shield-checkmark-outline"
          title="Review"
          text="Every application is reviewed by Snapgram."
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Application
        </Text>

        <Text style={styles.sectionSubtitle}>
          Provide accurate information before
          submitting your request.
        </Text>
      </View>

      <ApplicationForm
        category={category}
        setCategory={setCategory}
        reason={reason}
        setReason={setReason}
        website={website}
        setWebsite={setWebsite}
        submitting={submitting}
        canSubmit={canSubmit}
        onSubmit={onSubmit}
      />
    </>
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
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>
          Category
        </Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => {
            const selected = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                disabled={submitting}
                style={[
                  styles.categoryButton,
                  selected &&
                    styles.categoryButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected &&
                      styles.categoryTextSelected,
                  ]}
                >
                  {item}
                </Text>

                {selected ? (
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color="#FFFFFF"
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>
          Why should Snapgram verify you?
        </Text>

        <TextInputBox
          value={reason}
          onChangeText={setReason}
          placeholder="Tell us about yourself, your work, brand, audience or public presence."
          multiline
          maxLength={MAX_REASON_LENGTH}
          editable={!submitting}
        />

        <View style={styles.characterRow}>
          <Text style={styles.helperText}>
            Explain why your account should be
            verified.
          </Text>

          <Text
            style={[
              styles.characterCount,
              reason.length > MAX_REASON_LENGTH - 100 &&
                styles.characterCountWarning,
            ]}
          >
            {reason.length}/{MAX_REASON_LENGTH}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>
          Website
        </Text>

        <TextInputBox
          value={website}
          onChangeText={setWebsite}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!submitting}
        />

        <Text style={styles.helperText}>
          Optional. Add a website that supports
          your identity or public presence.
        </Text>
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmit &&
            styles.submitButtonDisabled,
          pressed &&
            canSubmit &&
            styles.submitButtonPressed,
        ]}
      >
        {submitting ? (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
          />
        ) : (
          <Text style={styles.submitButtonText}>
            Apply for verification
          </Text>
        )}
      </Pressable>

      {submitting ? (
        <Text style={styles.submittingText}>
          Sending your application securely...
        </Text>
      ) : null}

      {!canSubmit && !submitting ? (
        <Text style={styles.validationText}>
          Select a category and provide at least
          10 characters explaining your request.
        </Text>
      ) : null}
    </>
  );
}

function RequestSummary({ request }) {
  if (!request) {
    return null;
  }

  return (
    <SectionCard>
      <Text style={styles.cardTitle}>
        Application details
      </Text>

      {request.category ? (
        <InfoRow
          icon="briefcase-outline"
          title="Category"
          value={request.category}
        />
      ) : null}

      {request.status ? (
        <InfoRow
          icon="ellipse-outline"
          title="Status"
          value={formatStatus(request.status)}
        />
      ) : null}

      {request.createdAt ? (
        <InfoRow
          icon="calendar-outline"
          title="Submitted"
          value={formatDate(
            request.createdAt
          )}
        />
      ) : null}

      {request.reason ? (
        <View style={styles.reasonBlock}>
          <Text style={styles.reasonLabel}>
            Reason provided
          </Text>

          <Text style={styles.reasonValue}>
            {request.reason}
          </Text>
        </View>
      ) : null}
    </SectionCard>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="alert-circle-outline"
          size={21}
          color={COLORS.red}
        />
      </View>

      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {message}
        </Text>

        <Pressable
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            Try again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionCard({ children }) {
  return (
    <View style={styles.sectionCard}>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  title,
  value,
  valueColor,
  last = false,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoRowLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.secondary}
        />

        <Text style={styles.infoRowTitle}>
          {title}
        </Text>
      </View>

      <Text
        style={[
          styles.infoRowValue,
          valueColor && {
            color: valueColor,
          },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function InfoFeature({
  icon,
  title,
  text,
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={COLORS.text}
        />
      </View>

      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function NoticeCard({ icon, text }) {
  return (
    <View style={styles.noticeCard}>
      <Ionicons
        name={icon}
        size={19}
        color={COLORS.secondary}
      />

      <Text style={styles.noticeText}>
        {text}
      </Text>
    </View>
  );
}

function TextInputBox({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  editable = true,
  ...props
}) {
  return (
    <View
      style={[
        styles.inputContainer,
        multiline && styles.multilineInputContainer,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  flex: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  headerButton: {
    position: "absolute",
    left: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    position: "absolute",
    right: 10,
    width: 40,
    height: 40,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 50,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },

  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF4FF",
    marginBottom: 15,
  },

  heroIconSuccess: {
    backgroundColor: COLORS.blue,
  },

  heroIconPending: {
    backgroundColor:
      COLORS.orangeBackground,
  },

  heroIconRejected: {
    backgroundColor: COLORS.redBackground,
  },

  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  heroText: {
    marginTop: 8,
    maxWidth: 340,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.secondary,
    textAlign: "center",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E1E1E1",
  },

  profileAvatarText: {
    fontSize: 21,
    fontWeight: "700",
    color: COLORS.text,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  profileName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  username: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.secondary,
  },

  verifiedLabel: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.green,
    fontWeight: "600",
  },

  sectionCard: {
    overflow: "hidden",
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  cardTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  infoRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoRowBorder: {
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  infoRowTitle: {
    fontSize: 14,
    color: COLORS.text,
  },

  infoRowValue: {
    maxWidth: "48%",
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
  },

  statusBanner: {
    flexDirection: "row",
    padding: 15,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor:
      COLORS.orangeBackground,
  },

  statusBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE7B5",
  },

  statusBannerContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.orange,
  },

  statusBannerText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#795000",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },

  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondary,
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: COLORS.redBackground,
  },

  errorIcon: {
    marginTop: 1,
  },

  errorContent: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.red,
  },

  errorText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#8B2C27",
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },

  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.red,
  },

  infoList: {
    marginBottom: 20,
  },

  featureRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },

  featureContent: {
    flex: 1,
    marginLeft: 12,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  featureText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondary,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondary,
  },

  formCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  fieldLabel: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  categoryGrid: {
    gap: 8,
  },

  categoryButton: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
  },

  categoryButtonSelected: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blue,
  },

  categoryText: {
    fontSize: 14,
    color: COLORS.text,
  },

  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },

  multilineInputContainer: {
    minHeight: 130,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },

  multilineInput: {
    minHeight: 130,
    textAlignVertical: "top",
  },

  characterRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  characterCount: {
    fontSize: 12,
    color: COLORS.muted,
  },

  characterCountWarning: {
    color: COLORS.orange,
    fontWeight: "600",
  },

  reasonBlock: {
    padding: 16,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },

  reasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  reasonValue: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },

  submitButton: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.blue,
    marginTop: 4,
  },

  submitButtonDisabled: {
    backgroundColor: "#B8DDF7",
  },

  submitButtonPressed: {
    opacity: 0.8,
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  submittingText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.muted,
  },

  validationText: {
    marginTop: 9,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },
});