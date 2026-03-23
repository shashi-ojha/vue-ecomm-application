import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import router from "@/router";

export const http = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

// Attach auth token
http.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  
  return config;
});

// Refresh logic
let refreshing = false;
let queue: Array<() => void> = [];

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const auth = useAuthStore();
    
    const toast = useToastStore();
    const status = err?.response?.status;

    const original = err.config;

    
    if (status === 403) {
      toast.show("You don’t have permission to access this resource.", "error");
      router.push("/forbidden");
      return Promise.reject(err);
    }
    if (err.response?.status === 423) {
      toast.show(err.response.data.message, "error");
      return Promise.reject(err);
    }


    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
      } else {
        refreshing = true;
        try {
          const { data } = await axios.post(
            `${http.defaults.baseURL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          auth.setAccessToken(data.accessToken);

          queue.forEach((fn) => fn());
          queue = [];
        } catch (e) {
          auth.clearAuth();
          queue.forEach((fn) => fn());
          queue = [];
          throw e;
        } finally {
          refreshing = false;
        }
      }

      original._retry = true;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${auth.accessToken}`;
      return http.request(original);
    }

    return Promise.reject(err);
  }
);
