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
Pressable,
StyleSheet,
Text,
TextInput,
View,
} from "react-native";

import {
router,
useLocalSearchParams,
} from "expo-router";

import * as Clipboard from "expo-clipboard";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

import VoiceMessageBubble from "../../components/messages/VoiceMessageBubble";
import MediaPicker from "../../components/messages/MediaPicker";
import VoiceRecorder from "../../components/messages/VoiceRecorder";
import OnlineStatus from "../../components/messages/OnlineStatus";
import MessageSearch from "../../components/messages/MessageSearch";
import ReactionBar from "../../components/messages/ReactionBar";
import VerifiedBadge from "../../components/common/VerifiedBadge";

import {
getMessages,
getOrCreateConversation,
markMessagesRead,
sendMessage,
sendMediaMessage,
sendVoiceMessage,
reactToMessage,
unsendMessage,
deleteMessage,
} from "../../services/messageService";

import { startCall } from "../../services/callService";

import {
getSocket,
joinConversation,
leaveConversation,
sendSocketMessage,
sendTyping,
stopTyping,
waitForSocket,
} from "../../services/socket";

function getId(value) {
if (!value) {
return null;
}

if (typeof value === "string") {
return value;
}

return value?._id || value?.id || null;
}

function normalizeParam(value) {
if (Array.isArray(value)) {
return value[0] || null;
}

return value || null;
}

function sameId(a, b) {
if (!a || !b) {
return false;
}

return String(a) === String(b);
}

function getMessageId(message) {
return message?._id || message?.id || null;
}

function getDisplayName(user) {
return (
user?.fullName?.trim() ||
user?.name?.trim() ||
user?.username ||
"User"
);
}

function getUsername(user) {
if (!user?.username) {
return null;
}

return `@${user.username}`;
}

function getAvatar(user) {
return (
user?.avatar ||
user?.profilePicture ||
user?.photoURL ||
null
);
}

/*

* Search is intentionally local.
*
* The server must never receive a plaintext search query for an
* end-to-end encrypted conversation.
  */
  function getMessageSearchText(message) {
  if (!message) {
  return "";
  }

return [
message.text,
message.caption,
message?.sender?.fullName,
message?.sender?.username,
]
.filter(Boolean)
.join(" ")
.toLowerCase();
}


export default function ConversationScreen() {
const params = useLocalSearchParams();

const {
user,
loading: authLoading,
} = useAuth();

const insets = useSafeAreaInsets();

const routeConversationId = normalizeParam(
params?.conversationId
);

const routeUserId = normalizeParam(
params?.userId
);

const currentUserId = getId(user);

const [conversationId, setConversationId] =
useState(
routeConversationId
? String(routeConversationId)
: null
);

const [conversation, setConversation] =
useState(null);

const [messages, setMessages] =
useState([]);

const [text, setText] =
useState("");

const [loading, setLoading] =
useState(true);

const [searching, setSearching] =
useState(false);

const [searchResults, setSearchResults] =
useState([]);

const [typingUser, setTypingUser] =
useState(null);

const [replyingTo, setReplyingTo] =
useState(null);

const [selectedMessage, setSelectedMessage] =
useState(null);

const [startingCall, setStartingCall] =
useState(null);

const [sending, setSending] =
useState(false);

const listRef = useRef(null);
const typingTimerRef = useRef(null);
const mountedRef = useRef(true);
const loadingRef = useRef(false);
const callStartingRef = useRef(false);

const otherUser = useMemo(() => {
const participants = Array.isArray(
conversation?.participants
)
? conversation.participants
: [];

const participant = participants.find(
  (item) => {
    const id = getId(item);

    return (
      id &&
      !sameId(id, currentUserId)
    );
  }
);

if (participant) {
  return participant;
}

if (routeUserId) {
  return {
    _id: String(routeUserId),
    id: String(routeUserId),
    username: "user",
    fullName: "User",
    avatar: null,
    isVerified: false,
  };
}

for (const message of messages) {
  const senderId = getId(
    message?.sender
  );

  if (
    senderId &&
    !sameId(
      senderId,
      currentUserId
    )
  ) {
    return message.sender;
  }

  const receiverId = getId(
    message?.receiver
  );

  if (
    receiverId &&
    !sameId(
      receiverId,
      currentUserId
    )
  ) {
    return message.receiver;
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
getId(otherUser) ||
routeUserId ||
null;

const displayName =
getDisplayName(otherUser);

const username =
getUsername(otherUser);

const otherAvatar =
getAvatar(otherUser);

const appendMessage = useCallback(
(message) => {
if (!message) {
return;
}

  const id = getMessageId(message);

  setMessages((current) => {
    if (
      id &&
      current.some((item) =>
        sameId(
          getMessageId(item),
          id
        )
      )
    ) {
      return current;
    }

    return [
      ...current,
      message,
    ];
  });
},
[]

);

const loadConversation = useCallback(
async () => {
if (authLoading) {
return;
}

  if (!user) {
    setLoading(false);
    return;
  }

  if (loadingRef.current) {
    return;
  }

  loadingRef.current = true;

  try {
    setLoading(true);

    let id = conversationId;

    if (!id && routeUserId) {
      const created =
        await getOrCreateConversation(
          String(routeUserId)
        );

      const createdId =
        getId(created);

      if (!createdId) {
        throw new Error(
          "Unable to create conversation."
        );
      }

      id = String(createdId);

      if (mountedRef.current) {
        setConversationId(id);
        setConversation(
          created
        );
      }
    }

    if (!id) {
      if (mountedRef.current) {
        setMessages([]);
      }

      return;
    }

    const result =
      await getMessages(id);

    if (!mountedRef.current) {
      return;
    }

    if (result?.conversation) {
      setConversation(
        result.conversation
      );
    }

    const loaded =
      Array.isArray(
        result?.messages
      )
        ? result.messages
        : Array.isArray(result)
          ? result
          : [];

    /*
     * messageService is responsible for decrypting messages
     * before returning them to the UI.
     *
     * The screen therefore only handles plaintext that already
     * exists locally after successful decryption.
     */
    setMessages(loaded);

    try {
      await markMessagesRead(id);
    } catch (error) {
      console.warn(
        "[CHAT] Mark read failed:",
        error?.response?.data ||
          error
      );
    }
  } catch (error) {
    console.error(
      "[CHAT] Load conversation error:",
      error?.response?.data ||
        error
    );

    if (mountedRef.current) {
      Alert.alert(
        "Unable to load chat",
        error?.response?.data
          ?.message ||
          error?.message ||
          "We couldn't load this conversation."
      );
    }
  } finally {
    loadingRef.current = false;

    if (mountedRef.current) {
      setLoading(false);
    }
  }
},
[
  authLoading,
  conversationId,
  routeUserId,
  user,
]

);


useEffect(() => {
mountedRef.current = true;

return () => {
  mountedRef.current = false;

  if (typingTimerRef.current) {
    clearTimeout(
      typingTimerRef.current
    );
  }
};

}, []);

useEffect(() => {
loadConversation();
}, [loadConversation]);

useEffect(() => {
if (
!user ||
!conversationId
) {
return undefined;
}

const socket = getSocket();

if (!socket) {
  return undefined;
}

joinConversation(
  conversationId
);

const handleNewMessage =
  (message) => {
    if (!message) {
      return;
    }

    const incomingConversation =
      message?.conversation;

    const incomingConversationId =
      getId(
        incomingConversation
      ) ||
      incomingConversation;

    if (
      !sameId(
        incomingConversationId,
        conversationId
      )
    ) {
      return;
    }

    /*
     * message:new should already contain the locally
     * decrypted representation from the message service/
     * socket message handling layer.
     */
    appendMessage(message);

    markMessagesRead(
      conversationId
    ).catch(() => {});
  };

const handleTyping =
  (data) => {
    if (
      data?.userId &&
      currentUserId &&
      sameId(
        data.userId,
        currentUserId
      )
    ) {
      return;
    }

    setTypingUser(
      displayName
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
    conversationId
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
appendMessage,
conversationId,
currentUserId,
displayName,
user,
]);

const handleTypingChange =
useCallback(
(value) => {
setText(value);

    if (typingTimerRef.current) {
      clearTimeout(
        typingTimerRef.current
      );
    }

    const socket = getSocket();

    if (
      !socket?.connected ||
      !conversationId ||
      !currentUserId ||
      !receiverId
    ) {
      return;
    }

    if (value.trim()) {
      sendTyping(
        conversationId,
        receiverId
      );

      typingTimerRef.current =
        setTimeout(() => {
          stopTyping(
            conversationId,
            receiverId
          );
        }, 1200);
    } else {
      stopTyping(
        conversationId,
        receiverId
      );
    }
  },
  [
    conversationId,
    currentUserId,
    receiverId,
  ]
);

const handleSend = useCallback(
async () => {
const value = text.trim();

  if (
    !value ||
    !conversationId ||
    !receiverId ||
    sending
  ) {
    return;
  }

  setSending(true);

  try {
    setText("");

    stopTyping(
      conversationId,
      receiverId
    );

    const message =
      await sendMessage({
        conversationId,
        receiverId: String(
          receiverId
        ),
        text: value,
        replyTo:
          getMessageId(
            replyingTo
          ) || null,
      });

    if (message) {
      appendMessage(message);

      sendSocketMessage(
        message
      );
    }

    setReplyingTo(null);
  } catch (error) {
    console.error(
      "[CHAT] Secure send error:",
      error?.response?.data ||
        error
    );

    setText(value);

    Alert.alert(
      "Message failed",
      error?.response?.data
        ?.message ||
        error?.message ||
        "Unable to send encrypted message."
    );
  } finally {
    if (mountedRef.current) {
      setSending(false);
    }
  }
},
[
  appendMessage,
  conversationId,
  receiverId,
  replyingTo,
  sending,
  text,
]

);

const handleMediaSelected =
useCallback(
async (media) => {
if (
!media?.uri ||
!conversationId ||
!receiverId
) {
return;
}

    try {

      const message =
        await sendMediaMessage({
          conversationId,
          receiverId: String(
            receiverId
          ),
          type:
            media.type ||
            "image",
          uri: media.uri,
          mimeType:
            media.mimeType,
          replyTo:
            getMessageId(
              replyingTo
            ) || null,
        });

      if (message) {
        appendMessage(message);

        sendSocketMessage(
          message
        );
      }

      setReplyingTo(null);
    } catch (error) {
      console.error(
        "[CHAT] Secure media send error:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Media failed",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to send encrypted media."
      );
    }
  },
  [
    appendMessage,
    conversationId,
    receiverId,
    replyingTo,
  ]
);

const handleVoiceRecorded =
useCallback(
async (recording) => {
if (
!recording?.uri ||
!conversationId ||
!receiverId
) {
return;
}

    try {

      const message =
        await sendVoiceMessage({
          conversationId,
          receiverId: String(
            receiverId
          ),
          uri: recording.uri,
          duration:
            recording.duration ||
            0,
          replyTo:
            getMessageId(
              replyingTo
            ) || null,
        });

      if (message) {
        appendMessage(message);

        sendSocketMessage(
          message
        );
      }

      setReplyingTo(null);
    } catch (error) {
      console.error(
        "[CHAT] Secure voice send error:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Voice message failed",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to send encrypted voice message."
      );
    }
  },
  [
    appendMessage,
    conversationId,
    receiverId,
    replyingTo,
  ]
);

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

const handleReply =
useCallback(
(message) => {
if (!message) {
return;
}

    setReplyingTo(message);
    setSelectedMessage(null);
  },
  []
);

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

      setSelectedMessage(null);
    } catch (error) {
      console.error(
        "[CHAT] Copy error:",
        error
      );
    }
  },
  []
);

const handleReaction =
useCallback(
async (message, emoji) => {
const messageId =
getMessageId(message);

    if (!messageId) {
      return;
    }

    try {
      const result =
        await reactToMessage(
          messageId,
          emoji
        );

      setMessages(
        (current) =>
          current.map(
            (item) =>
              sameId(
                getMessageId(
                  item
                ),
                messageId
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

const handleUnsend =
useCallback(
async (message) => {
const messageId =
getMessageId(message);

    if (!messageId) {
      return;
    }

    try {
      await unsendMessage(
        messageId
      );

      setMessages(
        (current) =>
          current.map(
            (item) =>
              sameId(
                getMessageId(
                  item
                ),
                messageId
              )
                ? {
                    ...item,
                    deleted:
                      true,
                    text: "",
                    ciphertext:
                      null,
                    mediaUrl:
                      null,
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

const handleDelete =
useCallback(
async (message) => {
const messageId =
getMessageId(message);

    if (!messageId) {
      return;
    }

    try {
      await deleteMessage(
        messageId
      );

      setMessages(
        (current) =>
          current.filter(
            (item) =>
              !sameId(
                getMessageId(
                  item
                ),
                messageId
              )
          )
      );

      setSelectedMessage(
        null
      );
    } catch (error) {
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

const handleSearch =
useCallback(
async (query) => {
const cleanQuery =
String(query || "")
.trim()
.toLowerCase();

    if (!cleanQuery) {
      setSearchResults([]);
      return;
    }

    const results =
      messages.filter(
        (message) =>
          getMessageSearchText(
            message
          ).includes(
            cleanQuery
          )
      );

    setSearchResults(
      results
    );
  },
  [messages]
);

const handleSearchResultPress =
useCallback(
(message) => {
const messageId =
getMessageId(message);

    if (!messageId) {
      return;
    }

    const index =
      messages.findIndex(
        (item) =>
          sameId(
            getMessageId(
              item
            ),
            messageId
          )
      );

    setSearching(false);
    setSearchResults([]);

    if (index < 0) {
      Alert.alert(
        "Message unavailable",
        "This message is not currently loaded."
      );

      return;
    }

    requestAnimationFrame(
      () => {
        try {
          listRef.current?.scrollToIndex(
            {
              index,
              animated: true,
              viewPosition: 0.5,
            }
          );
        } catch (error) {
          console.warn(
            "[CHAT] Search scroll error:",
            error
          );
        }
      }
    );
  },
  [messages]
);

const openConversationInfo =
useCallback(() => {
if (
!conversationId ||
!receiverId
) {
return;
}

  router.push({
    pathname:
      "/messages/[conversationId]/info",
    params: {
      conversationId:
        String(
          conversationId
        ),
      userId: String(
        receiverId
      ),
    },
  });
}, [
  conversationId,
  receiverId,
]);

const startOutgoingCall =
useCallback(
async (type) => {
if (
callStartingRef.current ||
startingCall
) {
return;
}

    if (
      type !== "voice" &&
      type !== "video"
    ) {
      return;
    }

    const callerId =
      currentUserId;

    const targetId =
      receiverId;

    if (!callerId) {
      Alert.alert(
        "Call failed",
        "Your account could not be identified."
      );
      return;
    }

    if (!targetId) {
      Alert.alert(
        "Call failed",
        "Unable to find this user."
      );
      return;
    }

    if (
      sameId(
        callerId,
        targetId
      )
    ) {
      Alert.alert(
        "Call failed",
        "You cannot call yourself."
      );
      return;
    }

    callStartingRef.current =
      true;

    setStartingCall(type);

    try {
      /*
       * Socket identity comes from the authenticated
       * socket connection. The client does not become the
       * source of truth for who is calling.
       */
      const socket =
        await waitForSocket(
          String(callerId),
          10000
        );

      if (!socket?.connected) {
        throw new Error(
          "Call server is not connected."
        );
      }

      const call =
        await startCall({
          receiverId:
            String(targetId),
          type,
        });

      const callId =
        getId(call);

      if (!callId) {
        throw new Error(
          "The server did not return a call ID."
        );
      }

      /*
       * The server/socket layer should validate the
       * authenticated caller and receiver.
       *
       * The caller object is UI metadata only.
       */
      socket.emit(
        "call:initiate",
        {
          callId: String(
            callId
          ),
          receiverId:
            String(targetId),
          type,
        }
      );

      router.push({
        pathname:
          "/calls/[callId]",
        params: {
          callId: String(
            callId
          ),
          username:
            displayName,
          avatar:
            otherAvatar || "",
          type,
          otherUserId:
            String(
              targetId
            ),
          callerId:
            String(
              callerId
            ),
          isCaller: "true",
          callStatus:
            "ringing",
        },
      });
    } catch (error) {
      console.error(
        "[CALL] Start error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      if (mountedRef.current) {
        Alert.alert(
          "Call failed",
          error?.response?.data
            ?.message ||
            error?.message ||
            `Unable to start ${type} call.`
        );
      }
    } finally {
      callStartingRef.current =
        false;

      if (mountedRef.current) {
        setStartingCall(
          null
        );
      }
    }
  },
  [
    currentUserId,
    displayName,
    otherAvatar,
    receiverId,
    startingCall,
  ]
);


const handleVoiceCall =
useCallback(() => {
startOutgoingCall(
"voice"
);
}, [startOutgoingCall]);

const handleVideoCall =
useCallback(() => {
startOutgoingCall(
"video"
);
}, [startOutgoingCall]);

/* ------------------------------------------------------------------------ */
/* Search controls                                                           */
/* ------------------------------------------------------------------------ */

const openSearch =
useCallback(() => {
setSearching(true);
}, []);

const closeSearch =
useCallback(() => {
setSearching(false);
setSearchResults([]);
}, []);

/* ------------------------------------------------------------------------ */
/* Scrolling                                                                 */
/* ------------------------------------------------------------------------ */

const scrollToBottom =
useCallback(
(animated = true) => {
requestAnimationFrame(() => {
try {
listRef.current?.scrollToEnd(
{
animated,
}
);
} catch {}
});
},
[]
);

useEffect(() => {
if (
messages.length > 0 &&
!loading
) {
scrollToBottom(false);
}
}, [
loading,
messages.length,
scrollToBottom,
]);

/* ------------------------------------------------------------------------ */
/* Message rendering                                                         */
/* ------------------------------------------------------------------------ */

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

const keyExtractor =
useCallback(
(item, index) =>
String(
getMessageId(item) ||
`message-${index}`
),
[]
);

const handleScrollToIndexFailed =
useCallback((info) => {
setTimeout(() => {
try {
listRef.current?.scrollToOffset(
{
offset: Math.max(
0,
info.averageItemLength *
info.index
),
animated: true,
}
);
} catch {}
}, 100);
}, []);

/* ------------------------------------------------------------------------ */
/* Loading                                                                    */
/* ------------------------------------------------------------------------ */

if (
authLoading ||
loading
) {
return ( <View style={styles.loading}> <ActivityIndicator
       size="small"
       color="#111111"
     /> </View>
);
}

return (
<KeyboardAvoidingView
style={styles.container}
behavior={
Platform.OS === "ios"
? "padding"
: undefined
}
>
{/* HEADER */}

  <View
    style={[
      styles.header,
      {
        paddingTop:
          insets.top,
      },
    ]}
  >
    <Pressable
      onPress={() =>
        router.back()
      }
      style={
        styles.backButton
      }
      hitSlop={10}
    >
      <Ionicons
        name="chevron-back"
        size={28}
        color="#111111"
      />
    </Pressable>

    <Pressable
      onPress={
        openConversationInfo
      }
      style={
        styles.headerUser
      }
    >
      {otherAvatar ? (
        <Image
          source={{
            uri: otherAvatar,
          }}
          style={
            styles.headerAvatar
          }
        />
      ) : (
        <View
          style={
            styles.headerAvatarFallback
          }
        >
          <Text
            style={
              styles.headerAvatarLetter
            }
          >
            {displayName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
      )}

      <View
        style={
          styles.headerIdentity
        }
      >
        <View
          style={
            styles.nameRow
          }
        >
          <Text
            numberOfLines={1}
            style={
              styles.headerName
            }
          >
            {displayName}
          </Text>

          {otherUser?.isVerified ? (
            <VerifiedBadge
              size={14}
            />
          ) : null}
        </View>

        {/*
         * Verified users:
         * full name + badge only.
         *
         * Unverified users:
         * full name + username.
         *
         * Online status remains separate so it does not
         * accidentally display the username for verified users.
         */}
        {otherUser?.isVerified ? (
          <OnlineStatus
            userId={
              receiverId
            }
          />
        ) : username ? (
          <Text
            numberOfLines={1}
            style={
              styles.headerUsername
            }
          >
            {username}
          </Text>
        ) : (
          <OnlineStatus
            userId={
              receiverId
            }
          />
        )}
      </View>
    </Pressable>

    <Pressable
      onPress={
        openSearch
      }
      style={
        styles.headerIcon
      }
      hitSlop={8}
    >
      <Ionicons
        name="search-outline"
        size={23}
        color="#111111"
      />
    </Pressable>

    <Pressable
      onPress={
        handleVoiceCall
      }
      disabled={
        !!startingCall
      }
      style={[
        styles.headerIcon,
        !!startingCall &&
          styles.disabledIcon,
      ]}
      hitSlop={8}
    >
      {startingCall ===
      "voice" ? (
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
    </Pressable>

    <Pressable
      onPress={
        handleVideoCall
      }
      disabled={
        !!startingCall
      }
      style={[
        styles.headerIcon,
        !!startingCall &&
          styles.disabledIcon,
      ]}
      hitSlop={8}
    >
      {startingCall ===
      "video" ? (
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
    </Pressable>
  </View>

  {/* SEARCH */}

  {searching ? (
    <MessageSearch
      onSearch={
        handleSearch
      }
      onClose={
        closeSearch
      }
    />
  ) : null}

  {/* SEARCH RESULTS */}

  {searching &&
  searchResults.length > 0 ? (
    <View
      style={
        styles.searchResults
      }
    >
      {searchResults.map(
        (
          message,
          index
        ) => {
          const sender =
            message?.sender;

          const senderName =
            getDisplayName(
              sender
            );

          return (
            <Pressable
              key={String(
                getMessageId(
                  message
                ) ||
                  `search-${index}`
              )}
              onPress={() =>
                handleSearchResultPress(
                  message
                )
              }
              style={
                styles.searchResult
              }
            >
              <View
                style={
                  styles.searchResultIcon
                }
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={17}
                  color="#666666"
                />
              </View>

              <View
                style={
                  styles.searchResultContent
                }
              >
                <View
                  style={
                    styles.searchNameRow
                  }
                >
                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.searchResultUsername
                    }
                  >
                    {senderName}
                  </Text>

                  {sender?.isVerified ? (
                    <VerifiedBadge
                      size={12}
                    />
                  ) : null}
                </View>

                <Text
                  numberOfLines={
                    2
                  }
                  style={
                    styles.searchResultText
                  }
                >
                  {message?.type ===
                  "voice"
                    ? "Voice message"
                    : message?.text ||
                      "Media message"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color="#AAAAAA"
              />
            </Pressable>
          );
        }
      )}
    </View>
  ) : null}

  {/* MESSAGES */}

  <FlatList
    ref={listRef}
    data={messages}
    keyExtractor={
      keyExtractor
    }
    renderItem={
      renderMessage
    }
    onScrollToIndexFailed={
      handleScrollToIndexFailed
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

  {/* TYPING */}

  {typingUser ? (
    <View
      style={
        styles.typingContainer
      }
    >
      <Text
        style={
          styles.typingText
        }
      >
        {typingUser} is typing...
      </Text>
    </View>
  ) : null}

  {/* REPLY */}

  {replyingTo ? (
    <View
      style={
        styles.replyComposer
      }
    >
      <View
        style={
          styles.replyAccent
        }
      />

      <View
        style={
          styles.replyContent
        }
      >
        <Text
          style={
            styles.replyTitle
          }
        >
          Replying to message
        </Text>

        <Text
          numberOfLines={1}
          style={
            styles.replyText
          }
        >
          {replyingTo?.type ===
          "voice"
            ? "Voice message"
            : replyingTo?.text ||
              "Media message"}
        </Text>
      </View>

      <Pressable
        onPress={() =>
          setReplyingTo(
            null
          )
        }
        style={
          styles.replyClose
        }
      >
        <Ionicons
          name="close"
          size={20}
          color="#777777"
        />
      </Pressable>
    </View>
  ) : null}

  {/* COMPOSER */}

  <View
    style={styles.composer}
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
      style={styles.input}
      multiline
      maxLength={5000}
      textAlignVertical="center"
      returnKeyType="default"
    />

    {!text.trim() ? (
      <VoiceRecorder
        onRecorded={
          handleVoiceRecorded
        }
      />
    ) : (
      <Pressable
        onPress={
          handleSend
        }
        disabled={sending}
        style={
          styles.sendButton
        }
        hitSlop={6}
      >
        {sending ? (
          <ActivityIndicator
            size="small"
            color="#0095F6"
          />
        ) : (
          <Ionicons
            name="send"
            size={21}
            color="#0095F6"
          />
        )}
      </Pressable>
    )}
  </View>

  {/* MESSAGE OPTIONS */}

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
    <Pressable
      style={
        styles.modalOverlay
      }
      onPress={() =>
        setSelectedMessage(
          null
        )
      }
    >
      <Pressable
        style={
          styles.actionBox
        }
        onPress={() => {}}
      >
        <View
          style={
            styles.modalHandle
          }
        />

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

        <ActionRow
          icon="arrow-undo-outline"
          label="Reply"
          onPress={() =>
            handleReply(
              selectedMessage
            )
          }
        />

        {selectedMessage?.text ? (
          <ActionRow
            icon="copy-outline"
            label="Copy"
            onPress={() =>
              handleCopy(
                selectedMessage
              )
            }
          />
        ) : null}

        <ActionRow
          icon="remove-circle-outline"
          label="Unsend"
          danger
          onPress={() =>
            handleUnsend(
              selectedMessage
            )
          }
        />

        <ActionRow
          icon="trash-outline"
          label="Delete"
          danger
          onPress={() =>
            handleDelete(
              selectedMessage
            )
          }
        />

        <Pressable
          onPress={() =>
            setSelectedMessage(
              null
            )
          }
          style={
            styles.cancelAction
          }
        >
          <Text
            style={
              styles.cancelText
            }
          >
            Cancel
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
</KeyboardAvoidingView>

);
}

function ActionRow({
icon,
label,
danger = false,
onPress,
}) {
return ( <Pressable
   onPress={onPress}
   style={styles.action}
 >
<Ionicons
name={icon}
size={21}
color={
danger
? "#ED4956"
: "#111111"
}
style={
styles.actionIcon
}
/>

  <Text
    style={[
      styles.actionText,
      danger &&
        styles.dangerText,
    ]}
  >
    {label}
  </Text>
</Pressable>

);
}

function MessageBubble({
message,
currentUserId,
onLongPress,
}) {
const senderId =
getId(message?.sender) ||
message?.sender;

const isMine = sameId(
senderId,
currentUserId
);

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
> <Ionicons
         name="ban-outline"
         size={15}
         color="#999999"
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
<Pressable
onLongPress={() =>
onLongPress?.(message)
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
            : message.replyTo
                ?.text ||
              "Media message"}
        </Text>
      </View>
    ) : null}

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
                key={`${getMessageId(message) || "message"}-reaction-${index}`}
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
</Pressable>


);
}

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
type ===
"video"
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
      {type ===
      "video"
        ? "Video"
        : "Media"}
    </Text>
  </View>
);

}

return (
<Image
source={{
uri: message.mediaUrl,
}}
style={
styles.messageImage
}
resizeMode="cover"
/>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: "#FFFFFF",
},

loading: {
flex: 1,
alignItems: "center",
justifyContent: "center",
backgroundColor: "#FFFFFF",
},

header: {
minHeight: 62,
paddingHorizontal: 4,
flexDirection: "row",
alignItems: "center",
backgroundColor: "#FFFFFF",
borderBottomWidth:
StyleSheet.hairlineWidth,
borderBottomColor: "#DBDBDB",
},

backButton: {
width: 40,
height: 44,
alignItems: "center",
justifyContent: "center",
},

headerUser: {
flex: 1,
minWidth: 0,
marginRight: 2,
flexDirection: "row",
alignItems: "center",
},

headerAvatar: {
width: 38,
height: 38,
marginHorizontal: 7,
borderRadius: 19,
backgroundColor: "#EFEFEF",
},

headerAvatarFallback: {
width: 38,
height: 38,
marginHorizontal: 7,
borderRadius: 19,
alignItems: "center",
justifyContent: "center",
backgroundColor: "#EFEFEF",
},

headerAvatarLetter: {
fontSize: 15,
fontWeight: "700",
color: "#777777",
},

headerIdentity: {
flex: 1,
minWidth: 0,
justifyContent: "center",
},

nameRow: {
flexDirection: "row",
alignItems: "center",
minWidth: 0,
},

headerName: {
flexShrink: 1,
fontSize: 15,
lineHeight: 19,
fontWeight: "700",
color: "#111111",
},

headerUsername: {
marginTop: 1,
fontSize: 12,
lineHeight: 16,
color: "#777777",
},

headerIcon: {
width: 42,
height: 44,
alignItems: "center",
justifyContent: "center",
borderRadius: 21,
},

disabledIcon: {
opacity: 0.45,
},

searchResults: {
maxHeight: 260,
backgroundColor: "#FFFFFF",
borderBottomWidth:
StyleSheet.hairlineWidth,
borderBottomColor: "#DBDBDB",
},

searchResult: {
minHeight: 58,
paddingHorizontal: 15,
paddingVertical: 9,
flexDirection: "row",
alignItems: "center",
borderBottomWidth:
StyleSheet.hairlineWidth,
borderBottomColor: "#EEEEEE",
},

searchResultIcon: {
width: 34,
height: 34,
marginRight: 10,
borderRadius: 17,
alignItems: "center",
justifyContent: "center",
backgroundColor: "#F2F2F2",
},

searchResultContent: {
flex: 1,
minWidth: 0,
},

searchNameRow: {
flexDirection: "row",
alignItems: "center",
minWidth: 0,
},

searchResultUsername: {
flexShrink: 1,
fontSize: 13,
fontWeight: "700",
color: "#111111",
},

searchResultText: {
marginTop: 2,
fontSize: 13,
lineHeight: 18,
color: "#666666",
},

messages: {
flexGrow: 1,
paddingHorizontal: 12,
paddingTop: 14,
paddingBottom: 12,
},

emptyMessages: {
justifyContent: "flex-end",
},

messageRow: {
width: "100%",
marginVertical: 3,
},

myMessageRow: {
alignItems: "flex-end",
},

theirMessageRow: {
alignItems: "flex-start",
},

bubble: {
maxWidth: "82%",
paddingHorizontal: 14,
paddingVertical: 9,
borderRadius: 20,
},

myBubble: {
backgroundColor: "#0095F6",
borderBottomRightRadius: 5,
},

theirBubble: {
backgroundColor: "#EFEFEF",
borderBottomLeftRadius: 5,
},

voiceBubble: {
minWidth: 230,
paddingHorizontal: 9,
paddingVertical: 8,
},

messageText: {
fontSize: 15,
lineHeight: 20,
},

myMessageText: {
color: "#FFFFFF",
},

theirMessageText: {
color: "#111111",
},

replyReference: {
flexDirection: "row",
alignItems: "center",
minHeight: 26,
paddingLeft: 8,
marginBottom: 7,
borderLeftWidth: 3,
},

myReplyReference: {
borderLeftColor: "#FFFFFF",
},

theirReplyReference: {
borderLeftColor: "#777777",
},

replyReferenceText: {
flex: 1,
marginLeft: 5,
fontSize: 12,
lineHeight: 16,
},

myReplyText: {
color: "#FFFFFF",
},

theirReplyText: {
color: "#666666",
},

reactions: {
alignSelf: "flex-start",
flexDirection: "row",
alignItems: "center",
marginTop: 5,
paddingHorizontal: 5,
paddingVertical: 2,
borderRadius: 10,
backgroundColor:
"rgba(255,255,255,0.92)",
},

reaction: {
marginHorizontal: 1,
fontSize: 14,
},

messageImage: {
width: 220,
height: 220,
borderRadius: 14,
backgroundColor: "#EDEDED",
},

mediaPlaceholder: {
minWidth: 100,
minHeight: 48,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
},

mediaPlaceholderText: {
marginLeft: 7,
fontSize: 14,
fontWeight: "600",
},

deletedBubble: {
maxWidth: "78%",
minHeight: 38,
paddingHorizontal: 14,
paddingVertical: 9,
flexDirection: "row",
alignItems: "center",
borderRadius: 18,
backgroundColor: "#F3F3F3",
},

deletedText: {
marginLeft: 6,
fontSize: 14,
fontStyle: "italic",
color: "#999999",
},

typingContainer: {
paddingHorizontal: 17,
paddingVertical: 4,
backgroundColor: "#FFFFFF",
},

typingText: {
fontSize: 12,
lineHeight: 17,
fontStyle: "italic",
color: "#888888",
},

replyComposer: {
minHeight: 52,
paddingHorizontal: 12,
paddingVertical: 7,
flexDirection: "row",
alignItems: "center",
backgroundColor: "#F8F8F8",
borderTopWidth:
StyleSheet.hairlineWidth,
borderTopColor: "#DBDBDB",
},

replyAccent: {
width: 3,
height: 34,
marginRight: 9,
borderRadius: 2,
backgroundColor: "#0095F6",
},

replyContent: {
flex: 1,
minWidth: 0,
},

replyTitle: {
fontSize: 11,
lineHeight: 15,
fontWeight: "800",
color: "#0095F6",
},

replyText: {
marginTop: 1,
fontSize: 12,
lineHeight: 17,
color: "#666666",
},

replyClose: {
width: 34,
height: 34,
alignItems: "center",
justifyContent: "center",
},

composer: {
minHeight: 61,
paddingHorizontal: 9,
paddingVertical: 8,
flexDirection: "row",
alignItems: "center",
backgroundColor: "#FFFFFF",
borderTopWidth:
StyleSheet.hairlineWidth,
borderTopColor: "#DBDBDB",
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
backgroundColor: "#F2F2F2",
color: "#111111",
fontSize: 15,
lineHeight: 20,
},

sendButton: {
width: 43,
height: 43,
alignItems: "center",
justifyContent: "center",
},

modalOverlay: {
flex: 1,
alignItems: "center",
justifyContent: "center",
paddingHorizontal: 20,
backgroundColor:
"rgba(0,0,0,0.45)",
},

actionBox: {
width: "100%",
maxWidth: 390,
overflow: "hidden",
borderRadius: 20,
backgroundColor: "#FFFFFF",
},

modalHandle: {
alignSelf: "center",
width: 38,
height: 4,
marginTop: 9,
marginBottom: 4,
borderRadius: 2,
backgroundColor: "#D8D8D8",
},

action: {
minHeight: 53,
paddingHorizontal: 20,
flexDirection: "row",
alignItems: "center",
borderBottomWidth:
StyleSheet.hairlineWidth,
borderBottomColor: "#EEEEEE",
},

actionIcon: {
width: 28,
marginRight: 11,
},

actionText: {
fontSize: 15,
fontWeight: "600",
color: "#111111",
},

dangerText: {
color: "#ED4956",
fontWeight: "700",
},

cancelAction: {
minHeight: 54,
alignItems: "center",
justifyContent: "center",
},

cancelText: {
fontSize: 15,
fontWeight: "600",
color: "#111111",
},
});
