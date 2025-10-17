"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Loader2, ArrowRight, Eye } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Status = "pending" | "confirmed" | "cancelled";

type MovingBooking = {
  _id: string;
  bookingNumber?: number;
  name?: string;
  email?: string;
  date?: string; // ISO
  status?: Status;
  createdAt?: string;
  service?: "moving";
};

type CleaningBooking = {
  _id: string;
  bookingNumber?: number;
  name?: string;
  email?: string;
  date?: string; // ISO or YYYY-MM-DD
  time?: string; // "HH:mm"
  status?: Status;
  createdAt?: string;
  service?: "cleaning";
};

type ByggBooking = {
  _id: string;
  bookingNumber?: number;
  name?: string;
  email?: string;
  date?: string; // ISO or YYYY-MM-DD
  status?: Status;
  createdAt?: string;
  service?: "bygg";
};

type AnyBooking = (MovingBooking | CleaningBooking | ByggBooking) & {
  service: "moving" | "cleaning" | "bygg";
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [moving, setMoving] = useState<MovingBooking[]>([]);
  const [cleaning, setCleaning] = useState<CleaningBooking[]>([]);
  const [bygg, setBygg] = useState<ByggBooking[]>([]);

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

        // Fetch all three in parallel
        const [resMoving, resCleaning, resBygg] = await Promise.all([
          fetch(`${API_URL}/moving`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${API_URL}/cleaning`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${API_URL}/bygg`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        const [dataMoving, dataCleaning, dataBygg] = await Promise.all([
          resMoving.json().catch(() => []),
          resCleaning.json().catch(() => []),
          resBygg.json().catch(() => []),
        ]);

        if (!resMoving.ok) {
          setError(
            (prev) =>
              prev || dataMoving?.message || "Kunde inte hämta flytt-bokningar."
          );
          setMoving([]);
        } else {
          setMoving(
            (Array.isArray(dataMoving)
              ? dataMoving
              : Array.isArray(dataMoving?.data)
              ? dataMoving.data
              : []) as MovingBooking[]
          );
        }

        if (!resCleaning.ok) {
          setError(
            (prev) =>
              prev ||
              dataCleaning?.message ||
              "Kunde inte hämta städ-bokningar."
          );
          setCleaning([]);
        } else {
          setCleaning(
            (Array.isArray(dataCleaning)
              ? dataCleaning
              : Array.isArray(dataCleaning?.data)
              ? dataCleaning.data
              : []) as CleaningBooking[]
          );
        }

        if (!resBygg.ok) {
          setError(
            (prev) =>
              prev ||
              dataBygg?.message ||
              "Kunde inte hämta byggstäd-bokningar."
          );
          setBygg([]);
        } else {
          setBygg(
            (Array.isArray(dataBygg)
              ? dataBygg
              : Array.isArray(dataBygg?.data)
              ? dataBygg.data
              : []) as ByggBooking[]
          );
        }
      } catch {
        setError("Nätverksfel. Försök igen.");
        setMoving([]);
        setCleaning([]);
        setBygg([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Merge + sort by createdAt desc, take last 10
  const recent: AnyBooking[] = useMemo(() => {
    const m = (moving || []).map((b) => ({ ...b, service: "moving" as const }));
    const c = (cleaning || []).map((b) => ({
      ...b,
      service: "cleaning" as const,
    }));
    const g = (bygg || []).map((b) => ({ ...b, service: "bygg" as const }));
    const merged = [...m, ...c, ...g];

    const ts = (d?: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    merged.sort((a, b) => ts(b.createdAt) - ts(a.createdAt)); // newest first
    return merged.slice(0, 10);
  }, [moving, cleaning, bygg]);

  // Stats
  const totalMoving = moving.length;
  const totalCleaning = cleaning.length;
  const totalBygg = bygg.length;

  const todayYMD = ymdFromDate(new Date());
  const countToday = [...moving, ...cleaning, ...bygg].filter(
    (b) => toYMD(b.date) === todayYMD
  ).length;

  const countUpcoming = [...moving, ...cleaning, ...bygg].filter((b) => {
    if (!b.date) return false;
    const time = new Date(b.date).getTime();
    return !isNaN(time) && time > Date.now();
  }).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Översikt</CardTitle>
          <CardDescription>Hämtar bokningar…</CardDescription>
        </CardHeader>
        <CardContent className="py-10 grid place-items-center">
          <Loader2 className="size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Totalt – Flytt" value={totalMoving} />
        <StatCard label="Totalt – Städ" value={totalCleaning} />
        <StatCard label="Totalt – Byggstäd" value={totalBygg} />
        <StatCard label="Idag" value={countToday} /> {/* ⬅️ NEW */}
        <StatCard label="Kommande" value={countUpcoming} />
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          title="Visa alla flyttbokningar"
          onClick={() => router.push("/service/flytthjalp")}
        />
        <QuickLink
          title="Visa alla flyttstäd-bokningar"
          onClick={() => router.push("/service/flyttstad")}
        />
        <QuickLink
          title="Visa alla byggstäd-bokningar"
          onClick={() => router.push("/service/byggstad")}
        />
      </section>

      {/* Recent table */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Senaste bokningar</CardTitle>
            <CardDescription>De senaste 10 oavsett tjänst.</CardDescription>
          </div>
          <Badge variant="secondary">{recent.length} st</Badge>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}

          {recent.length === 0 ? (
            <div className="text-muted-foreground">
              Inga bokningar hittades.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Bokningsnr</TableHead>
                    <TableHead>Tjänst</TableHead>
                    <TableHead>Kund</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skapad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((b) => {
                    const id = b._id;
                    const number =
                      b.bookingNumber ??
                      (b._id ? b._id.slice(-6).toUpperCase() : "—");
                    const name = b.name || "—";
                    const dateLabel = formatDateOnly(b.date);

                    const serviceLabel =
                      b.service === "moving"
                        ? "Flytt"
                        : b.service === "cleaning"
                        ? "Flyttstäd"
                        : "Byggstäd";

                    const viewHref =
                      b.service === "moving"
                        ? `/service/flytthjalp/${id}`
                        : b.service === "cleaning"
                        ? `/service/flyttstad/${id}`
                        : `/service/byggstad/${id}`;

                    return (
                      <TableRow key={`${b.service}-${id}`}>
                        <TableCell className="font-medium">#{number}</TableCell>
                        <TableCell>{serviceLabel}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{dateLabel}</TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell>
                          {b.createdAt
                            ? new Intl.DateTimeFormat("sv-SE", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Europe/Stockholm",
                              }).format(new Date(b.createdAt))
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(viewHref)}
                          >
                            <Eye className="mr-1.5 size-4" />
                            Visa
                          </Button>
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
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function QuickLink({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Gå till sidan</CardDescription>
        </div>
        <Button variant="outline" onClick={onClick}>
          Öppna <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status?: Status }) {
  if (!status) return <Badge variant="secondary">okänd</Badge>;
  const variant =
    status === "confirmed"
      ? "default"
      : status === "cancelled"
      ? "destructive"
      : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

/* ---------- Date helpers ---------- */

function toYMD(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(+d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymdFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateOnly(input?: string) {
  if (!input) return "—";
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-").map(Number);
    date = new Date(Date.UTC(y, m - 1, d));
  } else {
    date = new Date(input);
  }
  if (isNaN(+date)) return "—";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(date);
}
