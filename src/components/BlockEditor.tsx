"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
  Save,
  Send,
  Clock,
  Hash,
  Video,
  Music,
  GripVertical,
  ChevronDown,
  X,
  AlertTriangle,
} from "lucide-react";

const CHAR_LIMIT = 8000;

interface Block {
  id: string;
  type: string;
  content?: string;
  src?: string;
}

interface Channel {
  id: string;
  name: string;
  telegramId: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  channel: Channel;
  versions?: { id: string; content: string; versionNumber: number; createdAt: string }[];
}

interface EditorProps {
  post: Post;
  channels: Channel[];
}

export default function BlockEditor({ post, channels }: EditorProps) {
  const [title, setTitle] = useState(post.title || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    post.channel.id,
  ]);
  const [charCount, setCharCount] = useState(0);
  const [showVersions, setShowVersions] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Начните писать или введите "/" для вызова блоков...',
      }),
      CharacterCount.configure({
        limit: CHAR_LIMIT,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: (() => {
      try {
        const blocks = JSON.parse(post.content) as Block[];
        if (blocks.length === 0) return "";
        return blocks
          .map((b) => {
            if (b.type === "text") return b.content || "";
            if (b.type === "image") return `<img src="${b.src}" />`;
            if (b.type === "video") return `<p>[Видео: ${b.src}]</p>`;
            if (b.type === "audio") return `<p>[Аудио: ${b.src}]</p>`;
            return "";
          })
          .join("");
      } catch {
        return post.content || "";
      }
    })(),
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-8 py-6",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadAndInsertImage(file);
            }
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setCharCount(editor.storage.characterCount.characters());
    },
  });

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("postId", post.id);

      try {
        const res = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });
        const media = await res.json();
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: file.name })
          .run();
      } catch (err) {
        console.error("Upload failed:", err);
      }
    },
    [editor, post.id]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        savePost();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Handled by TipTap's handlePaste
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, title]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      setCharCount(editor.storage.characterCount.characters());
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  const savePost = async () => {
    if (!editor) return;
    setSaving(true);

    const content = editor.getHTML();
    const blocks: Block[] = [];
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    tempDiv.childNodes.forEach((node) => {
      if (node instanceof HTMLParagraphElement || node instanceof HTMLHeadingElement) {
        const text = node.textContent?.trim();
        if (text) {
          blocks.push({ id: crypto.randomUUID(), type: "text", content: text });
        }
      } else if (node instanceof HTMLImageElement) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "image",
          src: node.src,
        });
      }
    });

    if (blocks.length === 0 && content) {
      blocks.push({ id: crypto.randomUUID(), type: "text", content });
    }

    await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || null,
        content: JSON.stringify(blocks),
        status: showSchedule && scheduleDate && scheduleTime ? "SCHEDULED" : undefined,
        scheduledAt:
          showSchedule && scheduleDate && scheduleTime
            ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            : undefined,
      }),
    });

    setSaving(false);
    setLastSaved(new Date());
  };

  const autoSave = useCallback(() => {
    const timeout = setTimeout(() => savePost(), 3000);
    return () => clearTimeout(timeout);
  }, [editor, title]);

  useEffect(() => {
    if (editor) {
      const unsub = autoSave();
      return unsub;
    }
  }, [editor, title]);

  const handlePublish = async () => {
    await savePost();

    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        channelIds: selectedChannels,
      }),
    });

    const data = await res.json();
    if (data.results?.some((r: { success: boolean }) => r.success)) {
      alert("Опубликовано!");
      setShowPublishMenu(false);
    } else {
      alert("Ошибка публикации");
    }
  };

  const handleFileUpload = async (type: "image" | "video" | "audio") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      type === "image"
        ? "image/*"
        : type === "video"
        ? "video/*"
        : "audio/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("postId", post.id);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const media = await res.json();

      if (type === "image") {
        editor
          .chain()
          .focus()
          .setImage({ src: media.url, alt: file.name })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(`<p>[${type === "video" ? "Видео" : "Аудио"}: ${media.url}]</p>`)
          .run();
      }
    };
    input.click();
  };

  const insertSlashCommand = (command: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).run();

    switch (command) {
      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "code":
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case "list":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "olist":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "image":
        handleFileUpload("image");
        break;
      case "video":
        handleFileUpload("video");
        case "audio":
        handleFileUpload("audio");
        break;
    }
  };

  const charPercentage = Math.min((charCount / CHAR_LIMIT) * 100, 100);
  const isOverLimit = charCount > CHAR_LIMIT;
  const willSplit = charCount > 4096;

  if (!editor) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <Redo className="h-4 w-4" />
              </button>

              <div className="mx-2 h-6 w-px bg-gray-200" />

              <button
                onClick={() =>
                  editor.chain().focus().toggleBold().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("bold")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("italic")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleUnderline().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("underline")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>

              <div className="mx-2 h-6 w-px bg-gray-200" />

              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Heading2 className="h-4 w-4" />
              </button>

              <div className="mx-2 h-6 w-px bg-gray-200" />

              <button
                onClick={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("bulletList")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("orderedList")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("blockquote")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleCodeBlock().run()
                }
                className={`rounded p-1.5 ${
                  editor.isActive("codeBlock")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Code className="h-4 w-4" />
              </button>

              <div className="mx-2 h-6 w-px bg-gray-200" />

              <button
                onClick={() => handleFileUpload("image")}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                title="Вставить изображение"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFileUpload("video")}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                title="Вставить видео"
              >
                <Video className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFileUpload("audio")}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                title="Вставить аудио"
              >
                <Music className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      isOverLimit
                        ? "text-red-600"
                        : willSplit
                        ? "text-yellow-600"
                        : "text-gray-500"
                    }`}
                  >
                    {charCount} / {CHAR_LIMIT}
                  </span>
                  {isOverLimit && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                {willSplit && !isOverLimit && (
                  <p className="text-xs text-yellow-600">
                    Пост разобьётся на части
                  </p>
                )}
                {isOverLimit && (
                  <p className="text-xs text-red-600">
                    Превышен лимит! Пост будет обрезан.
                  </p>
                )}
              </div>

              <div className="mx-2 h-6 w-px bg-gray-200" />

              {lastSaved && (
                <span className="text-xs text-gray-400">
                  Сохранено {lastSaved.toLocaleTimeString("ru-RU")}
                </span>
              )}

              <button
                onClick={savePost}
                disabled={saving}
                className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Сохранение..." : "Сохранить"}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Отложить
                </button>
                {showSchedule && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Дата и время публикации
                    </p>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => {
                        savePost();
                        setShowSchedule(false);
                      }}
                      className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      Запланировать
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowPublishMenu(!showPublishMenu)}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  Опубликовать
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showPublishMenu && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Выберите каналы
                    </p>
                    {channels.map((ch) => (
                      <label
                        key={ch.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes(ch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannels([
                                ...selectedChannels,
                                ch.id,
                              ]);
                            } else {
                              setSelectedChannels(
                                selectedChannels.filter((id) => id !== ch.id)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{ch.name}</span>
                      </label>
                    ))}
                    <button
                      onClick={handlePublish}
                      disabled={selectedChannels.length === 0}
                      className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Опубликовать
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl py-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок поста"
            className="mb-4 w-full border-none bg-transparent text-3xl font-bold text-gray-900 focus:outline-none"
          />

          <div
            ref={editorRef}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <EditorContent editor={editor} />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>
              {charCount} символов · {willSplit ? "Будет разбито на части" : "Влезет в один пост"}
            </span>
            <span>Ctrl+S — сохранить · Ctrl+V — вставить картинку</span>
          </div>
        </div>
      </div>

      {showVersions && post.versions && (
        <div className="fixed inset-y-0 right-0 z-30 w-80 border-l border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold">История изменений</h3>
            <button
              onClick={() => setShowVersions(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            {post.versions.length === 0 ? (
              <p className="text-sm text-gray-500">Нет сохранённых версий</p>
            ) : (
              post.versions.map((v) => (
                <button
                  key={v.id}
                  className="mb-2 w-full rounded-md border border-gray-200 p-3 text-left hover:bg-gray-50"
                  onClick={() => {
                    try {
                      const blocks = JSON.parse(v.content) as Block[];
                      const html = blocks
                        .map((b) => {
                          if (b.type === "text") return `<p>${b.content}</p>`;
                          if (b.type === "image")
                            return `<img src="${b.src}" />`;
                          return "";
                        })
                        .join("");
                      editor?.commands.setContent(html);
                    } catch {
                      editor?.commands.setContent(v.content);
                    }
                    setShowVersions(false);
                  }}
                >
                  <p className="text-sm font-medium">
                    Версия {v.versionNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(v.createdAt).toLocaleString("ru-RU")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
