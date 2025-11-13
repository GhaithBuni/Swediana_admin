// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const base = (p: string) => `${API_URL}${p.startsWith("/") ? "" : "/"}${p}`;

export type DiscountPayload = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  validFrom?: string; // "YYYY-MM-DD"
  validUntil?: string; // "YYYY-MM-DD"
  maxUses?: number;
  minPurchaseAmount?: number;
  applicableServices?: ("cleaning" | "moving")[];
};

export type ExtraServicesDTO = {
  packagingAllRooms: number;
  packagingKitchen: number;
  mounting: number;
};

export type PriceDTO = {
  pricePerKvm: number;
  travelFee: number;
  fixedPrice: number;
  // we treat pricing as a single profile; backend still accepts an array
  extraServices: ExtraServicesDTO[];
};

export type CleanExtraServicesDTO = {
  Persinner: number;
  ExtraBadrum: number;
  ExtraToalett: number;
  inglassadDusch: number;
};

export type CleanPriceDTO = {
  pricePerKvm: number;
  fixedPrice: number;
  extraServices: CleanExtraServicesDTO[]; // we’ll use index 0
};

export const api = {
  login: (username: string, password: string) =>
    fetch(base("/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  getBookings: (token: string) =>
    fetch(base("/moving"), { headers: { Authorization: `Bearer ${token}` } }),

  getPrice: (token: string) =>
    fetch(base("/prices"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  getCleanPrice: (token: string) =>
    fetch(base("/prices/clean"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),

  savePrice: (token: string, payload: PriceDTO) =>
    fetch(base("/prices"), {
      method: "PATCH", // idempotent update
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),
  saveCleanPrice: (token: string, payload: CleanPriceDTO) =>
    fetch(base("/prices/clean"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),

  getBookingsCleaning: (token: string) =>
    fetch(base("/cleaning"), { headers: { Authorization: `Bearer ${token}` } }),
  getBookingsBygg: (token: string) =>
    fetch(base("/bygg"), { headers: { Authorization: `Bearer ${token}` } }),
  getContacts: (token: string) =>
    fetch(base("/contact"), { headers: { Authorization: `Bearer ${token}` } }),
  deleteContact: (token: string, id: string) =>
    fetch(base(`/contact/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  // 🔒 Locked dates
  // If your backend returns plain strings from /cleaning/locked-dates, change the path here.
  getLockedDates: (token: string) =>
    fetch(base("/cleaning/locked-dates/all"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  getLockedDatesMoving: (token: string) =>
    fetch(base("/moving/locked-dates/all"), {
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
  addLockedDateMoving: (token: string, ymd: string) =>
    fetch(base("/moving/locked-dates"), {
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
  deleteLockedDateMoving: (token: string, ymd: string) =>
    fetch(base(`/moving/locked-dates/${ymd}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDiscounts: (token: string) =>
    fetch(base("/discount"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),

  createDiscount: (token: string, payload: DiscountPayload) =>
    fetch(base("/discount/create-discount"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),

  deleteDiscount: (token: string, idOrCode: string) =>
    fetch(base(`/discount/${encodeURIComponent(idOrCode)}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  registerAdmin: (username: string, password: string) =>
    fetch(base("/admin/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
};
