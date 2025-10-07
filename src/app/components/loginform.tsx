"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { authStorage } from "@/app/lib/auth";
// If you already have this, keep your path:
import { api } from "@/app/lib/api"; // api.login(username, password) -> fetch Response

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login(username, password);
      const data = await res.json();

      if (res.ok) {
        authStorage.setToken(data.token);
        router.push("/dashboard");
      } else {
        setError(data.message || data);
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-2">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="size-5" />
        </div>
        <CardTitle>Admin login</CardTitle>
        <CardDescription>Sign in to view your dashboard.</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="admin"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 inline-flex items-center"
                disabled={loading}
              >
                {showPwd ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Trouble logging in? Check your username & password or try again later.
        </p>
      </CardFooter>
    </Card>
  );
}
