"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session || pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            U
          </div>
          <span className="text-base font-semibold tracking-tight">
            UX Live Editor
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-accent/10 text-accent font-medium"
                : "text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            Посты
          </Link>
          <div className="mx-2 h-4 w-px bg-border" />
          <span className="text-sm text-muted truncate max-w-[200px]">
            {session.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}
