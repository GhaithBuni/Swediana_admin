// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res;
  },

  getBookings: async (token: string) => {
    const res = await fetch(`${API_URL}/moving`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  },

  getBookingsCleaning: async (token: string) => {
    const res = await fetch(`${API_URL}/cleaning`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  },
};
