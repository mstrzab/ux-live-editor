"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TelegramWidget from "@/components/TelegramWidget";

export default function RegisterForm() {
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
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error && (
          <div className="mb-6 rounded-xl bg-danger/10 px-5 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted">Регистрация...</p>
        ) : (
          <TelegramWidget
            botUsername="out_redactor_bot"
            onAuth={handleTelegramAuth}
          />
        )}
      </div>
    </div>
  );
}
