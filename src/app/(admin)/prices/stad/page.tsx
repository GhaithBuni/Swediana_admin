"use client";

import { useEffect, useState } from "react";
import { authStorage } from "@/app/lib/auth";
import { api, type CleanPriceDTO } from "@/app/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

type FormState = {
  pricePerKvm: string;
  fixedPrice: string;
  Persinner: string;
  ExtraBadrum: string;
  ExtraToalett: string;
  inglassadDusch: string;
};

export default function CleaningPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState<FormState>({
    pricePerKvm: "",
    fixedPrice: "",
    Persinner: "",
    ExtraBadrum: "",
    ExtraToalett: "",
    inglassadDusch: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = authStorage.getToken?.();
        if (!token) throw new Error("Ingen token. Logga in igen.");

        const res = await api.getCleanPrice(token);
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.message || "Kunde inte hämta städpriser.");

        const doc = Array.isArray(data) ? data[0] : data?.data ?? data;
        const es =
          Array.isArray(doc?.extraServices) && doc.extraServices[0]
            ? doc.extraServices[0]
            : {};

        setForm({
          pricePerKvm: String(doc?.pricePerKvm ?? ""),
          fixedPrice: String(doc?.fixedPrice ?? ""),
          Persinner: String(es?.Persinner ?? ""),
          ExtraBadrum: String(es?.ExtraBadrum ?? ""),
          ExtraToalett: String(es?.ExtraToalett ?? ""),
          inglassadDusch: String(es?.inglassadDusch ?? ""),
        });
      } catch (e: any) {
        setError(e?.message || "Fel vid laddning.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (k: keyof FormState, v: string) => {
    setOk("");
    setError("");
    setForm((s) => ({ ...s, [k]: v }));
  };

  const toNum = (s: string) => {
    const n = parseFloat((s ?? "").toString().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");

    const payload: CleanPriceDTO = {
      pricePerKvm: toNum(form.pricePerKvm),
      fixedPrice: toNum(form.fixedPrice),
      extraServices: [
        {
          Persinner: toNum(form.Persinner),
          ExtraBadrum: toNum(form.ExtraBadrum),
          ExtraToalett: toNum(form.ExtraToalett),
          inglassadDusch: toNum(form.inglassadDusch),
        },
      ],
    };

    // simple validation
    if (
      !Number.isFinite(payload.pricePerKvm) ||
      !Number.isFinite(payload.fixedPrice) ||
      !Number.isFinite(payload.extraServices[0].Persinner) ||
      !Number.isFinite(payload.extraServices[0].ExtraBadrum) ||
      !Number.isFinite(payload.extraServices[0].ExtraToalett) ||
      !Number.isFinite(payload.extraServices[0].inglassadDusch)
    ) {
      setError("Ange giltiga numeriska värden i alla fält.");
      return;
    }

    setSaving(true);
    try {
      const token = authStorage.getToken?.();
      const res = await api.saveCleanPrice(token!, payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Kunde inte spara städpriser.");

      setOk("Städpriser uppdaterade.");
    } catch (e: any) {
      setError(e?.message || "Något gick fel vid sparande.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Städ – Prissättning</CardTitle>
        <CardDescription>Uppdatera grund- och tilläggspriser.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 grid place-items-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={onSave} className="grid gap-6">
            {error && (
              <div className="text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                {error}
              </div>
            )}
            {ok && (
              <div className="text-sm rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                {ok}
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2">
              <Field
                id="pricePerKvm"
                label="Pris per kvm"
                value={form.pricePerKvm}
                onChange={(v) => setField("pricePerKvm", v)}
              />
              <Field
                id="fixedPrice"
                label="Fast pris"
                value={form.fixedPrice}
                onChange={(v) => setField("fixedPrice", v)}
              />
            </section>

            <section>
              <p className="text-sm font-medium mb-3">Tilläggstjänster</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  id="Persinner"
                  label="Persinner"
                  value={form.Persinner}
                  onChange={(v) => setField("Persinner", v)}
                />
                <Field
                  id="ExtraBadrum"
                  label="Extra badrum"
                  value={form.ExtraBadrum}
                  onChange={(v) => setField("ExtraBadrum", v)}
                />
                <Field
                  id="ExtraToalett"
                  label="Extra toalett"
                  value={form.ExtraToalett}
                  onChange={(v) => setField("ExtraToalett", v)}
                />
                <Field
                  id="inglassadDusch"
                  label="Inglassad dusch"
                  value={form.inglassadDusch}
                  onChange={(v) => setField("inglassadDusch", v)}
                />
              </div>
            </section>

            <CardFooter className="px-0">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sparar…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Spara
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  );
}
