import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Colors from "../../constants/Colors";
import VerifiedBadge from "../common/VerifiedBadge";

import {
  togglePostLike,
  toggleSavePost,
} from "../../services/postService";

import { sharePost } from "../../services/shareService";

import { getSettings } from "../../services/settingsApi";

import TranslatableCaption from "./TranslatableCaption";

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  text: "#111111",
  secondary: "#737373",
  border: "#DBDBDB",
  light: "#F5F5F5",
  blue: "#0095F6",
  red: "#ED4956",
};

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getPostUser(post) {
  if (!post) {
    return {};
  }

  if (
    post.user &&
    typeof post.user === "object"
  ) {
    return post.user;
  }

  return {};
}

function getUsername(user) {
  return cleanText(user?.username);
}

function getFullName(user) {
  const fullName = cleanText(user?.fullName);

  if (fullName) {
    return fullName;
  }

  return "User";
}

function getAvatar(user) {
  return cleanText(user?.avatar);
}

function getUserVerified(user) {
  return user?.isVerified === true;
}

export default function PostCard({
  post,
  currentUserId,
  onComment,
  onShare,
  onMore,
}) {
  const postId =
    post?._id ||
    post?.id ||
    post?.postId ||
    null;

  const postUser = useMemo(
    () => getPostUser(post),
    [post]
  );

  const username = useMemo(
    () => getUsername(postUser),
    [postUser]
  );

  const fullName = useMemo(
    () => getFullName(postUser),
    [postUser]
  );

  const avatar = useMemo(
    () => getAvatar(postUser),
    [postUser]
  );

  const isVerified = useMemo(
    () => getUserVerified(postUser),
    [postUser]
  );

  const userId =
    postUser?._id ||
    postUser?.id ||
    null;

  /*
   * ============================================================
   * USER LANGUAGE
   * ============================================================
   *
   * This comes from:
   *
   * UserSettings.preferences.language
   *
   * Example:
   * English
   * Swahili
   * French
   * Spanish
   */

  const [userLanguage, setUserLanguage] =
    useState("English");

  const [languageLoading, setLanguageLoading] =
    useState(true);

  const loadUserLanguage = useCallback(
    async () => {
      try {
        const settings =
          await getSettings();

        const language =
          settings?.preferences?.language;

        if (
          typeof language === "string" &&
          language.trim()
        ) {
          setUserLanguage(
            language.trim()
          );
        } else {
          setUserLanguage("English");
        }
      } catch (error) {
        console.error(
          "POST LANGUAGE LOAD ERROR:",
          error
        );

        /*
         * Translation should never break
         * the post if settings fail.
         */
        setUserLanguage("English");
      } finally {
        setLanguageLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadUserLanguage();
  }, [loadUserLanguage]);

  const mediaItem =
    Array.isArray(post?.media)
      ? post.media[0]
      : null;

  const image =
    mediaItem?.url ||
    mediaItem?.secure_url ||
    mediaItem?.uri ||
    post?.image ||
    post?.imageUrl ||
    post?.mediaUrl ||
    null;

  const mediaType =
    mediaItem?.type ||
    post?.mediaType ||
    "image";

  const isVideo =
    mediaType === "video" ||
    mediaItem?.mimeType?.startsWith?.(
      "video/"
    );

  const initialLiked = Boolean(
    post?.isLiked ??
      post?.liked ??
      post?.likes?.some?.((like) => {
        const likeId =
          like?._id ??
          like?.id ??
          like?.userId ??
          like;

        return (
          String(likeId) ===
          String(currentUserId)
        );
      })
  );

  const initialLikesCount = Number(
    post?.likesCount ??
      post?.likeCount ??
      post?.likes?.length ??
      0
  );

  const initialSaved = Boolean(
    post?.isSaved ??
      post?.saved ??
      post?.isBookmarked ??
      post?.bookmarked
  );

  const commentsCount = Number(
    post?.commentsCount ??
      post?.commentCount ??
      post?.comments?.length ??
      0
  );

  const [liked, setLiked] =
    useState(initialLiked);

  const [likesCount, setLikesCount] =
    useState(initialLikesCount);

  const [saved, setSaved] =
    useState(initialSaved);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [shareLoading, setShareLoading] =
    useState(false);

  const [imageLoading, setImageLoading] =
    useState(Boolean(image));

  const [imageError, setImageError] =
    useState(false);

  const [menuVisible, setMenuVisible] =
    useState(false);

  const [menuActionLoading, setMenuActionLoading] =
    useState(false);

  const doubleTapTimeout =
    useRef(null);

  useEffect(() => {
    return () => {
      if (doubleTapTimeout.current) {
        clearTimeout(
          doubleTapTimeout.current
        );

        doubleTapTimeout.current = null;
      }
    };
  }, []);

  /*
   * ============================================================
   * LIKE
   * ============================================================
   */

  const handleLike = useCallback(
    async () => {
      if (
        !postId ||
        likeLoading
      ) {
        return;
      }

      const previousLiked =
        liked;

      const previousCount =
        likesCount;

      const nextLiked =
        !previousLiked;

      setLiked(nextLiked);

      setLikesCount(
        Math.max(
          0,
          previousCount +
            (nextLiked ? 1 : -1)
        )
      );

      setLikeLoading(true);

      try {
        const result =
          await togglePostLike(
            postId
          );

        if (
          result &&
          typeof result === "object"
        ) {
          if (
            typeof result.liked ===
            "boolean"
          ) {
            setLiked(
              result.liked
            );
          }

          if (
            typeof result.likesCount ===
            "number"
          ) {
            setLikesCount(
              result.likesCount
            );
          } else if (
            typeof result.likeCount ===
            "number"
          ) {
            setLikesCount(
              result.likeCount
            );
          }
        }
      } catch (error) {
        console.error(
          "POST LIKE ERROR:",
          error
        );

        setLiked(
          previousLiked
        );

        setLikesCount(
          previousCount
        );
      } finally {
        setLikeLoading(false);
      }
    },
    [
      postId,
      likeLoading,
      liked,
      likesCount,
    ]
  );

  /*
   * ============================================================
   * MEDIA PRESS / DOUBLE TAP LIKE
   * ============================================================
   */

  const handleMediaPress =
    useCallback(() => {
      if (!postId) {
        return;
      }

      if (
        doubleTapTimeout.current
      ) {
        clearTimeout(
          doubleTapTimeout.current
        );

        doubleTapTimeout.current =
          null;

        if (!liked) {
          handleLike();
        }

        return;
      }

      doubleTapTimeout.current =
        setTimeout(() => {
          doubleTapTimeout.current =
            null;

          router.push({
            pathname:
              "/post/[id]",
            params: {
              id: String(postId),
            },
          });
        }, 220);
    }, [
      postId,
      liked,
      handleLike,
    ]);

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  const handleSave = useCallback(
    async () => {
      if (
        !postId ||
        saveLoading
      ) {
        return;
      }

      const previousSaved =
        saved;

      const nextSaved =
        !previousSaved;

      setSaved(nextSaved);
      setSaveLoading(true);

      try {
        const result =
          await toggleSavePost(
            postId
          );

        if (
          result &&
          typeof result === "object"
        ) {
          if (
            typeof result.saved ===
            "boolean"
          ) {
            setSaved(
              result.saved
            );
          } else if (
            typeof result.isSaved ===
            "boolean"
          ) {
            setSaved(
              result.isSaved
            );
          }
        }
      } catch (error) {
        console.error(
          "POST SAVE ERROR:",
          error
        );

        setSaved(
          previousSaved
        );
      } finally {
        setSaveLoading(false);
      }
    },
    [
      postId,
      saveLoading,
      saved,
    ]
  );

  /*
   * ============================================================
   * SHARE
   * ============================================================
   */

  const handleShare =
    useCallback(async () => {
      if (
        !postId ||
        shareLoading
      ) {
        return;
      }

      setShareLoading(true);

      try {
        if (
          typeof onShare ===
          "function"
        ) {
          await onShare(post);
        } else {
          await sharePost(post);
        }
      } catch (error) {
        console.error(
          "POST SHARE ERROR:",
          error
        );
      } finally {
        setShareLoading(false);
      }
    }, [
      postId,
      shareLoading,
      onShare,
      post,
    ]);

  /*
   * ============================================================
   * COMMENTS
   * ============================================================
   */

  const handleComment =
    useCallback(() => {
      if (!postId) {
        return;
      }

      if (
        typeof onComment ===
        "function"
      ) {
        onComment(post);
        return;
      }

      router.push({
        pathname:
          "/post/[id]/comments",
        params: {
          id: String(postId),
        },
      });
    }, [
      postId,
      onComment,
      post,
    ]);

  /*
   * ============================================================
   * PROFILE
   * ============================================================
   */

  const openProfile =
    useCallback(() => {
      if (!username) {
        return;
      }

      router.push({
        pathname:
          "/profile/[username]",
        params: {
          username: String(
            username
          ),
        },
      });
    }, [username]);

  /*
   * ============================================================
   * MENU
   * ============================================================
   */

  const openMenu =
    useCallback(() => {
      setMenuVisible(true);
    }, []);

  const closeMenu =
    useCallback(() => {
      if (!menuActionLoading) {
        setMenuVisible(false);
      }
    }, [menuActionLoading]);

  const handleMenuSave =
    useCallback(async () => {
      setMenuVisible(false);
      await handleSave();
    }, [handleSave]);

  const handleMenuShare =
    useCallback(async () => {
      setMenuVisible(false);
      await handleShare();
    }, [handleShare]);

  const handleGoToPost =
    useCallback(() => {
      setMenuVisible(false);

      if (!postId) {
        return;
      }

      router.push({
        pathname:
          "/post/[id]",
        params: {
          id: String(postId),
        },
      });
    }, [postId]);

  const handleReport =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Report",
        "Why are you reporting this post?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Report",
            style: "destructive",
            onPress: () => {
              console.log(
                "REPORT POST:",
                postId
              );

              Alert.alert(
                "Thanks",
                "Thanks for helping keep Snapgram safe."
              );
            },
          },
        ]
      );
    }, [postId]);

  const handleNotInterested =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        "Not interested",
        "We'll show you fewer posts like this."
      );
    }, []);

  const handleMute =
    useCallback(() => {
      setMenuVisible(false);

      Alert.alert(
        `Mute @${username}?`,
        "You won't see posts from this account in your feed.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Mute",
            onPress: () => {
              console.log(
                "MUTE USER:",
                userId ||
                  username
              );
            },
          },
        ]
      );
    }, [
      username,
      userId,
    ]);

  const handleMore =
    useCallback(() => {
      if (
        typeof onMore ===
        "function"
      ) {
        onMore(post);
        return;
      }

      openMenu();
    }, [
      onMore,
      post,
      openMenu,
    ]);

  const formattedLikes =
    likesCount.toLocaleString();

  const avatarLetter = (
    fullName !== "User"
      ? fullName
      : username || "S"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <View style={styles.card}>

        {/* =================================================
            POST HEADER
        ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userButton}
            activeOpacity={0.75}
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel={`Open ${
              username || "user"
            }'s profile`}
          >
            <View style={styles.avatar}>
              {avatar ? (
                <Image
                  source={{
                    uri: avatar,
                  }}
                  style={
                    styles.avatarImage
                  }
                />
              ) : (
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {avatarLetter}
                </Text>
              )}
            </View>

            <View
              style={styles.identity}
            >
              <View
                style={styles.nameRow}
              >
                <Text
                  style={
                    styles.fullName
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {fullName}
                </Text>

                {isVerified ? (
                  <View
                    style={
                      styles.verifiedContainer
                    }
                  >
                    <VerifiedBadge
                      size={14}
                    />
                  </View>
                ) : null}
              </View>

              {username ? (
                <Text
                  style={
                    styles.username
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  @{username}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.moreButton
            }
            activeOpacity={0.7}
            onPress={handleMore}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={
                COLORS.black
              }
            />
          </TouchableOpacity>
        </View>

        {/* =================================================
            MEDIA
        ================================================= */}

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleMediaPress}
          style={
            styles.mediaContainer
          }
        >
          {image &&
          !imageError ? (
            <>
              <Image
                source={{
                  uri: image,
                }}
                style={
                  styles.media
                }
                resizeMode="cover"
                onLoadStart={() =>
                  setImageLoading(
                    true
                  )
                }
                onLoad={() =>
                  setImageLoading(
                    false
                  )
                }
                onError={() => {
                  setImageLoading(
                    false
                  );

                  setImageError(
                    true
                  );
                }}
              />

              {imageLoading ? (
                <View
                  style={
                    styles.mediaLoading
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.white
                    }
                  />
                </View>
              ) : null}

              {isVideo ? (
                <View
                  style={
                    styles.videoIndicator
                  }
                >
                  <Ionicons
                    name="play"
                    size={15}
                    color={
                      COLORS.white
                    }
                  />
                </View>
              ) : null}
            </>
          ) : (
            <View
              style={
                styles.emptyMedia
              }
            >
              <Ionicons
                name="image-outline"
                size={42}
                color="#999999"
              />

              <Text
                style={
                  styles.emptyMediaText
                }
              >
                Media unavailable
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <View
          style={styles.actions}
        >
          <View
            style={
              styles.leftActions
            }
          >
            <TouchableOpacity
              style={
                styles.actionButton
              }
              onPress={
                handleLike
              }
              disabled={
                likeLoading
              }
              activeOpacity={0.65}
            >
              <Ionicons
                name={
                  liked
                    ? "heart"
                    : "heart-outline"
                }
                size={27}
                color={
                  liked
                    ? COLORS.red
                    : COLORS.black
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.actionButton
              }
              onPress={
                handleComment
              }
              activeOpacity={0.65}
            >
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={
                  COLORS.black
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.actionButton
              }
              onPress={
                handleShare
              }
              disabled={
                shareLoading
              }
              activeOpacity={0.65}
            >
              {shareLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.black
                  }
                />
              ) : (
                <Ionicons
                  name="paper-plane-outline"
                  size={26}
                  color={
                    COLORS.black
                  }
                />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleSave
            }
            disabled={
              saveLoading
            }
            activeOpacity={0.65}
          >
            {saveLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.black
                }
              />
            ) : (
              <Ionicons
                name={
                  saved
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={27}
                color={
                  COLORS.black
                }
              />
            )}
          </TouchableOpacity>
        </View>

        {/* =================================================
            LIKES
        ================================================= */}

        {likesCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (!postId) {
                return;
              }

              router.push({
                pathname:
                  "/post/[id]/likes",
                params: {
                  id: String(
                    postId
                  ),
                },
              });
            }}
          >
            <Text
              style={styles.likes}
            >
              {formattedLikes}{" "}
              {likesCount === 1
                ? "like"
                : "likes"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* =================================================
            CAPTION + TRANSLATION
        ================================================= */}

        {post?.caption ? (
          <View
            style={
              styles.captionContainer
            }
          >
            {/* Username stays outside translation */}

            {username ? (
              <Text
                style={
                  styles.captionUsername
                }
              >
                {username}{" "}
              </Text>
            ) : null}

            {/* Translation component renders
                the original caption and
                "See translation" button. */}

            {!languageLoading ? (
              <TranslatableCaption
                text={post.caption}
                targetLanguage={
                  userLanguage
                }
              />
            ) : (
              <Text
                style={
                  styles.captionText
                }
              >
                {post.caption}
              </Text>
            )}
          </View>
        ) : null}

        {/* =================================================
            COMMENTS
        ================================================= */}

        {commentsCount > 0 ? (
          <TouchableOpacity
            style={
              styles.commentsButton
            }
            onPress={
              handleComment
            }
            activeOpacity={0.7}
          >
            <Text
              style={
                styles.commentsText
              }
            >
              View all{" "}
              {commentsCount.toLocaleString()}{" "}
              {commentsCount === 1
                ? "comment"
                : "comments"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* =================================================
            DATE
        ================================================= */}

        {post?.createdAt ? (
          <Text
            style={
              styles.dateText
            }
          >
            {formatPostDate(
              post.createdAt
            )}
          </Text>
        ) : null}
      </View>

      {/* ===================================================
          OPTIONS MODAL
      =================================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeMenu
        }
      >
        <View
          style={
            styles.modalRoot
          }
        >
          <Pressable
            style={
              styles.modalBackdrop
            }
            onPress={
              closeMenu
            }
          />

          <View
            style={
              styles.optionsSheet
            }
          >
            <View
              style={
                styles.sheetHandle
              }
            />

            <View
              style={
                styles.sheetHeader
              }
            >
              <Text
                style={
                  styles.sheetTitle
                }
              >
                Options
              </Text>

              <TouchableOpacity
                onPress={
                  closeMenu
                }
                style={
                  styles.sheetClose
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.optionDivider
              }
            />

            <TouchableOpacity
              style={
                styles.menuOption
              }
              onPress={
                handleMenuSave
              }
              disabled={
                saveLoading
              }
            >
              <Ionicons
                name={
                  saved
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={23}
                color={
                  COLORS.black
                }
              />

              <Text
                style={
                  styles.menuOptionText
                }
              >
                {saved
                  ? "Remove from saved"
                  : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuOption
              }
              onPress={
                handleGoToPost
              }
            >
              <Ionicons
                name="open-outline"
                size={23}
                color={
                  COLORS.black
                }
              />

              <Text
                style={
                  styles.menuOptionText
                }
              >
                Go to post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuOption
              }
              onPress={
                handleMenuShare
              }
            >
              <Ionicons
                name="paper-plane-outline"
                size={23}
                color={
                  COLORS.black
                }
              />

              <Text
                style={
                  styles.menuOptionText
                }
              >
                Share to...
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuOption
              }
              onPress={
                handleNotInterested
              }
            >
              <Ionicons
                name="eye-off-outline"
                size={23}
                color={
                  COLORS.black
                }
              />

              <Text
                style={
                  styles.menuOptionText
                }
              >
                Not interested
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.menuOption
              }
              onPress={
                handleMute
              }
            >
              <Ionicons
                name="volume-mute-outline"
                size={23}
                color={
                  COLORS.black
                }
              />

              <Text
                style={
                  styles.menuOptionText
                }
              >
                Mute @{username}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuOption,
                styles.reportOption,
              ]}
              onPress={
                handleReport
              }
            >
              <Ionicons
                name="flag-outline"
                size={23}
                color={
                  COLORS.red
                }
              />

              <Text
                style={
                  styles.reportText
                }
              >
                Report
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.bottomSafeSpace
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatPostDate(date) {
  const timestamp =
    new Date(date).getTime();

  if (
    Number.isNaN(timestamp)
  ) {
    return "";
  }

  const difference =
    Math.max(
      0,
      Date.now() - timestamp
    );

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "JUST NOW";
  }

  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1
        ? "MINUTE"
        : "MINUTES"
    } AGO`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "HOUR"
        : "HOURS"
    } AGO`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} ${
      days === 1
        ? "DAY"
        : "DAYS"
    } AGO`;
  }

  const postDate =
    new Date(date);

  const currentDate =
    new Date();

  return postDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        postDate.getFullYear() !==
        currentDate.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:
      Colors.white ||
      Colors.background ||
      COLORS.white,

    marginBottom: 10,
  },

  header: {
    minHeight: 60,
    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  userButton: {
    flex: 1,
    minWidth: 0,

    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,

    overflow: "hidden",

    backgroundColor:
      Colors.surface ||
      "#F2F2F2",

    alignItems: "center",
    justifyContent:
      "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "800",

    color:
      Colors.black ||
      COLORS.black,
  },

  identity: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",

    minWidth: 0,
    flexShrink: 1,
  },

  fullName: {
    flexShrink: 1,

    fontSize: 14,
    lineHeight: 18,

    fontWeight: "700",

    color:
      Colors.black ||
      COLORS.black,
  },

  verifiedContainer: {
    marginLeft: 4,

    alignItems: "center",
    justifyContent:
      "center",

    flexShrink: 0,
  },

  username: {
    marginTop: 1,

    fontSize: 12,
    lineHeight: 16,

    color:
      Colors.secondaryText ||
      COLORS.secondary,
  },

  moreButton: {
    width: 40,
    height: 40,

    marginLeft: 4,

    alignItems: "center",
    justifyContent:
      "center",
  },

  mediaContainer: {
    width: "100%",
    aspectRatio: 1,

    overflow: "hidden",

    backgroundColor:
      Colors.surface ||
      "#F2F2F2",
  },

  media: {
    width: "100%",
    height: "100%",
  },

  mediaLoading: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    alignItems: "center",
    justifyContent:
      "center",

    backgroundColor:
      "rgba(0,0,0,0.12)",
  },

  videoIndicator: {
    position: "absolute",

    top: 12,
    right: 12,

    width: 30,
    height: 30,

    borderRadius: 15,

    alignItems: "center",
    justifyContent:
      "center",

    backgroundColor:
      "rgba(0,0,0,0.55)",
  },

  emptyMedia: {
    width: "100%",
    height: "100%",

    alignItems: "center",
    justifyContent:
      "center",
  },

  emptyMediaText: {
    marginTop: 8,

    fontSize: 13,

    color: "#888888",
  },

  actions: {
    height: 50,

    paddingHorizontal: 9,

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent:
      "center",
  },

  likes: {
    paddingHorizontal: 12,

    marginTop: 1,

    fontSize: 14,
    lineHeight: 19,

    fontWeight: "700",

    color:
      Colors.black ||
      COLORS.black,
  },

  captionContainer: {
    paddingHorizontal: 12,

    marginTop: 5,

    paddingBottom: 1,

    flexDirection: "row",
    flexWrap: "wrap",

    alignItems: "flex-start",
  },

  captionText: {
    fontSize: 14,
    lineHeight: 19,

    color:
      Colors.black ||
      COLORS.black,
  },

  captionUsername: {
    fontSize: 14,
    lineHeight: 19,

    fontWeight: "700",

    color:
      Colors.black ||
      COLORS.black,
  },

  commentsButton: {
    paddingHorizontal: 12,

    marginTop: 5,
  },

  commentsText: {
    fontSize: 14,
    lineHeight: 19,

    color:
      Colors.secondaryText ||
      COLORS.secondary,
  },

  dateText: {
    paddingHorizontal: 12,

    marginTop: 7,
    marginBottom: 8,

    fontSize: 10,
    lineHeight: 14,

    letterSpacing: 0.25,

    color:
      Colors.secondaryText ||
      "#8E8E8E",
  },

  modalRoot: {
    flex: 1,

    justifyContent:
      "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      "rgba(0,0,0,0.45)",
  },

  optionsSheet: {
    width: "100%",

    backgroundColor:
      COLORS.white,

    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,

    paddingTop: 10,

    overflow: "hidden",
  },

  sheetHandle: {
    alignSelf: "center",

    width: 38,
    height: 4,

    borderRadius: 2,

    backgroundColor:
      "#C7C7C7",

    marginBottom: 4,
  },

  sheetHeader: {
    minHeight: 54,

    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
  },

  sheetTitle: {
    fontSize: 16,

    fontWeight: "700",

    color:
      COLORS.black,
  },

  sheetClose: {
    position: "absolute",

    right: 12,

    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: "center",
    justifyContent:
      "center",
  },

  optionDivider: {
    height:
      StyleSheet.hairlineWidth,

    backgroundColor:
      COLORS.border,
  },

  menuOption: {
    minHeight: 56,

    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",

    gap: 16,
  },

  menuOptionText: {
    flex: 1,

    fontSize: 15,

    fontWeight: "500",

    color:
      COLORS.text,
  },

  reportOption: {
    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopColor:
      COLORS.border,

    marginTop: 4,
  },

  reportText: {
    flex: 1,

    fontSize: 15,

    fontWeight: "600",

    color:
      COLORS.red,
  },

  bottomSafeSpace: {
    height: 18,
  },
});