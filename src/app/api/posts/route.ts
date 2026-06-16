import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    userId: (session.user as { id: string }).id,
  };

  if (channelId) where.channelId = channelId;
  if (status) where.status = status;

  const posts = await prisma.post.findMany({
    where,
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId, title, content } = await req.json();

  if (!channelId) {
    return NextResponse.json(
      { error: "Channel ID required" },
      { status: 400 }
    );
  }

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const post = await prisma.post.create({
    data: {
      channelId,
      title: title || null,
      content: content || "[]",
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(post);
}
