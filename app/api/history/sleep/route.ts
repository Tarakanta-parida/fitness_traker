import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hours, quality } = body;

    if (hours === undefined || isNaN(Number(hours))) {
      return NextResponse.json(
        { error: "Valid sleep hours value is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sleep = await prisma.sleep.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        hours: parseFloat(hours),
        quality: quality || "good",
      },
      create: {
        userId: user.id,
        hours: parseFloat(hours),
        quality: quality || "good",
        date: today,
      },
    });

    return NextResponse.json({ success: true, sleep });
  } catch (error: any) {
    console.error("Log sleep error:", error);
    return NextResponse.json(
      { error: "Failed to log sleep duration" },
      { status: 550 }
    );
  }
}
