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

  // Validate bot token
  try {
    const botCheck = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botCheck.json();
    if (!botData.ok) {
      return NextResponse.json(
        { error: "Invalid bot token. Check your token from @BotFather." },
        { status: 400 }
      );
    }

    // Check if bot is admin in the channel
    const chatMemberCheck = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${telegramId}&user_id=${botData.result.id}`
    );
    const memberData = await chatMemberCheck.json();

    if (!memberData.ok) {
      return NextResponse.json(
        { error: "Bot cannot access this channel. Make sure the channel ID is correct and the bot was added to the channel." },
        { status: 400 }
      );
    }

    const isAdmin = ["administrator", "creator"].includes(memberData.result?.status);
    const canPost = memberData.result?.can_post_messages ?? false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Bot is not an admin in this channel. Add the bot as administrator." },
        { status: 400 }
      );
    }

    if (!canPost && memberData.result?.status !== "creator") {
      return NextResponse.json(
        { error: "Bot admin must have permission to post messages." },
        { status: 400 }
      );
    }

    // Fetch actual channel info
    const chatCheck = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramId}`
    );
    const chatData = await chatCheck.json();
    const actualName = chatData.ok ? chatData.result.title : name;
    const actualUsername = chatData.ok ? chatData.result.username || username : username;

    const channel = await prisma.channel.create({
      data: {
        name: actualName || name,
        username: actualUsername,
        botToken,
        telegramId,
        userId: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json(channel);
  } catch {
    return NextResponse.json(
      { error: "Failed to validate bot. Check your internet connection and token." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
  }

  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel || channel.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.channel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
