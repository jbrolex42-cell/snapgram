import api from "./api";

export async function translateText({
  text,
  targetLanguage,
  sourceLanguage,
}) {
  if (!text || !text.trim()) {
    return null;
  }

  if (!targetLanguage) {
    throw new Error("Target language is required");
  }

  const response = await api.post("/translation", {
    text: text.trim(),
    targetLanguage,
    sourceLanguage:
      sourceLanguage || undefined,
  });

  return (
    response.data?.translation || null
  );
}

export async function translateCaption({
  text,
  targetLanguage,
  sourceLanguage,
}) {
  return translateText({
    text,
    targetLanguage,
    sourceLanguage,
  });
}

export async function translateComment({
  text,
  targetLanguage,
  sourceLanguage,
}) {
  return translateText({
    text,
    targetLanguage,
    sourceLanguage,
  });
}