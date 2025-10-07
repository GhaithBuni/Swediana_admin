// app/(dashboard)/admin/cleaning/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth";
import { api } from "@/app/lib/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, MailCheck, Eye } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type CleaningBooking = {
  _id: string;
  bookingNumber?: string;
  ref?: string;
  name?: string;
  customerName?: string;
  customer?: string;
  date?: string; // e.g. "2025-10-07"
  time?: string; // e.g. "14:30"
};

export default function CleaningPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<CleaningBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actingId, setActingId] = useState<string | null>(null);

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

        const res = await api.getBookingsCleaning(token);
        const data = await res.json().catch(() => ({}));
        console.log("Fetched cleaning bookings:", data);

        if (!res.ok) {
          setError(data?.message || "Kunde inte hämta bokningar.");
          setBookings([]);
        } else {
          // accept array or {data:[...]} or {bookings:[...]}
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.bookings)
            ? data.bookings
            : [];
          setBookings(list);
        }
      } catch {
        setError("Nätverksfel. Försök igen.");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = bookings.length;
  function formatDateOnly(input?: string) {
    if (!input) return "—";

    let d: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      // Avoid timezone shifts for plain dates
      const [y, m, day] = input.split("-").map(Number);
      d = new Date(Date.UTC(y, m - 1, day));
    } else {
      d = new Date(input); // ISO like "2025-10-16T00:00:00.000Z"
    }
    if (isNaN(+d)) return "—";

    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Europe/Stockholm",
    }).format(d);
  }

  const formatWhen = (b: CleaningBooking) => {
    // prefer explicit date, else fall back to startsAt
    if (b.date) return formatDateOnly(b.date);
    return "—";
  };
  const displayNumber = (b: CleaningBooking) =>
    b.bookingNumber ?? b.ref ?? b._id?.slice(-6).toUpperCase();

  const displayName = (b: CleaningBooking) =>
    b.name ?? b.customerName ?? b.customer ?? "—";

  async function onDelete(id: string) {
    setActingId(id);
    try {
      const token = authStorage.getToken?.();
      const res = await fetch(`${API_URL}/cleaning/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(await res.text());
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch {
      setError("Kunde inte radera bokningen.");
    } finally {
      setActingId(null);
    }
  }

  async function onSendConfirmation(id: string) {
    setActingId(id);
    try {
      const token = authStorage.getToken?.();
      const res = await fetch(`${API_URL}/cleaning/${id}/send-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      // Optionally toast success here
    } catch {
      setError("Kunde inte skicka bekräftelsen.");
    } finally {
      setActingId(null);
    }
  }

  function onViewDetails(id: string) {
    router.push(`/service/flyttstad/${id}`);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flyttstäd</CardTitle>
          <CardDescription>Hämtar bokningar…</CardDescription>
        </CardHeader>
        <CardContent className="py-10 grid place-items-center">
          <Loader2 className="size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <div>
          <CardTitle>Flyttstäd – Bokningar</CardTitle>
          <CardDescription>
            Översikt med bokningsnummer, namn och tid.
          </CardDescription>
        </div>
        <Badge variant="secondary">{total} st</Badge>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-muted-foreground">Inga bokningar hittades.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Bokningsnr</TableHead>
                  <TableHead>Namn</TableHead>
                  <TableHead>Datum & tid</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const id = b._id;
                  const disabled = actingId === id;

                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">
                        #{displayNumber(b)}
                      </TableCell>
                      <TableCell>{displayName(b)}</TableCell>
                      <TableCell>{formatWhen(b)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(id)}
                          disabled={disabled}
                        >
                          <Eye className="mr-1.5 size-4" />
                          Visa
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSendConfirmation(id)}
                          disabled={disabled}
                        >
                          {disabled ? (
                            <Loader2 className="mr-1.5 size-4 animate-spin" />
                          ) : (
                            <MailCheck className="mr-1.5 size-4" />
                          )}
                          Skicka bekräftelse
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={disabled}
                            >
                              <Trash2 className="mr-1.5 size-4" />
                              Radera
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Radera bokning?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Detta går inte att ångra. Bokningen tas bort
                                permanent.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Ja, radera
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
