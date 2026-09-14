import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function FollowButton({
  isFollowing = false,
  isRequested = false,
  disabled = false,
  onFollow,
  onUnfollow,
  onCancelRequest,
  style,
}) {
  const [loading, setLoading] =
    useState(false);

  const handlePress =
    useCallback(async () => {
      if (
        loading ||
        disabled
      ) {
        return;
      }

      try {
        setLoading(true);

        if (
          isRequested &&
          typeof onCancelRequest ===
            "function"
        ) {
          await onCancelRequest();
          return;
        }

        if (
          isFollowing &&
          typeof onUnfollow ===
            "function"
        ) {
          await onUnfollow();
          return;
        }

        if (
          !isFollowing &&
          typeof onFollow ===
            "function"
        ) {
          await onFollow();
        }
      } catch (error) {
        console.error(
          "FOLLOW BUTTON ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, [
      loading,
      disabled,
      isFollowing,
      isRequested,
      onFollow,
      onUnfollow,
      onCancelRequest,
    ]);

  const label = isRequested
    ? "Requested"
    : isFollowing
      ? "Following"
      : "Follow";

  const isSecondary =
    isFollowing ||
    isRequested;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={
        disabled ||
        loading
      }
      onPress={
        handlePress
      }
      style={[
        styles.button,

        !isSecondary &&
          styles.followButton,

        isFollowing &&
          styles.followingButton,

        isRequested &&
          styles.requestedButton,

        disabled &&
          styles.disabledButton,

        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isRequested
          ? "Cancel follow request"
          : isFollowing
            ? "Unfollow"
            : "Follow"
      }
      accessibilityState={{
        disabled:
          disabled ||
          loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            isSecondary
              ? "#111111"
              : "#FFFFFF"
          }
        />
      ) : (
        <Text
          style={[
            styles.text,

            isSecondary &&
              styles.secondaryText,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minWidth: 96,
      height: 36,

      paddingHorizontal: 16,

      borderRadius: 8,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth: 1,

      borderColor:
        "transparent",
    },

    followButton: {
      backgroundColor:
        "#0095F6",
    },

    followingButton: {
      backgroundColor:
        "#EFEFEF",

      borderColor:
        "#DBDBDB",
    },

    requestedButton: {
      backgroundColor:
        "#EFEFEF",

      borderColor:
        "#DBDBDB",
    },

    disabledButton: {
      opacity: 0.45,
    },

    text: {
      fontSize: 14,

      lineHeight: 18,

      fontWeight:
        "700",

      color:
        "#FFFFFF",

      textAlign:
        "center",
    },

    secondaryText: {
      color:
        "#111111",
    },
  });