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

import TranslatableComment from "../../../components/posts/TranslatableComment";

import {
  createComment,
  getComments,
  likeComment,
  unlikeComment,
} from "../../../services/commentService";

import {
  getSettings,
} from "../../../services/settingsApi";

/* ============================================================
   COMMENT ITEM
============================================================ */

function CommentItem({
  comment,
  onReply,
  userLanguage,
}) {
  const [liked, setLiked] =
    useState(
      Boolean(
        comment?.isLiked ??
        comment?.liked ??
        false
      )
    );

  const [likes, setLikes] =
    useState(
      Number(
        comment?.likesCount ??
        comment?.likeCount ??
        comment?.likes?.length ??
        0
      )
    );

  const [likeLoading, setLikeLoading] =
    useState(false);

  /* ==========================================================
     LIKE COMMENT
  ========================================================== */

  const toggleLike =
    useCallback(async () => {
      if (
        !comment?._id ||
        likeLoading
      ) {
        return;
      }

      const previousLiked = liked;
      const previousLikes = likes;

      const nextLiked = !previousLiked;

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
    }, [
      comment?._id,
      likeLoading,
      liked,
      likes,
    ]);

  const username =
    comment?.user?.username ||
    "user";

  const avatarLetter =
    username
      .charAt(0)
      .toUpperCase() || "S";

  return (
    <View style={styles.comment}>

      {/* ======================================================
          AVATAR
      ====================================================== */}

      <View style={styles.avatar}>
        {comment?.user?.avatar ? (
          <View
            style={
              styles.avatarImage
            }
          >
            <Text
              style={
                styles.avatarFallback
              }
            >
              {avatarLetter}
            </Text>
          </View>
        ) : (
          <Text
            style={
              styles.avatarFallback
            }
          >
            {avatarLetter}
          </Text>
        )}
      </View>

      {/* ======================================================
          COMMENT BODY
      ====================================================== */}

      <View style={styles.commentBody}>

        {/* USERNAME */}

        <Text style={styles.username}>
          {username}
        </Text>

        {/* ====================================================
            TRANSLATABLE COMMENT

            IMPORTANT:
            Do NOT also render {comment.text}
            here. TranslatableComment handles
            the original text and translation.
        ==================================================== */}

        {comment?.text ? (
          <TranslatableComment
            text={comment.text}
            targetLanguage={
              userLanguage
            }
          />
        ) : null}

        {/* ====================================================
            COMMENT ACTIONS
        ==================================================== */}

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
            onPress={
              toggleLike
            }
            disabled={
              likeLoading
            }
            activeOpacity={0.7}
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

        {Array.isArray(
          comment?.replies
        ) &&
        comment.replies.length > 0
          ? comment.replies.map(
              (reply) => {
                const replyUsername =
                  reply?.user
                    ?.username ||
                  "user";

                return (
                  <View
                    key={
                      reply?._id ||
                      `${comment._id}-${replyUsername}`
                    }
                    style={
                      styles.replyItem
                    }
                  >
                    <Text
                      style={
                        styles.username
                      }
                    >
                      {replyUsername}
                    </Text>

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
            )
          : null}
      </View>
    </View>
  );
}

/* ============================================================
   COMMENTS SCREEN
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

  /* ==========================================================
     USER LANGUAGE

     Comes from:

     UserSettings.preferences.language
  ========================================================== */

  const [userLanguage, setUserLanguage] =
    useState("English");

  const [languageLoading, setLanguageLoading] =
    useState(true);

  /* ==========================================================
     LOAD USER LANGUAGE
  ========================================================== */

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

        /*
         * Translation should never
         * break the comments screen.
         */
        setUserLanguage(
          "English"
        );
      } finally {
        setLanguageLoading(
          false
        );
      }
    }, []);

  /* ==========================================================
     LOAD COMMENTS
  ========================================================== */

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

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadUserLanguage();
  }, [loadUserLanguage]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  /* ==========================================================
     SEND COMMENT
  ========================================================== */

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
                    item._id !==
                    replyTo._id
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    replies: [
                      ...(item.replies ||
                        []),
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

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </View>
    );
  }

  /* ==========================================================
     SCREEN
  ========================================================== */

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
              color={
                Colors.black
              }
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
            style={{
              width: 25,
            }}
          />
        </View>

        {/* ====================================================
            REPLY BAR
        ==================================================== */}

        {replyTo ? (
          <View
            style={styles.replyBar}
          >
            <Text
              style={
                styles.replyingText
              }
            >
              Replying to{" "}
              <Text
                style={
                  styles.username
                }
              >
                @
                {
                  replyTo?.user
                    ?.username
                }
              </Text>
            </Text>

            <TouchableOpacity
              onPress={() =>
                setReplyTo(null)
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  Colors.black
                }
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
              : undefined
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
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color={
                  Colors.primary
                }
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

/* ============================================================
   STYLES
============================================================ */

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

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      Colors.border,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    paddingHorizontal: 15,
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: "800",

    color:
      Colors.black,
  },

  replyBar: {
    paddingHorizontal: 15,

    paddingVertical: 10,

    backgroundColor:
      Colors.surface,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  replyingText: {
    fontSize: 13,

    color:
      Colors.black,
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

    justifyContent:
      "center",

    marginRight: 10,

    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",

    alignItems: "center",
    justifyContent:
      "center",
  },

  avatarFallback: {
    fontSize: 14,

    fontWeight: "700",

    color:
      Colors.black,
  },

  commentBody: {
    flex: 1,

    minWidth: 0,
  },

  username: {
    fontSize: 14,

    fontWeight: "800",

    color:
      Colors.black,
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

    color:
      Colors.black,
  },

  likes: {
    fontSize: 12,

    color:
      Colors.secondaryText,
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

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopColor:
      Colors.border,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 15,

    gap: 10,
  },

  input: {
    flex: 1,

    maxHeight: 100,

    fontSize: 15,

    color:
      Colors.black,

    paddingTop: 8,

    paddingBottom: 8,
  },

  sendButton: {
    width: 35,
    height: 35,

    alignItems: "center",

    justifyContent:
      "center",
  },

  emptyList: {
    flexGrow: 1,
  },

  empty: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",

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

    justifyContent:
      "center",

    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: "800",

    color:
      Colors.black,
  },

  emptyText: {
    marginTop: 6,

    fontSize: 14,

    color:
      Colors.secondaryText,
  },

  center: {
    flex: 1,

    justifyContent:
      "center",

    alignItems: "center",

    backgroundColor:
      Colors.white,
  },
});