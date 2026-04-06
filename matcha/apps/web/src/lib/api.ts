
import axios from "axios";

export const access_token = "token";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined" )
    if (localStorage.getItem('auth-storage')) {
      token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((request) => {
    if (error || !token) {
      request.reject(error);
      return;
    }
    request.resolve(token);
  });
  failedQueue = [];
};

const saveTokenToAuthStorage = (token: string) => {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("auth-storage");
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    parsed.state = parsed.state ?? {};
    parsed.state.token = token;
    localStorage.setItem("auth-storage", JSON.stringify(parsed));
  } catch {
    localStorage.removeItem("auth-storage");
  }
};

const clearAuthAndRedirectToLogin = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth-storage");
  localStorage.removeItem(access_token);
  const path = window.location.pathname;
  if (path !== "/login" && path !== "/register") {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = String(originalRequest?.url ?? "");
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status !== 401 || !originalRequest || isAuthRequest) {
      return Promise.reject(error);
    }

    if (isRefreshRequest) {
      clearAuthAndRedirectToLogin();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthAndRedirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await api.post("/auth/refresh-token", {});
      const newToken = refreshResponse?.data?.accessToken;

      if (!newToken) {
        throw new Error("Failed to refresh access token");
      }

      saveTokenToAuthStorage(newToken);
      processQueue(null, newToken);

      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${newToken}`,
      };

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
