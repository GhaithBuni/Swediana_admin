"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  MailCheck,
  Trash2,
  Pencil,
  X,
  Save,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ——— Types matching your MovingBooking schema ———
type YesNo = "JA" | "NEJ";
type HomeType = "lagenhet" | "Hus" | "forrad" | "kontor";
type Access = "stairs" | "elevator" | "large-elevator";

type Address = {
  postcode: string;
  homeType: HomeType;
  floor: string;
  access: Access;
  parkingDistance: number;
};

type PriceLine = { key: string; label: string; amount: number; meta?: string };
type PriceTotals = {
  movingBase: number;
  movingExtras: number;
  cleaningBaseAfterDiscount: number;
  cleaningExtras: number;
  grandTotal: number;
  currency?: "SEK";
};
type PriceDetails = { lines: PriceLine[]; totals: PriceTotals };

type MovingBooking = {
  _id: string;
  bookingNumber: number;
  size: number; // m² or m³
  from: Address;
  to: Address;

  packa: YesNo;
  packaKitchen: YesNo;
  montera: YesNo;
  flyttstad: YesNo;

  name: string;
  email: string;
  phone: string;
  pnr?: string;
  apartmentKeys?: string;
  whatToMove?: string;
  message?: string;

  date: string; // ISO (can include time)
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  moveType?: "typical" | "inspection";

  priceDetails?: PriceDetails;

  createdAt: string;
  updatedAt: string;
};

type EditState = {
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  email: string;
  phone: string;
  size: string; // keep as string for input
  status: MovingBooking["status"];

  movingBase: string;
  movingExtras: string;
  cleaningBaseAfterDiscount: string;
  cleaningExtras: string;
  grandTotal: string; // auto: movingBase + movingExtras + cleaningBaseAfterDiscount + cleaningExtras
};

// ——— Helpers ———
const accessLabel: Record<Access, string> = {
  stairs: "Trappa",
  elevator: "Hiss",
  "large-elevator": "Stor hiss",
};

const currency = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: "SEK",
      }).format(n)
    : "—";

function formatDateTimeSV(input?: string) {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(+d)) return "—";
  const date = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(d);
  const time = new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(d);
  return `${date} kl ${time}`;
}

function toInputYMD(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(+d)) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputHM(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(+d)) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Combine yyyy-mm-dd + HH:mm into ISO using local time (avoid TZ shift)
function combineLocalYmdHmToISO(ymd: string, hm: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = (hm || "00:00").split(":").map(Number);
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return local.toISOString();
}

const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

export default function MovingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [booking, setBooking] = useState<MovingBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"send" | "delete" | null>(null);
  const [error, setError] = useState<string>("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load booking
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = authStorage.getToken?.();
        if (!token) {
          setError("Ingen token hittades. Logga in igen.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/moving/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data?.message || "Kunde inte hämta bokningen.");
        else setBooking(data?.booking ?? data);
      } catch {
        setError("Nätverksfel. Försök igen.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Prepare edit state
  useEffect(() => {
    if (!booking) return;

    const t = booking.priceDetails?.totals;
    const movingBase = t?.movingBase ?? 0;
    const movingExtras = t?.movingExtras ?? 0;
    const cleaningBaseAfterDiscount = t?.cleaningBaseAfterDiscount ?? 0;
    const cleaningExtras = t?.cleaningExtras ?? 0;
    const grandTotal =
      t?.grandTotal ??
      movingBase + movingExtras + cleaningBaseAfterDiscount + cleaningExtras;

    setEdit({
      date: toInputYMD(booking.date),
      time: booking.time || "08:00",
      email: booking.email || "",
      phone: booking.phone || "",
      size: String(booking.size ?? ""),
      status: booking.status,
      movingBase: String(movingBase),
      movingExtras: String(movingExtras),
      cleaningBaseAfterDiscount: String(cleaningBaseAfterDiscount),
      cleaningExtras: String(cleaningExtras),
      grandTotal: String(grandTotal),
    });
    setFieldErrors({});
  }, [booking]);

  // Live-calc grand total
  function onTotalsChange<K extends keyof EditState>(key: K, val: string) {
    if (!edit) return;
    const next = { ...edit, [key]: val };
    const mb = parseFloat(next.movingBase || "0") || 0;
    const me = parseFloat(next.movingExtras || "0") || 0;
    const cb = parseFloat(next.cleaningBaseAfterDiscount || "0") || 0;
    const ce = parseFloat(next.cleaningExtras || "0") || 0;
    next.grandTotal = String(mb + me + cb + ce);
    setEdit(next);
  }

  function resetEditFromBooking() {
    if (!booking) return;

    const t = booking.priceDetails?.totals;
    const movingBase = t?.movingBase ?? 0;
    const movingExtras = t?.movingExtras ?? 0;
    const cleaningBaseAfterDiscount = t?.cleaningBaseAfterDiscount ?? 0;
    const cleaningExtras = t?.cleaningExtras ?? 0;
    const grandTotal =
      t?.grandTotal ??
      movingBase + movingExtras + cleaningBaseAfterDiscount + cleaningExtras;

    setEdit({
      date: toInputYMD(booking.date),
      time: toInputHM(booking.date) || "08:00",
      email: booking.email || "",
      phone: booking.phone || "",
      size: String(booking.size ?? ""),
      status: booking.status,
      movingBase: String(movingBase),
      movingExtras: String(movingExtras),
      cleaningBaseAfterDiscount: String(cleaningBaseAfterDiscount),
      cleaningExtras: String(cleaningExtras),
      grandTotal: String(grandTotal),
    });
    setFieldErrors({});
  }

  function validate(): boolean {
    if (!edit) return false;
    const errs: Record<string, string> = {};
    if (!edit.date) errs.date = "Välj datum";
    if (!edit.time) errs.time = "Välj tid";
    if (!edit.email || !isEmail(edit.email)) errs.email = "Ogiltig e-post";
    if (!edit.phone) errs.phone = "Ange telefon";
    const sizeNum = parseFloat(edit.size);
    if (Number.isNaN(sizeNum) || sizeNum <= 0) errs.size = "Ogiltig yta";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSave() {
    if (!booking || !edit) return;
    if (!validate()) return;

    setSaving(true);
    setError("");

    try {
      const token = authStorage.getToken?.();

      const isoDate = combineLocalYmdHmToISO(edit.date, edit.time);

      const payload = {
        date: isoDate, // Moving schema stores Date (incl time)
        time: edit.time,
        email: edit.email.trim().toLowerCase(),
        phone: edit.phone.trim(),
        size: parseFloat(edit.size) || 0,
        status: edit.status,
        priceDetails: {
          lines: booking.priceDetails?.lines ?? [],
          totals: {
            movingBase: parseFloat(edit.movingBase || "0") || 0,
            movingExtras: parseFloat(edit.movingExtras || "0") || 0,
            cleaningBaseAfterDiscount:
              parseFloat(edit.cleaningBaseAfterDiscount || "0") || 0,
            cleaningExtras: parseFloat(edit.cleaningExtras || "0") || 0,
            grandTotal: parseFloat(edit.grandTotal || "0") || 0,
            currency: "SEK",
          } as PriceTotals,
        } as PriceDetails,
      };

      const res = await fetch(`${API_URL}/moving/${booking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Uppdatering misslyckades");

      const updated: MovingBooking = data?.booking ?? data;
      setBooking(updated);
      resetEditFromBooking();
      setEditing(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunde inte spara ändringarna."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSendConfirmation() {
    if (!booking) return;
    setActing("send");
    setError("");
    try {
      const token = authStorage.getToken?.();
      const res = await fetch(
        `${API_URL}/moving/send-confirmation/${booking._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Send confirmation failed");
      }
    } catch {
      setError("Kunde inte skicka bekräftelsen.");
    } finally {
      setActing(null);
    }
  }

  async function onDelete() {
    if (!booking) return;
    setActing("delete");
    setError("");
    try {
      const token = authStorage.getToken?.();
      const res = await fetch(`${API_URL}/moving/${booking._id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Delete failed");
      }
      router.push("/admin/moving");
    } catch {
      setError("Kunde inte radera bokningen.");
      setActing(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visar bokning…</CardTitle>
          <CardDescription>Flytt</CardDescription>
        </CardHeader>
        <CardContent className="py-10 grid place-items-center">
          <Loader2 className="size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bokning saknas</CardTitle>
          <CardDescription>{error || "Ingen data."}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" /> Tillbaka
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate">
            Bokning #{booking.bookingNumber} – {booking.name}
          </CardTitle>
          <CardDescription className="truncate">
            Flytt • {formatDateTimeSV(booking.date)}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              booking.status === "confirmed"
                ? "default"
                : booking.status === "cancelled"
                ? "destructive"
                : "secondary"
            }
          >
            {booking.status}
          </Badge>

          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 size-4" />
              Redigera
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  resetEditFromBooking();
                  setEditing(false);
                }}
              >
                <X className="mr-2 size-4" />
                Avbryt
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Sparar…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" /> Spara
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {error && (
          <div className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Datum & tid</p>
            <p className="font-medium">{formatDateTimeSV(booking.date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kund</p>
            <p className="font-medium">{booking.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">E-post</p>
            <p className="font-medium">{booking.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Telefon</p>
            <p className="font-medium">{booking.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Personnummer</p>
            <p className="font-medium">{booking.pnr || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Storlek</p>
            <p className="font-medium">{booking.size} m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nycklar</p>
            <p className="font-medium">{booking.apartmentKeys || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vad som ska flyttas</p>
            <p className="font-medium">{booking.moveType || "—"}</p>
          </div>
        </section>

        {/* Editable section */}
        {editing && edit && (
          <>
            <Separator />
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Datum</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={edit.date}
                  onChange={(e) =>
                    setEdit((s) => (s ? { ...s, date: e.target.value } : s))
                  }
                />
                {fieldErrors.date && (
                  <p className="text-xs text-red-600">{fieldErrors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Tid</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={edit.time}
                  onChange={(e) =>
                    setEdit((s) => (s ? { ...s, time: e.target.value } : s))
                  }
                />
                {fieldErrors.time && (
                  <p className="text-xs text-red-600">{fieldErrors.time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">E-post</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={edit.email}
                  onChange={(e) =>
                    setEdit((s) => (s ? { ...s, email: e.target.value } : s))
                  }
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={edit.phone}
                  onChange={(e) =>
                    setEdit((s) => (s ? { ...s, phone: e.target.value } : s))
                  }
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-size">Storlek (m²)</Label>
                <Input
                  id="edit-size"
                  type="number"
                  min={1}
                  step="1"
                  value={edit.size}
                  onChange={(e) =>
                    setEdit((s) => (s ? { ...s, size: e.target.value } : s))
                  }
                />
                {fieldErrors.size && (
                  <p className="text-xs text-red-600">{fieldErrors.size}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={edit.status}
                  onChange={(e) =>
                    setEdit((s) =>
                      s
                        ? {
                            ...s,
                            status: e.target.value as MovingBooking["status"],
                          }
                        : s
                    )
                  }
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <Label htmlFor="mb">Flytt – Grundpris</Label>
                <Input
                  id="mb"
                  inputMode="decimal"
                  value={edit.movingBase}
                  onChange={(e) => onTotalsChange("movingBase", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="me">Flytt – Tillägg</Label>
                <Input
                  id="me"
                  inputMode="decimal"
                  value={edit.movingExtras}
                  onChange={(e) =>
                    onTotalsChange("movingExtras", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cb">Städ – Grundpris (efter rabatt)</Label>
                <Input
                  id="cb"
                  inputMode="decimal"
                  value={edit.cleaningBaseAfterDiscount}
                  onChange={(e) =>
                    onTotalsChange("cleaningBaseAfterDiscount", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce">Städ – Tillägg</Label>
                <Input
                  id="ce"
                  inputMode="decimal"
                  value={edit.cleaningExtras}
                  onChange={(e) =>
                    onTotalsChange("cleaningExtras", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gt">Totalt</Label>
                <Input
                  id="gt"
                  inputMode="decimal"
                  value={edit.grandTotal}
                  onChange={(e) => onTotalsChange("grandTotal", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Beräknas som Flytt (grund+extra) + Städ (grund+extra).
                </p>
              </div>
            </section>
          </>
        )}

        <Separator />

        {/* Addresses */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Från-adress</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Postnummer" value={booking.from?.postcode} />
              <Info label="Boendetyp" value={booking.from?.homeType} />
              <Info label="Våning" value={booking.from?.floor} />
              <Info
                label="Tillgång"
                value={
                  booking.from?.access ? accessLabel[booking.from.access] : "—"
                }
              />
              <Info
                label="Parkering"
                value={
                  typeof booking.from?.parkingDistance === "number"
                    ? `${booking.from.parkingDistance} m`
                    : "—"
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Till-adress</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Postnummer" value={booking.to?.postcode} />
              <Info label="Boendetyp" value={booking.to?.homeType} />
              <Info label="Våning" value={booking.to?.floor} />
              <Info
                label="Tillgång"
                value={
                  booking.to?.access ? accessLabel[booking.to.access] : "—"
                }
              />
              <Info
                label="Parkering"
                value={
                  typeof booking.to?.parkingDistance === "number"
                    ? `${booking.to.parkingDistance} m`
                    : "—"
                }
              />
            </div>
          </div>
        </section>

        {/* Extras */}
        <Separator />
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Packa" value={booking.packa} />
          <Info label="Packa kök" value={booking.packaKitchen} />
          <Info label="Montera" value={booking.montera} />
          <Info label="Flyttstäd" value={booking.flyttstad} />
        </section>

        {/* What to move / message */}
        {(booking.whatToMove || booking.message) && (
          <>
            <Separator />
            <section className="grid gap-6 md:grid-cols-2">
              {booking.whatToMove && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Vad ska flyttas
                  </p>
                  <p className="font-medium whitespace-pre-wrap">
                    {booking.whatToMove}
                  </p>
                </div>
              )}
              {booking.message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Meddelande
                  </p>
                  <p className="font-medium whitespace-pre-wrap">
                    {booking.message}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* Pricing */}
        {booking.priceDetails && (
          <>
            <Separator />
            <section className="space-y-3">
              <p className="text-xs text-muted-foreground">Prisdetaljer</p>
              <div className="rounded-xl border">
                <div className="divide-y">
                  {(booking.priceDetails.lines || []).map((l) => (
                    <div
                      key={l.key}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.label}</p>
                        {l.meta && (
                          <p className="text-xs text-muted-foreground truncate">
                            {l.meta}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">{currency(l.amount)}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="px-4 py-3 space-y-1">
                  <Row
                    label="Flytt – Grundpris"
                    value={booking.priceDetails.totals?.movingBase}
                  />
                  <Row
                    label="Flytt – Tillägg"
                    value={booking.priceDetails.totals?.movingExtras}
                  />
                  <Row
                    label="Städ – Grundpris (efter rabatt)"
                    value={
                      booking.priceDetails.totals?.cleaningBaseAfterDiscount
                    }
                  />
                  <Row
                    label="Städ – Tillägg"
                    value={booking.priceDetails.totals?.cleaningExtras}
                  />
                  <div className="flex justify-between">
                    <span className="text-sm">Totalt</span>
                    <span className="font-semibold">
                      {currency(booking.priceDetails.totals?.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-between">
        <div className="text-xs text-muted-foreground">
          Skapad: {formatDateTimeSV(booking.createdAt)} • Uppdaterad:{" "}
          {formatDateTimeSV(booking.updatedAt)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" /> Tillbaka
          </Button>

          <Button
            variant="secondary"
            onClick={onSendConfirmation}
            disabled={acting === "send"}
          >
            {acting === "send" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Skickar…
              </>
            ) : (
              <>
                <MailCheck className="mr-2 size-4" /> Skicka bekräftelse
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={acting === "delete"}>
                <Trash2 className="mr-2 size-4" /> Radera
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Radera bokning?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta går inte att ångra. Bokningen tas bort permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ja, radera
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

// Small presentational helpers
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{currency(value)}</span>
    </div>
  );
}
