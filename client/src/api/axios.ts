import axios from "axios";
import { store } from "../store";
import { logout } from "../store/slices/authSlice";
import { disconnectSocket } from "../lib/socket";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Seamless SPA Logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Direct Redux action trigger without hard page refresh
      store.dispatch(logout());
      disconnectSocket();
    }
    return Promise.reject(error);
  },
);