import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channels = await prisma.channel.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(channels);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, username, botToken, telegramId } = await req.json();

  if (!name || !botToken || !telegramId) {
    return NextResponse.json(
      { error: "Name, botToken and telegramId required" },
      { status: 400 }
    );
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      username,
      botToken,
      telegramId,
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(channel);
}
