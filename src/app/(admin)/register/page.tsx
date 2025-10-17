"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

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
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  function validate() {
    const u = username.trim();
    if (!u) return "Ange ett användarnamn.";
    if (u.length < 3) return "Användarnamnet måste vara minst 3 tecken.";
    if (password.length < 6) return "Lösenordet måste vara minst 6 tecken.";
    if (password !== confirm) return "Lösenorden matchar inte.";
    return "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerAdmin(username.trim(), password);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // accept either {message} or plain string
        const msg =
          data?.message || data?.data || "Kunde inte registrera administratör.";
        setError(String(msg));
        return;
      }

      setOkMsg("Administratör skapad! Du kan nu logga in.");
      // simple redirect after a moment
      setTimeout(() => router.push("/login"), 900);
    } catch {
      setError("Nätverksfel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Registrera administratör
          </CardTitle>
          <CardDescription>
            Skapa ett admin-konto med användarnamn och lösenord.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="mb-4 text-sm rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700">
              {okMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Minst 6 tecken.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Bekräfta lösenord</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar…
                </>
              ) : (
                "Registrera"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Har du redan ett konto?&nbsp;
          <Link href="/login" className="underline underline-offset-4">
            Logga in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
