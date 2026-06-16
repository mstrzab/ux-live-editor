import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Telegraf } from "telegraf";
import { v4 as uuid } from "uuid";

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

  const results = [];

  for (const channel of targets) {
    try {
      const bot = new Telegraf(channel.botToken);
      const blocks = JSON.parse(post.content) as Array<{
        type: string;
        content?: string;
        src?: string;
      }>;

      const textParts: string[] = [];
      const mediaParts: Array<{ type: string; src: string; afterText?: string }> =
        [];

      for (const block of blocks) {
        if (block.type === "text" && block.content) {
          textParts.push(block.content);
        } else if (
          (block.type === "image" || block.type === "video" || block.type === "audio") &&
          block.src
        ) {
          mediaParts.push({
            type: block.type,
            src: block.src,
          });
        }
      }

      const fullText = textParts.join("\n\n");

      if (mediaParts.length === 0) {
        const msg = await bot.telegram.sendMessage(
          channel.telegramId,
          fullText,
          { parse_mode: "HTML" }
        );
        results.push({
          channelId: channel.id,
          messageId: msg.message_id,
          success: true,
        });
      } else {
        for (let i = 0; i < mediaParts.length; i++) {
          const media = mediaParts[i];
          const caption = i === 0 ? fullText : undefined;

          if (media.type === "image") {
            const msg = await bot.telegram.sendPhoto(
              channel.telegramId,
              { url: media.src },
              { caption, parse_mode: "HTML" }
            );
            results.push({
              channelId: channel.id,
              messageId: msg.message_id,
              success: true,
            });
          }
        }
      }

      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          telegramMessageId: results[0]?.messageId,
        },
      });
    } catch (error) {
      console.error(`Publish error for channel ${channel.id}:`, error);
      results.push({
        channelId: channel.id,
        success: false,
        error: String(error),
      });
    }
  }

  return NextResponse.json({ results });
}
