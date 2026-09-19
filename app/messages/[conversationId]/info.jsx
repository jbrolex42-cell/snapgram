import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import { useAuth } from "../../../context/AuthContext";

import VerifiedBadge from "../../../components/common/VerifiedBadge";

import {
  getConversationPreferences,
  setConversationMute,
  setConversationRestriction,
  setConversationTheme,
  setConversationNickname,
  setDisappearingMessages,
  setConversationBlock,
  reportConversation,
} from "../../../services/conversationPreferenceService";

function getId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return (
      value?._id ||
      value?.id ||
      null
    );
  }

  return String(value);
}

function normalizeParam(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function getDisplayName(user) {
  return (
    user?.fullName?.trim() ||
    user?.username ||
    "User"
  );
}

function getUsername(user) {
  if (!user?.username) {
    return null;
  }

  return String(user.username)
    .replace(/^@/, "")
    .trim();
}

function getAvatar(user) {
  return (
    user?.avatar ||
    user?.profilePicture ||
    user?.photoURL ||
    null
  );
}

function formatMuteDuration(
  mutedUntil
) {
  if (!mutedUntil) {
    return "Until turned back on";
  }

  const date =
    new Date(mutedUntil);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Muted";
  }

  const remaining =
    date.getTime() -
    Date.now();

  if (remaining <= 0) {
    return "Muted";
  }

  const minutes = Math.ceil(
    remaining / 60000
  );

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1
        ? ""
        : "s"
    }`;
  }

  const hours = Math.ceil(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    }`;
  }

  const days = Math.ceil(
    hours / 24
  );

  return `${days} day${
    days === 1
      ? ""
      : "s"
  }`;
}

function formatDisappearingDuration(
  duration
) {
  switch (
    Number(duration)
  ) {
    case 86400:
      return "24 hours";

    case 604800:
      return "7 days";

    case 2592000:
      return "30 days";

    default:
      return "Off";
  }
}

export default function ConversationInfoScreen() {
  const params =
    useLocalSearchParams();

  const {
    user: currentUser,
  } = useAuth();

  const conversationId =
    normalizeParam(
      params?.conversationId
    );

  const routeUserId =
    normalizeParam(
      params?.userId
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [otherUser, setOtherUser] =
    useState(null);

  const [muted, setMuted] =
    useState(false);

  const [muteUntil, setMuteUntil] =
    useState(null);

  const [restricted, setRestricted] =
    useState(false);

  const [blocked, setBlocked] =
    useState(false);

  const [theme, setTheme] =
    useState("default");

  const [nickname, setNickname] =
    useState("");

  const [
    disappearingDuration,
    setDisappearingDuration,
  ] = useState(0);

  const [
    nicknameModalVisible,
    setNicknameModalVisible,
  ] = useState(false);

  const [
    nicknameInput,
    setNicknameInput,
  ] = useState("");

  const profileUsername =
    useMemo(
      () =>
        getUsername(
          otherUser
        ),
      [otherUser]
    );

  const displayName =
    useMemo(
      () =>
        getDisplayName(
          otherUser
        ),
      [otherUser]
    );

  const avatar =
    useMemo(
      () =>
        getAvatar(
          otherUser
        ),
      [otherUser]
    );

  const verified =
    Boolean(
      otherUser?.isVerified
    );

  const loadData =
    useCallback(
      async () => {
        if (!conversationId) {
          setLoading(false);
          return;
        }

        setLoading(true);

        try {

          if (params?.user) {
            try {
              const parsed =
                JSON.parse(
                  String(
                    params.user
                  )
                );

              if (parsed) {
                setOtherUser(
                  parsed
                );
              }
            } catch (error) {
              console.warn(
                "[CONVERSATION INFO] Invalid user parameter:",
                error
              );
            }
          }

          const result =
            await getConversationPreferences(
              conversationId
            );

          const preference =
            result?.preference ||
            {};

          if (
            result?.user
          ) {
            setOtherUser(
              result.user
            );
          } else if (
            routeUserId &&
            !otherUser
          ) {
            setOtherUser({
              _id: String(
                routeUserId
              ),
              id: String(
                routeUserId
              ),
              fullName: "User",
              username: "",
              avatar: null,
              isVerified: false,
            });
          }

          setMuted(
            Boolean(
              preference.isMuted
            )
          );

          setMuteUntil(
            preference.mutedUntil ||
              null
          );

          setRestricted(
            Boolean(
              preference.restricted
            )
          );

          setTheme(
            preference.theme ||
              "default"
          );

          setNickname(
            preference.nickname ||
              ""
          );

          setDisappearingDuration(
            Number(
              preference.disappearingDuration ||
                0
            )
          );
        } catch (error) {
          console.error(
            "[CONVERSATION INFO] LOAD ERROR:",
            error
          );

          Alert.alert(
            "Couldn't load details",
            error?.response?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        conversationId,
        params?.user,
        routeUserId,
        otherUser,
      ]
    );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openProfile =
    useCallback(() => {
      if (!profileUsername) {
        Alert.alert(
          "Profile unavailable",
          "This user's profile could not be opened."
        );

        return;
      }

      router.push({
        pathname:
          "/profile/[username]",
        params: {
          username:
            profileUsername,
        },
      });
    }, [
      profileUsername,
    ]);

  const openSearch =
    useCallback(() => {
      if (!conversationId) {
        Alert.alert(
          "Search unavailable",
          "This conversation could not be identified."
        );

        return;
      }

      router.push({
        pathname:
          "/messages/[conversationId]/search",
        params: {
          conversationId:
            String(
              conversationId
            ),
        },
      });
    }, [
      conversationId,
    ]);

  const applyMute =
    useCallback(
      async (duration) => {
        if (!conversationId) {
          return;
        }

        try {
          setSaving(true);

          const result =
            await setConversationMute(
              conversationId,
              duration
            );

          setMuted(
            Boolean(
              result?.isMuted
            )
          );

          setMuteUntil(
            result?.mutedUntil ||
              null
          );
        } catch (error) {
          console.error(
            "[CONVERSATION INFO] MUTE ERROR:",
            error
          );

          Alert.alert(
            "Couldn't update mute",
            error?.response?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setSaving(false);
        }
      },
      [
        conversationId,
      ]
    );

  const unmute =
    useCallback(
      async () => {
        await applyMute(
          0
        );
      },
      [
        applyMute,
      ]
    );

  const showMuteOptions =
    useCallback(() => {
      const buttons = [
        {
          text: "1 hour",
          onPress: () =>
            applyMute(
              3600
            ),
        },
        {
          text: "8 hours",
          onPress: () =>
            applyMute(
              28800
            ),
        },
        {
          text: "24 hours",
          onPress: () =>
            applyMute(
              86400
            ),
        },
      ];

      if (muted) {
        buttons.push({
          text: "Turn notifications back on",
          onPress:
            unmute,
        });
      }

      buttons.push({
        text: "Cancel",
        style: "cancel",
      });

      Alert.alert(
        "Mute messages",
        muted
          ? `Notifications are muted${
              muteUntil
                ? ` for ${formatMuteDuration(
                    muteUntil
                  )}`
                : ""
            }.`
          : "Choose how long you want to mute this conversation.",
        buttons
      );
    }, [
      applyMute,
      muted,
      muteUntil,
      unmute,
    ]);

  const handleRestrict =
    useCallback(() => {
      const nextValue =
        !restricted;

      Alert.alert(
        nextValue
          ? "Restrict account"
          : "Unrestrict account",
        nextValue
          ? `Restrict ${displayName}?`
          : `Allow ${displayName} to interact with you normally again?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: nextValue
              ? "Restrict"
              : "Unrestrict",
            onPress:
              async () => {
                try {
                  setSaving(true);

                  const result =
                    await setConversationRestriction(
                      conversationId,
                      nextValue
                    );

                  setRestricted(
                    Boolean(
                      result?.restricted
                    )
                  );
                } catch (error) {
                  console.error(
                    "[CONVERSATION INFO] RESTRICT ERROR:",
                    error
                  );

                  Alert.alert(
                    "Couldn't update restriction",
                    error?.response
                      ?.data
                      ?.message ||
                      error?.message ||
                      "Please try again."
                  );
                } finally {
                  setSaving(
                    false
                  );
                }
              },
          },
        ]
      );
    }, [
      conversationId,
      displayName,
      restricted,
    ]);

  const handleBlock =
    useCallback(() => {
      const nextValue =
        !blocked;

      Alert.alert(
        nextValue
          ? `Block ${displayName}?`
          : `Unblock ${displayName}?`,
        nextValue
          ? "This person will no longer be able to message or interact with you."
          : "Allow this person to interact with you again?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: nextValue
              ? "Block"
              : "Unblock",
            style: nextValue
              ? "destructive"
              : "default",
            onPress:
              async () => {
                try {
                  setSaving(true);

                  const result =
                    await setConversationBlock(
                      conversationId,
                      nextValue
                    );

                  setBlocked(
                    Boolean(
                      result?.blocked
                    )
                  );

                  if (
                    nextValue
                  ) {
                    Alert.alert(
                      "Blocked",
                      `${displayName} has been blocked.`
                    );
                  }
                } catch (error) {
                  console.error(
                    "[CONVERSATION INFO] BLOCK ERROR:",
                    error
                  );

                  Alert.alert(
                    "Couldn't update block",
                    error?.response
                      ?.data
                      ?.message ||
                      error?.message ||
                      "Please try again."
                  );
                } finally {
                  setSaving(
                    false
                  );
                }
              },
          },
        ]
      );
    }, [
      blocked,
      conversationId,
      displayName,
    ]);

  const submitReport =
    useCallback(
      async (reason) => {
        try {
          setSaving(true);

          await reportConversation(
            conversationId,
            {
              reason,
            }
          );

          Alert.alert(
            "Report submitted",
            "Thanks. Your report has been submitted."
          );
        } catch (error) {
          console.error(
            "[CONVERSATION INFO] REPORT ERROR:",
            error
          );

          Alert.alert(
            "Couldn't submit report",
            error?.response?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setSaving(false);
        }
      },
      [
        conversationId,
      ]
    );

  const showReportOptions =
    useCallback(() => {
      Alert.alert(
        "Report",
        `Why are you reporting ${displayName}?`,
        [
          {
            text: "Spam",
            onPress: () =>
              submitReport(
                "spam"
              ),
          },
          {
            text: "Harassment",
            onPress: () =>
              submitReport(
                "harassment"
              ),
          },
          {
            text: "Scam or fraud",
            onPress: () =>
              submitReport(
                "scam"
              ),
          },
          {
            text: "Inappropriate content",
            onPress: () =>
              submitReport(
                "inappropriate"
              ),
          },
          {
            text: "Hate or abusive content",
            onPress: () =>
              submitReport(
                "hate"
              ),
          },
          {
            text: "Something else",
            onPress: () =>
              submitReport(
                "other"
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      displayName,
      submitReport,
    ]);

  const showOptions =
    useCallback(() => {
      Alert.alert(
        "Options",
        undefined,
        [
          {
            text: restricted
              ? "Unrestrict"
              : "Restrict",
            onPress:
              handleRestrict,
          },
          {
            text: blocked
              ? "Unblock"
              : "Block",
            style: "destructive",
            onPress:
              handleBlock,
          },
          {
            text: "Report",
            style: "destructive",
            onPress:
              showReportOptions,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      blocked,
      handleBlock,
      handleRestrict,
      restricted,
      showReportOptions,
    ]);

  const showThemeOptions =
    useCallback(() => {
      const themes = [
        {
          label: "Default",
          value: "default",
        },
        {
          label: "Blue",
          value: "blue",
        },
        {
          label: "Purple",
          value: "purple",
        },
        {
          label: "Pink",
          value: "pink",
        },
        {
          label: "Green",
          value: "green",
        },
      ];

      Alert.alert(
        "Theme",
        "Choose a conversation theme.",
        [
          ...themes.map(
            (item) => ({
              text:
                item.label,
              onPress:
                async () => {
                  try {
                    setSaving(
                      true
                    );

                    const result =
                      await setConversationTheme(
                        conversationId,
                        item.value
                      );

                    setTheme(
                      result?.theme ||
                        item.value
                    );
                  } catch (error) {
                    console.error(
                      "[CONVERSATION INFO] THEME ERROR:",
                      error
                    );

                    Alert.alert(
                      "Couldn't update theme",
                      error?.response
                        ?.data
                        ?.message ||
                        error?.message ||
                        "Please try again."
                    );
                  } finally {
                    setSaving(
                      false
                    );
                  }
                },
            })
          ),
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      conversationId,
    ]);

  const openNicknameEditor =
    useCallback(() => {
      setNicknameInput(
        nickname || ""
      );

      setNicknameModalVisible(
        true
      );
    }, [
      nickname,
    ]);

  const saveNickname =
    useCallback(
      async () => {
        try {
          setSaving(true);

          const result =
            await setConversationNickname(
              conversationId,
              nicknameInput.trim()
            );

          setNickname(
            result?.nickname ||
              ""
          );

          setNicknameModalVisible(
            false
          );
        } catch (error) {
          console.error(
            "[CONVERSATION INFO] NICKNAME ERROR:",
            error
          );

          Alert.alert(
            "Couldn't save nickname",
            error?.response?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setSaving(false);
        }
      },
      [
        conversationId,
        nicknameInput,
      ]
    );

  const applyDisappearing =
    useCallback(
      async (duration) => {
        try {
          setSaving(true);

          const result =
            await setDisappearingMessages(
              conversationId,
              duration
            );

          setDisappearingDuration(
            Number(
              result?.disappearingDuration ||
                0
            )
          );
        } catch (error) {
          console.error(
            "[CONVERSATION INFO] DISAPPEARING ERROR:",
            error
          );

          Alert.alert(
            "Couldn't update disappearing messages",
            error?.response?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setSaving(false);
        }
      },
      [
        conversationId,
      ]
    );

  const showDisappearingOptions =
    useCallback(() => {
      Alert.alert(
        "Disappearing messages",
        "Choose when new messages should disappear.",
        [
          {
            text: "Off",
            onPress: () =>
              applyDisappearing(
                0
              ),
          },
          {
            text: "24 hours",
            onPress: () =>
              applyDisappearing(
                86400
              ),
          },
          {
            text: "7 days",
            onPress: () =>
              applyDisappearing(
                604800
              ),
          },
          {
            text: "30 days",
            onPress: () =>
              applyDisappearing(
                2592000
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      applyDisappearing,
    ]);

  const openPrivacySafety =
    useCallback(() => {
      Alert.alert(
        "Privacy & safety",
        "Messages use end-to-end encryption. Your private encryption keys remain on your device. Snapgram's server stores encrypted message envelopes rather than readable message text.",
        [
          {
            text: "OK",
          },
        ]
      );
    }, []);

  const createGroupChat =
    useCallback(() => {
      Alert.alert(
        "Create group chat",
        "Choose additional people to add to this conversation.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.push(
                "/messages/new"
              );
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, []);

  const showProblemOptions =
    useCallback(() => {
      Alert.alert(
        "Something isn't working",
        "What would you like help with?",
        [
          {
            text: "Messages aren't sending",
            onPress: () =>
              Alert.alert(
                "Messages",
                "Check your connection and encryption session. If the problem continues, use Snapgram Support."
              ),
          },
          {
            text: "Calls aren't working",
            onPress: () =>
              Alert.alert(
                "Calls",
                "Check microphone/camera permissions and your connection. If the problem continues, use Snapgram Support."
              ),
          },
          {
            text: "Encryption problem",
            onPress: () =>
              Alert.alert(
                "Encryption",
                "Your private encryption keys remain on this device. If a session cannot be established, the conversation may need to establish a new secure session."
              ),
          },
          {
            text: "Something else",
            onPress: () =>
              Alert.alert(
                "Support",
                "Support reporting can be connected here."
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.loading
          }
        >
          <ActivityIndicator
            size="small"
            color="#111111"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >

      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.headerButton
          }
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111111"
          />
        </Pressable>

        <Text
          style={
            styles.headerTitle
          }
        >
          Details
        </Text>

        <View
          style={
            styles.headerButton
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        <View
          style={
            styles.profileSection
          }
        >
          <Pressable
            onPress={
              openProfile
            }
          >
            <Image
              source={
                avatar
                  ? {
                      uri: avatar,
                    }
                  : require(
                      "../../../assets/images/icon.png"
                    )
              }
              style={
                styles.avatar
              }
            />
          </Pressable>

          <Pressable
            onPress={
              openProfile
            }
            style={
              styles.identity
            }
          >
            <View
              style={
                styles.nameRow
              }
            >
              <Text
                style={
                  styles.name
                }
                numberOfLines={
                  1
                }
              >
                {displayName}
              </Text>

              {verified ? (
                <VerifiedBadge
                  size={17}
                />
              ) : null}
            </View>

            {!verified &&
            profileUsername ? (
              <Text
                style={
                  styles.username
                }
                numberOfLines={
                  1
                }
              >
                @{profileUsername}
              </Text>
            ) : null}
          </Pressable>

          {blocked ? (
            <View
              style={
                styles.statusBadge
              }
            >
              <Ionicons
                name="ban-outline"
                size={14}
                color="#666666"
              />

              <Text
                style={
                  styles.statusBadgeText
                }
              >
                Blocked
              </Text>
            </View>
          ) : restricted ? (
            <View
              style={
                styles.statusBadge
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#666666"
              />

              <Text
                style={
                  styles.statusBadgeText
                }
              >
                Restricted
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={
            styles.actionRow
          }
        >
          <InfoAction
            icon="person-outline"
            label="Profile"
            onPress={
              openProfile
            }
          />

          <InfoAction
            icon="search-outline"
            label="Search"
            onPress={
              openSearch
            }
          />

          <InfoAction
            icon={
              muted
                ? "notifications-off-outline"
                : "notifications-outline"
            }
            label={
              muted
                ? "Unmute"
                : "Mute"
            }
            onPress={
              showMuteOptions
            }
            active={
              muted
            }
          />

          <InfoAction
            icon="ellipsis-horizontal"
            label="Options"
            onPress={
              showOptions
            }
          />
        </View>

        {muted ? (
          <View
            style={
              styles.infoBanner
            }
          >
            <Ionicons
              name="notifications-off-outline"
              size={19}
              color="#555555"
            />

            <View
              style={
                styles.infoBannerText
              }
            >
              <Text
                style={
                  styles.infoBannerTitle
                }
              >
                Notifications muted
              </Text>

              <Text
                style={
                  styles.infoBannerSubtitle
                }
              >
                {muteUntil
                  ? formatMuteDuration(
                      muteUntil
                    )
                  : "Until turned back on"}
              </Text>
            </View>

            <Pressable
              onPress={
                unmute
              }
              disabled={
                saving
              }
            >
              <Text
                style={
                  styles.infoBannerAction
                }
              >
                Turn on
              </Text>
            </Pressable>
          </View>
        ) : null}

        <SectionTitle
          title="Conversation"
        />

        <SettingRow
          icon="color-palette-outline"
          title="Theme"
          subtitle={
            theme ===
            "default"
              ? "Default"
              : theme
                  .charAt(0)
                  .toUpperCase() +
                theme.slice(
                  1
                )
          }
          onPress={
            showThemeOptions
          }
        />

        <SettingRow
          icon="at-outline"
          title="Nicknames"
          subtitle={
            nickname
              ? nickname
              : "Set a nickname for this person"
          }
          onPress={
            openNicknameEditor
          }
        />

        <SettingRow
          icon="timer-outline"
          title="Disappearing messages"
          subtitle={formatDisappearingDuration(
            disappearingDuration
          )}
          onPress={
            showDisappearingOptions
          }
        />

        <SectionTitle
          title="Privacy & safety"
        />

        <SettingRow
          icon="lock-closed-outline"
          title="Privacy and safety"
          subtitle="End-to-end encrypted messages"
          onPress={
            openPrivacySafety
          }
        />

        <SectionTitle
          title="More"
        />

        <SettingRow
          icon="people-outline"
          title="Create a group chat"
          subtitle="Add more people to this conversation"
          onPress={
            createGroupChat
          }
        />

        <SettingRow
          icon="help-circle-outline"
          title="Something isn't working"
          subtitle="Get help with this conversation"
          onPress={
            showProblemOptions
          }
        />

        <SectionTitle
          title="Account"
        />

        <SettingRow
          icon={
            restricted
              ? "shield-checkmark-outline"
              : "shield-outline"
          }
          title={
            restricted
              ? "Unrestrict account"
              : "Restrict account"
          }
          subtitle={
            restricted
              ? "Allow normal interaction again"
              : "Limit how this person can interact with you"
          }
          onPress={
            handleRestrict
          }
        />

        <SettingRow
          icon={
            blocked
              ? "lock-open-outline"
              : "ban-outline"
          }
          title={
            blocked
              ? "Unblock"
              : "Block"
          }
          subtitle={
            blocked
              ? "Allow this person to interact with you again"
              : "Stop this person from messaging or interacting with you"
          }
          danger={
            !blocked
          }
          onPress={
            handleBlock
          }
        />

        <SettingRow
          icon="flag-outline"
          title="Report"
          subtitle="Report this account or conversation"
          danger
          onPress={
            showReportOptions
          }
        />

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>

      {saving ? (
        <View
          pointerEvents="auto"
          style={
            styles.savingOverlay
          }
        >
          <View
            style={
              styles.savingBox
            }
          >
            <ActivityIndicator
              size="small"
              color="#111111"
            />

            <Text
              style={
                styles.savingText
              }
            >
              Saving...
            </Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={
          nicknameModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNicknameModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.nicknameModal
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Nickname
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Set a nickname for{" "}
              {displayName}.
            </Text>

            <TextInput
              value={
                nicknameInput
              }
              onChangeText={
                setNicknameInput
              }
              placeholder="Nickname"
              placeholderTextColor="#999999"
              maxLength={50}
              autoFocus
              style={
                styles.nicknameInput
              }
              returnKeyType="done"
              onSubmitEditing={
                saveNickname
              }
            />

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                onPress={() =>
                  setNicknameModalVisible(
                    false
                  )
                }
                style={
                  styles.modalButton
                }
              >
                <Text
                  style={
                    styles.modalCancel
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              {nickname ? (
                <Pressable
                  onPress={() => {
                    setNicknameInput(
                      ""
                    );
                  }}
                  style={
                    styles.modalButton
                  }
                >
                  <Text
                    style={
                      styles.modalRemove
                    }
                  >
                    Clear
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={
                  saveNickname
                }
                style={[
                  styles.modalButton,
                  styles.modalSaveButton,
                ]}
              >
                <Text
                  style={
                    styles.modalSave
                  }
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoAction({
  icon,
  label,
  onPress,
  active = false,
}) {
  return (
    <Pressable
      style={
        styles.action
      }
      onPress={
        onPress
      }
    >
      <View
        style={[
          styles.actionCircle,
          active &&
            styles.actionCircleActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={
            active
              ? "#0095F6"
              : "#111111"
          }
        />
      </View>

      <Text
        style={[
          styles.actionLabel,
          active &&
            styles.actionLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({
  title,
}) {
  return (
    <Text
      style={
        styles.sectionTitle
      }
    >
      {title}
    </Text>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={
        styles.settingRow
      }
    >
      <View
        style={[
          styles.settingIcon,
          danger &&
            styles.dangerIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            danger
              ? "#ED4956"
              : "#111111"
          }
        />
      </View>

      <View
        style={
          styles.settingText
        }
      >
        <Text
          style={[
            styles.settingTitle,
            danger &&
              styles.dangerText,
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={
              styles.settingSubtitle
            }
            numberOfLines={
              2
            }
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={
          danger
            ? "#ED4956"
            : "#888888"
        }
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    loading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#FFFFFF",
    },

    header: {
      height: 54,
      paddingHorizontal: 7,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#DBDBDB",
      backgroundColor:
        "#FFFFFF",
    },

    headerButton: {
      width: 44,
      height: 44,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerTitle: {
      flex: 1,
      textAlign:
        "center",
      fontSize: 17,
      fontWeight:
        "700",
      color: "#111111",
    },

    content: {
      paddingBottom: 45,
    },

    profileSection: {
      alignItems:
        "center",
      paddingTop: 25,
      paddingBottom: 22,
    },

    avatar: {
      width: 92,
      height: 92,
      marginBottom: 12,
      borderRadius: 46,
      backgroundColor:
        "#EFEFEF",
    },

    identity: {
      alignItems:
        "center",
      maxWidth: "88%",
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
    },

    name: {
      maxWidth: "88%",
      fontSize: 20,
      lineHeight: 25,
      fontWeight:
        "700",
      color: "#111111",
    },

    username: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 19,
      color: "#777777",
    },

    statusBadge: {
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 14,
      backgroundColor:
        "#F2F2F2",
    },

    statusBadgeText: {
      fontSize: 12,
      fontWeight:
        "600",
      color: "#666666",
    },

    actionRow: {
      paddingHorizontal: 12,
      paddingBottom: 22,
      flexDirection:
        "row",
      justifyContent:
        "space-around",
    },

    action: {
      width: 78,
      alignItems:
        "center",
    },

    actionCircle: {
      width: 52,
      height: 52,
      marginBottom: 7,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 26,
      backgroundColor:
        "#F1F1F1",
    },

    actionCircleActive: {
      backgroundColor:
        "#EAF6FF",
    },

    actionLabel: {
      fontSize: 12,
      fontWeight:
        "500",
      color: "#111111",
    },

    actionLabelActive: {
      color: "#0095F6",
    },

    infoBanner: {
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 12,
      backgroundColor:
        "#F5F5F5",
    },

    infoBannerText: {
      flex: 1,
      marginLeft: 10,
    },

    infoBannerTitle: {
      fontSize: 13,
      fontWeight:
        "700",
      color: "#222222",
    },

    infoBannerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: "#777777",
    },

    infoBannerAction: {
      fontSize: 13,
      fontWeight:
        "700",
      color: "#0095F6",
    },

    sectionTitle: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 8,
      fontSize: 15,
      fontWeight:
        "700",
      color: "#555555",
    },

    settingRow: {
      minHeight: 68,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
    },

    settingIcon: {
      width: 43,
      alignItems:
        "flex-start",
    },

    dangerIcon: {
      width: 43,
    },

    settingText: {
      flex: 1,
      paddingRight: 12,
    },

    settingTitle: {
      fontSize: 16,
      lineHeight: 21,
      color: "#111111",
    },

    dangerText: {
      color: "#ED4956",
    },

    settingSubtitle: {
      marginTop: 3,
      fontSize: 12.5,
      lineHeight: 17,
      color: "#777777",
    },

    bottomSpace: {
      height: 25,
    },

    savingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.08)",
    },

    savingBox: {
      minWidth: 130,
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      shadowColor:
        "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 5,
    },

    savingText: {
      marginLeft: 9,
      fontSize: 14,
      fontWeight:
        "600",
      color: "#222222",
    },

    modalBackdrop: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 22,
      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    nicknameModal: {
      width: "100%",
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
    },

    modalTitle: {
      fontSize: 19,
      fontWeight:
        "700",
      color: "#111111",
    },

    modalSubtitle: {
      marginTop: 5,
      marginBottom: 16,
      fontSize: 13,
      lineHeight: 18,
      color: "#777777",
    },

    nicknameInput: {
      height: 48,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        "#D8D8D8",
      borderRadius: 10,
      fontSize: 15,
      color: "#111111",
      backgroundColor:
        "#FAFAFA",
    },

    modalButtons: {
      marginTop: 15,
      flexDirection:
        "row",
      justifyContent:
        "flex-end",
      alignItems:
        "center",
    },

    modalButton: {
      minHeight: 40,
      paddingHorizontal: 11,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalSaveButton: {
      marginLeft: 4,
    },

    modalCancel: {
      fontSize: 14,
      fontWeight:
        "600",
      color: "#666666",
    },

    modalRemove: {
      fontSize: 14,
      fontWeight:
        "600",
      color: "#ED4956",
    },

    modalSave: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#0095F6",
    },
  });