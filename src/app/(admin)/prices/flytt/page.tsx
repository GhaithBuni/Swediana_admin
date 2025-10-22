"use client";

import { useEffect, useState } from "react";
import { api, type PriceDTO } from "@/app/lib/api";
import { authStorage } from "@/app/lib/auth";
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
  travelFee: string;
  fixedPrice: string;
  packagingAllRooms: string;
  packagingKitchen: string;
  mounting: string;
};

export default function PricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState<FormState>({
    pricePerKvm: "",
    travelFee: "",
    fixedPrice: "",
    packagingAllRooms: "",
    packagingKitchen: "",
    mounting: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = authStorage.getToken?.();
        if (!token) throw new Error("Ingen token. Logga in igen.");
        const res = await api.getPrice(token);
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.message || "Kunde inte hämta priser.");

        // Expecting one doc; normalize
        const doc = Array.isArray(data) ? data[0] : data?.data ?? data;
        const es =
          Array.isArray(doc?.extraServices) && doc.extraServices[0]
            ? doc.extraServices[0]
            : {};

        setForm({
          pricePerKvm: String(doc?.pricePerKvm ?? ""),
          travelFee: String(doc?.travelFee ?? ""),
          fixedPrice: String(doc?.fixedPrice ?? ""),
          packagingAllRooms: String(es?.packagingAllRooms ?? ""),
          packagingKitchen: String(es?.packagingKitchen ?? ""),
          mounting: String(es?.mounting ?? ""),
        });
      } catch (e: any) {
        setError(e?.message || "Fel vid laddning.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setField<K extends keyof FormState>(k: K, v: string) {
    setOk("");
    setError("");
    setForm((s) => ({ ...s, [k]: v }));
  }

  function toNum(s: string) {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");

    const payload: PriceDTO = {
      pricePerKvm: toNum(form.pricePerKvm),
      travelFee: toNum(form.travelFee),
      fixedPrice: toNum(form.fixedPrice),
      extraServices: [
        {
          packagingAllRooms: toNum(form.packagingAllRooms),
          packagingKitchen: toNum(form.packagingKitchen),
          mounting: toNum(form.mounting),
        },
      ],
    };

    // quick validation
    for (const [k, v] of Object.entries(payload)) {
      if (k === "extraServices") continue;
      if (!Number.isFinite(v as number)) {
        setError("Ange giltiga numeriska värden.");
        return;
      }
    }
    for (const [k, v] of Object.entries(payload.extraServices[0])) {
      if (!Number.isFinite(v)) {
        setError("Ange giltiga numeriska värden för tilläggstjänster.");
        return;
      }
    }

    setSaving(true);
    try {
      const token = authStorage.getToken?.();
      const res = await api.savePrice(token!, payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Kunde inte spara priser.");

      setOk("Priser uppdaterade.");
    } catch (e: any) {
      setError(e?.message || "Något gick fel vid sparande.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Prissättning</CardTitle>
        <CardDescription>
          Uppdatera grundpriser och tilläggstjänster.
        </CardDescription>
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

            <section className="grid gap-4 sm:grid-cols-3">
              <Field
                id="pricePerKvm"
                label="Pris per kvm"
                value={form.pricePerKvm}
                onChange={(v) => setField("pricePerKvm", v)}
              />
              <Field
                id="travelFee"
                label="Framkörningsavgift"
                value={form.travelFee}
                onChange={(v) => setField("travelFee", v)}
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
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  id="packagingAllRooms"
                  label="Packning – alla rum"
                  value={form.packagingAllRooms}
                  onChange={(v) => setField("packagingAllRooms", v)}
                />
                <Field
                  id="packagingKitchen"
                  label="Packning – kök"
                  value={form.packagingKitchen}
                  onChange={(v) => setField("packagingKitchen", v)}
                />
                <Field
                  id="mounting"
                  label="Montering"
                  value={form.mounting}
                  onChange={(v) => setField("mounting", v)}
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
