import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "snapgram_token";

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const API_URL =
  typeof window !== "undefined"
    ? "https://snapgram-api-0rdz.onrender.com/api"
    : ENV_API_URL;

const baseURL = String(API_URL || "").trim();

if (!baseURL) {
  console.error("[API] ERROR: API URL is missing.");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("[API] PLATFORM:", typeof window !== "undefined" ? "WEB" : "NATIVE");
console.log("[API] BASE URL:", baseURL);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      const url = `${config.baseURL || ""}${config.url || ""}`;

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        "[API REQUEST]",
        config.method?.toUpperCase(),
        url
      );
      console.log("[API TOKEN EXISTS]", !!token);

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        console.log("[API AUTH HEADER] ATTACHED");
      } else {
        console.log("[API AUTH HEADER] NO TOKEN");
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "[API RESPONSE]",
      response.status,
      response.config?.url
    );

    return response;
  },
  (error) => {
    const config = error?.config;

    const url = `${config?.baseURL || ""}${config?.url || ""}`;

    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("[API ERROR]");
    console.error("METHOD:", config?.method?.toUpperCase());
    console.error("URL:", url);
    console.error("STATUS:", error?.response?.status);
    console.error(
      "MESSAGE:",
      error?.response?.data?.message ||
        error?.message ||
        "Unknown error"
    );
    console.error("CODE:", error?.code);
    console.error("NETWORK ERROR:", !error?.response);
    console.error("RESPONSE DATA:", error?.response?.data);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return Promise.reject(error);
  }
);

export { TOKEN_KEY };

export default api;