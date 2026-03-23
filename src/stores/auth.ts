import { defineStore } from "pinia";
import { http } from "@/api/http";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    accessToken: "" as string,
    initialized: false,
  }),

  getters: {
    // ✅ reactive in templates
    isLoggedIn: (s) => !!s.user && !!s.accessToken,
  },

  actions: {
    setAccessToken(t: string) { this.accessToken = t || ""; },

    async init() {
      try {
        const { data } = await http.post("/api/auth/refresh", {});
        this.setAccessToken(data.accessToken);
        await this.fetchMe();
      } catch {
        this.clearAuth();
      } finally {
        this.initialized = true;
      }
    },

    async fetchMe() {
      if (!this.accessToken) return;
      const { data } = await http.get("/api/auth/me");
      this.user = data.user;
    },

    async register(payload: { email: string; password: string; name?: string; rememberDevice?: boolean; }) {
      const { data } = await http.post("/api/auth/register", payload);
      this.setAccessToken(data.accessToken);
      this.user = data.user;
    },

    async login(payload: { email: string; password: string; rememberDevice?: boolean; }) {
      const { data } = await http.post("/api/auth/login", payload);
      this.setAccessToken(data.accessToken);
      this.user = data.user;
    },

    async logout() {
      try { await http.post("/api/auth/logout", {}); } catch (e) { console.error(e); }
      this.clearAuth(); // instantly updates header now
    },

    clearAuth() {
      this.user = null;
      this.accessToken = "";
    },
  },
});