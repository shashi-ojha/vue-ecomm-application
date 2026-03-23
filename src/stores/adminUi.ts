import { defineStore } from "pinia";

export const useAdminUiStore = defineStore("adminUi", {
  state: () => ({
    collapsed: JSON.parse(localStorage.getItem("admin.sidebar.collapsed") || "false") as boolean,
    mobileOpen: false
  }),
  actions: {
    toggle() {
      this.collapsed = !this.collapsed;
      localStorage.setItem("admin.sidebar.collapsed", JSON.stringify(this.collapsed));
    },
    openMobile() { this.mobileOpen = true; },
    closeMobile() { this.mobileOpen = false; }
  }
});