import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-2xl font-bold text-white shadow-lg shadow-accent/25">
          U
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          UX Live Editor
        </h1>
        <p className="mb-10 text-base leading-relaxed text-muted">
          WYSIWYG-редактор постов для Telegram-каналов.
          <br />
          Блоки, медиа, мульти-постинг, отложка.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98]"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-card-hover active:scale-[0.98]"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
