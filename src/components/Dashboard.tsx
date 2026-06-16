"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle, Trash2, Edit } from "lucide-react";

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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/channels").then((r) => r.json()).then(setChannels);
      fetch("/api/posts").then((r) => r.json()).then(setPosts);
    }
  }, [session]);

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
    if (!confirm("Удалить пост?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts(posts.filter((p) => p.id !== id));
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

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "SCHEDULED":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "PUBLISHED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Посты</h1>
          <button
            onClick={() => setShowAddChannel(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Добавить канал
          </button>
        </div>

        {showAddChannel && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Новый канал</h2>
            <form onSubmit={handleAddChannel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Название канала
                  </label>
                  <input
                    type="text"
                    value={channelForm.name}
                    onChange={(e) =>
                      setChannelForm({ ...channelForm, name: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telegram ID канала
                  </label>
                  <input
                    type="text"
                    value={channelForm.telegramId}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        telegramId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="-1001234567890"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bot Token
                  </label>
                  <input
                    type="text"
                    value={channelForm.botToken}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        botToken: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="123456:ABC-DEF..."
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Username (опционально)
                  </label>
                  <input
                    type="text"
                    value={channelForm.username}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        username: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="@channel_name"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Все" },
            { key: "DRAFT", label: "Черновики" },
            { key: "SCHEDULED", label: "Отложенные" },
            { key: "PUBLISHED", label: "Опубликованные" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                filter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {channels.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="mb-4 text-gray-500">
              Подключите первый канал, чтобы начать
            </p>
            <button
              onClick={() => setShowAddChannel(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Добавить канал
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {channel.name}
                    </h3>
                    {channel.username && (
                      <p className="text-sm text-gray-500">
                        {channel.username}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCreatePost(channel.id)}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                    Новый пост
                  </button>
                </div>

                <div className="space-y-2">
                  {posts
                    .filter((p) => p.channel.id === channel.id)
                    .filter((p) => filter === "all" || p.status === filter)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {statusIcon(post.status)}
                          <div>
                            <Link
                              href={`/editor/${post.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {post.title || "Без названия"}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {new Date(post.updatedAt).toLocaleString("ru-RU")}{" "}
                              · {post.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/editor/${post.id}`}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
