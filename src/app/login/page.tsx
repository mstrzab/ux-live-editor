"use client";

import { useRouter } from "next/navigation";

export default function LoginPromo() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">UX Live Editor</h1>
        <p className="mb-8 text-base text-muted">
          Редактор постов для Telegram-каналов
        </p>
        <a
          href="https://t.me/out_redactor_bot?start=login"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 7.86l-1.93 9.1c-.15.67-.53.83-1.07.52l-2.96-2.18-1.43 1.37c-.16.16-.29.29-.59.29l.21-2.99 5.44-4.92c.24-.21-.05-.33-.37-.14l-6.73 4.24-2.9-.9c-.63-.2-.64-.63.13-.93l11.34-4.37c.53-.19.99.13.82.93z"/>
          </svg>
          Открыть в Telegram
        </a>
      </div>
    </div>
  );
}
