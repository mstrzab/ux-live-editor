"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPromo() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://tgredactorout.online");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-card px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Логотип */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/30">
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        </div>

        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
          UX Live Editor
        </h1>
        <p className="mb-8 text-base text-muted leading-relaxed">
          Современный редактор постов для Telegram-каналов.
          <br />
          WYSIWYG, отложка, медиа и мультипостинг.
        </p>

        {/* Основная кнопка — открыть бота */}
        <div className="space-y-3">
          <a
            href="https://t.me/out_redactor_bot?start=login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#3390ec] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#3390ec]/25 transition-all hover:bg-[#2888e8] hover:shadow-xl active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48s-.666-.2-.995-.4c-1.317-.783-2.315-1.27-3.022-1.629-.676-.344-1.342-.556-1.057-1.15.282-.583 1.746-.365 2.85-.16 1.524.29 2.638.867 5.07 2.142 4.817 2.494 5.363 2.79 5.98 2.94.138.032.278-.04.354-.162.073-.117.063-.27.008-.42-.154-.405-.775-1.143-1.22-1.582a7.903 7.903 0 0 1-.436-.426 1.21 1.21 0 0 0-.152-.153c-.074-.066-.148-.128-.223-.19a.913.913 0 0 0-.314-.167c-.054-.008-.043.06 0 0z"/>
            </svg>
            Войти через Telegram
          </a>

          <button
            onClick={handleCopyLink}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-muted transition-all hover:bg-card-hover hover:text-foreground"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Ссылка скопирована
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Копировать ссылку на сервис
              </>
            )}
          </button>
        </div>

        {/* Инструкция */}
        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-5 text-left">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Как начать:
          </p>
          <ol className="space-y-2.5 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">1</span>
              Нажмите кнопку «Войти через Telegram»
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">2</span>
              Нажмите «START» в боте
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">3</span>
              Вернитесь на сайт и работайте
            </li>
          </ol>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            SSL защита
          </span>
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Безопасная авторизация
          </span>
        </div>
      </div>
    </div>
  );
}
