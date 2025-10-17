"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { authStorage } from "@/app/lib/auth";

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
import { Badge } from "@/components/ui/badge";
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

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Trash2, Plus } from "lucide-react";

type LockedDateRow = { ymd: string; createdAt?: string };

function normalizeRows(input: any): LockedDateRow[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x: any) => {
      if (typeof x === "string") return { ymd: x };
      if (x?.ymd) return { ymd: String(x.ymd), createdAt: x.createdAt };
      if (x?.date) return { ymd: String(x.date), createdAt: x.createdAt };
      return null;
    })
    .filter(Boolean) as LockedDateRow[];
}

const formatSV = (ymd?: string) => {
  if (!ymd) return "—";
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const ymdFromDate = (d: Date) => {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function LockedDatesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LockedDateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");

  // add state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const existingSet = useMemo(() => new Set(rows.map((r) => r.ymd)), [rows]);
  const selectedYmd = selected ? ymdFromDate(selected) : "";

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

        const res = await api.getLockedDatesMoving(token);
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          setError(data?.message || "Kunde inte hämta låsta datum.");
          setRows([]);
        } else {
          const list = normalizeRows(data);
          list.sort((a, b) => a.ymd.localeCompare(b.ymd));
          setRows(list);
        }
      } catch {
        setError("Nätverksfel. Försök igen.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onAdd() {
    if (!selectedYmd) {
      setError("Välj ett datum att låsa.");
      return;
    }
    if (existingSet.has(selectedYmd)) {
      setError("Datumet är redan låst.");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const token = authStorage.getToken?.();
      const res = await api.addLockedDateMoving(token!, selectedYmd);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Kunde inte låsa datumet.");
      }
      setRows((prev) => {
        const next = [...prev, { ymd: selectedYmd }];
        next.sort((a, b) => a.ymd.localeCompare(b.ymd));
        return next;
      });
      setSelected(undefined);
      setPickerOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte låsa datumet.");
    } finally {
      setAdding(false);
    }
  }

  async function onDelete(ymd: string) {
    setActing(ymd);
    setError("");
    try {
      const token = authStorage.getToken?.();
      const res = await api.deleteLockedDateMoving(token!, ymd);
      if (!res.ok) throw new Error(await res.text());
      setRows((prev) => prev.filter((r) => r.ymd !== ymd));
    } catch {
      setError("Kunde inte ta bort datumet.");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Låsta datum</CardTitle>
          <CardDescription>Hämtar…</CardDescription>
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
          <CardTitle>Låsta datum</CardTitle>
          <CardDescription>
            Visa, lägg till och ta bort låsta dagar för bokning.
          </CardDescription>
        </div>
        <Badge variant="secondary">{rows.length} st</Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {/* Add section */}
        <div className="rounded-xl border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 shadow-sm hover:bg-accent/40"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selected ? formatSV(ymdFromDate(selected)) : "Välj datum"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-auto" align="start">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(d) => setSelected(d)}
                  weekStartsOn={1}
                  showOutsideDays
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedYmd && existingSet.has(selectedYmd) && (
              <span className="text-xs text-muted-foreground">Redan låst</span>
            )}
          </div>

          <Button
            onClick={onAdd}
            disabled={adding || !selected || existingSet.has(selectedYmd)}
          >
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lägger till…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Lås valt datum
              </>
            )}
          </Button>
        </div>

        {/* List */}
        {rows.length === 0 ? (
          <div className="text-muted-foreground">
            Inga låsta datum hittades.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Skapad</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const disabled = acting === r.ymd;
                  return (
                    <TableRow key={r.ymd}>
                      <TableCell className="font-medium">
                        {formatSV(r.ymd)}
                      </TableCell>
                      <TableCell>
                        {r.createdAt
                          ? new Intl.DateTimeFormat("sv-SE", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(r.createdAt))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={disabled}
                            >
                              {disabled ? (
                                <Loader2 className="mr-1.5 size-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1.5 size-4" />
                              )}
                              Ta bort
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Ta bort låst datum?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Detta går inte att ångra. Datumet{" "}
                                {formatSV(r.ymd)} blir bokningsbart igen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(r.ymd)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Ja, ta bort
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
