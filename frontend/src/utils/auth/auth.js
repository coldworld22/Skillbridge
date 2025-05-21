import axios from "./api";
import useAuthStore from "@/store/auth/authStore";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  res => res,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.get("/auth/refresh-token", { withCredentials: true });
        authStore.setToken(data.accessToken);
        processQueue(null, data.accessToken);

        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        authStore.logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
