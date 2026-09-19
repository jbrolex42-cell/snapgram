import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "snapgram_token";

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const API_URL =
  typeof window !== "undefined"
    ? "https://snapgram-api-0rdz.onrender.com/api"
    : ENV_API_URL;

const baseURL = String(API_URL || "").trim();

if (!baseURL) {
  console.error("[API] ERROR: API URL is missing.");
}

console.log("[API] BASE URL:", baseURL);

let memoryToken = null;

export function setApiToken(token) {
  memoryToken = token ? String(token) : null;
}

export function clearApiToken() {
  memoryToken = null;
}

export async function restoreApiToken() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    memoryToken = token || null;

    return memoryToken;
  } catch (error) {
    console.error("[API] TOKEN RESTORE ERROR:", error);
    memoryToken = null;
    return null;
  }
}

const api = axios.create({
  baseURL,

  timeout: 15000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (memoryToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }

    if (__DEV__) {
      console.log(
        "[API]",
        config.method?.toUpperCase(),
        config.url
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        "[API RESPONSE]",
        response.status,
        response.config?.url
      );
    }

    return response;
  },

  async (error) => {
    const response = error?.response;
    const config = error?.config;

    if (response?.status === 401) {
      memoryToken = null;
    }

    if (__DEV__) {
      console.error(
        "[API ERROR]",
        config?.method?.toUpperCase(),
        config?.url,
        response?.status,
        response?.data?.message || error?.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;