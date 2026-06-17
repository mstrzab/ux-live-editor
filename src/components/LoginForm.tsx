"use client";

import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TelegramWidget from "@/components/TelegramWidget";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"telegram" | "email">("telegram");
  const router = useRouter();

  const handleTelegramAuth = useCallback(async (user: Record<string, string>) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Неверный email или пароль");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white">
            U
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Вход в UX Live Editor
          </h1>
          <p className="mt-1 text-sm text-muted">
            Редактор постов для Telegram
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="mb-4 flex rounded-xl bg-background p-1">
            <button
              onClick={() => setMode("telegram")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "telegram"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Telegram
            </button>
            <button
              onClick={() => setMode("email")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "email"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Email
            </button>
          </div>

          {mode === "telegram" ? (
            <div className="py-4">
              <p className="mb-4 text-center text-sm text-muted">
                Нажмите кнопку ниже для входа через Telegram
              </p>
              <TelegramWidget
                botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ux_live_editor_bot"}
                onAuth={handleTelegramAuth}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? "Вход..." : "Войти"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
