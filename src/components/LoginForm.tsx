"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TelegramWidget from "@/components/TelegramWidget";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

          {loading ? (
            <div className="py-8 text-center text-sm text-muted">
              Авторизация...
            </div>
          ) : (
            <div className="py-4">
              <p className="mb-6 text-center text-sm text-muted">
                Войдите через Telegram
              </p>
              <TelegramWidget
                botUsername="out_redactor_bot"
                onAuth={handleTelegramAuth}
              />
            </div>
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
