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
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import * as Clipboard from "expo-clipboard";

import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

import VoiceMessageBubble from "../../components/messages/VoiceMessageBubble";
import MediaPicker from "../../components/messages/MediaPicker";
import VoiceRecorder from "../../components/messages/VoiceRecorder";
import OnlineStatus from "../../components/messages/OnlineStatus";
import MessageSearch from "../../components/messages/MessageSearch";
import ReactionBar from "../../components/messages/ReactionBar";

import {
  getMessages,
  getOrCreateConversation,
  markMessagesRead,
  sendMessage,
  sendMediaMessage,
  sendVoiceMessage,
  searchMessages,
  reactToMessage,
  unsendMessage,
  deleteMessage,
} from "../../services/messageService";

import {
  startCall,
} from "../../services/callService";

import {
  getSocket,
  joinConversation,
  leaveConversation,
  sendSocketMessage,
  sendTyping,
  stopTyping,
  waitForSocket,
} from "../../services/socket";

export default function ConversationScreen() {
  const params = useLocalSearchParams();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  /*
   * ==================================================
   * ROUTE PARAMS
   * ==================================================
   */

  const routeConversationId = Array.isArray(
    params?.conversationId
  )
    ? params.conversationId[0]
    : params?.conversationId;

  const routeUserId = Array.isArray(
    params?.userId
  )
    ? params.userId[0]
    : params?.userId;

  /*
   * ==================================================
   * STATE
   * ==================================================
   */

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(
    routeConversationId
      ? String(routeConversationId)
      : null
  );

  const [messages, setMessages] = useState([]);

  const [conversation, setConversation] =
    useState(null);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);

  const [searching, setSearching] =
    useState(false);

  const [searchResults, setSearchResults] =
    useState([]);

  const [typingUser, setTypingUser] =
    useState(null);

  const [replyingTo, setReplyingTo] =
    useState(null);

  const [
    selectedMessage,
    setSelectedMessage,
  ] = useState(null);

  const [startingCall, setStartingCall] =
    useState(false);

  const typingTimeoutRef = useRef(null);

  /*
   * ==================================================
   * CURRENT USER
   * ==================================================
   */

  const currentUserId =
    user?._id ||
    user?.id ||
    null;

  /*
   * ==================================================
   * OTHER PARTICIPANT
   * ==================================================
   */

  const otherUser = useMemo(() => {
    const participants = Array.isArray(
      conversation?.participants
    )
      ? conversation.participants
      : [];

    if (participants.length > 0) {
      const participant =
        participants.find(
          (item) =>
            String(
              item?._id ||
                item?.id
            ) !==
            String(currentUserId)
        );

      if (participant) {
        return participant;
      }
    }

    if (routeUserId) {
      return {
        _id: String(routeUserId),
        username: "User",
        name: "User",
        avatar: null,
      };
    }

    for (const message of messages) {
      const senderId =
        message?.sender?._id ||
        message?.sender?.id ||
        message?.sender;

      if (
        senderId &&
        String(senderId) !==
          String(currentUserId)
      ) {
        return message?.sender;
      }

      const receiverId =
        message?.receiver?._id ||
        message?.receiver?.id ||
        message?.receiver;

      if (
        receiverId &&
        String(receiverId) !==
          String(currentUserId)
      ) {
        return message?.receiver;
      }
    }

    return null;
  }, [
    conversation,
    currentUserId,
    messages,
    routeUserId,
  ]);

  const receiverId =
    otherUser?._id ||
    otherUser?.id ||
    routeUserId ||
    null;

  /*
   * ==================================================
   * LOAD / CREATE CONVERSATION
   * ==================================================
   */

  const loadConversation = useCallback(
    async () => {
      if (authLoading || !user) {
        if (!authLoading) {
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);

        let conversationId =
          activeConversationId;

        /*
         * Opened with userId instead of
         * an existing conversation.
         */

        if (
          !conversationId &&
          routeUserId
        ) {
          const createdConversation =
            await getOrCreateConversation(
              String(routeUserId)
            );

          if (
            !createdConversation?._id
          ) {
            throw new Error(
              "Unable to create conversation."
            );
          }

          conversationId = String(
            createdConversation._id
          );

          setActiveConversationId(
            conversationId
          );

          setConversation(
            createdConversation
          );
        }

        if (!conversationId) {
          setMessages([]);
          setLoading(false);
          return;
        }

        const result =
          await getMessages(
            conversationId
          );

        if (result?.conversation) {
          setConversation(
            result.conversation
          );
        }

        const safeMessages =
          Array.isArray(
            result?.messages
          )
            ? result.messages
            : Array.isArray(result)
              ? result
              : [];

        setMessages(
          safeMessages
        );

        try {
          await markMessagesRead(
            conversationId
          );
        } catch (readError) {
          console.warn(
            "MARK MESSAGES READ ERROR:",
            readError?.response
              ?.data ||
              readError
          );
        }
      } catch (error) {
        console.error(
          "LOAD CHAT ERROR:",
          error?.response?.data ||
            error
        );

        Alert.alert(
          "Unable to load chat",
          error?.response?.data
            ?.message ||
            "We couldn't load this conversation."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      activeConversationId,
      authLoading,
      routeUserId,
      user,
    ]
  );

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
   * ==================================================
   * MESSAGE SOCKET
   * ==================================================
   */

  useEffect(() => {
    const socket = getSocket();

    if (
      !socket ||
      !user ||
      !activeConversationId
    ) {
      return undefined;
    }

    joinConversation(
      activeConversationId
    );

    const handleNewMessage = (
      message
    ) => {
      const messageConversationId =
        message?.conversation?._id ||
        message?.conversation?.id ||
        message?.conversation;

      if (
        String(
          messageConversationId
        ) !==
        String(
          activeConversationId
        )
      ) {
        return;
      }

      setMessages((current) => {
        if (!message) {
          return current;
        }

        if (message?._id) {
          const exists =
            current.some(
              (item) =>
                String(
                  item?._id
                ) ===
                String(
                  message._id
                )
            );

          if (exists) {
            return current;
          }
        }

        return [
          ...current,
          message,
        ];
      });
    };

    const handleTyping = (
      data
    ) => {
      if (
        data?.userId &&
        currentUserId &&
        String(
          data.userId
        ) ===
          String(
            currentUserId
          )
      ) {
        return;
      }

      setTypingUser(
        data?.username ||
          otherUser?.username ||
          "Someone"
      );
    };

    const handleStopTyping =
      () => {
        setTypingUser(null);
      };

    socket.on(
      "message:new",
      handleNewMessage
    );

    socket.on(
      "message:typing",
      handleTyping
    );

    socket.on(
      "message:stopTyping",
      handleStopTyping
    );

    return () => {
      leaveConversation(
        activeConversationId
      );

      socket.off(
        "message:new",
        handleNewMessage
      );

      socket.off(
        "message:typing",
        handleTyping
      );

      socket.off(
        "message:stopTyping",
        handleStopTyping
      );
    };
  }, [
    activeConversationId,
    currentUserId,
    otherUser?.username,
    user,
  ]);

  /*
   * ==================================================
   * CLEANUP
   * ==================================================
   */

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }
    };
  }, []);

  /*
   * ==================================================
   * TYPING
   * ==================================================
   */

  const handleTypingChange =
    useCallback(
      (value) => {
        setText(value);

        const socket = getSocket();

        if (
          !socket ||
          !activeConversationId ||
          !currentUserId
        ) {
          return;
        }

        if (
          typingTimeoutRef.current
        ) {
          clearTimeout(
            typingTimeoutRef.current
          );
        }

        if (value.trim()) {
          sendTyping(
            activeConversationId,
            currentUserId,
            user?.username ||
              "Snapgram User"
          );

          typingTimeoutRef.current =
            setTimeout(() => {
              stopTyping(
                activeConversationId,
                currentUserId
              );
            }, 1200);
        } else {
          stopTyping(
            activeConversationId,
            currentUserId
          );
        }
      },
      [
        activeConversationId,
        currentUserId,
        user,
      ]
    );

  /*
   * ==================================================
   * SEND TEXT
   * ==================================================
   */

  const handleSend =
    useCallback(
      async () => {
        const value =
          text.trim();

        if (
          !value ||
          !activeConversationId ||
          !receiverId
        ) {
          return;
        }

        try {
          setText("");

          stopTyping(
            activeConversationId,
            currentUserId
          );

          const message =
            await sendMessage({
              conversationId:
                activeConversationId,
              receiverId,
              text: value,
              replyTo:
                replyingTo?._id ||
                null,
            });

          if (message) {
            setMessages(
              (current) => {
                if (
                  message?._id &&
                  current.some(
                    (item) =>
                      String(
                        item?._id
                      ) ===
                      String(
                        message._id
                      )
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  message,
                ];
              }
            );

            sendSocketMessage(
              message
            );
          }

          setReplyingTo(null);
        } catch (error) {
          console.error(
            "SEND MESSAGE ERROR:",
            error?.response?.data ||
              error
          );

          setText(value);

          Alert.alert(
            "Error",
            error?.response?.data
              ?.message ||
              "Unable to send message."
          );
        }
      },
      [
        activeConversationId,
        currentUserId,
        receiverId,
        replyingTo,
        text,
      ]
    );

  /*
   * ==================================================
   * SEND MEDIA
   * ==================================================
   */

  const handleMediaSelected =
    useCallback(
      async (media) => {
        try {
          if (
            !activeConversationId ||
            !receiverId ||
            !media?.uri
          ) {
            return;
          }

          const message =
            await sendMediaMessage({
              conversationId:
                activeConversationId,
              receiverId,
              type:
                media.type ||
                "image",
              uri: media.uri,
              mimeType:
                media.mimeType,
              fileName:
                media.fileName,
              replyTo:
                replyingTo?._id ||
                null,
            });

          if (message) {
            setMessages(
              (current) => {
                if (
                  message?._id &&
                  current.some(
                    (item) =>
                      String(
                        item?._id
                      ) ===
                      String(
                        message._id
                      )
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  message,
                ];
              }
            );

            sendSocketMessage(
              message
            );
          }

          setReplyingTo(null);
        } catch (error) {
          console.error(
            "MEDIA MESSAGE ERROR:",
            error?.response?.data ||
              error
          );

          Alert.alert(
            "Error",
            error?.response?.data
              ?.message ||
              "Unable to send media."
          );
        }
      },
      [
        activeConversationId,
        receiverId,
        replyingTo,
      ]
    );

  /*
   * ==================================================
   * SEND VOICE MESSAGE
   * ==================================================
   */

  const handleVoiceRecorded =
    useCallback(
      async (recording) => {
        try {
          if (
            !activeConversationId ||
            !receiverId ||
            !recording?.uri
          ) {
            return;
          }

          const message =
            await sendVoiceMessage({
              conversationId:
                activeConversationId,
              receiverId,
              uri: recording.uri,
              duration:
                recording.duration ||
                0,
              replyTo:
                replyingTo?._id ||
                null,
            });

          if (message) {
            setMessages(
              (current) => {
                if (
                  message?._id &&
                  current.some(
                    (item) =>
                      String(
                        item?._id
                      ) ===
                      String(
                        message._id
                      )
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  message,
                ];
              }
            );

            sendSocketMessage(
              message
            );
          }

          setReplyingTo(null);
        } catch (error) {
          console.error(
            "VOICE SEND ERROR:",
            error?.response?.data ||
              error
          );

          Alert.alert(
            "Error",
            error?.response?.data
              ?.message ||
              "Unable to send voice message."
          );
        }
      },
      [
        activeConversationId,
        receiverId,
        replyingTo,
      ]
    );

  /*
   * ==================================================
   * MESSAGE OPTIONS
   * ==================================================
   */

  const handleMessageOptions =
    useCallback(
      (message) => {
        if (!message) {
          return;
        }

        setSelectedMessage(
          message
        );
      },
      []
    );

  /*
   * ==================================================
   * REPLY
   * ==================================================
   */

  const handleReply =
    useCallback(
      (message) => {
        if (!message) {
          return;
        }

        setReplyingTo(
          message
        );

        setSelectedMessage(
          null
        );
      },
      []
    );

  /*
   * ==================================================
   * COPY
   * ==================================================
   */

  const handleCopy =
    useCallback(
      async (message) => {
        if (!message?.text) {
          return;
        }

        try {
          await Clipboard.setStringAsync(
            message.text
          );

          setSelectedMessage(
            null
          );
        } catch (error) {
          console.error(
            "COPY ERROR:",
            error
          );
        }
      },
      []
    );

  /*
   * ==================================================
   * REACTION
   * ==================================================
   */

  const handleReaction =
    useCallback(
      async (
        message,
        emoji
      ) => {
        if (!message?._id) {
          return;
        }

        try {
          const result =
            await reactToMessage(
              message._id,
              emoji
            );

          setMessages(
            (current) =>
              current.map(
                (item) =>
                  String(
                    item?._id
                  ) ===
                  String(
                    message._id
                  )
                    ? {
                        ...item,
                        reactions:
                          result?.reactions ||
                          [],
                      }
                    : item
              )
          );

          setSelectedMessage(
            null
          );
        } catch (error) {
          console.error(
            "REACTION ERROR:",
            error?.response?.data ||
              error
          );

          Alert.alert(
            "Reaction failed",
            error?.response?.data
              ?.message ||
              "Unable to add reaction."
          );
        }
      },
      []
    );

  /*
   * ==================================================
   * UNSEND
   * ==================================================
   */

  const handleUnsend =
    useCallback(
      async (message) => {
        if (!message?._id) {
          return;
        }

        try {
          await unsendMessage(
            message._id
          );

          setMessages(
            (current) =>
              current.map(
                (item) =>
                  String(
                    item?._id
                  ) ===
                  String(
                    message._id
                  )
                    ? {
                        ...item,
                        deleted: true,
                        text: "",
                        mediaUrl: null,
                        mediaPublicId:
                          null,
                      }
                    : item
              )
          );

          setSelectedMessage(
            null
          );
        } catch (error) {
          console.error(
            "UNSEND ERROR:",
            error?.response?.data ||
              error
          );

          Alert.alert(
            "Unsend failed",
            error?.response?.data
              ?.message ||
              "Unable to unsend this message."
          );
        }
      },
      []
    );

  /*
   * ==================================================
   * DELETE
   * ==================================================
   */

  const handleDelete =
    useCallback(
      async (message) => {
        if (!message?._id) {
          return;
        }

        try {
          await deleteMessage(
            message._id
          );

          setMessages(
            (current) =>
              current.filter(
                (item) =>
                  String(
                    item?._id
                  ) !==
                  String(
                    message._id
                  )
              )
          );

          setSelectedMessage(
            null
          );
        } catch (error) {
          console.error(
            "DELETE ERROR:",
            error?.response?.data ||
              error
          );

          Alert.alert(
            "Delete failed",
            error?.response?.data
              ?.message ||
              "Unable to delete this message."
          );
        }
      },
      []
    );

  /*
   * ==================================================
   * SEARCH
   * ==================================================
   */

  const handleSearch =
    useCallback(
      async (query) => {
        const cleanQuery =
          String(
            query || ""
          ).trim();

        if (!cleanQuery) {
          setSearchResults([]);
          return;
        }

        if (!activeConversationId) {
          return;
        }

        try {
          const results =
            await searchMessages(
              activeConversationId,
              cleanQuery
            );

          setSearchResults(
            Array.isArray(results)
              ? results
              : results?.messages ||
                  results?.data ||
                  []
          );
        } catch (error) {
          console.error(
            "SEARCH ERROR:",
            error?.response?.data ||
              error
          );
        }
      },
      [activeConversationId]
    );

  /*
   * ==================================================
   * START OUTGOING VOICE / VIDEO CALL
   * ==================================================
   *
   * Flow:
   *
   * 1. Validate caller.
   * 2. Validate receiver.
   * 3. Create Call in MongoDB.
   * 4. Make sure Socket.IO is connected.
   * 5. Emit call:initiate.
   * 6. Navigate caller to CallScreen.
   *
   * WebRTC negotiation happens later in
   * CallScreen after the receiver accepts.
   */

  const startOutgoingCall =
    useCallback(
      async (type) => {
        if (startingCall) {
          return;
        }

        if (
          type !== "voice" &&
          type !== "video"
        ) {
          console.error(
            "INVALID CALL TYPE:",
            type
          );

          return;
        }

        const callerId =
          user?._id ||
          user?.id ||
          currentUserId ||
          null;

        const targetUserId =
          otherUser?._id ||
          otherUser?.id ||
          receiverId ||
          routeUserId ||
          null;

        /*
         * ------------------------------------------
         * VALIDATE CALLER
         * ------------------------------------------
         */

        if (!callerId) {
          Alert.alert(
            "Call failed",
            "Your account could not be identified. Please log in again."
          );

          return;
        }

        /*
         * ------------------------------------------
         * VALIDATE RECEIVER
         * ------------------------------------------
         */

        if (!targetUserId) {
          Alert.alert(
            "Call failed",
            "Unable to find the person you are trying to call."
          );

          return;
        }

        /*
         * ------------------------------------------
         * PREVENT SELF CALL
         * ------------------------------------------
         */

        if (
          String(callerId) ===
          String(targetUserId)
        ) {
          Alert.alert(
            "Call failed",
            "You cannot call yourself."
          );

          return;
        }

        try {
          setStartingCall(true);

          console.log(
            "================================"
          );

          console.log(
            "STARTING OUTGOING CALL"
          );

          console.log(
            "CALLER:",
            String(callerId)
          );

          console.log(
            "RECEIVER:",
            String(targetUserId)
          );

          console.log(
            "TYPE:",
            type
          );

          console.log(
            "================================"
          );

          /*
           * ------------------------------------------
           * STEP 1
           * CREATE CALL IN DATABASE
           * ------------------------------------------
           */

          const call =
            await startCall({
              receiverId:
                String(
                  targetUserId
                ),
              type,
            });

          console.log(
            "CALL CREATED:",
            call
          );

          if (!call?._id) {
            throw new Error(
              "The server did not return a valid call ID."
            );
          }

          const callId =
            String(call._id);

          /*
           * ------------------------------------------
           * STEP 2
           * CONNECT SOCKET BEFORE INITIATE
           * ------------------------------------------
           */

          let socket = getSocket();

          try {
            socket =
              await waitForSocket(
                String(callerId),
                10000
              );

            console.log(
              "CALL SOCKET READY:",
              socket?.id
            );
          } catch (socketError) {
            console.error(
              "CALL SOCKET CONNECTION ERROR:",
              socketError
            );

            /*
             * The database call was created,
             * but signaling isn't available.
             *
             * Clean up the call.
             */

            try {
              const {
                updateCall,
              } = await import(
                "../../services/callService"
              );

              await updateCall(
                callId,
                "ended"
              );
            } catch (cleanupError) {
              console.warn(
                "CALL CLEANUP ERROR:",
                cleanupError
              );
            }

            throw new Error(
              "Unable to connect to the call server. Please check your internet connection and try again."
            );
          }

          if (
            !socket ||
            !socket.connected
          ) {
            throw new Error(
              "Call server connection is unavailable."
            );
          }

          /*
           * ------------------------------------------
           * STEP 3
           * PREPARE CALLER INFORMATION
           * ------------------------------------------
           */

          const caller = {
            _id:
              String(
                callerId
              ),

            username:
              call?.caller
                ?.username ||
              user?.username ||
              "Snapgram User",

            name:
              call?.caller?.name ||
              user?.name ||
              "",

            avatar:
              call?.caller
                ?.avatar ||
              user?.avatar ||
              null,
          };

          /*
           * ------------------------------------------
           * STEP 4
           * NOTIFY RECEIVER
           * ------------------------------------------
           */

          socket.emit(
            "call:initiate",
            {
              callId,

              receiverId:
                String(
                  targetUserId
                ),

              type,

              caller,
            }
          );

          console.log(
            "CALL INITIATE EMITTED:",
            {
              callId,
              receiverId:
                String(
                  targetUserId
                ),
              type,
            }
          );

          /*
           * ------------------------------------------
           * STEP 5
           * NAVIGATE TO CALL SCREEN
           * ------------------------------------------
           */

          router.push({
            pathname:
              "/calls/[callId]",

            params: {
              callId,

              username:
                otherUser?.username ||
                otherUser?.name ||
                "User",

              avatar:
                otherUser?.avatar ||
                "",

              type,

              otherUserId:
                String(
                  targetUserId
                ),

              callerId:
                String(
                  callerId
                ),

              isCaller:
                "true",
            },
          });
        } catch (error) {
          console.error(
            `${type.toUpperCase()} CALL ERROR:`,
            error?.response
              ?.data ||
              error?.message ||
              error
          );

          const message =
            error?.response?.data
              ?.message ||
            error?.message ||
            `Unable to start ${type} call.`;

          Alert.alert(
            "Call failed",
            message
          );
        } finally {
          setStartingCall(false);
        }
      },
      [
        currentUserId,
        otherUser,
        receiverId,
        routeUserId,
        startingCall,
        user,
      ]
    );

  /*
   * ==================================================
   * VOICE CALL
   * ==================================================
   */

  const handleVoiceCall =
    useCallback(() => {
      startOutgoingCall(
        "voice"
      );
    }, [
      startOutgoingCall,
    ]);

  /*
   * ==================================================
   * VIDEO CALL
   * ==================================================
   */

  const handleVideoCall =
    useCallback(() => {
      startOutgoingCall(
        "video"
      );
    }, [
      startOutgoingCall,
    ]);

  /*
   * ==================================================
   * RENDER MESSAGE
   * ==================================================
   */

  const renderMessage =
    useCallback(
      ({ item }) => (
        <MessageBubble
          message={item}
          currentUserId={
            currentUserId
          }
          onLongPress={
            handleMessageOptions
          }
        />
      ),
      [
        currentUserId,
        handleMessageOptions,
      ]
    );

  const messageKeyExtractor =
    useCallback(
      (item, index) =>
        String(
          item?._id ||
            item?.id ||
            `message-${index}`
        ),
      []
    );

  /*
   * ==================================================
   * LOADING
   * ==================================================
   */

  if (
    authLoading ||
    loading
  ) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <ActivityIndicator
          size="large"
          color="#111111"
        />
      </View>
    );
  }

  /*
   * ==================================================
   * MAIN UI
   * ==================================================
   */

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? 0
          : 0
      }
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color="#111111"
          />
        </TouchableOpacity>

        {otherUser?.avatar ? (
          <Image
            source={{
              uri:
                otherUser.avatar,
            }}
            style={
              styles.headerAvatar
            }
          />
        ) : (
          <View
            style={
              styles.headerAvatarPlaceholder
            }
          >
            <Text
              style={
                styles.headerAvatarText
              }
            >
              {(
                otherUser?.username ||
                otherUser?.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}

        <View
          style={
            styles.headerInfo
          }
        >
          <Text
            style={
              styles.username
            }
            numberOfLines={1}
          >
            {otherUser?.username ||
              otherUser?.name ||
              "Chat"}
          </Text>

          {otherUser?._id ||
          otherUser?.id ? (
            <OnlineStatus
              userId={
                otherUser._id ||
                otherUser.id
              }
            />
          ) : null}
        </View>

        {/* SEARCH */}

        <TouchableOpacity
          onPress={() =>
            setSearching(true)
          }
          style={
            styles.headerButton
          }
          activeOpacity={0.7}
          hitSlop={5}
          disabled={startingCall}
        >
          <Ionicons
            name="search-outline"
            size={23}
            color="#111111"
          />
        </TouchableOpacity>

        {/* VOICE CALL */}

        <TouchableOpacity
          onPress={
            handleVoiceCall
          }
          style={
            styles.headerButton
          }
          activeOpacity={0.7}
          hitSlop={5}
          disabled={
            startingCall
          }
        >
          {startingCall ? (
            <ActivityIndicator
              size="small"
              color="#111111"
            />
          ) : (
            <Ionicons
              name="call-outline"
              size={22}
              color="#111111"
            />
          )}
        </TouchableOpacity>

        {/* VIDEO CALL */}

        <TouchableOpacity
          onPress={
            handleVideoCall
          }
          style={
            styles.headerButton
          }
          activeOpacity={0.7}
          hitSlop={5}
          disabled={
            startingCall
          }
        >
          {startingCall ? (
            <ActivityIndicator
              size="small"
              color="#111111"
            />
          ) : (
            <Ionicons
              name="videocam-outline"
              size={24}
              color="#111111"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================
          SEARCH
      ================================================== */}

      {searching ? (
        <MessageSearch
          onSearch={
            handleSearch
          }
          onClose={() => {
            setSearching(false);
            setSearchResults([]);
          }}
        />
      ) : null}

      {searching &&
      searchResults.length >
        0 ? (
        <View
          style={
            styles.searchResults
          }
        >
          {searchResults.map(
            (
              message,
              index
            ) => (
              <TouchableOpacity
                key={String(
                  message?._id ||
                    `search-${index}`
                )}
                style={
                  styles.searchResult
                }
                onPress={() => {
                  setSearching(
                    false
                  );

                  setSearchResults(
                    []
                  );
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.searchUsername
                  }
                >
                  {message
                    ?.sender
                    ?.username ||
                    "User"}
                </Text>

                <Text
                  numberOfLines={2}
                  style={
                    styles.searchMessage
                  }
                >
                  {message?.type ===
                  "voice"
                    ? "Voice message"
                    : message?.text ||
                      "Media message"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      ) : null}

      {/* ==================================================
          MESSAGES
      ================================================== */}

      <FlatList
        data={
          messages
        }
        keyExtractor={
          messageKeyExtractor
        }
        renderItem={
          renderMessage
        }
        contentContainerStyle={[
          styles.messages,
          messages.length ===
            0 &&
            styles.emptyMessages,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === "ios"
            ? "interactive"
            : "on-drag"
        }
      />

      {/* ==================================================
          TYPING
      ================================================== */}

      {typingUser ? (
        <View
          style={
            styles.typingContainer
          }
        >
          <Text
            style={
              styles.typing
            }
          >
            {typingUser} is
            typing...
          </Text>
        </View>
      ) : null}

      {/* ==================================================
          REPLY PREVIEW
      ================================================== */}

      {replyingTo ? (
        <View
          style={
            styles.replyComposer
          }
        >
          <View
            style={
              styles.replyComposerLine
            }
          />

          <View
            style={
              styles.replyComposerContent
            }
          >
            <Text
              style={
                styles.replyComposerTitle
              }
            >
              Replying to message
            </Text>

            <Text
              numberOfLines={1}
              style={
                styles.replyComposerText
              }
            >
              {replyingTo.type ===
              "voice"
                ? "Voice message"
                : replyingTo.text ||
                  "Media message"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              setReplyingTo(
                null
              )
            }
            style={
              styles.replyCloseButton
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={20}
              color="#777777"
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ==================================================
          COMPOSER
      ================================================== */}

      <View
        style={
          styles.composer
        }
      >
        <MediaPicker
          onSelected={
            handleMediaSelected
          }
        />

        <TextInput
          value={text}
          onChangeText={
            handleTypingChange
          }
          placeholder="Message..."
          placeholderTextColor="#999999"
          style={
            styles.input
          }
          multiline
          maxLength={5000}
          textAlignVertical="center"
        />

        {!text.trim() ? (
          <VoiceRecorder
            onRecorded={
              handleVoiceRecorded
            }
          />
        ) : (
          <TouchableOpacity
            style={
              styles.sendButton
            }
            onPress={
              handleSend
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={21}
              color="#0095F6"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ==================================================
          MESSAGE ACTION MODAL
      ================================================== */}

      <Modal
        visible={
          !!selectedMessage
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedMessage(
            null
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.actionBox
            }
          >
            <View
              style={
                styles.modalHandle
              }
            />

            {/* REACTIONS */}

            {selectedMessage ? (
              <ReactionBar
                onSelect={(emoji) =>
                  handleReaction(
                    selectedMessage,
                    emoji
                  )
                }
              />
            ) : null}

            {/* REPLY */}

            <TouchableOpacity
              style={
                styles.action
              }
              onPress={() =>
                handleReply(
                  selectedMessage
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={21}
                color="#111111"
                style={
                  styles.actionIcon
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                Reply
              </Text>
            </TouchableOpacity>

            {/* COPY */}

            {selectedMessage?.text ? (
              <TouchableOpacity
                style={
                  styles.action
                }
                onPress={() =>
                  handleCopy(
                    selectedMessage
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color="#111111"
                  style={
                    styles.actionIcon
                  }
                />

                <Text
                  style={
                    styles.actionText
                  }
                >
                  Copy
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* UNSEND */}

            <TouchableOpacity
              style={
                styles.action
              }
              onPress={() =>
                handleUnsend(
                  selectedMessage
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={21}
                color="#ED4956"
                style={
                  styles.actionIcon
                }
              />

              <Text
                style={
                  styles.deleteText
                }
              >
                Unsend
              </Text>
            </TouchableOpacity>

            {/* DELETE */}

            <TouchableOpacity
              style={
                styles.action
              }
              onPress={() =>
                handleDelete(
                  selectedMessage
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color="#ED4956"
                style={
                  styles.actionIcon
                }
              />

              <Text
                style={
                  styles.deleteText
                }
              >
                Delete
              </Text>
            </TouchableOpacity>

            {/* CANCEL */}

            <TouchableOpacity
              style={
                styles.cancelAction
              }
              onPress={() =>
                setSelectedMessage(
                  null
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.actionCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/*
 * =====================================================
 * MESSAGE BUBBLE
 * =====================================================
 */

function MessageBubble({
  message,
  currentUserId,
  onLongPress,
}) {
  const senderId =
    message?.sender?._id ||
    message?.sender?.id ||
    message?.sender;

  const isMine =
    String(senderId) ===
    String(currentUserId);

  /*
   * Deleted message
   */

  if (message?.deleted) {
    return (
      <View
        style={[
          styles.messageRow,
          isMine
            ? styles.myMessageRow
            : styles.theirMessageRow,
        ]}
      >
        <View
          style={
            styles.deletedBubble
          }
        >
          <Ionicons
            name="ban-outline"
            size={15}
            color="#999999"
            style={
              styles.deletedIcon
            }
          />

          <Text
            style={
              styles.deletedText
            }
          >
            Message unsent
          </Text>
        </View>
      </View>
    );
  }

  const isVoice =
    message?.type ===
    "voice";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() =>
        onLongPress?.(
          message
        )
      }
      delayLongPress={350}
      style={[
        styles.messageRow,
        isMine
          ? styles.myMessageRow
          : styles.theirMessageRow,
      ]}
    >
      <View
        style={[
          styles.bubble,

          isVoice &&
            styles.voiceBubble,

          isMine
            ? styles.myBubble
            : styles.theirBubble,
        ]}
      >
        {/* REPLY REFERENCE */}

        {message?.replyTo ? (
          <View
            style={[
              styles.replyReference,
              isMine
                ? styles.myReplyReference
                : styles.theirReplyReference,
            ]}
          >
            <Ionicons
              name="return-down-forward-outline"
              size={13}
              color={
                isMine
                  ? "#FFFFFF"
                  : "#777777"
              }
              style={
                styles.replyReferenceIcon
              }
            />

            <Text
              numberOfLines={2}
              style={[
                styles.replyReferenceText,
                isMine
                  ? styles.myReplyText
                  : styles.theirReplyText,
              ]}
            >
              {message.replyTo
                ?.type ===
              "voice"
                ? "Voice message"
                : message
                    .replyTo
                    ?.text ||
                  "Media message"}
            </Text>
          </View>
        ) : null}

        {/* VOICE MESSAGE */}

        {isVoice ? (
          <VoiceMessageBubble
            url={
              message?.mediaUrl ||
              null
            }
            duration={
              message?.mediaDuration ||
              0
            }
            isMine={
              isMine
            }
          />
        ) : (
          <>
            {/* TEXT */}

            {message?.text ? (
              <Text
                style={[
                  styles.messageText,
                  isMine
                    ? styles.myMessageText
                    : styles.theirMessageText,
                ]}
              >
                {message.text}
              </Text>
            ) : null}

            {/* MEDIA */}

            {message?.mediaUrl &&
            message?.type !==
              "voice" ? (
              <MessageMedia
                message={
                  message
                }
                isMine={
                  isMine
                }
              />
            ) : null}
          </>
        )}

        {/* REACTIONS */}

        {Array.isArray(
          message?.reactions
        ) &&
        message.reactions
          .length > 0 ? (
          <View
            style={
              styles.reactions
            }
          >
            {message.reactions
              .slice(0, 5)
              .map(
                (
                  reaction,
                  index
                ) => (
                  <Text
                    key={`${message?._id || "message"}-reaction-${index}`}
                    style={
                      styles.reaction
                    }
                  >
                    {reaction?.emoji ||
                      reaction}
                  </Text>
                )
              )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/*
 * =====================================================
 * MEDIA MESSAGE
 * =====================================================
 */

function MessageMedia({
  message,
  isMine,
}) {
  if (!message?.mediaUrl) {
    return null;
  }

  const type =
    message?.type ||
    message?.mediaType ||
    "image";

  const isImage =
    type === "image" ||
    String(
      message?.mimeType ||
        ""
    ).startsWith(
      "image/"
    );

  if (!isImage) {
    return (
      <View
        style={
          styles.mediaPlaceholder
        }
      >
        <Ionicons
          name={
            type === "video"
              ? "videocam-outline"
              : "document-outline"
          }
          size={22}
          color={
            isMine
              ? "#FFFFFF"
              : "#555555"
          }
        />

        <Text
          style={[
            styles.mediaPlaceholderText,
            isMine
              ? styles.myMessageText
              : styles.theirMessageText,
          ]}
        >
          {type === "video"
            ? "Video"
            : "Media"}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{
        uri:
          message.mediaUrl,
      }}
      style={
        styles.messageImage
      }
      resizeMode="cover"
    />
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    container: {
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

    /*
     * HEADER
     */

    header: {
      minHeight: 62,
      paddingHorizontal: 8,
      paddingTop:
        Platform.OS ===
        "ios"
          ? 4
          : 0,
      paddingBottom: 4,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#DBDBDB",
    },

    backButton: {
      width: 38,
      height: 44,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginHorizontal: 7,
      backgroundColor:
        "#EFEFEF",
    },

    headerAvatarPlaceholder: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginHorizontal: 7,
      backgroundColor:
        "#EFEFEF",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerAvatarText: {
      fontSize: 15,
      fontWeight:
        "700",
      color: "#777777",
    },

    headerInfo: {
      flex: 1,
      minWidth: 0,
      justifyContent:
        "center",
    },

    username: {
      fontSize: 15,
      lineHeight: 19,
      fontWeight:
        "700",
      color: "#111111",
    },

    headerButton: {
      width: 39,
      height: 44,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 20,
    },

    /*
     * SEARCH
     */

    searchResults: {
      maxHeight: 230,
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#DBDBDB",
    },

    searchResult: {
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#EEEEEE",
    },

    searchUsername: {
      fontSize: 13,
      fontWeight:
        "700",
      color: "#111111",
    },

    searchMessage: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 18,
      color: "#666666",
    },

    /*
     * MESSAGES
     */

    messages: {
      flexGrow: 1,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 12,
    },

    emptyMessages: {
      justifyContent:
        "flex-end",
    },

    messageRow: {
      width: "100%",
      marginVertical: 3,
    },

    myMessageRow: {
      alignItems:
        "flex-end",
    },

    theirMessageRow: {
      alignItems:
        "flex-start",
    },

    bubble: {
      maxWidth: "82%",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },

    myBubble: {
      backgroundColor:
        "#0095F6",
      borderBottomRightRadius:
        5,
    },

    theirBubble: {
      backgroundColor:
        "#EFEFEF",
      borderBottomLeftRadius:
        5,
    },

    /*
     * VOICE
     */

    voiceBubble: {
      minWidth: 230,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },

    /*
     * TEXT
     */

    messageText: {
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.1,
    },

    myMessageText: {
      color: "#FFFFFF",
    },

    theirMessageText: {
      color: "#111111",
    },

    /*
     * REPLY
     */

    replyReference: {
      flexDirection:
        "row",
      alignItems:
        "center",
      minHeight: 26,
      borderLeftWidth: 3,
      paddingLeft: 8,
      marginBottom: 7,
      opacity: 0.88,
    },

    myReplyReference: {
      borderLeftColor:
        "#FFFFFF",
    },

    theirReplyReference: {
      borderLeftColor:
        "#777777",
    },

    replyReferenceIcon: {
      marginRight: 5,
    },

    replyReferenceText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
    },

    myReplyText: {
      color: "#FFFFFF",
    },

    theirReplyText: {
      color: "#666666",
    },

    /*
     * REACTIONS
     */

    reactions: {
      alignSelf:
        "flex-start",
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 5,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor:
        "rgba(255,255,255,0.92)",
      gap: 2,
    },

    reaction: {
      fontSize: 14,
    },

    /*
     * MEDIA
     */

    messageImage: {
      width: 220,
      height: 220,
      marginTop: 2,
      borderRadius: 14,
      backgroundColor:
        "#EDEDED",
    },

    mediaPlaceholder: {
      minWidth: 100,
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    mediaPlaceholderText: {
      fontSize: 14,
      fontWeight:
        "600",
    },

    /*
     * DELETED
     */

    deletedBubble: {
      maxWidth: "78%",
      minHeight: 38,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor:
        "#F3F3F3",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    deletedIcon: {
      marginRight: 6,
    },

    deletedText: {
      fontSize: 14,
      color: "#999999",
      fontStyle:
        "italic",
    },

    /*
     * TYPING
     */

    typingContainer: {
      paddingHorizontal: 17,
      paddingVertical: 4,
      backgroundColor:
        "#FFFFFF",
    },

    typing: {
      fontSize: 12,
      lineHeight: 17,
      color: "#888888",
      fontStyle:
        "italic",
    },

    /*
     * REPLY COMPOSER
     */

    replyComposer: {
      minHeight: 52,
      paddingHorizontal: 12,
      paddingVertical: 7,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#F8F8F8",
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor:
        "#DBDBDB",
    },

    replyComposerLine: {
      width: 3,
      height: 34,
      borderRadius: 2,
      marginRight: 9,
      backgroundColor:
        "#0095F6",
    },

    replyComposerContent: {
      flex: 1,
      minWidth: 0,
    },

    replyComposerTitle: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight:
        "800",
      color: "#0095F6",
    },

    replyComposerText: {
      marginTop: 1,
      fontSize: 12,
      lineHeight: 17,
      color: "#666666",
    },

    replyCloseButton: {
      width: 34,
      height: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    /*
     * COMPOSER
     */

    composer: {
      minHeight: 61,
      paddingHorizontal: 9,
      paddingVertical: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor:
        "#DBDBDB",
    },

    input: {
      flex: 1,
      minHeight: 43,
      maxHeight: 105,
      marginHorizontal: 6,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 10,
      borderRadius: 22,
      backgroundColor:
        "#F2F2F2",
      color: "#111111",
      fontSize: 15,
      lineHeight: 20,
    },

    sendButton: {
      width: 43,
      height: 43,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    /*
     * ACTION MODAL
     */

    modalOverlay: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 20,
      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    actionBox: {
      width: "100%",
      maxWidth: 390,
      overflow:
        "hidden",
      borderRadius: 20,
      backgroundColor:
        "#FFFFFF",
    },

    modalHandle: {
      alignSelf:
        "center",
      width: 38,
      height: 4,
      marginTop: 9,
      marginBottom: 4,
      borderRadius: 2,
      backgroundColor:
        "#D8D8D8",
    },

    action: {
      minHeight: 53,
      paddingHorizontal: 20,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#EEEEEE",
    },

    actionIcon: {
      width: 28,
      marginRight: 11,
    },

    actionText: {
      fontSize: 15,
      fontWeight:
        "600",
      color: "#111111",
    },

    deleteText: {
      fontSize: 15,
      fontWeight:
        "700",
      color: "#ED4956",
    },

    cancelAction: {
      minHeight: 54,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    actionCancelText: {
      fontSize: 15,
      fontWeight:
        "600",
      color: "#111111",
    },
  });