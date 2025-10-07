// lib/auth.ts
export const authStorage = {
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_token", token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token");
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
  },

  isAuthenticated: (): boolean => {
    return !!authStorage.getToken();
  },
};
