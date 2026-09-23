import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "snapgram_token";

const API_URL = "https://snapgram-api-0rdz.onrender.com/api";

console.log("[API] BASE URL:", API_URL);

let memoryToken = null;

export function setApiToken(token) {
  memoryToken = token ? String(token) : null;

  if (__DEV__) {
    console.log(
      "[API] TOKEN SET:",
      memoryToken ? "YES" : "NO"
    );
  }
}

export function clearApiToken() {
  memoryToken = null;

  if (__DEV__) {
    console.log("[API] TOKEN CLEARED");
  }
}

export async function restoreApiToken() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    memoryToken = token || null;

    if (__DEV__) {
      console.log(
        "[API] TOKEN RESTORED:",
        memoryToken ? "YES" : "NO"
      );
    }

    return memoryToken;
  } catch (error) {
    console.error(
      "[API] TOKEN RESTORE ERROR:",
      error
    );

    memoryToken = null;

    return null;
  }
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,

  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    const isFormData =
      typeof FormData !== "undefined" &&
      config.data instanceof FormData;

    if (isFormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];

      if (__DEV__) {
        console.log("[API] MULTIPART REQUEST");
      }
    } else {
      
      config.headers["Content-Type"] =
        "application/json";
    }

    if (memoryToken) {
      config.headers.Authorization =
        `Bearer ${memoryToken}`;
    }

    if (__DEV__) {
      console.log(
        "[API]",
        config.method?.toUpperCase(),
        config.baseURL + config.url,
        isFormData
          ? "[MULTIPART]"
          : "[JSON]",
        memoryToken
          ? "[TOKEN ATTACHED]"
          : "[NO TOKEN]"
      );
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
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

      if (__DEV__) {
        console.error(
          "[API] TOKEN REJECTED - MEMORY TOKEN CLEARED"
        );
      }
    }

    if (__DEV__) {
      console.error(
        "[API ERROR]",
        config?.method?.toUpperCase(),
        config?.baseURL,
        config?.url,
        response?.status,
        response?.data?.message ||
          error?.message
      );
    }

    return Promise.reject(error);
  }
);

export default api;