import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const isWeb = typeof window !== "undefined";
const BASE_URL = "https://schedule.stkkr.com/";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: isWeb,
  headers: {
    "Content-Type": "application/json",
  },
});

const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: isWeb,
  headers: {
    "Content-Type": "application/json",
  },
});

const getStoredToken = async () =>
  isWeb ? localStorage.getItem("token") : await AsyncStorage.getItem("token");

const decodeBase64Url = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const base64 =
    padded + "=".repeat((4 - (padded.length % 4)) % 4);
  if (isWeb && typeof atob === "function") {
    return atob(base64);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  throw new Error("No base64 decoder available");
};

const getTokenPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getTokenExpiryMs = (token) => {
  const payload = getTokenPayload(token);
  const exp = payload?.exp;
  if (!exp || typeof exp !== "number") return null;
  return exp * 1000;
};

const REFRESH_EARLY_MS = 30 * 1000;

const shouldRefreshSoon = (token) => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return false;
  return expiryMs - Date.now() <= REFRESH_EARLY_MS;
};

let tokenExpiryLogTimer = null;

const startTokenExpiryLogger = (token) => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return;

  if (tokenExpiryLogTimer) {
    clearInterval(tokenExpiryLogTimer);
  }

  const logRemaining = () => {
    const remainingMs = expiryMs - Date.now();
    const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
    console.log(`[token] expires in ${remainingSec}s`);
    if (remainingMs <= 0) {
      clearInterval(tokenExpiryLogTimer);
      tokenExpiryLogTimer = null;
    }
  };

  logRemaining();
  tokenExpiryLogTimer = setInterval(logRemaining, 30 * 1000);
};

const setStoredToken = async (token) => {
  if (isWeb) localStorage.setItem("token", token);
  else await AsyncStorage.setItem("token", token);
  startTokenExpiryLogger(token);
};

const clearStoredToken = async () => {
  if (isWeb) localStorage.removeItem("token");
  else await AsyncStorage.removeItem("token");
  if (tokenExpiryLogTimer) {
    clearInterval(tokenExpiryLogTimer);
    tokenExpiryLogTimer = null;
  }
};

const forceLogout = async () => {
  await clearStoredToken();
  if (isWeb && typeof window !== "undefined") {
    window.location.replace("/");
  }
};

const showErrorAlert = (message) => {
  if (!message) return;
  if (isWeb && typeof window !== "undefined") {
    window.alert(message);
    return;
  }
  Alert.alert("오류", message);
};

api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    const isReissueCall = String(config?.url || "").includes(
      "/auth/reissue-token"
    );

    if (token && !isReissueCall) {
      let finalToken = token;
      if (shouldRefreshSoon(token)) {
        finalToken = await refreshAccessToken();
      }
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${finalToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

const queueRefresh = (cb) => refreshQueue.push(cb);
const flushQueue = (token) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const reissueToken = async () => {
  const response = await authApi.post("/auth/reissue-token");
  return response?.data?.access_token;
};

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      queueRefresh((newToken) => {
        if (!newToken) return reject(new Error("Token refresh failed"));
        resolve(newToken);
      });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await reissueToken();
    if (!newToken) throw new Error("Token refresh failed");

    await setStoredToken(newToken);
    flushQueue(newToken);
    return newToken;
  } catch (refreshError) {
    flushQueue(null);
    await forceLogout();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error || {};
    const originalRequest = config || {};
    const errorCode = response?.data?.code;
    const status = response?.status;
    const msg = response?.data?.msg;

    if (status === 401 && errorCode === "REFRESH_TOKEN_EXPIRED") {
      await forceLogout();
      showErrorAlert(msg);
      return Promise.reject(error);
    }

    const tokenExpired =
      errorCode === "_TOKEN_EXPIRED" || errorCode === "TOKEN_EXPIRED";

    if (
      status === 401 &&
      tokenExpired &&
      !originalRequest._retry &&
      !String(originalRequest?.url || "").includes("/auth/reissue-token")
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        showErrorAlert(msg);
        return Promise.reject(refreshError);
      }
    }

    showErrorAlert(msg);
    return Promise.reject(error);
  }
);

export default api;
export { getStoredToken, setStoredToken, getTokenPayload, getTokenExpiryMs };
