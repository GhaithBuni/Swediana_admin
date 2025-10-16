"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type DiscountPayload } from "@/app/lib/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Trash2, Plus } from "lucide-react";

type Discount = {
  _id?: string;
  id?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  minPurchaseAmount?: number;
  applicableServices?: string[];
  createdAt?: string;
  updatedAt?: string;
  uses?: number; // if backend tracks it
};

function normalizeList(input: any): Discount[] {
  const arr = Array.isArray(input)
    ? input
    : Array.isArray(input?.data)
    ? input.data
    : Array.isArray(input?.discounts)
    ? input.discounts
    : [];
  return arr as Discount[];
}

const niceDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(+d)) return s;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

export default function DiscountsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create form state
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<DiscountPayload>({
    code: "",
    type: "percentage",
    value: 0,
    isActive: true,
    validFrom: "",
    validUntil: "",
    maxUses: undefined,
    minPurchaseAmount: undefined,
    applicableServices: ["cleaning"],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const existingCodes = useMemo(
    () => new Set(rows.map((r) => r.code.toLowerCase())),
    [rows]
  );

  // Load
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
        const res = await api.getDiscounts(token);
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          setError(data?.message || "Kunde inte hämta rabattkoder.");
          setRows([]);
        } else {
          const list = normalizeList(data);
          list.sort((a, b) => a.code.localeCompare(b.code));
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

  // Validation
  function validate(): boolean {
    const e: Record<string, string> = {};
    const v = form;

    if (!v.code.trim()) e.code = "Ange kod.";
    if (existingCodes.has(v.code.trim().toLowerCase()))
      e.code = "Koden finns redan.";
    if (!v.type) e.type = "Välj typ.";
    if (v.value === undefined || v.value === null || isNaN(v.value))
      e.value = "Ange belopp.";
    if (v.type === "percentage" && (v.value <= 0 || v.value > 100))
      e.value = "Procent ska vara 1–100.";
    if (v.type === "fixed" && v.value <= 0) e.value = "Belopp måste vara > 0.";

    if (v.validFrom && isNaN(+new Date(v.validFrom)))
      e.validFrom = "Ogiltigt datum.";
    if (v.validUntil && isNaN(+new Date(v.validUntil)))
      e.validUntil = "Ogiltigt datum.";
    if (
      v.validFrom &&
      v.validUntil &&
      new Date(v.validUntil) < new Date(v.validFrom)
    ) {
      e.validUntil = "Slutdatum före startdatum.";
    }
    if (v.maxUses !== undefined && v.maxUses! < 0)
      e.maxUses = "Måste vara ≥ 0.";
    if (v.minPurchaseAmount !== undefined && v.minPurchaseAmount! < 0)
      e.minPurchaseAmount = "Måste vara ≥ 0.";
    if (!v.applicableServices || v.applicableServices.length === 0)
      e.applicableServices = "Välj minst en tjänst.";

    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onCreate() {
    if (!validate()) return;
    setCreating(true);
    setError("");

    try {
      const token = authStorage.getToken?.();
      const payload: DiscountPayload = {
        ...form,
        // send empty strings as undefined
        validFrom: form.validFrom ? form.validFrom : undefined,
        validUntil: form.validUntil ? form.validUntil : undefined,
      };
      const res = await api.createDiscount(token!, payload);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Kunde inte skapa rabattkod.");
      }

      const created: Discount = data?.discount ?? data;
      const normalizeCreated: Discount = created?.code
        ? created
        : { ...payload, code: payload.code, isActive: payload.isActive };

      setRows((prev) => {
        const next = [...prev, normalizeCreated];
        next.sort((a, b) => a.code.localeCompare(b.code));
        return next;
      });

      // reset form
      setForm({
        code: "",
        type: "percentage",
        value: 0,
        isActive: true,
        validFrom: "",
        validUntil: "",
        maxUses: undefined,
        minPurchaseAmount: undefined,
        applicableServices: ["cleaning"],
      });
      setFormErrors({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte skapa rabattkod.");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(d: Discount) {
    const idOrCode = d._id || d.id || d.code;
    if (!idOrCode) return;
    try {
      const token = authStorage.getToken?.();
      const res = await api.deleteDiscount(token!, idOrCode);
      if (!res.ok) throw new Error(await res.text());
      setRows((prev) => prev.filter((x) => x !== d));
    } catch {
      setError("Kunde inte ta bort rabattkoden.");
    }
  }

  // UI
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rabattkoder</CardTitle>
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
          <CardTitle>Rabattkoder</CardTitle>
          <CardDescription>Skapa och ta bort rabattkoder.</CardDescription>
        </div>
        <Badge variant="secondary">{rows.length} st</Badge>
      </CardHeader>

      <CardContent className="space-y-8">
        {error && (
          <div className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {/* Create form */}
        <div className="rounded-xl border p-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Kod *</Label>
            <Input
              id="code"
              placeholder="SUMMER2025"
              value={form.code}
              onChange={(e) =>
                setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))
              }
              className={formErrors.code ? "border-red-500" : ""}
            />
            {formErrors.code && (
              <p className="text-xs text-red-600">{formErrors.code}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Typ *</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    type: e.target.value as "percentage" | "fixed",
                  }))
                }
                className={`w-full border rounded-md px-3 py-2 bg-background ${
                  formErrors.type ? "border-red-500" : ""
                }`}
              >
                <option value="percentage">percentage</option>
                <option value="fixed">fixed</option>
              </select>
              {formErrors.type && (
                <p className="text-xs text-red-600">{formErrors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {form.type === "percentage" ? "Procent (%) *" : "Belopp *"}
              </Label>
              <Input
                id="value"
                type="number"
                min={form.type === "percentage" ? 1 : 1}
                max={form.type === "percentage" ? 100 : undefined}
                value={form.value}
                onChange={(e) =>
                  setForm((s) => ({ ...s, value: Number(e.target.value) }))
                }
                className={formErrors.value ? "border-red-500" : ""}
              />
              {formErrors.value && (
                <p className="text-xs text-red-600">{formErrors.value}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Gäller från</Label>
              <Input
                id="validFrom"
                type="date"
                value={form.validFrom}
                onChange={(e) =>
                  setForm((s) => ({ ...s, validFrom: e.target.value }))
                }
                className={formErrors.validFrom ? "border-red-500" : ""}
              />
              {formErrors.validFrom && (
                <p className="text-xs text-red-600">{formErrors.validFrom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Gäller till</Label>
              <Input
                id="validUntil"
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  setForm((s) => ({ ...s, validUntil: e.target.value }))
                }
                className={formErrors.validUntil ? "border-red-500" : ""}
              />
              {formErrors.validUntil && (
                <p className="text-xs text-red-600">{formErrors.validUntil}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max användningar</Label>
              <Input
                id="maxUses"
                type="number"
                min={0}
                value={form.maxUses ?? ""}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    maxUses:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
                className={formErrors.maxUses ? "border-red-500" : ""}
              />
              {formErrors.maxUses && (
                <p className="text-xs text-red-600">{formErrors.maxUses}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPurchaseAmount">Minsta orderbelopp</Label>
              <Input
                id="minPurchaseAmount"
                type="number"
                min={0}
                value={form.minPurchaseAmount ?? ""}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    minPurchaseAmount:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
                className={formErrors.minPurchaseAmount ? "border-red-500" : ""}
              />
              {formErrors.minPurchaseAmount && (
                <p className="text-xs text-red-600">
                  {formErrors.minPurchaseAmount}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tjänster *</Label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.applicableServices?.includes("cleaning")}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      applicableServices: toggleArr(
                        s.applicableServices ?? [],
                        "cleaning",
                        e.target.checked
                      ),
                    }))
                  }
                />
                Cleaning
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.applicableServices?.includes("moving")}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      applicableServices: toggleArr(
                        s.applicableServices ?? [],
                        "moving",
                        e.target.checked
                      ),
                    }))
                  }
                />
                Moving
              </label>

              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="isActive">Aktiv</Label>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, isActive: v }))
                  }
                />
              </div>
            </div>
            {formErrors.applicableServices && (
              <p className="text-xs text-red-600">
                {formErrors.applicableServices}
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Skapar…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Skapa rabatt
                </>
              )}
            </Button>
          </div>
        </div>

        {/* List table */}
        {rows.length === 0 ? (
          <div className="text-muted-foreground">
            Inga rabattkoder hittades.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Värde</TableHead>
                  <TableHead>Giltig</TableHead>
                  <TableHead>Aktiv</TableHead>
                  <TableHead>Tjänster</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d._id ?? d.id ?? d.code}>
                    <TableCell className="font-medium">{d.code}</TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>
                      {d.type === "percentage"
                        ? `${d.value}%`
                        : `${d.value} kr`}
                    </TableCell>
                    <TableCell>
                      {niceDate(d.validFrom)} – {niceDate(d.validUntil)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.isActive ? "default" : "secondary"}>
                        {d.isActive ? "aktiv" : "inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(d.applicableServices ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-1.5 size-4" />
                            Ta bort
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort rabatt?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Koden{" "}
                              <span className="font-medium">{d.code}</span>{" "}
                              raderas permanent.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(d)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Ja, ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function toggleArr<T>(arr: T[], value: T, checked: boolean) {
  const set = new Set(arr);
  if (checked) set.add(value);
  else set.delete(value);
  return Array.from(set);
}
