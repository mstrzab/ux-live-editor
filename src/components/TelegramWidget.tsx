"use client";

import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

interface TelegramWidgetProps {
  botUsername: string;
  onAuth: (user: Record<string, string>) => void;
}

export default function TelegramWidget({ onAuth }: TelegramWidgetProps) {
  const handleAuth = useCallback(async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      alert("Откройте приложение через Telegram");
      return;
    }

    tg.ready();
    tg.expand();

    const initData = tg.initData;
    const user = tg.initDataUnsafe.user;

    if (!initData || !user) {
      alert("Нет данных авторизации");
      return;
    }

    try {
      const res = await fetch("/api/auth/telegram-miniapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка авторизации");
        return;
      }

      localStorage.setItem("token", data.token);
      onAuth(data.user);
    } catch {
      alert("Ошибка сети");
    }
  }, [onAuth]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleAuth}
        className="inline-flex items-center gap-2 rounded-xl bg-[#3390ec] px-8 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#2b7fd6] active:scale-[0.98]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 7.86l-1.93 9.1c-.15.67-.53.83-1.07.52l-2.96-2.18-1.43 1.37c-.16.16-.29.29-.59.29l.21-2.99 5.44-4.92c.24-.21-.05-.33-.37-.14l-6.73 4.24-2.9-.9c-.63-.2-.64-.63.13-.93l11.34-4.37c.53-.19.99.13.82.93z"/>
        </svg>
        Войти через Telegram
      </button>
      <p className="text-xs text-muted">
        Или откройте в Telegram Mini App
      </p>
    </div>
  );
}
