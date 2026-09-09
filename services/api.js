import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token =
      await AsyncStorage.getItem("snapgram_token");

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );

    console.log(
      "TOKEN EXISTS:",
      !!token
    );

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

      console.log(
        "AUTH HEADER ATTACHED: YES"
      );
    } else {
      console.log(
        "AUTH HEADER ATTACHED: NO TOKEN"
      );
    }

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "API RESPONSE:",
      response.status,
      response.config?.url
    );

    return response;
  },

  (error) => {
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.error("API ERROR");

    console.error(
      "URL:",
      error.config?.url
    );

    console.error(
      "METHOD:",
      error.config?.method
    );

    console.error(
      "BASE URL:",
      error.config?.baseURL
    );

    console.error(
      "FULL URL:",
      `${error.config?.baseURL || ""}${error.config?.url || ""}`
    );

    console.error(
      "STATUS:",
      error.response?.status
    );

    console.error(
      "MESSAGE:",
      error.response?.data?.message ||
        error.message
    );

    console.error(
      "CODE:",
      error.code
    );

    console.error(
      "NETWORK ERROR:",
      !error.response
    );

    console.error(
      "RESPONSE DATA:",
      error.response?.data
    );

    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    return Promise.reject(error);
  }
);

export default api;