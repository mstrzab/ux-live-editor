import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramAuth } from "@/lib/telegram";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    let initData: Record<string, string> = {};
    
    if (data.initData) {
      const params = new URLSearchParams(data.initData);
      for (const [key, value] of params.entries()) {
        initData[key] = value;
      }
    } else {
      initData = data;
    }

    const userJson = initData.user;
    if (!userJson) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    const userData = JSON.parse(userJson);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const isValid = verifyTelegramAuth(initData, botToken);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid auth signature" }, { status: 401 });
    }

    const authDate = parseInt(initData.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return NextResponse.json({ error: "Auth expired" }, { status: 401 });
    }

    const telegramId = userData.id.toString();

    let user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: [userData.first_name, userData.last_name].filter(Boolean).join(" "),
          image: userData.photo_url || null,
          email: `tg_${telegramId}@telegram.local`,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: [userData.first_name, userData.last_name].filter(Boolean).join(" "),
          image: userData.photo_url || user.image,
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
    console.error("Mini app auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
