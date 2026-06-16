import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          UX Live Editor
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Редактор постов для Telegram-каналов с rich-контентом.
          WYSIWYG, drag-and-drop блоки, мульти-постинг, отложенная публикация.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
