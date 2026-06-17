import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://editor.147.45.68.190.sslip.io";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id;
      const firstName = update.message.from.first_name;
      const lastName = update.message.from.last_name || "";
      const username = update.message.from.username || "";
      const telegramId = update.message.from.id.toString();

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: `Войти как ${firstName}`,
              web_app: { url: `${APP_URL}/auth?tg_id=${telegramId}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&username=${encodeURIComponent(username)}` },
            },
          ],
        ],
      };

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Привет, ${firstName}! Нажми кнопку ниже для входа.`,
          reply_markup: keyboard,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
