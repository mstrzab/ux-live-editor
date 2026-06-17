import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">UX Live Editor</h1>
        <p className="mb-8 text-base text-muted">
          Редактор постов для Telegram-каналов
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-accent px-8 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl"
        >
          Начать
        </Link>
      </div>
    </div>
  );
}
