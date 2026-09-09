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

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import Colors from "../../../constants/Colors";

import {
  createComment,
  getComments,
  likeComment,
  unlikeComment,
} from "../../../services/commentService";

function CommentItem({
  comment,
  onReply,
}) {
  const [liked, setLiked] =
    useState(false);

  const [likes, setLikes] =
    useState(
      comment.likes?.length || 0
    );

  async function toggleLike() {
    try {
      if (liked) {
        await unlikeComment(comment._id);
        setLikes(
          (value) =>
            Math.max(value - 1, 0)
        );
      } else {
        await likeComment(comment._id);
        setLikes(
          (value) => value + 1
        );
      }

      setLiked(!liked);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={styles.comment}>
      <View style={styles.avatar}>
        {comment.user?.avatar ? (
          <View style={styles.avatarImage}>
            <Text>
              {comment.user.username
                ?.charAt(0)
                ?.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text>
            {comment.user?.username
              ?.charAt(0)
              ?.toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.username}>
            {comment.user?.username}{" "}
          </Text>

          {comment.text}
        </Text>

        <View style={styles.commentActions}>
          <Text style={styles.time}>
            Just now
          </Text>

          <TouchableOpacity
            onPress={() =>
              onReply(comment)
            }
          >
            <Text style={styles.reply}>
              Reply
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleLike}
          >
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
          </TouchableOpacity>

          {likes > 0 && (
            <Text style={styles.likes}>
              {likes}
            </Text>
          )}
        </View>

        {comment.replies?.map(
          (reply) => (
            <View
              key={reply._id}
              style={styles.replyItem}
            >
              <Text
                style={styles.commentText}
              >
                <Text
                  style={styles.username}
                >
                  {reply.user?.username}{" "}
                </Text>

                {reply.text}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

export default function CommentsScreen() {
  const { id } =
    useLocalSearchParams();

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

  const loadComments =
    useCallback(async () => {
      try {
        const result =
          await getComments(id);

        setComments(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function sendComment() {
    if (!text.trim()) {
      return;
    }

    try {
      setSending(true);

      const comment =
        await createComment(
          id,
          text.trim(),
          replyTo?._id || null
        );

      if (replyTo) {
        setComments((current) =>
          current.map((item) => {
            if (
              item._id !==
              replyTo._id
            ) {
              return item;
            }

            return {
              ...item,
              replies: [
                ...(item.replies || []),
                comment,
              ],
            };
          })
        );
      } else {
        setComments((current) => [
          ...current,
          {
            ...comment,
            replies: [],
          },
        ]);
      }

      setText("");
      setReplyTo(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  }

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Comments
          </Text>

          <View style={{ width: 25 }} />
        </View>

        {replyTo && (
          <View style={styles.replyBar}>
            <Text>
              Replying to{" "}
              <Text style={styles.username}>
                @{replyTo.user?.username}
              </Text>
            </Text>

            <TouchableOpacity
              onPress={() =>
                setReplyTo(null)
              }
            >
              <Ionicons
                name="close"
                size={20}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={comments}
          keyExtractor={(item) =>
            item._id
          }
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onReply={setReplyTo}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                No comments yet
              </Text>

              <Text style={styles.emptyText}>
                Start the conversation.
              </Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
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
          />

          <TouchableOpacity
            onPress={sendComment}
            disabled={
              sending ||
              !text.trim()
            }
          >
            <Ionicons
              name="send"
              size={25}
              color={
                text.trim()
                  ? Colors.primary
                  : Colors.secondaryText
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  keyboard: {
    flex: 1,
  },

  header: {
    height: 55,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  replyBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
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
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  avatarImage: {
    alignItems: "center",
    justifyContent: "center",
  },

  commentBody: {
    flex: 1,
  },

  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  username: {
    fontWeight: "800",
  },

  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 5,
  },

  time: {
    fontSize: 12,
    color: Colors.secondaryText,
  },

  reply: {
    fontSize: 12,
    fontWeight: "700",
  },

  likes: {
    fontSize: 12,
    color: Colors.secondaryText,
  },

  replyItem: {
    marginTop: 12,
    marginLeft: 10,
  },

  inputBar: {
    minHeight: 60,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 10,
  },

  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
  },

  empty: {
    alignItems: "center",
    paddingTop: 100,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 6,
    color: Colors.secondaryText,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});