import { defineStore } from "pinia";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [] as Toast[]
  }),

  actions: {
    show(message: string, type: Toast["type"] = "success") {
      const id = Date.now();
      this.toasts.push({ id, message, type });

      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 2500);
    }
  }
});