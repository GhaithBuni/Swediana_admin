// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const base = (p: string) => `${API_URL}${p.startsWith("/") ? "" : "/"}${p}`;

export const api = {
  login: (username: string, password: string) =>
    fetch(base("/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  getBookings: (token: string) =>
    fetch(base("/moving"), { headers: { Authorization: `Bearer ${token}` } }),

  getBookingsCleaning: (token: string) =>
    fetch(base("/cleaning"), { headers: { Authorization: `Bearer ${token}` } }),

  // 🔒 Locked dates
  // If your backend returns plain strings from /cleaning/locked-dates, change the path here.
  getLockedDates: (token: string) =>
    fetch(base("/cleaning/locked-dates/all"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),

  addLockedDate: (token: string, ymd: string) =>
    fetch(base("/cleaning/locked-dates"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: ymd }), // backend expects { date: "YYYY-MM-DD" }
    }),

  deleteLockedDate: (token: string, ymd: string) =>
    fetch(base(`/cleaning/locked-dates/${ymd}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};
