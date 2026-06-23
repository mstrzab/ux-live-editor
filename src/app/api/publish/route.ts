import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat?: { id: number };
  };
  description?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, channelIds } = await req.json();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { channel: true, media: true },
  });

  if (!post || post.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const targets = channelIds?.length
    ? await prisma.channel.findMany({
        where: { id: { in: channelIds } },
      })
    : [post.channel];

  const results: Array<{
    channelId: string;
    messageId?: number;
    success: boolean;
    error?: string;
  }> = [];

  for (const channel of targets) {
    try {
      const blocks = JSON.parse(post.content) as Array<{
        type: string;
        content?: string;
        src?: string;
      }>;

      const textParts: string[] = [];
      const mediaParts: Array<{
        type: string;
        src: string;
      }> = [];

      for (const block of blocks) {
        if (block.type === "text" && block.content) {
          textParts.push(block.content);
        } else if (
          ["image", "video", "audio"].includes(block.type) &&
          block.src
        ) {
          mediaParts.push({ type: block.type, src: block.src });
        }
      }

      const fullText = textParts.join("\n\n");
      const apiBase = `https://api.telegram.org/bot${channel.botToken}`;

      let messageId: number | undefined;

      // Собираем URL фото/видео/аудио из абсолютных путей
      const absoluteUrl = (src: string) => {
        if (src.startsWith("http")) return src;
        const host = process.env.NEXT_PUBLIC_APP_URL || "https://outredactor.ru";
        return `${host}${src}`;
      };

      if (mediaParts.length === 0) {
        const res = await fetch(`${apiBase}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channel.telegramId,
            text: fullText,
            parse_mode: "HTML",
          }),
        });
        const data = (await res.json()) as TelegramApiResponse;
        if (data.ok) messageId = data.result?.message_id;
      } else if (mediaParts.length === 1 && fullText.length <= 1024) {
        // Одно медиа с подписью
        const media = mediaParts[0];
        const url = absoluteUrl(media.src);

        if (media.type === "image") {
          const res = await fetch(`${apiBase}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: channel.telegramId,
              photo: url,
              caption: fullText,
              parse_mode: "HTML",
            }),
          });
          const data = (await res.json()) as TelegramApiResponse;
          if (data.ok) messageId = data.result?.message_id;
        } else if (media.type === "video") {
          const res = await fetch(`${apiBase}/sendVideo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: channel.telegramId,
              video: url,
              caption: fullText,
              parse_mode: "HTML",
            }),
          });
          const data = (await res.json()) as TelegramApiResponse;
          if (data.ok) messageId = data.result?.message_id;
        } else if (media.type === "audio") {
          const res = await fetch(`${apiBase}/sendAudio`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: channel.telegramId,
              audio: url,
              caption: fullText,
              parse_mode: "HTML",
            }),
          });
          const data = (await res.json()) as TelegramApiResponse;
          if (data.ok) messageId = data.result?.message_id;
        }
      } else {
        // Группа медиа (album)
        const inputMedia = mediaParts.map((m, i) => {
          const url = absoluteUrl(m.src);
          if (m.type === "image") {
            return {
              type: "photo" as const,
              media: url,
              caption: i === 0 ? fullText : undefined,
              parse_mode: "HTML",
            };
          }
          return { type: m.type, media: url };
        });

        const res = await fetch(`${apiBase}/sendMediaGroup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channel.telegramId,
            media: inputMedia,
          }),
        });
        const data = (await res.json()) as TelegramApiResponse;
        if (data.ok) messageId = data.result?.message_id;
      }

      if (messageId) {
        results.push({
          channelId: channel.id,
          messageId,
          success: true,
        });
      } else {
        results.push({
          channelId: channel.id,
          success: false,
          error: "Failed to get message ID",
        });
      }
    } catch (error) {
      console.error(`Publish error for channel ${channel.id}:`, error);
      results.push({
        channelId: channel.id,
        success: false,
        error: String(error),
      });
    }
  }

  const allSuccess = results.some((r) => r.success);
  if (allSuccess) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        telegramMessageId: results.find((r) => r.success)?.messageId,
      },
    });
  }

  return NextResponse.json({ results });
}
