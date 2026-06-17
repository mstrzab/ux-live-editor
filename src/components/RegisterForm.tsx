"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TelegramWidget from "@/components/TelegramWidget";

export default function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();

  const handleTelegramAuth = async (user: Record<string, string>) => {
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
        setError(data.error || "Ошибка");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-lg text-success">
              ✓
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Готово!</h1>
            <p className="mt-2 text-sm text-muted">
              Теперь войдите через Telegram
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white">
            U
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Регистрация
          </h1>
          <p className="mt-1 text-sm text-muted">
            Создайте аккаунт через Telegram
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
              Регистрация...
            </div>
          ) : (
            <div className="py-4">
              <p className="mb-6 text-center text-sm text-muted">
                Нажмите кнопку для регистрации
              </p>
              <TelegramWidget
                botUsername="out_redactor_bot"
                onAuth={handleTelegramAuth}
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
