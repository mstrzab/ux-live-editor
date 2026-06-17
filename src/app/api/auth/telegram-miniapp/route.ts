import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { id, first_name, last_name, username } = await req.json();

    if (!id || !first_name) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const telegramId = id.toString();

    let user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name: [first_name, last_name].filter(Boolean).join(" "),
          email: `tg_${telegramId}@telegram.local`,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: [first_name, last_name].filter(Boolean).join(" "),
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
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Mini app auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
