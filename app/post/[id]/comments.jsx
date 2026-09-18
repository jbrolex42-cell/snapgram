import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import Colors from "../../../constants/Colors";

import VerifiedBadge from "../../../components/common/VerifiedBadge";

import TranslatableComment from "../../../components/post/TranslatableComment";

import {
  createComment,
  getComments,
  likeComment,
  unlikeComment,
} from "../../../services/commentService";

import {
  getSettings,
} from "../../../services/settingsApi";

function getUsername(user) {
  return (
    user?.username ||
    user?.handle ||
    "user"
  );
}

function isUserVerified(user) {
  return user?.isVerified === true;
}

function getAvatarLetter(username) {
  return (
    String(username || "S")
      .charAt(0)
      .toUpperCase() || "S"
  );
}

function UsernameWithBadge({
  username,
  verified = false,
  size = 14,
}) {
  return (
    <View style={styles.usernameRow}>
      <Text style={styles.username}>
        {username}
      </Text>

      {verified ? (
        <VerifiedBadge size={size} />
      ) : null}
    </View>
  );
}

function CommentItem({
  comment,
  onReply,
  userLanguage,
}) {
  const [liked, setLiked] = useState(
    Boolean(
      comment?.isLiked ??
        comment?.liked ??
        false
    )
  );

  const [likes, setLikes] = useState(
    Number(
      comment?.likesCount ??
        comment?.likeCount ??
        comment?.likes?.length ??
        0
    )
  );

  const [likeLoading, setLikeLoading] =
    useState(false);

  const username = getUsername(
    comment?.user
  );

  const avatarLetter =
    getAvatarLetter(username);

  const verified =
    isUserVerified(comment?.user);

  const toggleLike = useCallback(
    async () => {
      if (
        !comment?._id ||
        likeLoading
      ) {
        return;
      }

      const previousLiked = liked;
      const previousLikes = likes;

      const nextLiked =
        !previousLiked;

      setLiked(nextLiked);

      setLikes(
        Math.max(
          0,
          previousLikes +
            (nextLiked ? 1 : -1)
        )
      );

      setLikeLoading(true);

      try {
        let result;

        if (previousLiked) {
          result =
            await unlikeComment(
              comment._id
            );
        } else {
          result =
            await likeComment(
              comment._id
            );
        }

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
            setLikes(
              result.likesCount
            );
          } else if (
            typeof result.likeCount ===
            "number"
          ) {
            setLikes(
              result.likeCount
            );
          }
        }
      } catch (error) {
        console.error(
          "COMMENT LIKE ERROR:",
          error
        );

        setLiked(
          previousLiked
        );

        setLikes(
          previousLikes
        );
      } finally {
        setLikeLoading(false);
      }
    },
    [
      comment?._id,
      likeLoading,
      liked,
      likes,
    ]
  );

  const replies = Array.isArray(
    comment?.replies
  )
    ? comment.replies
    : [];

  return (
    <View style={styles.comment}>
      {/* ======================================================
          AVATAR
      ====================================================== */}

      <View style={styles.avatar}>
        <Text
          style={
            styles.avatarFallback
          }
        >
          {avatarLetter}
        </Text>
      </View>

      {/* ======================================================
          COMMENT BODY
      ====================================================== */}

      <View style={styles.commentBody}>
        {/* USERNAME + VERIFIED BADGE */}

        <UsernameWithBadge
          username={username}
          verified={verified}
          size={14}
        />

        {/* COMMENT TEXT */}

        {comment?.text ? (
          <TranslatableComment
            text={comment.text}
            targetLanguage={
              userLanguage
            }
          />
        ) : null}

        {/* COMMENT ACTIONS */}

        <View
          style={
            styles.commentActions
          }
        >
          <Text style={styles.time}>
            Just now
          </Text>

          <TouchableOpacity
            onPress={() =>
              onReply(comment)
            }
            activeOpacity={0.7}
          >
            <Text style={styles.reply}>
              Reply
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleLike}
            disabled={likeLoading}
            activeOpacity={0.7}
            style={styles.likeButton}
          >
            {likeLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  Colors.secondaryText
                }
              />
            ) : (
              <Ionicons
                name={
                  liked
                    ? "heart"
                    : "heart-outline"
                }
                size={16}
                color={
                  liked
                    ? Colors.heart
                    : Colors.black
                }
              />
            )}
          </TouchableOpacity>

          {likes > 0 ? (
            <Text
              style={styles.likes}
            >
              {likes}
            </Text>
          ) : null}
        </View>

        {/* ====================================================
            REPLIES
        ==================================================== */}

        {replies.length > 0 ? (
          <View style={styles.replies}>
            {replies.map(
              (reply, index) => {
                const replyUsername =
                  getUsername(
                    reply?.user
                  );

                const replyVerified =
                  isUserVerified(
                    reply?.user
                  );

                return (
                  <View
                    key={
                      reply?._id ||
                      `${comment?._id}-reply-${index}`
                    }
                    style={
                      styles.replyItem
                    }
                  >
                    <UsernameWithBadge
                      username={
                        replyUsername
                      }
                      verified={
                        replyVerified
                      }
                      size={13}
                    />

                    {reply?.text ? (
                      <TranslatableComment
                        text={
                          reply.text
                        }
                        targetLanguage={
                          userLanguage
                        }
                      />
                    ) : null}
                  </View>
                );
              }
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================
   MAIN COMMENTS SCREEN
============================================================ */

export default function CommentsScreen() {
  const { id } =
    useLocalSearchParams();

  const postId = Array.isArray(id)
    ? id[0]
    : id;

  const [comments, setComments] =
    useState([]);

  const [text, setText] =
    useState("");

  const [replyTo, setReplyTo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [
    userLanguage,
    setUserLanguage,
  ] = useState("English");

  const [
    languageLoading,
    setLanguageLoading,
  ] = useState(true);

  const loadUserLanguage =
    useCallback(async () => {
      try {
        const settings =
          await getSettings();

        const language =
          settings?.preferences
            ?.language;

        if (
          typeof language ===
            "string" &&
          language.trim()
        ) {
          setUserLanguage(
            language.trim()
          );
        } else {
          setUserLanguage(
            "English"
          );
        }
      } catch (error) {
        console.error(
          "COMMENTS LANGUAGE LOAD ERROR:",
          error
        );

        setUserLanguage(
          "English"
        );
      } finally {
        setLanguageLoading(
          false
        );
      }
    }, []);

  const loadComments =
    useCallback(async () => {
      if (!postId) {
        setComments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const result =
          await getComments(
            postId
          );

        setComments(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (error) {
        console.error(
          "LOAD COMMENTS ERROR:",
          error
        );

        setComments([]);
      } finally {
        setLoading(false);
      }
    }, [postId]);

  useEffect(() => {
    loadUserLanguage();
  }, [loadUserLanguage]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const sendComment =
    useCallback(async () => {
      const trimmedText =
        text.trim();

      if (
        !trimmedText ||
        !postId ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        const comment =
          await createComment(
            postId,
            trimmedText,
            replyTo?._id || null
          );

        if (!comment) {
          throw new Error(
            "Comment was not returned by the server."
          );
        }

        if (replyTo) {
          setComments(
            (current) =>
              current.map(
                (item) => {
                  if (
                    item?._id !==
                    replyTo?._id
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    replies: [
                      ...(Array.isArray(
                        item.replies
                      )
                        ? item.replies
                        : []),
                      comment,
                    ],
                  };
                }
              )
          );
        } else {
          setComments(
            (current) => [
              ...current,
              {
                ...comment,
                replies: [],
              },
            ]
          );
        }

        setText("");
        setReplyTo(null);
      } catch (error) {
        console.error(
          "SEND COMMENT ERROR:",
          error
        );
      } finally {
        setSending(false);
      }
    }, [
      text,
      postId,
      sending,
      replyTo,
    ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <View
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Comments
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* ====================================================
            REPLY BAR
        ==================================================== */}

        {replyTo ? (
          <View
            style={styles.replyBar}
          >
            <View
              style={
                styles.replyingContainer
              }
            >
              <Text
                style={
                  styles.replyingText
                }
              >
                Replying to{" "}
              </Text>

              <UsernameWithBadge
                username={
                  getUsername(
                    replyTo?.user
                  )
                }
                verified={isUserVerified(
                  replyTo?.user
                )}
                size={13}
              />
            </View>

            <TouchableOpacity
              onPress={() =>
                setReplyTo(null)
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
            >
              <Ionicons
                name="close"
                size={20}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ====================================================
            COMMENTS LIST
        ==================================================== */}

        <FlatList
          data={comments}
          keyExtractor={(
            item,
            index
          ) =>
            String(
              item?._id ||
                `comment-${index}`
            )
          }
          renderItem={({
            item,
          }) => (
            <CommentItem
              comment={item}
              onReply={
                setReplyTo
              }
              userLanguage={
                languageLoading
                  ? "English"
                  : userLanguage
              }
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            comments.length === 0
              ? styles.emptyList
              : styles.listContent
          }
          ListEmptyComponent={
            <View
              style={styles.empty}
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={
                    Colors.secondaryText
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No comments yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Start the conversation.
              </Text>
            </View>
          }
        />

        {/* ====================================================
            COMMENT INPUT
        ==================================================== */}

        <View
          style={styles.inputBar}
        >
          <TextInput
            value={text}
            onChangeText={
              setText
            }
            placeholder={
              replyTo
                ? "Write a reply..."
                : "Add a comment..."
            }
            placeholderTextColor={
              Colors.secondaryText
            }
            style={styles.input}
            multiline
            maxLength={2200}
            textAlignVertical="center"
          />

          <TouchableOpacity
            onPress={
              sendComment
            }
            disabled={
              sending ||
              !text.trim()
            }
            activeOpacity={0.7}
            style={
              styles.sendButton
            }
            accessibilityRole="button"
            accessibilityLabel={
              replyTo
                ? "Send reply"
                : "Send comment"
            }
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
              />
            ) : (
              <Ionicons
                name="send"
                size={25}
                color={
                  text.trim()
                    ? Colors.primary
                    : Colors.secondaryText
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.white,
  },

  keyboard: {
    flex: 1,
  },

  header: {
    height: 55,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    paddingHorizontal: 15,

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      Colors.border,
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: Colors.black,
  },

  headerSpacer: {
    width: 25,
  },

  replyBar: {
    minHeight: 45,

    paddingHorizontal: 15,

    paddingVertical: 9,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    backgroundColor:
      Colors.surface,

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      Colors.border,
  },

  replyingContainer: {
    flexDirection: "row",

    alignItems: "center",

    flex: 1,
  },

  replyingText: {
    fontSize: 13,

    color: Colors.black,
  },

  comment: {
    flexDirection: "row",

    paddingHorizontal: 15,

    paddingVertical: 12,
  },

  avatar: {
    width: 35,

    height: 35,

    borderRadius: 18,

    backgroundColor:
      Colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 10,

    overflow: "hidden",
  },

  avatarFallback: {
    fontSize: 14,

    fontWeight: "700",

    color: Colors.black,
  },

  commentBody: {
    flex: 1,

    minWidth: 0,
  },

  usernameRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: 4,

    minHeight: 18,
  },

  username: {
    fontSize: 14,

    fontWeight: "800",

    color: Colors.black,
  },

  commentActions: {
    flexDirection: "row",

    alignItems: "center",

    gap: 14,

    marginTop: 6,
  },

  time: {
    fontSize: 12,

    color:
      Colors.secondaryText,
  },

  reply: {
    fontSize: 12,

    fontWeight: "700",

    color: Colors.black,
  },

  likeButton: {
    minWidth: 18,

    minHeight: 18,

    alignItems: "center",

    justifyContent: "center",
  },

  likes: {
    fontSize: 12,

    color:
      Colors.secondaryText,
  },

  replies: {
    marginTop: 4,
  },

  replyItem: {
    marginTop: 12,

    marginLeft: 10,

    paddingLeft: 10,

    borderLeftWidth: 1,

    borderLeftColor:
      Colors.border,
  },

  inputBar: {
    minHeight: 60,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 15,

    gap: 10,

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopColor:
      Colors.border,

    backgroundColor:
      Colors.white,
  },

  input: {
    flex: 1,

    maxHeight: 100,

    fontSize: 15,

    color: Colors.black,

    paddingTop: 8,

    paddingBottom: 8,
  },

  sendButton: {
    width: 35,

    height: 35,

    alignItems: "center",

    justifyContent: "center",
  },

  listContent: {
    paddingBottom: 10,
  },

  emptyList: {
    flexGrow: 1,
  },

  empty: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,

    height: 64,

    borderRadius: 32,

    borderWidth: 1,

    borderColor:
      Colors.border,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: "800",

    color: Colors.black,
  },

  emptyText: {
    marginTop: 6,

    fontSize: 14,

    color:
      Colors.secondaryText,
  },

  center: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor:
      Colors.white,
  },
});