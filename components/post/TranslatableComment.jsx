import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { translateComment } from "../../services/translationApi";

function normalizeLanguage(language) {
  if (!language) {
    return "en";
  }

  const value = String(language)
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  const aliases = {
    english: "en",
    en: "en",

    swahili: "sw",
    kiswahili: "sw",
    sw: "sw",

    french: "fr",
    français: "fr",
    fr: "fr",

    spanish: "es",
    español: "es",
    es: "es",

    german: "de",
    deutsch: "de",
    de: "de",

    portuguese: "pt",
    português: "pt",
    pt: "pt",

    italian: "it",
    italiano: "it",
    it: "it",

    arabic: "ar",
    العربية: "ar",
    ar: "ar",

    hindi: "hi",
    हिन्दी: "hi",
    hi: "hi",

    chinese: "zh-CN",
    中文: "zh-CN",
    zh: "zh-CN",
    "zh-cn": "zh-CN",

    japanese: "ja",
    日本語: "ja",
    ja: "ja",

    korean: "ko",
    한국어: "ko",
    ko: "ko",

    russian: "ru",
    русский: "ru",
    ru: "ru",

    dutch: "nl",
    nederlands: "nl",
    nl: "nl",

    turkish: "tr",
    türkçe: "tr",
    tr: "tr",
  };

  return aliases[value] || value;
}

export default function TranslatableComment({
  text,
  targetLanguage = "en",
  sourceLanguage = null,
  style,
}) {
  const [translatedText, setTranslatedText] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  const normalizedTarget = useMemo(
    () => normalizeLanguage(targetLanguage),
    [targetLanguage]
  );

  const normalizedSource = useMemo(
    () =>
      sourceLanguage
        ? normalizeLanguage(sourceLanguage)
        : null,
    [sourceLanguage]
  );

  const cleanText = useMemo(
    () => (typeof text === "string" ? text.trim() : ""),
    [text]
  );

  useEffect(() => {
    requestIdRef.current += 1;

    setTranslatedText(null);
    setDetectedLanguage(null);
    setShowTranslated(false);
    setLoading(false);
    setError("");
  }, [cleanText, normalizedTarget]);

  const handleTranslate = useCallback(async () => {
    if (!cleanText) {
      return;
    }

    if (translatedText) {
      setShowTranslated((current) => !current);
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const result = await translateComment({
        text: cleanText,
        targetLanguage: normalizedTarget,
        sourceLanguage: normalizedSource || undefined,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const translated =
        typeof result?.translatedText === "string"
          ? result.translatedText.trim()
          : "";

      if (!translated) {
        throw new Error(
          "No translation was returned."
        );
      }

      setTranslatedText(translated);

      setDetectedLanguage(
        result?.detectedSourceLanguage ||
          normalizedSource ||
          null
      );

      setShowTranslated(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        "COMMENT TRANSLATION ERROR:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Translation failed.";

      setError(message);
      setShowTranslated(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    cleanText,
    normalizedTarget,
    normalizedSource,
    translatedText,
  ]);

  if (!cleanText) {
    return null;
  }

  const sameLanguage =
    detectedLanguage &&
    normalizeLanguage(detectedLanguage) ===
      normalizedTarget;

  const displayText =
    showTranslated && translatedText
      ? translatedText
      : cleanText;

  return (
    <View style={styles.container}>
      <Text style={style || styles.commentText}>
        {displayText}
      </Text>

      {!sameLanguage && (
        <Pressable
          onPress={handleTranslate}
          disabled={loading}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            showTranslated
              ? "See original comment"
              : "See comment translation"
          }
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
              />

              <Text style={styles.loadingText}>
                Translating...
              </Text>
            </View>
          ) : (
            <Text style={styles.translationButton}>
              {showTranslated
                ? "See original"
                : "See translation"}
            </Text>
          )}
        </Pressable>
      )}

      {!!error && !loading && (
        <Pressable
          onPress={handleTranslate}
          hitSlop={6}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry translation"
        >
          <Text style={styles.retryText}>
            Couldn't translate. Tap to retry.
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  commentText: {
    color: "#111111",
    fontSize: 14,
    lineHeight: 19,
  },

  button: {
    alignSelf: "flex-start",
    marginTop: 4,
  },

  buttonPressed: {
    opacity: 0.55,
  },

  translationButton: {
    color: "#737373",
    fontSize: 12,
    fontWeight: "600",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  loadingText: {
    marginLeft: 6,
    color: "#737373",
    fontSize: 12,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },

  retryText: {
    color: "#d00",
    fontSize: 12,
    fontWeight: "600",
  },
});