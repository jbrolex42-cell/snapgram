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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

import {
  useAuth,
} from "../../../../context/AuthContext";

import VerifiedBadge from "../../../../components/common/VerifiedBadge";

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

/**
 * Identity rule:
 *
 * Verified:
 *   John Doe ✓
 *
 * Unverified:
 *   John Doe
 *   @johndoe
 */
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
    useState(false);

  const [otherUser, setOtherUser] =
    useState(null);

  const [muted, setMuted] =
    useState(false);

  const [muteDuration, setMuteDuration] =
    useState(null);

  const [restricted, setRestricted] =
    useState(false);

  const [theme, setTheme] =
    useState("Default");

  const [disappearingDuration, setDisappearingDuration] =
    useState("Off");

  const [nickname, setNickname] =
    useState("");

  /**
   * Read user passed from ConversationScreen.
   */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoading(true);

      try {
        if (params?.user) {
          try {
            const parsed =
              JSON.parse(
                String(params.user)
              );

            if (
              mounted &&
              parsed
            ) {
              setOtherUser(parsed);
              return;
            }
          } catch (error) {
            console.warn(
              "[CONVERSATION INFO] Invalid user parameter:",
              error
            );
          }
        }

        /**
         * Fallback object.
         *
         * If ConversationScreen does not pass the complete
         * user object, we still keep the screen usable.
         *
         * A dedicated user-profile API can later hydrate
         * this object with the full profile.
         */
        if (
          mounted &&
          routeUserId
        ) {
          setOtherUser({
            _id: String(routeUserId),
            id: String(routeUserId),
            fullName: "User",
            username: "",
            avatar: null,
            isVerified: false,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [
    params?.user,
    routeUserId,
  ]);

  const profileUsername =
    getUsername(otherUser);

  const displayName =
    getDisplayName(otherUser);

  const avatar =
    getAvatar(otherUser);

  const verified =
    Boolean(
      otherUser?.isVerified
    );

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
            String(conversationId),
        },
      });
    }, [
      conversationId,
    ]);

  /**
   * Mute
   *
   * This currently updates local UI state.
   * Connect these actions to your notification/mute API
   * when the backend mute endpoint is ready.
   */
  const applyMute =
    useCallback(
      (duration) => {
        setMuted(true);
        setMuteDuration(duration);
      },
      []
    );

  const unmute =
    useCallback(() => {
      setMuted(false);
      setMuteDuration(null);
    }, []);

  const showMuteOptions =
    useCallback(() => {
      const options = [
        {
          label: "1 hour",
          value: "1 hour",
        },
        {
          label: "8 hours",
          value: "8 hours",
        },
        {
          label: "24 hours",
          value: "24 hours",
        },
        {
          label: "Until turned back on",
          value: "Until turned back on",
        },
      ];

      Alert.alert(
        "Mute messages",
        muted
          ? `Messages are muted ${
              muteDuration
                ? `for ${muteDuration.toLowerCase()}`
                : ""
            }.`
          : "Choose how long you want to mute this conversation.",
        [
          ...options.map(
            (option) => ({
              text:
                option.label,
              onPress: () =>
                applyMute(
                  option.value
                ),
            })
          ),

          ...(muted
            ? [
                {
                  text: "Turn notifications back on",
                  onPress:
                    unmute,
                },
              ]
            : []),

          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      applyMute,
      muted,
      muteDuration,
      unmute,
    ]);

  /**
   * Restrict
   *
   * Replace the local state update with your
   * restriction API once the backend endpoint is connected.
   */
  const handleRestrict =
    useCallback(() => {
      Alert.alert(
        restricted
          ? "Unrestrict account"
          : "Restrict account",
        restricted
          ? `Allow ${displayName} to interact with you normally again?`
          : `Restrict ${displayName}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text:
              restricted
                ? "Unrestrict"
                : "Restrict",
            onPress: () => {
              setRestricted(
                (current) =>
                  !current
              );
            },
          },
        ]
      );
    }, [
      displayName,
      restricted,
    ]);

  /**
   * Block
   *
   * The confirmation is intentionally separate from
   * the actual backend action.
   */
  const handleBlock =
    useCallback(() => {
      Alert.alert(
        `Block ${displayName}?`,
        "This person will no longer be able to message or interact with you.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Block",
            style: "destructive",
            onPress: () => {
              /**
               * Connect your blockUser service here.
               */
              Alert.alert(
                "Block",
                `${displayName} can now be connected to your block system.`
              );
            },
          },
        ]
      );
    }, [
      displayName,
    ]);

  const submitReport =
    useCallback(
      (reason) => {
        /**
         * Connect reportConversation/reportUser service here.
         */
        Alert.alert(
          "Report submitted",
          `Thanks. Your report for ${displayName} was submitted as "${reason}".`
        );
      },
      [
        displayName,
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
                "Spam"
              ),
          },
          {
            text: "Harassment",
            onPress: () =>
              submitReport(
                "Harassment"
              ),
          },
          {
            text: "Scam or fraud",
            onPress: () =>
              submitReport(
                "Scam or fraud"
              ),
          },
          {
            text: "Inappropriate content",
            onPress: () =>
              submitReport(
                "Inappropriate content"
              ),
          },
          {
            text: "Hate or abusive content",
            onPress: () =>
              submitReport(
                "Hate or abusive content"
              ),
          },
          {
            text: "Something else",
            onPress: () =>
              submitReport(
                "Something else"
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
            text: "Block",
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
      handleBlock,
      handleRestrict,
      restricted,
      showReportOptions,
    ]);

  const showThemeOptions =
    useCallback(() => {
      Alert.alert(
        "Theme",
        "Choose a conversation theme.",
        [
          {
            text: "Default",
            onPress: () =>
              setTheme(
                "Default"
              ),
          },
          {
            text: "Blue",
            onPress: () =>
              setTheme(
                "Blue"
              ),
          },
          {
            text: "Purple",
            onPress: () =>
              setTheme(
                "Purple"
              ),
          },
          {
            text: "Pink",
            onPress: () =>
              setTheme(
                "Pink"
              ),
          },
          {
            text: "Green",
            onPress: () =>
              setTheme(
                "Green"
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, []);

  const showNicknameOptions =
    useCallback(() => {
      Alert.alert(
        "Nicknames",
        nickname
          ? `Nickname: ${nickname}`
          : "No nickname has been set.",
        [
          {
            text: "Set nickname",
            onPress: () => {
              /**
               * Replace with a real nickname editor/modal.
               */
              Alert.alert(
                "Nicknames",
                "Nickname editing can be connected to your conversation settings API."
              );
            },
          },
          ...(nickname
            ? [
                {
                  text: "Remove nickname",
                  style: "destructive",
                  onPress: () =>
                    setNickname(
                      ""
                    ),
                },
              ]
            : []),
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, [
      nickname,
    ]);

  const showDisappearingOptions =
    useCallback(() => {
      Alert.alert(
        "Disappearing messages",
        "Choose when new messages should disappear.",
        [
          {
            text: "Off",
            onPress: () =>
              setDisappearingDuration(
                "Off"
              ),
          },
          {
            text: "24 hours",
            onPress: () =>
              setDisappearingDuration(
                "24 hours"
              ),
          },
          {
            text: "7 days",
            onPress: () =>
              setDisappearingDuration(
                "7 days"
              ),
          },
          {
            text: "90 days",
            onPress: () =>
              setDisappearingDuration(
                "90 days"
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, []);

  const openPrivacySafety =
    useCallback(() => {
      Alert.alert(
        "Privacy & safety",
        "Snapgram uses encrypted messaging and encrypted call transport. Your private encryption keys should remain on your device.",
        [
          {
            text: "OK",
            style: "default",
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
              /**
               * Connect this to your group creation route.
               */
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
        "What would you like to report?",
        [
          {
            text: "Messages aren't sending",
            onPress: () =>
              Alert.alert(
                "Thanks",
                "Your problem report can be connected to the support system."
              ),
          },
          {
            text: "Calls aren't working",
            onPress: () =>
              Alert.alert(
                "Thanks",
                "Your problem report can be connected to the support system."
              ),
          },
          {
            text: "Encryption problem",
            onPress: () =>
              Alert.alert(
                "Thanks",
                "Your encryption problem can be connected to the support system."
              ),
          },
          {
            text: "Something else",
            onPress: () =>
              Alert.alert(
                "Thanks",
                "Your problem report can be connected to the support system."
              ),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }, []);

  if (
    loading
  ) {
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
      {/* HEADER */}

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
        {/* PROFILE */}

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
                  : require("../../../../assets/images/icon.png")
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

            {/* IMPORTANT:
                Verified users never show @username here.
            */}

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

          {restricted ? (
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

        {/* QUICK ACTIONS */}

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

        {/* MUTE STATUS */}

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
                {muteDuration ||
                  "Until turned back on"}
              </Text>
            </View>

            <Pressable
              onPress={
                unmute
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

        {/* CONVERSATION */}

        <SectionTitle
          title="Conversation"
        />

        <SettingRow
          icon="color-palette-outline"
          title="Theme"
          subtitle={
            theme
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
              : "Set nicknames for people in this chat"
          }
          onPress={
            showNicknameOptions
          }
        />

        <SettingRow
          icon="timer-outline"
          title="Disappearing messages"
          subtitle={
            disappearingDuration
          }
          onPress={
            showDisappearingOptions
          }
        />

        {/* PRIVACY */}

        <SectionTitle
          title="Privacy & safety"
        />

        <SettingRow
          icon="lock-closed-outline"
          title="Privacy and safety"
          subtitle="End-to-end encrypted messages and calls"
          onPress={
            openPrivacySafety
          }
        />

        {/* MORE */}

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
          subtitle="Report a problem with this conversation"
          onPress={
            showProblemOptions
          }
        />

        {/* ACCOUNT ACTIONS */}

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
          icon="ban-outline"
          title="Block"
          subtitle="Stop this person from messaging or interacting with you"
          danger
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
  });