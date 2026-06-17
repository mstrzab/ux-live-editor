"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tgId = searchParams.get("tg_id");
    const firstName = searchParams.get("first_name");
    const lastName = searchParams.get("last_name");
    const username = searchParams.get("username");

    if (!tgId || !firstName) {
      router.push("/login");
      return;
    }

    const auth = async () => {
      try {
        const res = await fetch("/api/auth/telegram-miniapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: tgId,
            first_name: firstName,
            last_name: lastName || "",
            username: username || "",
          }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    auth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted">Авторизация...</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Загрузка...</p>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}
