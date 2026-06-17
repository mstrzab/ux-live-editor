import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramAuth, TelegramUser } from "@/lib/telegram";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
    }

    const isValid = verifyTelegramAuth(data, botToken);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid auth data" }, { status: 401 });
    }

    const authDate = parseInt(data.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return NextResponse.json({ error: "Auth expired" }, { status: 401 });
    }

    const telegramUser: TelegramUser = {
      id: parseInt(data.id),
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      photo_url: data.photo_url,
      auth_date: authDate,
    };

    const telegramId = telegramUser.id.toString();

    let user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "),
          image: telegramUser.photo_url || null,
          email: `tg_${telegramId}@telegram.local`,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" "),
          image: telegramUser.photo_url || user.image,
        },
      });
    }

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      secret,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Telegram auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
