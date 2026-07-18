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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const body = await request.json();
    const { amount = 1 } = body; // default to +1 glass

    const water = await prisma.waterIntake.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        glasses: {
          increment: amount,
        },
      },
      create: {
        userId: user.id,
        glasses: amount,
        goal: 10,
        date: today,
      },
    });

    return NextResponse.json({ success: true, water });
  } catch (error: any) {
    console.error("Log water error:", error);
    return NextResponse.json(
      { error: "Failed to log water intake" },
      { status: 500 }
    );
  }
}
