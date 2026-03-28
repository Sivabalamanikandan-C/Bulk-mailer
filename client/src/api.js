import axios from "axios";

// Smart base URL with fallback
const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || "https://bulkmailerbackend.onrender.com";
};

let currentBaseURL = getBaseURL();

// Test connection function
const testConnection = async (baseURL) => {
  try {
    await axios.get(`${baseURL}/`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

console.log("🔗 API using local backend: http://localhost:5000");

const API = axios.create({
  baseURL: currentBaseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add request interceptor to include token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with retry logic
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a network or 5xx server error, and we haven't already retried
    if (
      (error.code === 'ERR_NETWORK' || error.response?.status >= 500) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      console.log('🔄 Backend request failed. Retrying in 1 second...');

      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      return API(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default API;
