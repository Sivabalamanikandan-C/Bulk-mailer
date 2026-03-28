import axios from "axios";

const DEFAULT_API_URL = "https://bulkmailerbackend.onrender.com";
const RETRYABLE_METHODS = new Set(["get", "head", "options"]);

const normalizeBaseURL = (value) =>
  String(value || DEFAULT_API_URL)
    .trim()
    .replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseURL(import.meta.env.VITE_API_URL);

console.log(`API base URL: ${API_BASE_URL}`);

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestMethod = String(originalRequest.method || "get").toLowerCase();
    const shouldRetryMethod = RETRYABLE_METHODS.has(requestMethod);

    if (
      shouldRetryMethod &&
      (error.code === "ERR_NETWORK" || error.response?.status >= 500) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log("Backend request failed. Retrying in 1 second...");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return API(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default API;
