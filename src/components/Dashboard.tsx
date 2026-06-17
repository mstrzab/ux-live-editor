"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Trash2,
  Pencil,
  Hash,
  Search,
  X,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  telegramId: string;
  username?: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  channel: Channel;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: "",
    telegramId: "",
    botToken: "",
    username: "",
  });
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadData = useCallback(async () => {
    if (!session) return;
    const [ch, po] = await Promise.all([
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/posts").then((r) => r.json()),
    ]);
    setChannels(ch);
    setPosts(po);
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(channelForm),
    });
    if (res.ok) {
      const channel = await res.json();
      setChannels([...channels, channel]);
      setShowAddChannel(false);
      setChannelForm({ name: "", telegramId: "", botToken: "", username: "" });
    }
  };

  const handleDeletePost = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts(posts.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleCreatePost = async (channelId: string) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, content: "[]" }),
    });
    if (res.ok) {
      const post = await res.json();
      router.push(`/editor/${post.id}`);
    }
  };

  const filteredPosts = posts
    .filter((p) => filter === "all" || p.status === filter)
    .filter(
      (p) =>
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.channel.name.toLowerCase().includes(search.toLowerCase())
    );

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    DRAFT: { icon: <FileText className="h-3.5 w-3.5" />, label: "Черновик", color: "bg-zinc-100 text-zinc-600" },
    SCHEDULED: { icon: <Clock className="h-3.5 w-3.5" />, label: "Отложено", color: "bg-amber-50 text-amber-600" },
    PUBLISHED: { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Опубликовано", color: "bg-emerald-50 text-emerald-600" },
  };

  const filterTabs = [
    { key: "all", label: "Все", count: posts.length },
    { key: "DRAFT", label: "Черновики", count: posts.filter((p) => p.status === "DRAFT").length },
    { key: "SCHEDULED", label: "Отложенные", count: posts.filter((p) => p.status === "SCHEDULED").length },
    { key: "PUBLISHED", label: "Опубликованные", count: posts.filter((p) => p.status === "PUBLISHED").length },
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse-soft text-muted">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Посты</h1>
            <p className="mt-1 text-sm text-muted">
              {posts.length > 0
                ? `${posts.length} ${posts.length === 1 ? "пост" : posts.length < 5 ? "поста" : "постов"}`
                : "Создайте первый пост"}
            </p>
          </div>
          <button
            onClick={() => setShowAddChannel(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Канал
          </button>
        </div>

        {showAddChannel && (
          <div className="mb-8 animate-in rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Новый канал</h2>
              <button
                onClick={() => setShowAddChannel(false)}
                className="rounded-lg p-1 text-muted hover:bg-card-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddChannel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Название</label>
                  <input
                    type="text"
                    value={channelForm.name}
                    onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Мой канал"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Telegram ID</label>
                  <input
                    type="text"
                    value={channelForm.telegramId}
                    onChange={(e) => setChannelForm({ ...channelForm, telegramId: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="-1001234567890"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Bot Token</label>
                  <input
                    type="text"
                    value={channelForm.botToken}
                    onChange={(e) => setChannelForm({ ...channelForm, botToken: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="123456:ABC-DEF..."
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={channelForm.username}
                    onChange={(e) => setChannelForm({ ...channelForm, username: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="@channel_name"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="rounded-xl bg-background px-4 py-2 text-sm text-muted hover:bg-card-hover"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск постов..."
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-background p-1">
          {filterTabs.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className="rounded-full bg-background px-1.5 py-0.5 text-xs">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {channels.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center animate-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
              <Hash className="h-6 w-6 text-accent" />
            </div>
            <p className="mb-2 text-base font-medium">Подключите канал</p>
            <p className="mb-6 text-sm text-muted">
              Добавьте Telegram-канал, чтобы начать публикацию постов
            </p>
            <button
              onClick={() => setShowAddChannel(true)}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Добавить канал
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center animate-in">
            <p className="text-sm text-muted">
              {search ? "Ничего не найдено" : "Нет постов в этой категории"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post) => {
              const st = statusConfig[post.status] || statusConfig.DRAFT;
              return (
                <div
                  key={post.id}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-accent/20 hover:shadow-sm animate-in"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/editor/${post.id}`}
                        className="truncate text-sm font-medium text-foreground hover:text-accent"
                      >
                        {post.title || "Без названия"}
                      </Link>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span>{post.channel.name}</span>
                      <span>·</span>
                      <span>{new Date(post.updatedAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/editor/${post.id}`}
                      className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleting === post.id}
                      className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
