import React, { memo } from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import VoiceMessageBubble from "./VoiceMessageBubble";

function MessageBubble({
  message,
  onLongPress,
  isMine = true,
}) {
  if (!message) {
    return null;
  }

  /**
   * ---------------------------------------------------------
   * UNSENT / DELETED MESSAGE
   * ---------------------------------------------------------
   */

  if (message.deleted) {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.deletedBubble,
          isMine
            ? styles.deletedMine
            : styles.deletedOther,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="ban-outline"
          size={15}
          color="#8E8E93"
        />

        <Text style={styles.deletedText}>
          Message unsent
        </Text>
      </Pressable>
    );
  }

  /**
   * ---------------------------------------------------------
   * VOICE MESSAGE
   * ---------------------------------------------------------
   */

  if (message.type === "voice") {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.voiceWrapper,
          isMine
            ? styles.alignRight
            : styles.alignLeft,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.voiceBubble,
            isMine
              ? styles.mineVoiceBubble
              : styles.otherVoiceBubble,
          ]}
        >
          {message.mediaUrl ? (
            <VoiceMessageBubble
              url={message.mediaUrl}
              duration={message.mediaDuration}
              isMine={isMine}
            />
          ) : (
            <View style={styles.voiceUnavailable}>
              <Ionicons
                name="mic-off-outline"
                size={20}
                color={
                  isMine
                    ? "#FFFFFF"
                    : "#8E8E93"
                }
              />

              <Text
                style={[
                  styles.voiceUnavailableText,
                  isMine
                    ? styles.mineText
                    : styles.otherText,
                ]}
              >
                Voice message unavailable
              </Text>
            </View>
          )}

          {message.text ? (
            <Text
              style={[
                styles.voiceCaption,
                isMine
                  ? styles.mineText
                  : styles.otherText,
              ]}
            >
              {message.text}
            </Text>
          ) : null}
        </View>

        <ReactionDisplay
          reactions={message.reactions}
          isMine={isMine}
        />
      </Pressable>
    );
  }

  /**
   * ---------------------------------------------------------
   * IMAGE MESSAGE
   * ---------------------------------------------------------
   */

  if (message.type === "image") {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.mediaWrapper,
          isMine
            ? styles.alignRight
            : styles.alignLeft,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.imageBubble}>
          {message.mediaUrl ? (
            <Image
              source={{
                uri: message.mediaUrl,
              }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mediaError}>
              <Ionicons
                name="image-outline"
                size={32}
                color="#8E8E93"
              />

              <Text style={styles.mediaErrorText}>
                Image unavailable
              </Text>
            </View>
          )}

          {message.text ? (
            <View
              style={[
                styles.captionContainer,
                isMine
                  ? styles.mineCaptionContainer
                  : styles.otherCaptionContainer,
              ]}
            >
              <Text
                style={[
                  styles.caption,
                  isMine
                    ? styles.mineText
                    : styles.otherText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}
        </View>

        <ReactionDisplay
          reactions={message.reactions}
          isMine={isMine}
        />
      </Pressable>
    );
  }

  /**
   * ---------------------------------------------------------
   * VIDEO MESSAGE
   * ---------------------------------------------------------
   */

  if (message.type === "video") {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.mediaWrapper,
          isMine
            ? styles.alignRight
            : styles.alignLeft,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.videoBubble}>
          <View style={styles.videoPlaceholder}>
            <View style={styles.videoPlayButton}>
              <Ionicons
                name="play"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.videoText}>
              Video
            </Text>
          </View>

          {message.text ? (
            <View
              style={[
                styles.captionContainer,
                isMine
                  ? styles.mineCaptionContainer
                  : styles.otherCaptionContainer,
              ]}
            >
              <Text
                style={[
                  styles.caption,
                  isMine
                    ? styles.mineText
                    : styles.otherText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}
        </View>

        <ReactionDisplay
          reactions={message.reactions}
          isMine={isMine}
        />
      </Pressable>
    );
  }

  /**
   * ---------------------------------------------------------
   * TEXT MESSAGE
   * ---------------------------------------------------------
   */

  return (
    <Pressable
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.textWrapper,
        isMine
          ? styles.alignRight
          : styles.alignLeft,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.textBubble,
          isMine
            ? styles.mineTextBubble
            : styles.otherTextBubble,
        ]}
      >
        {message.replyTo ? (
          <ReplyReference
            replyTo={message.replyTo}
            isMine={isMine}
          />
        ) : null}

        {message.text ? (
          <Text
            style={[
              styles.messageText,
              isMine
                ? styles.mineText
                : styles.otherText,
            ]}
          >
            {message.text}
          </Text>
        ) : (
          <Text
            style={[
              styles.emptyMessageText,
              isMine
                ? styles.mineText
                : styles.otherText,
            ]}
          >
            Message
          </Text>
        )}
      </View>

      <ReactionDisplay
        reactions={message.reactions}
        isMine={isMine}
      />
    </Pressable>
  );
}

/**
 * ---------------------------------------------------------
 * REPLY REFERENCE
 * ---------------------------------------------------------
 */

function ReplyReference({
  replyTo,
  isMine,
}) {
  const replyText =
    replyTo?.text ||
    getReplyMediaLabel(replyTo);

  return (
    <View
      style={[
        styles.replyReference,
        isMine
          ? styles.mineReplyReference
          : styles.otherReplyReference,
      ]}
    >
      <View style={styles.replyIconContainer}>
        <Ionicons
          name="return-down-forward-outline"
          size={14}
          color={
            isMine
              ? "rgba(255,255,255,0.85)"
              : "#8E8E93"
          }
        />
      </View>

      <Text
        style={[
          styles.replyReferenceText,
          isMine
            ? styles.mineReplyText
            : styles.otherReplyText,
        ]}
        numberOfLines={2}
      >
        {replyText}
      </Text>
    </View>
  );
}

/**
 * ---------------------------------------------------------
 * REACTIONS
 * ---------------------------------------------------------
 */

function ReactionDisplay({
  reactions,
  isMine,
}) {
  if (
    !Array.isArray(reactions) ||
    reactions.length === 0
  ) {
    return null;
  }

  const uniqueReactions = [];

  for (const reaction of reactions) {
    if (!reaction?.emoji) {
      continue;
    }

    const alreadyExists =
      uniqueReactions.some(
        (item) =>
          item.emoji === reaction.emoji
      );

    if (!alreadyExists) {
      uniqueReactions.push(reaction);
    }
  }

  if (uniqueReactions.length === 0) {
    return null;
  }

  const visibleReactions =
    uniqueReactions.slice(0, 4);

  const remainingCount =
    Math.max(
      0,
      uniqueReactions.length - 4
    );

  return (
    <View
      style={[
        styles.reactions,
        isMine
          ? styles.reactionsMine
          : styles.reactionsOther,
      ]}
    >
      {visibleReactions.map(
        (reaction, index) => (
          <Text
            key={`${reaction.emoji}-${index}`}
            style={styles.reaction}
          >
            {reaction.emoji}
          </Text>
        )
      )}

      {remainingCount > 0 ? (
        <Text style={styles.moreReactions}>
          +{remainingCount}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * ---------------------------------------------------------
 * REPLY MEDIA LABEL
 * ---------------------------------------------------------
 */

function getReplyMediaLabel(message) {
  if (!message) {
    return "Message";
  }

  switch (message.type) {
    case "image":
      return "Photo";

    case "video":
      return "Video";

    case "voice":
      return "Voice message";

    default:
      return "Message";
  }
}

/**
 * ---------------------------------------------------------
 * STYLES
 * ---------------------------------------------------------
 */

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.88,
  },

  alignRight: {
    alignSelf: "flex-end",
  },

  alignLeft: {
    alignSelf: "flex-start",
  },

  /**
   * TEXT
   */

  textWrapper: {
    position: "relative",
    maxWidth: "78%",
    marginVertical: 3,
    paddingBottom: 5,
  },

  textBubble: {
    minHeight: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    justifyContent: "center",
  },

  mineTextBubble: {
    backgroundColor: "#0095F6",
    borderBottomRightRadius: 6,
  },

  otherTextBubble: {
    backgroundColor: "#EFEFEF",
    borderBottomLeftRadius: 6,
  },

  messageText: {
    fontSize: 15.5,
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  emptyMessageText: {
    fontSize: 14,
    fontStyle: "italic",
  },

  mineText: {
    color: "#FFFFFF",
  },

  otherText: {
    color: "#111111",
  },

  /**
   * REPLY
   */

  replyReference: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 30,
    marginBottom: 7,
    paddingLeft: 7,
    paddingRight: 5,
    borderLeftWidth: 2,
  },

  mineReplyReference: {
    borderLeftColor:
      "rgba(255,255,255,0.85)",
  },

  otherReplyReference: {
    borderLeftColor: "#8E8E93",
  },

  replyIconContainer: {
    width: 20,
    marginRight: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  replyReferenceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },

  mineReplyText: {
    color: "rgba(255,255,255,0.82)",
  },

  otherReplyText: {
    color: "#777777",
  },

  /**
   * MEDIA
   */

  mediaWrapper: {
    position: "relative",
    width: 240,
    marginVertical: 4,
    paddingBottom: 5,
  },

  imageBubble: {
    width: 240,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
  },

  image: {
    width: 240,
    height: 300,
    backgroundColor: "#EFEFEF",
  },

  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  mineCaptionContainer: {
    backgroundColor: "#0095F6",
  },

  otherCaptionContainer: {
    backgroundColor: "#EFEFEF",
  },

  caption: {
    fontSize: 14.5,
    lineHeight: 19,
  },

  mediaError: {
    width: 240,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEFEF",
  },

  mediaErrorText: {
    marginTop: 8,
    color: "#8E8E93",
    fontSize: 13,
  },

  /**
   * VIDEO
   */

  videoBubble: {
    width: 240,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#111111",
  },

  videoPlaceholder: {
    width: 240,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },

  videoPlayButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.35)",
  },

  videoText: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  /**
   * VOICE
   */

  voiceWrapper: {
    position: "relative",
    maxWidth: "84%",
    marginVertical: 4,
    paddingBottom: 5,
  },

  voiceBubble: {
    minWidth: 210,
    maxWidth: 280,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
  },

  mineVoiceBubble: {
    backgroundColor: "#0095F6",
    borderBottomRightRadius: 6,
  },

  otherVoiceBubble: {
    backgroundColor: "#EFEFEF",
    borderBottomLeftRadius: 6,
  },

  voiceCaption: {
    marginTop: 6,
    paddingHorizontal: 3,
    fontSize: 14,
    lineHeight: 19,
  },

  voiceUnavailable: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
  },

  voiceUnavailableText: {
    marginLeft: 8,
    fontSize: 13,
  },

  /**
   * DELETED
   */

  deletedBubble: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "78%",
    marginVertical: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F7F7F7",
  },

  deletedMine: {
    alignSelf: "flex-end",
  },

  deletedOther: {
    alignSelf: "flex-start",
  },

  deletedText: {
    marginLeft: 7,
    color: "#8E8E93",
    fontSize: 14,
    fontStyle: "italic",
  },

  /**
   * REACTIONS
   */

  reactions: {
    position: "absolute",
    bottom: -4,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 25,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",

    elevation: 3,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.14,
    shadowRadius: 3,
  },

  reactionsMine: {
    right: 7,
  },

  reactionsOther: {
    left: 7,
  },

  reaction: {
    marginHorizontal: 1,
    fontSize: 15,
    lineHeight: 18,
  },

  moreReactions: {
    marginLeft: 2,
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default memo(MessageBubble);