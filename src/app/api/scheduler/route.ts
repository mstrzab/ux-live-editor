import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron-like scheduler endpoint — вызывать каждую минуту
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SCHEDULER_SECRET || process.env.NEXTAUTH_SECRET;

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: { channel: true },
  });

  const results = [];

  for (const post of scheduledPosts) {
    try {
      const channel = post.channel;

      const blocks = JSON.parse(post.content) as Array<{
        type: string;
        content?: string;
        src?: string;
      }>;

      const textParts: string[] = [];
      const mediaParts: Array<{ type: string; src: string }> = [];

      for (const block of blocks) {
        if (block.type === "text" && block.content) {
          textParts.push(block.content);
        } else if (["image", "video", "audio"].includes(block.type) && block.src) {
          mediaParts.push({ type: block.type, src: block.src });
        }
      }

      const fullText = textParts.join("\n\n");
      const apiBase = `https://api.telegram.org/bot${channel.botToken}`;

      let messageId: number | undefined;

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
        const data = await res.json();
        if (data.ok) messageId = data.result?.message_id;
      } else if (mediaParts.length === 1 && fullText.length <= 1024) {
        const media = mediaParts[0];
        const url = absoluteUrl(media.src);
        const methodMap: Record<string, string> = {
          image: "sendPhoto",
          video: "sendVideo",
          audio: "sendAudio",
        };

        const res = await fetch(`${apiBase}/${methodMap[media.type] || "sendDocument"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channel.telegramId,
            [media.type === "image" ? "photo" : media.type]: url,
            caption: fullText,
            parse_mode: "HTML",
          }),
        });
        const data = await res.json();
        if (data.ok) messageId = data.result?.message_id;
      } else {
        const inputMedia = mediaParts.map((m, i) => ({
          type: m.type === "image" ? "photo" : m.type,
          media: absoluteUrl(m.src),
          caption: i === 0 ? fullText : undefined,
          parse_mode: "HTML",
        }));

        const res = await fetch(`${apiBase}/sendMediaGroup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channel.telegramId,
            media: inputMedia,
          }),
        });
        const data = await res.json();
        if (data.ok) messageId = data.result?.[0]?.message_id;
      }

      if (messageId) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: now,
            telegramMessageId: messageId,
          },
        });
        results.push({ postId: post.id, success: true, messageId });
      } else {
        results.push({ postId: post.id, success: false });
      }
    } catch (error) {
      console.error(`Scheduler error for post ${post.id}:`, error);
      results.push({ postId: post.id, success: false, error: String(error) });
    }
  }

  return NextResponse.json({
    processed: scheduledPosts.length,
    results,
  });
}
