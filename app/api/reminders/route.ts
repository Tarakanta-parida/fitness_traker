import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id },
      orderBy: { time: "asc" },
    });

    return NextResponse.json({ success: true, reminders });
  } catch (error: any) {
    console.error("Fetch reminders error:", error);
    return NextResponse.json(
      { error: "Failed to load reminders" },
      { status: 550 }
    );
  }
}

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
    const { type, time, repeat, enabled } = body;

    if (!type || !time) {
      return NextResponse.json(
        { error: "Reminder type and time are required" },
        { status: 400 }
      );
    }

    // Check if a reminder for this user and type already exists, if so update it, else create
    const existing = await prisma.reminder.findFirst({
      where: { userId: user.id, type },
    });

    let reminder;
    const timeDate = new Date(`1970-01-01T${time}:00Z`);

    if (existing) {
      reminder = await prisma.reminder.update({
        where: { id: existing.id },
        data: {
          time: timeDate,
          repeat: repeat || "daily",
          enabled: enabled !== undefined ? enabled : true,
        },
      });
    } else {
      reminder = await prisma.reminder.create({
        data: {
          userId: user.id,
          type,
          time: timeDate,
          repeat: repeat || "daily",
          enabled: enabled !== undefined ? enabled : true,
        },
      });
    }

    return NextResponse.json({ success: true, reminder });
  } catch (error: any) {
    console.error("Save reminder error:", error);
    return NextResponse.json(
      { error: "Failed to save reminder details" },
      { status: 550 }
    );
  }
}
